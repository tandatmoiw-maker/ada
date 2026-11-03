# ThreeUI Community Bookshelf

The public library hero uses the actual Bookshelf renderer from [MengTo/threeui](https://github.com/MengTo/threeui), rather than a hand-made imitation. The source is MIT licensed by Meng To (2026); the license is retained at `public/threeui/LICENSE-ThreeUI.txt`.

## Vendored source

- `src/threeui/bookshelfRenderer.js`: upstream `src/shaders/bookshelf/bookshelfRenderer.js`.
- `src/threeui/three165/*`: the four upstream vendored Three.js 0.165.0 addons required by that renderer.
- `public/threeui/cover-atlas.webp` and `walnut.webp`: the exact embedded base64 assets extracted from the upstream renderer, without image modification. The original cover atlas is retained for provenance; library mode does not download or display it.
- Required npm alias: `three165: npm:three@0.165.0`. No dependency on the full ThreeUI component package is needed.

Source retrieved from the official repository's `main` branch on 2026-11-01. The upstream generated renderer retains its canonical SHA-256 comments.

## Local integration

`Bookshelf` is a decorative scene, not a library catalog. The actual searchable catalog remains regular accessible HTML. Its host gets its dimensions from the containing hero's CSS. `data-state` reports `loading`, `ready`, `unavailable`, `reduced-motion`, or `software-fallback` for verification.

The React wrapper checks WebGL support before importing the detailed renderer. SwiftShader, llvmpipe, softpipe and other explicitly named software renderers use the CSS perspective book collection immediately. Hardware WebGL uses the actual ThreeUI scene, rendered on demand after snapping the decorative books into their initial shelf positions. Device pixel ratio is capped at 1.5 on desktop and 1 on mobile.

The wrapper lazy-loads the renderer when the scene approaches the viewport, disposes Three.js resources on unmount, observes host resizing, and pauses rendering off screen. Reduced motion uses a static arrangement of HTML covers without loading Three.js. If WebGL fails or its context is lost, the same static alternative remains visible. The wrapper supplies an image description unless the parent marks it decorative.

The seven books use local display metadata from `src/threeui/collection.ts`: Nhà giả kim, Rừng Na Uy, Hoàng tử bé, Atomic Habits, Sapiens, Đi tìm lẽ sống, and Cây cam ngọt. These titles and authors render through ThreeUI's existing procedural cloth-and-foil Canvas textures. They are typographic illustrations, not replicas of published cover artwork. Static fallback covers use that same metadata.

Small adaptations to the upstream renderer:

1. External asset paths replace the embedded data URLs so the browser can cache the images separately.
2. The microcopy DOM lookup is scoped to the scene host.
3. `neutralTheme` applies a warm paper-colored room while preserving the original books, geometry, textures, lighting, camera and animation.
4. `setActive` pauses the render loop while the scene is outside the viewport.
5. The host ignores pointer input because the scene is artwork. Hidden upstream controls exist solely to satisfy the original renderer's DOM contract.
6. `libraryCollection` replaces the seven display titles, authors and colors, uses the upstream procedural cover generation instead of its technology cover atlas, and adjusts the text layout for Vietnamese titles. Book geometry, page construction, materials and physics remain based on the original renderer.
7. `staticArtwork` snaps books to their shelf slots before the first render and stops the perpetual animation loop. Resizing, texture readiness and visibility changes can request a new render.
8. RAF delta is clamped to 0–0.05 seconds. An observed first RAF timestamp was 24.297782 seconds older than `performance.now()` after expensive startup; passing that negative delta to exponential damping sent book transforms far outside the camera. `frameTiming.test.ts` checks the actual Three.js damping function through 120 updates with that timestamp pattern.

## Validation

The corrected hardware scene was visually verified in Edge at 1440×900 using Intel UHD Graphics 620 through ANGLE/D3D11: five books appeared in the hero camera, with the outer collection cropped by the frame as intended. The richer HTML fallback was visually verified by enabling reduced motion. Software renderer detection is implemented; it was not claimed as a hardware test result.

The vendored Three.js addons are also MIT licensed; `public/threeui/LICENSE-ThreeJS.txt` retains that notice.
