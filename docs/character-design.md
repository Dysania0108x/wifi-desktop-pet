# WiFi — Character Design Brief

## Identity

- Character name: WiFi
- Form: small, fluffy black-and-white companion dog
- Style: readable, warm pixel art; soft cream highlights and restrained lavender UI accents
- Intended display: small desktop companion, readable around 96–160 px tall

## Silhouette priorities

1. Big plume tail curled over the back. This is a major recognition cue.
2. Fluffy white coat and compact body.
3. Black floppy ears and dark mask around the eyes.
4. White central forehead blaze.
5. Irregular black patches along the back / flank.
6. Dark harness when shown from side or three-quarter views.

Avoid making WiFi look like a generic short-haired Dalmatian or a corgi. The coat should read as long and fluffy.

## Face

- Dark, floppy ears framing the face.
- White stripe/blaze down the forehead and muzzle.
- Warm dark-brown eyes.
- Small black nose.
- Gentle, slightly curious expression.

## Accessories

- Dark harness.
- Blue leash with small paw / bone motifs (optional cosmetic; not always attached).
- Brown plush bear toy, based on the photo reference.

## Sprite direction

Use a consistent pixel grid and limited palette. Avoid painterly anti-aliasing in production sprites; the concept sheet is illustrative only.

Suggested animation states:
- idle: breathing, blink, subtle ear movement
- walk: 4–6 frames, side view
- trot/run: 4–6 frames
- sit: transition + held pose
- lie down / sleep: transition + 2-frame breathing loop
- tail wag: 3–4 frames
- happy / petted: short reaction
- play: interact with teddy toy
- look up: glance toward pointer / screen edge

## Color palette (starting point)

- Deep coat black: #242329
- Warm charcoal: #454149
- Fur white: #F4F0E9
- Warm cream: #DCCFC0
- Eye brown: #6B4637
- Harness charcoal: #292B30
- Signature leash blue: #557BB5
- UI lavender: #B79ACD
- Background cream: #FAF7F1

Colors must be sampled/refined against the original photo references when production sprites are created.

## Asset quality checklist

- Transparent background.
- Consistent canvas size and ground baseline.
- No baked-in drop shadow unless deliberately part of a scene.
- Pixel edges remain crisp at integer scaling.
- Directional variants face the correct way.
- Animation frames align to prevent jitter.
- Inspect at actual desktop display size, not only enlarged.
