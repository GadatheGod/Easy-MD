# Changelog

All notable changes to Easy-MD will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [1.0.0] - 2026-05-04

### Added

- Monaco Editor integration with Markdown syntax highlighting
- Live preview pane with real-time Markdown rendering
- Toolbar with 12 formatting buttons (Bold, Italic, Strikethrough, Heading, Quote, Code, Lists, Link, Image, HR, Table)
- Export functionality for `.md`, `.html`, and `.pdf` formats
- Dark mode toggle
- Zen Mode (fullscreen distraction-free writing)
- Auto-save to browser localStorage with 500ms debounce
- Drag & drop file import support
- Settings panel with word wrap, line numbers, auto-save toggles
- Scroll synchronization between editor and preview
- Keyboard shortcuts (`Ctrl+B`, `Ctrl+I`, `Ctrl+K`, `Ctrl+S`, `Ctrl+Shift+Z`)
- Vim/Emacs keybinding options in settings
- Clear saved data button in settings
- Save status indicator ("Saving...", "Saved")

### Changed

- Replaced `marked.js` with `showdown@2.1.0` to resolve AMD loader conflicts with Monaco Editor
- Reordered script tags to load `html2pdf.js` before Monaco loader to prevent `define()` interception
- Added `innerHTML = ''` clear before Monaco initialization to remove stuck loading message
- Enabled showdown extensions: tables, ghCodeBlocks, tasklists, strikethrough

### Fixed

- **AMD conflict**: Monaco's loader intercepting anonymous `define()` calls from other UMD libraries
- **Stuck loading message**: "Loading editor..." text not cleared after Monaco initialization
- **Preview rendering**: Code blocks and tables now render correctly with showdown extensions enabled
- **PDF export**: html2pdf now loads properly after script reordering

### Technical Notes

- All dependencies loaded via CDN (no build step required)
- Vanilla JavaScript only — no frameworks or bundlers
- Must be served via HTTP (Monaco Editor CDN requires it)
