# MAA Status Frontend

## Quick Start

1. Install dependencies (none required for runtime).
2. Run a local static server from the project root:

```bash
python3 -m http.server 8080
```

3. Open `http://localhost:8080` in your browser.

## Endfield-style Interactive Disc

This project now includes an interactive circular WebGL element built with Three.js + GLSL shaders.

- JavaScript logic: `app.js`
- Vertex shader displacement logic: `shaders/disc.vert.glsl`
- Fragment shader shading: `shaders/disc.frag.glsl`

### How deformation works

- The cursor is raycast onto the circular mesh to get UV coordinates.
- Vertex displacement uses distance-based Gaussian falloff.
- Near cursor: positive lift.
- Farther area: subtle negative sink.
- Optional velocity-driven ripple is added while the cursor moves.
- Cursor and hover values are interpolated each frame for smooth elastic motion.
- If Three.js or shader files are unavailable, the UI automatically falls back to a Canvas-based interactive disc so the page still works offline.

