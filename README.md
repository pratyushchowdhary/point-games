# Point Games — Nokia Snake

A dependency-free Nokia-style Snake game built with HTML, CSS, and JavaScript.

The original mode uses the Nokia 3310's 84 × 48 monochrome resolution and phone shell. Players can expand the playzone through representative 3.5″, 4.7″, 5.5″, 6.1″, and 6.7″ phone sizes, or use a laptop mode that fits the browser. Snake pixels remain the same size while the playzone grows.

The game includes two rule sets: Original uses wall collisions and fixed Nokia-style difficulty; Modern wraps across screen edges, awards one point per food, starts at 5 km/h, and gains 1 km/h per point.

## Run locally

Open `nokia-snake-game/index.html` in a browser, or run a local server from the repository root:

```sh
python3 -m http.server 8000
```

## Publish with GitHub Pages

1. Create a public GitHub repository.
2. Upload the files in this folder to the repository root.
3. Open **Settings → Pages**.
4. Under **Build and deployment**, select **Deploy from a branch**.
5. Select `main`, `/ (root)`, then click **Save**.

The game will be available at `https://YOUR-USERNAME.github.io/REPOSITORY-NAME/nokia-snake-game/`.
