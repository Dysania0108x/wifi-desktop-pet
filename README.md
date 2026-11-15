# WiFi Desktop Pet 🐾

A tiny pixel-art desktop companion inspired by the real dog WiFi.

## Project status

**Design / setup stage.** The repository is being initialized with the character brief and implementation plan. The first playable macOS MVP will use a transparent always-on-top pet window and local state; no paid AI API is required.

## Character: WiFi

WiFi is a small, fluffy black-and-white dog. Its defining visual features:

- Long, fluffy white coat with irregular black patches on the back.
- Dark floppy ears and a dark face, with a narrow white blaze down the forehead.
- Warm brown eyes and a small dark nose.
- A very fluffy white plume tail curled over the back.
- Compact body and short legs.
- Signature accessories: a dark harness, a blue paw-and-bone patterned leash, and a small brown teddy toy.

The supplied character sheet is a **visual direction reference**, not a final production sprite atlas. Individual animation frames should be redrawn/exported as transparent sprites and checked against the original photo references.

## Planned MVP

1. Transparent, borderless, always-on-top macOS pet window.
2. Pixel-art WiFi with idle, walk, sit, lie/sleep, and tail-wag animations.
3. Click to pet; show a brief happy reaction.
4. Drag the pet around the screen.
5. Small context menu: follow / pause, sleep, reset position, quit.
6. Persist name, position, interaction count, and a few personality stats locally.
7. Respect reduced-motion and click-through / interaction modes where practical.

## Proposed stack

- Electron
- React + TypeScript + Vite
- CSS or canvas sprite renderer for pixel animation
- Local JSON / Electron store for persistence

## Development principles

- Keep all pet behavior local and deterministic in the MVP.
- Do not capture screenshots, inspect window contents, or monitor keystrokes.
- Do not send user activity or pet data to a remote service.
- Keep the pet small and unobtrusive; provide pause and quit controls.
- Confirm any third-party asset licenses before reuse.

## Repository layout (planned)

```
assets/
  reference/
  sprites/
docs/
  character-design.md
  roadmap.md
src/
  main/
  renderer/
```

## License

To be decided before public distribution. Until then, treat original project assets and code as All Rights Reserved unless a file states otherwise.
