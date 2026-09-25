# Project context

- Static, single-page QR code generator hosted with Sites. Public files live in `dist/`.
- QR matrices are generated locally in the browser using bundled `qrcode-generator` 2.0.4. The page draws them to canvas with a four-module quiet zone and exports that canvas as PNG.
- Keep controls labeled, keyboard accessible, and responsive. Preserve live updates and clear empty/overflow feedback.
- Do not add a server or transmit entered content; generation is client-side.

## 2026-09-25 — Initial QR code generator

### Amaç

Create a simple QR generator with a live preview, foreground/background colors, PNG size, error correction, and download.

### Yapılanlar

- `dist/index.html` and `dist/styles.css`: One responsive page with labeled controls, live preview, empty/error feedback, and PNG download action.
- `dist/app.js`: Client-side QR generation, canvas rendering, download, and optional WebMCP configuration tool.
- `dist/qrcode.js`: Bundled MIT-licensed `qrcode-generator` 2.0.4 for offline-capable generation.
- `.openai/hosting.json` and `README.md`: Static Sites configuration and usage notes.

### Hedef durumu

- [x] Implement and verify the requested generator.

### Teknik kararlar

- Use a static page and bundled QR library so entered content stays in the browser. Draw a four-module quiet zone into the export canvas for scan reliability.

### Testler

- `node --check dist/app.js` and `node --check dist/qrcode.js`: Passed.
- Local HTTP and browser interaction: Live content, size, color, and error correction changes worked; empty and overflow states disabled download.
- PNG download: A 640 × 640 PNG was saved and decoded back to its source text with `jsQR`.

### Bilinen sorunlar ve sonraki adımlar

- Optional WebMCP registration could not be exercised in the available browser because it does not expose a supported WebMCP context.
