# playwright-cli Command Reference

Full command list for `playwright-cli`. All commands accept `-s=<session-name>` for session targeting.

## Session Management

| Command | Description | Example |
|---------|-------------|---------|
| `open [url]` | Launch browser | `-s=test open https://example.com --persistent` |
| `close` | Close session | `-s=test close` |
| `close-all` | Close all sessions | `close-all` |
| `list` | List active sessions | `list` |
| `delete-data` | Wipe session data | `-s=test delete-data` |

## Navigation

| Command | Description | Example |
|---------|-------------|---------|
| `goto <url>` | Navigate to URL | `-s=test goto https://example.com/page2` |
| `go-back` | Navigate back | `-s=test go-back` |
| `go-forward` | Navigate forward | `-s=test go-forward` |
| `reload` | Reload page | `-s=test reload` |

## Element Interaction

| Command | Description | Example |
|---------|-------------|---------|
| `snapshot` | Get element refs | `-s=test snapshot` |
| `click <ref>` | Click element | `-s=test click e12` |
| `fill <ref> <text>` | Fill input field | `-s=test fill e15 "hello"` |
| `type <text>` | Type into focused element | `-s=test type "search"` |
| `press <key>` | Press keyboard key | `-s=test press Enter` |
| `hover <ref>` | Hover over element | `-s=test hover e20` |
| `select <ref> <val>` | Select dropdown option | `-s=test select e30 "option1"` |

## Tabs

| Command | Description | Example |
|---------|-------------|---------|
| `tab-list` | List open tabs | `-s=test tab-list` |
| `tab-new [url]` | Open new tab | `-s=test tab-new https://example.com` |
| `tab-select <i>` | Switch to tab by index | `-s=test tab-select 1` |

## Capture

| Command | Description | Example |
|---------|-------------|---------|
| `screenshot` | Capture page as PNG | `-s=test screenshot --filename=out.png` |
| `console` | Get JS console output | `-s=test console` |

## Common Flags

| Flag | Purpose |
|------|---------|
| `--persistent` | Preserve cookies/localStorage across commands |
| `--headed` | Show visible browser window |
| `--browser=chrome` | Use specific browser engine |
| `--filename=<path>` | Save screenshot to specific path |
