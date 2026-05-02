# Enhancement Ideas

Starting point for a real brainstorm. Just bullet points — none of this is decided.

## Visual reskin (modern feel)

- Swap procedural graphics for sprite assets (Kenney top-down racing pack is free + permissive)
- Boost trail with gradient color (yellow → orange → red as speed builds)
- Subtle camera zoom-out at high speed for sense of motion
- Track decorations: chevrons, tire marks, finish-line checker pattern, edge cones
- Replace `Press Start 2P` with a friendlier rounded display font; keep retro option as a theme
- Real car shadow + subtle banking on turns
- Animated countdown 3-2-1-GO at race start
- Glass/frosted HUD panels instead of flat rectangles
- Minimap in a corner showing car position around the loop

## Retention / progression

- Streak counter for consecutive correct answers, with milestone rewards
- Rival AI ghost car (replay of player's previous best, or a tuned bot)
- Per-table mastery meter (visual progress per multiplication table)
- "Nemesis facts" — track which multiplications the player consistently misses or answers slowly, weight them more in future races
- Coin economy: earn coins per race based on time + accuracy
- Car customization shop (colors, decals, body shapes) bought with coins
- Championship cups: 3-race series with cumulative time, unlock next cup by clearing prior
- Daily challenge: one fixed seed per day, single attempt, shareable time

## Gameplay variants

- Variable track shapes per cup
- Time trial mode (no laps, race against the clock for N problems)
- Survival mode (timer shortens each correct answer; race ends when you miss)
- 2-player split-screen or hot-seat
- Power-ups on the track: shield, mega-boost, freeze opponent, double coins

## Audio

- Distinct audio for streak milestones, lap completion, personal best

## Quality / polish

- Settings: SFX volume, music volume, timer length (easy/normal/hard)
- Tutorial / first-run flow explaining voice input and timer mechanic
- Pause menu (currently can only restart)
- Better mobile/touch input (number pad overlay) — currently keyboard-only fallback
- Accessibility: dyslexia-friendly font option, colorblind-safe timer bar

## Known issues to fix opportunistically

- Successive problems can share an answer, so the previous answer can satisfy the next problem (already in `issues.md`)
- French parser bug: `quatre-vingt-un`, `quatre-vingt-deux`, etc. parse as 25/26 instead of 81/82 — the dict has hyphenated `quatre-vingt: 80` but splitting drops it
- Voice-match silently ignores wrong-but-recognized numbers; consider showing them as interim feedback so the player knows recognition worked

## Tech debt to chip away

- Convert remaining `.js` scenes to TypeScript (GameScene, GameOverScene, LeaderboardScene, MenuScene)
- Convert remaining `.js` systems (AudioManager, FrenchSpeechRecognition, ParticleEffects, SoundGenerator, Track)
- Extract a `RaceController` from GameScene if more state leaks in during feature work
