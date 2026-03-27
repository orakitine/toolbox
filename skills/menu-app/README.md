# menu-app

Convert a restaurant menu file into a self-contained single-page HTML ordering app.

## Quick Start

```
/menu-app ~/menus/restaurant-menu.pdf
```

## Options

| Variable | Default | Description |
|----------|---------|-------------|
| OUTPUT_DIR | `.` | Directory for generated HTML file |

## Prerequisites

None. Uses only Claude's native file reading (PDF, images, HTML, Markdown) and the Write tool.

## Examples

```
/menu-app ./menu.pdf
/menu-app ~/Downloads/sushi-menu.jpg ~/Desktop/sushi.html
/menu-app ./restaurant-website-saved.html
```

## What It Generates

A single HTML file with:
- Search and category filters
- Auto-tagged items (meat, fish, veg, etc.)
- Cart with quantities and per-item notes
- Copy-to-clipboard order text (paste into SMS, WhatsApp, etc.)
- Call and navigation buttons
- Mobile-first responsive design
- localStorage cart persistence
- Zero external dependencies

## Supported Input Formats

- PDF menus
- Photos/scans of menus (PNG, JPG)
- HTML (saved web pages)
- Markdown
- Word documents (DOCX, via macOS textutil)
