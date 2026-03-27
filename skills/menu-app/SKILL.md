---
name: menu-app
description: >-
  Convert a restaurant menu (PDF, image, Word, HTML, Markdown) into a
  self-contained single-page HTML ordering app. Extracts items, prices,
  categories, and contact info, then generates a mobile-friendly page with
  search, filters, cart, and copy-to-clipboard order text. Use when given
  a menu file to turn into an interactive ordering tool.
argument-hint: "<menu-file-path> [output-path]"
allowed-tools:
  - Read
  - Write
  - Bash
---

# Purpose

Read a restaurant menu file in any format Claude can parse (PDF, image, DOCX, HTML, Markdown) and generate a single self-contained HTML file that serves as a mobile-friendly ordering assistant with search, filtering, cart, and SMS-ready order text export.

## Workflow

1. **Locate and Read the Menu**
   - IF: `$ARGUMENTS` contains a file path → read that file
   - IF: `$ARGUMENTS` is empty → prompt for the menu file path
   - Supported formats: PDF (Read tool), images/PNG/JPG (Read tool), HTML/MD/TXT (Read tool), DOCX (extract via Bash `textutil` on macOS or similar)
   - IF: file not found or unreadable → stop and report
   - Example: `/menu-app ~/menus/pizza-palace.pdf` → Read the PDF, see the menu pages
   - Tool: Read (for PDF, images, text), Bash (for DOCX conversion if needed)

2. **Extract Structured Data**
   - Parse the menu content into structured data. Extract ALL of the following:
   - **Restaurant info**: name, tagline/motto, phone number(s) with contact names, email, address, delivery policy, business hours, any special notes
   - **Categories**: section headings that group menu items (e.g., "Appetizers", "Salads", "Main Courses", "Desserts", "Drinks")
   - **Menu items** — for each item extract:
     - Name (in original language)
     - English name/translation (if menu is non-English, translate; if already English, skip)
     - Price and unit (per lb, per piece, per kg, per liter, etc.)
     - Variants/sub-items (e.g., fillings, sizes, cooking options) with their individual prices if different
     - Minimum order constraints (e.g., "min 5 of same filling")
     - Seasonal or availability notes
     - Brief description if present on the menu
   - **Auto-tag items** based on ingredient keywords in the name/description:
     - `meat` — beef, pork, lamb, salo, liver, tongue
     - `chicken` — chicken, poultry, turkey, duck
     - `fish` — fish, salmon, tuna, shrimp, crab, herring, sturgeon, seafood
     - `veg` — items with no meat/chicken/fish indicators
     - `popular` — if the menu highlights it, or if it's a well-known signature dish
     - `seasonal` — if marked seasonal or limited availability
   - IF: price is "by arrangement" or missing → set price to null, display "by arrangement"
   - IF: item has variants at different prices → create separate entries OR a single entry with variant details
   - Example: "Блинчики с начинкой: мясо/творог/яблоки — $3/шт, мин. 5" → name: "Blini with filling", price: 3, unit: "pc", details: "meat / cheese / apple / potato / cabbage / mushroom / cherry — min 5 of same filling", tags: []
   - Example: "Fish & Chips — $14.99" → name: "Fish & Chips", price: 14.99, unit: "", tags: ["fish"]

3. **Determine Branding**
   - Pick a color scheme that fits the restaurant's vibe:
     - IF: menu has visible brand colors → match them
     - IF: upscale/fine dining → muted, elegant palette (dark backgrounds, gold/cream accents)
     - IF: casual/family → warm, inviting palette (earthy tones, readable)
     - IF: fast food/takeout → bold, high-contrast palette
     - IF: no strong signals → use a warm neutral palette
   - Choose an accent color for buttons, highlights, and the cart
   - Ensure sufficient contrast for accessibility (text on background)
   - Example: Russian catering with yellow-toned PDF → warm brown/sienna accent on cream background

4. **Generate the HTML App**
   - Read and follow `${CLAUDE_SKILL_DIR}/cookbook/html-app-spec.md` for the complete HTML generation spec
   - Write a single self-contained HTML file — all CSS and JS inline, zero external dependencies
   - The spec covers: header with contacts, search/filters, menu card grid, cart system with localStorage, order text export, call/navigate buttons
   - Example: 90-item Russian catering menu → single HTML file with 5 category sections, filter pills for meat/fish/veg/chicken, slide-out cart, copy-to-clipboard order text
   - Tool: Write

5. **Determine Output Path and Write**
   - IF: `$ARGUMENTS` contains a second argument → use as output path
   - ELSE: derive from restaurant name → e.g., `pizza_palace_menu.html` in the current directory
   - Write the complete HTML file
   - Example: `/menu-app ~/menus/sushi-zen.pdf` → writes `sushi_zen_menu.html`
   - Example: `/menu-app ~/menus/cafe.pdf ~/Desktop/cafe.html` → writes to specified path
   - Tool: Write

6. **Verify**
   - Read the generated file to confirm it's well-formed
   - Report to user: output path, number of items extracted, number of categories, any items with missing prices or ambiguous data
   - IF: items were ambiguous or skipped → list them so the user can review
   - Example: "Generated pizza_palace_menu.html — 47 items across 5 categories. 2 items marked 'price by arrangement'."
   - Tool: Read
