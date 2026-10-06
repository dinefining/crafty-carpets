# Crafty Carpets

Weave your own rug in the browser. Pick a motif, paint it onto a knotted grid, and the loom mirrors it, ties it knot by knot, and lets you recolour, rotate, save and export.

No build step, no server, no dependencies — open `index.html` and it runs.

## Use it

| Key | Action |
| --- | --- |
| Click / drag | Paint motif |
| R | Rotate right |
| T | Rotate left |
| + | Increase motif size |
| − | Decrease motif size |
| M | Change mirror |
| E | Eraser on / off |
| [ | Previous motif |
| ] | Next motif |
| Cmd+Z | Undo |
| Cmd+Shift+Z | Redo |
| Cmd+S | Save to collection |
| Pinch | Zoom |
| Space + drag | Pan |

Saved rugs are kept in your browser (localStorage), so they stay on the device you made them on.

## Files

| File | What's in it |
| --- | --- |
| `index.html` | Page layout and toolbar |
| `style.css` | All styling (colours are CSS variables at the top) |
| `motifs.js` | The motif library and colour palettes |
| `app.js` | Canvas, painting, mirroring, colours, collection, export |
| `favicon.svg`, `og.png` | Browser icon and link-preview image |

## Change things

- **Add a hand-drawn motif:** in `motifs.js`, add an entry to `FIGURES` — 11 strings of 11 characters each. `.` empty · `k` line · `a` accent A · `b` accent B · `w` accent C · `f` base.
- **Add a colour preset:** add a row to `PALETTES` in `motifs.js` (six colours: base, band, line, accent A, accent B, accent C).
- **Change the default colours or motif:** the `S` state object at the top of `app.js`.
- **Restyle the interface:** the `:root` variables at the top of `style.css`.

## Run locally

Open `index.html` in a browser, or serve the folder with any static server, e.g. `python3 -m http.server`.

## Publish

Push the folder to a public GitHub repository and turn on **Settings → Pages → Deploy from branch (main, root)**.
Once live, change the `og:image` line in `index.html` to the full address of `og.png` (e.g. `https://yourname.github.io/crafty-carpets/og.png`) so link previews show the image.
