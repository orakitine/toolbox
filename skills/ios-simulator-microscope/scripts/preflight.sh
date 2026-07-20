#!/usr/bin/env bash
# preflight.sh — environment doctor for the ios-simulator-microscope skill.
#
# Checks every precondition in dependency order and prints one line per check:
#   PASS <check> — <detail>
#   FAIL <check> — <what is missing> | fix: <human remediation>
#
# It NEVER installs anything or grants permissions — several of these (Xcode,
# `safaridriver --enable`, Accessibility) are human-only actions by design.
# The agent running this should relay FAIL lines to the user verbatim and stop.
#
# Usage: ./preflight.sh [--help]
# Exit codes: 0 all checks pass · 1 one or more checks fail

set -u

if [ "${1:-}" = "--help" ] || [ "${1:-}" = "-h" ]; then
  sed -n '2,14p' "$0" | sed 's/^# \{0,1\}//'
  exit 0
fi

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
fails=0

pass() { printf 'PASS %s — %s\n' "$1" "$2"; }
fail() { printf 'FAIL %s — %s | fix: %s\n' "$1" "$2" "$3"; fails=$((fails + 1)); }

# 1. Platform — everything below is macOS-only (Xcode Simulator, safaridriver,
#    CGEvent). There is no Windows/Linux equivalent; stop here if this fails.
if [ "$(uname -s)" = "Darwin" ]; then
  pass platform "macOS $(sw_vers -productVersion 2>/dev/null || echo '?')"
else
  fail platform "this is $(uname -s), but the skill drives Xcode's iOS Simulator via safaridriver + macOS CGEvent" \
    "run on a Mac — this skill is macOS-only and has no Windows/Linux equivalent"
  echo "RESULT: FAIL ($fails) — remaining checks skipped, they are all macOS-specific"
  exit 1
fi

# 2. Xcode + at least one available iOS Simulator device
if ! xcrun simctl help >/dev/null 2>&1; then
  if [ -d /Applications/Xcode.app ] && [[ "$(xcode-select -p 2>/dev/null)" == *CommandLineTools* ]]; then
    fail xcode "Xcode.app is installed but xcode-select points at CommandLineTools — simctl can't be found, and safaridriver will fail with 'Could not find Simulator.app' (it ignores DEVELOPER_DIR)" \
      "run: sudo xcode-select -s /Applications/Xcode.app (DEVELOPER_DIR=/Applications/Xcode.app is only a partial workaround: it fixes xcrun but NOT safaridriver)"
  else
    fail xcode "xcrun simctl is not functional" \
      "install Xcode from the App Store, then run: sudo xcode-select -s /Applications/Xcode.app && xcodebuild -runFirstLaunch"
  fi
else
  devices=$(xcrun simctl list devices available 2>/dev/null | grep -c '^\s*[A-Za-z]' || true)
  udid_count=$(xcrun simctl list devices available 2>/dev/null | grep -cE '\([0-9A-F-]{36}\)' || true)
  if [ "${udid_count:-0}" -gt 0 ]; then
    pass simulator "$udid_count available Simulator device(s)"
  else
    fail simulator "Xcode present but no iOS Simulator devices available" \
      "open Xcode > Settings > Components (or Platforms) and download an iOS Simulator runtime"
  fi
fi

# 3. safaridriver present. Whether it is *enabled* is not queryable; the first
#    session creation reveals it, so we only instruct here.
if command -v safaridriver >/dev/null 2>&1; then
  pass safaridriver "$(command -v safaridriver) (if session creation later fails with 'not enabled', run once: safaridriver --enable)"
else
  fail safaridriver "safaridriver not found on PATH" \
    "it ships with Safari at /usr/bin/safaridriver — ensure Safari is installed and PATH includes /usr/bin"
fi

# 4. Node >= 18 (sim-session.mjs and sim-bridge.mjs use global fetch)
if command -v node >/dev/null 2>&1; then
  node_major=$(node -p 'process.versions.node.split(".")[0]' 2>/dev/null || echo 0)
  if [ "${node_major:-0}" -ge 18 ]; then
    pass node "$(node --version)"
  else
    fail node "Node $(node --version 2>/dev/null || echo '?') is too old (need >= 18 for global fetch)" \
      "install Node.js >= 18 (e.g. brew install node)"
  fi
else
  fail node "node not found on PATH" "install Node.js >= 18 (e.g. brew install node)"
fi

# 5. Swift toolchain (compiles/runs the CGEvent helper scripts)
if command -v swift >/dev/null 2>&1 && swift --version >/dev/null 2>&1; then
  pass swift "$(swift --version 2>/dev/null | head -1)"
else
  fail swift "swift toolchain not functional" \
    "comes with Xcode; run: xcode-select --install (or install full Xcode)"
fi

# 6. Accessibility permission — required for CGEvent scroll/tap. Cannot be
#    granted programmatically; only the human at the machine can.
if command -v swift >/dev/null 2>&1 && [ -f "$SCRIPT_DIR/check-accessibility.swift" ]; then
  if swift "$SCRIPT_DIR/check-accessibility.swift" 2>/dev/null | grep -q 'postEventAccess: true'; then
    pass accessibility "terminal can post CGEvents"
  else
    fail accessibility "this terminal cannot post CGEvents (scroll/tap helpers will silently do nothing)" \
      "grant this terminal app Accessibility permission: System Settings > Privacy & Security > Accessibility (applies to new processes without restarting the terminal)"
  fi
else
  fail accessibility "cannot run check-accessibility.swift (swift missing or script not found)" \
    "fix the swift check above first, then re-run"
fi

if [ "$fails" -eq 0 ]; then
  echo "RESULT: PASS — environment ready"
  exit 0
else
  echo "RESULT: FAIL ($fails) — relay the fix lines above to the user; do not proceed"
  exit 1
fi
