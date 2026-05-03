# Easy-MD

A fully functional, Dillinger-style online Markdown editor built with vanilla JavaScript and Monaco Editor. Write clean, error-free Markdown with live preview, export capabilities, and distraction-free writing modes.

## Features

- **Monaco Editor** — Same code editor as VS Code with syntax highlighting for Markdown
- **Live Preview** — Real-time rendered Markdown output as you type
- **Toolbar Formatting** — Bold, italic, headings, lists, code blocks, links, images, tables, and more
- **Export Options** — Download your document as `.md`, `.html`, or `.pdf`
- **Dark Mode** — Easy on the eyes toggle
- **Zen Mode** — Fullscreen distraction-free writing
- **Auto-Save** — Your work is automatically saved to browser localStorage
- **Drag & Drop** — Drop Markdown files directly into the editor
- **Settings Panel** — Toggle word wrap, line numbers, auto-save, and Vim/Emacs keybindings
- **Scroll Sync** — Synchronized scrolling between editor and preview panes

## Quick Start

### Prerequisites

Easy-MD must be served via HTTP (not `file://` protocol) due to Monaco Editor's CDN loading requirements.

```bash
# Python 3
python -m http.server 8000

# Node.js
npx serve .

# PHP
php -S localhost:8000
```

Open your browser at `http://localhost:8000`.

### Using the Editor

1. **Write Markdown** on the left pane
2. **See live preview** rendered on the right pane
3. **Use toolbar buttons** for quick formatting or type Markdown syntax directly
4. **Export** your work via the export button (📄) as `.md`, `.html`, or `.pdf`

## Project Structure

```
Easy-MD/
├── index.html          # Main HTML structure and CDN imports
├── css/
│   └── style.css       # Global styles, dark mode, and responsive layout
├── js/
│   └── app.js          # Core application logic, Monaco initialization, and event handling
├── .gitignore          # Git ignore rules
├── LICENSE             # MIT License
└── README.md           # This file
```

## Dependencies (CDN)

| Library | Version | Purpose |
|---------|---------|---------|
| Monaco Editor | 0.45.0 | Code editor with Markdown syntax highlighting |
| Showdown | 2.1.0 | Markdown-to-HTML parser |
| html2pdf.js | 0.10.1 | PDF generation from HTML preview |

## Technical Details

### AMD Conflict Resolution

Monaco Editor uses an AMD loader that intercepts `define()` calls. This caused conflicts with other UMD libraries (`marked`, `html2pdf`). The solution:

1. **Showdown** replaced `marked.js` — no AMD dependencies, loads cleanly as plain script
2. **html2pdf.js** loaded before Monaco's loader to claim its anonymous `define()` first

### Auto-Save

Content is saved to `localStorage` under the key `easymd-content`. Settings are stored under `easymd-settings`. Both can be cleared via the Settings panel.

### Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| `Ctrl + B` | Bold |
| `Ctrl + I` | Italic |
| `Ctrl + K` | Insert link |
| `Ctrl + S` | Manual save |
| `Ctrl + Shift + Z` | Toggle Zen Mode |
| `Escape` | Exit Zen Mode |

## Browser Support

- Chrome/Edge (recommended)
- Firefox
- Safari

## License

MIT © 2026 Easy-MD

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## Roadmap

- [ ] Cloud storage sync (Google Drive, GitHub Gist)
- [ ] Collaborative editing via WebSockets
- [ ] Custom theme support
- [ ] Spell checker integration
- [ ] Export to DOCX format
