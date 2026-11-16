# Product renders

Studio-style 3D renders of the Tropos packaging, used as `img/*.webp` until real product photography exists.

```
cd tools/render
npm install three@0.160.0
python3 -m http.server 8765 &        # serve this folder
mkdir -p out && node shoot.js foundation omega creatine magnesium ashwagandha protein hydrate rest focus group
```

Colours, label text and the group layout live at the top of `render.html`. `shoot.js` writes transparent PNGs to `out/`.
Crop singles to 800×1000 and the group to its content, then export as WebP into `../../img/`.
