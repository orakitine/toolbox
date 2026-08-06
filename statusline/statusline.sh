#!/usr/bin/env bash
#
# Claude Code status line script.
#
# Reads a single JSON object from stdin (see Claude Code statusLine docs for
# the schema) and prints ONE line of status information:
#
#   1. Model display name
#   2. Current directory (abbreviated with ~)
#   3. Git branch + dirty marker "*" (only shown inside a git repo)
#   4. Context-window usage %, color-coded: green <50%, yellow 50-80%, red >80%
#   5. 5-hour rate-limit usage % + time-to-reset, same green/yellow/red scheme
#
# JSON parsing prefers `jq` (fast) and falls back to `python3` if jq isn't
# installed. No network calls are made; this is designed to stay well under
# the 100ms budget on a typical machine.

input="$(cat)"

# ---------------------------------------------------------------------------
# ANSI colors. The terminal already renders the status line dimmed, so we
# just use the plain 8-color codes rather than bold/bright variants.
# ---------------------------------------------------------------------------
RESET=$'\033[0m'
GREEN=$'\033[32m'
YELLOW=$'\033[33m'
RED=$'\033[31m'
CYAN=$'\033[36m'
BLUE=$'\033[34m'
MAGENTA=$'\033[35m'
GREY=$'\033[90m'

# Return the color code for a percentage using the green(<50)/yellow(50-80)/
# red(>80) step scheme. Prints nothing if the value isn't a usable number.
color_for_pct() {
  local pct="$1"
  case "$pct" in
    ''|*[!0-9.]*) return ;;
  esac
  local i="${pct%%.*}"
  [ -z "$i" ] && i=0
  if [ "$i" -lt 50 ]; then
    printf '%s' "$GREEN"
  elif [ "$i" -le 80 ]; then
    printf '%s' "$YELLOW"
  else
    printf '%s' "$RED"
  fi
}

