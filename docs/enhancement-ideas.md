# Enhancement Ideas

Starting point for a real brainstorm. Just bullet points — none of this is decided.

## Visual reskin (modern feel)

- Swap procedural graphics for sprite assets (Kenney top-down racing pack is free + permissive)
- Replace `Press Start 2P` with a friendlier rounded display font; keep retro option as a theme
- Real car shadow + subtle banking on turns
- Boost trail with gradient color (yellow → orange → red as speed builds)
- Track decorations: chevrons, tire marks, finish-line checker pattern, edge cones
- Animated countdown 3-2-1-GO at race start
- Glass/frosted HUD panels instead of flat rectangles
- Minimap in a corner showing car position around the loop
- Subtle camera zoom-out at high speed for sense of motion

## Retention / progression

- Coin economy: earn coins per race based on time + accuracy
- Car customization shop (colors, decals, body shapes) bought with coins
- Championship cups: 3-race series with cumulative time, unlock next cup by clearing prior
- Daily challenge: one fixed seed per day, single attempt, shareable time
- Rival AI ghost car (replay of player's previous best, or a tuned bot)
- "Nemesis facts" — track which multiplications the player consistently misses or answers slowly, weight them more in future races
- Streak counter for consecutive correct answers, with milestone rewards
- Per-table mastery meter (visual progress per multiplication table)

## Gameplay variants

- Time trial mode (no laps, race against the clock for N problems)
- Survival mode (timer shortens each correct answer; race ends when you miss)
- 2-player split-screen or hot-seat
- Power-ups on the track: shield, mega-boost, freeze opponent, double coins
- Variable track shapes per cup

## Audio

- Background music with intensity tied to speed (low-energy when stopped, urgent when fast)
- Distinct audio for streak milestones, lap completion, personal best
- Mute music separately from SFX
- Investigate whether music interferes with speech recognition; if so, duck during answer phase

## Quality / polish

- Pause menu (currently can only restart)
- Settings: SFX volume, music volume, timer length (easy/normal/hard)
- Better mobile/touch input (number pad overlay) — currently keyboard-only fallback
- Accessibility: dyslexia-friendly font option, colorblind-safe timer bar
- Tutorial / first-run flow explaining voice input and timer mechanic

## Known issues to fix opportunistically

- French parser bug: `quatre-vingt-un`, `quatre-vingt-deux`, etc. parse as 25/26 instead of 81/82 — the dict has hyphenated `quatre-vingt: 80` but splitting drops it
- Successive problems can share an answer, so the previous answer can satisfy the next problem (already in `issues.md`)
- Voice-match silently ignores wrong-but-recognized numbers; consider showing them as interim feedback so the player knows recognition worked

## Tech debt to chip away

- Convert remaining `.js` scenes to TypeScript (GameScene, GameOverScene, LeaderboardScene, MenuScene)
- Convert remaining `.js` systems (AudioManager, FrenchSpeechRecognition, ParticleEffects, SoundGenerator, Track)
- Extract a `RaceController` from GameScene if more state leaks in during feature work