# ---------------------------------------------------------------------------
# Parse the fields we need out of stdin JSON in a single pass (avoids
# spawning jq/python3 more than once, which matters for latency).
# Fields, tab-separated: model_display, current_dir, ctx_used_pct,
# five_hour_used_pct, five_hour_resets_at
# ---------------------------------------------------------------------------
if command -v jq >/dev/null 2>&1; then
  parsed="$(printf '%s' "$input" | jq -r '
    [
      (.model.display_name // "Claude"),
      (.workspace.current_dir // .cwd // ""),
      (.context_window.used_percentage // "" | tostring),
      (.rate_limits.five_hour.used_percentage // "" | tostring),
      (.rate_limits.five_hour.resets_at // "" |
        if type == "number" then floor
        else (try (sub("\\.[0-9]+"; "") | fromdateiso8601) catch "")
        end | tostring)
    ] | @tsv
  ')"
else
  # Fallback for machines without jq: same extraction logic in python3.
  parsed="$(printf '%s' "$input" | python3 -c '
import sys, json

try:
    data = json.load(sys.stdin)
except Exception:
    data = {}

def g(d, *keys):
    for k in keys:
        if not isinstance(d, dict):
            return None
        d = d.get(k)
    return d

model = g(data, "model", "display_name") or "Claude"
cwd = g(data, "workspace", "current_dir") or (data.get("cwd") if isinstance(data, dict) else None) or ""
used_pct = g(data, "context_window", "used_percentage")
five_used = g(data, "rate_limits", "five_hour", "used_percentage")
five_resets = g(data, "rate_limits", "five_hour", "resets_at")

# Normalize resets_at to a Unix epoch: it may arrive as a number or an
# ISO-8601 string like "2026-07-17T23:00:00Z".
if isinstance(five_resets, str) and five_resets:
    from datetime import datetime
    try:
        five_resets = int(datetime.fromisoformat(five_resets.replace("Z", "+00:00")).timestamp())
    except ValueError:
        five_resets = None
elif isinstance(five_resets, (int, float)):
    five_resets = int(five_resets)

def s(v):
    return "" if v is None else str(v)

print("\t".join([model, cwd, s(used_pct), s(five_used), s(five_resets)]))
')"
fi

IFS=$'\t' read -r model_display cur_dir ctx_used_pct five_used_pct five_resets_at <<< "$parsed"

# Middle-truncate a string to $2 chars, keeping head and tail around a "…".
mid_truncate() {
  local s="$1" max="$2"
  if [ "${#s}" -le "$max" ]; then
    printf '%s' "$s"
    return
  fi
  local head=$(( (max - 1) * 3 / 5 ))
  local tail=$(( max - 1 - head ))
  printf '%s…%s' "${s:0:head}" "${s: -tail}"
}

# ---------------------------------------------------------------------------
# 2. Current directory, abbreviated:
#    - $HOME → ~
#    - worktree paths <repo>/.claude/worktrees/<wt> collapse to "<repo> ⧉<wt>"
#    - if still over $MAX_DIR_LEN, fish-style shortening: middle path
#      components reduced to their first char (two for dot-dirs), last two
#      components kept in full; finally middle-truncated as a hard cap.
# ---------------------------------------------------------------------------
MAX_DIR_LEN=40

dir_display="${cur_dir/#$HOME/~}"
[ -z "$dir_display" ] && dir_display="$(pwd)"

wt_name=""
if [[ "$dir_display" == *"/.claude/worktrees/"* ]]; then
  wt_name="${dir_display##*/.claude/worktrees/}"
  repo_path="${dir_display%%/.claude/worktrees/*}"
  dir_display="${repo_path##*/} ⧉${wt_name}"
fi

if [ "${#dir_display}" -gt "$MAX_DIR_LEN" ] && [[ "$dir_display" == */* ]]; then
  IFS='/' read -r -a _comps <<< "$dir_display"
  _n=${#_comps[@]}
  _short=""
  for (( _i = 0; _i < _n; _i++ )); do
    _seg="${_comps[_i]}"
    if (( _i < _n - 2 )) && [ -n "$_seg" ] && [ "$_seg" != "~" ]; then
      case "$_seg" in
        .?*) _seg="${_seg:0:2}" ;;
        *)   _seg="${_seg:0:1}" ;;
      esac
    fi
    if (( _i == 0 )); then
      _short="$_seg"
    else
      _short="$_short/$_seg"
    fi
  done
  dir_display="$_short"
fi
dir_display="$(mid_truncate "$dir_display" "$MAX_DIR_LEN")"

# ---------------------------------------------------------------------------
# 3. Git branch + dirty marker, only when cwd is inside a git repo.
#    --no-optional-locks so this never blocks on a concurrent git process.
#    The branch is dropped entirely when it just restates the directory
#    already shown (worktree branches like "worktree-<dir>" or "<dir>");
#    the dirty "*" then attaches to the directory segment instead. Long
#    branch names are middle-truncated.
# ---------------------------------------------------------------------------
MAX_BRANCH_LEN=28

git_segment=""
if git -C "$cur_dir" --no-optional-locks rev-parse --is-inside-work-tree >/dev/null 2>&1; then
  branch="$(git -C "$cur_dir" --no-optional-locks branch --show-current 2>/dev/null)"
  [ -z "$branch" ] && branch="$(git -C "$cur_dir" --no-optional-locks rev-parse --short HEAD 2>/dev/null)"
  dirty=""
  if [ -n "$(git -C "$cur_dir" --no-optional-locks status --porcelain 2>/dev/null)" ]; then
    dirty="*"
  fi
  dir_tail="${cur_dir##*/}"
  redundant=""
  for cand in "$dir_tail" "$wt_name"; do
    [ -z "$cand" ] && continue
    case "$branch" in
      "$cand"|"worktree-$cand"|*/"$cand") redundant=1 ;;
    esac
  done
  if [ -n "$redundant" ]; then
    [ -n "$dirty" ] && dir_display="${dir_display}*"
  elif [ -n "$branch" ]; then
    branch="$(mid_truncate "$branch" "$MAX_BRANCH_LEN")"
    git_segment="${MAGENTA}${branch}${dirty}${RESET}"
  fi
fi

# ---------------------------------------------------------------------------
# 4. Context-window usage %, color-coded.
# ---------------------------------------------------------------------------
ctx_segment=""
if [ -n "$ctx_used_pct" ]; then
  ctx_color="$(color_for_pct "$ctx_used_pct")"
  ctx_int="${ctx_used_pct%%.*}"
  ctx_segment="${GREY}Ctx:${RESET}${ctx_color}${ctx_int}%${RESET}"
fi

# ---------------------------------------------------------------------------
# 5. 5-hour rate-limit usage % + time-to-reset, color-coded.
# ---------------------------------------------------------------------------
five_segment=""
if [ -n "$five_used_pct" ]; then
  five_color="$(color_for_pct "$five_used_pct")"
  five_int="${five_used_pct%%.*}"
  reset_str=""
  resets_int="${five_resets_at%%.*}"
  if [ -n "$resets_int" ] && [ -z "${resets_int//[0-9]/}" ]; then
    now_epoch="$(date +%s)"
    remaining=$(( resets_int - now_epoch ))
    if [ "$remaining" -gt 0 ]; then
      hrs=$(( remaining / 3600 ))
      mins=$(( (remaining % 3600) / 60 ))
      reset_str=" (${hrs}h${mins}m)"
    fi
  fi
  five_segment="${GREY}5h:${RESET}${five_color}${five_int}%${RESET}${GREY}${reset_str}${RESET}"
fi

# ---------------------------------------------------------------------------
# Assemble the final line: join non-empty segments with " | ".
# ---------------------------------------------------------------------------
parts=("${CYAN}${model_display}${RESET}" "${BLUE}${dir_display}${RESET}")
[ -n "$git_segment" ] && parts+=("$git_segment")
[ -n "$ctx_segment" ] && parts+=("$ctx_segment")
[ -n "$five_segment" ] && parts+=("$five_segment")

out=""
for p in "${parts[@]}"; do
  if [ -z "$out" ]; then
    out="$p"
  else
    out="$out | $p"
  fi
done

printf '%s\n' "$out"
