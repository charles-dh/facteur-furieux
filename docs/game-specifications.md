# Math Racer - Game Specifications

## Overview

Math Racer is a top-down educational racing game that teaches multiplication tables through engaging, fast-paced gameplay. Players race a car around a track by solving multiplication problems using voice input, with speed rewards for quick, accurate answers.

**Visual perspective**: Top-down view (bird's eye), similar to classic arcade racers like Super Sprint or Micro Machines.

## Target Audience

- French-speaking children (ages 7-12)
- Elementary school students learning multiplication tables
- Players with access to desktop/laptop with microphone

## Core Purpose

Transform multiplication practice from rote memorization into an exciting racing experience where:
- Speed of calculation directly impacts game performance
- Voice input provides hands-free, immersive gameplay
- Immediate feedback reinforces learning
- Momentum-based physics rewards consecutive correct answers

## Gameplay Loop

1. **Problem appears with 6-second timer**
2. **Player answers using voice** (can retry wrong answers until timer expires)
3. **Correct answer** → Car receives speed boost (strength based on remaining timer)
4. **New problem appears** after brief delay (~0.5 seconds)
5. **If timer expires** → No boost, new problem appears, car loses momentum
6. **Complete laps** → Track progress, beat personal records

### Key Mechanic: Timing & Momentum

**The core challenge**: Maintain momentum by answering before the timer expires.

**Critical mechanics**:
- **Boost strength = remaining timer** (instant answer = maximum boost, last second = minimal boost)
- **Friction continuously slows the car** between problems
- **No boost on timeout** → car can completely stop if player struggles
- **Wrong answers don't stop the timer** → player can keep trying until time runs out
- **Pressure increases** as car slows down → must answer quickly to regain speed

**Strategic depth**:
- Quick consecutive correct answers → accelerating car, fast lap times
- Hesitation or wrong answers → timer burns, weaker boost or no boost
- Risk of complete stop → creates tension and urgency
- Accuracy matters → wrong answers waste precious timer seconds

## Game Screens

### 1. Welcome Screen

**Purpose**: Configuration and game setup

**Elements**:
- Game title and branding
- Player name input field
- Multiplication table selector (buttons for tables 2-10)
- "Select All" quick option
- Start button (disabled until at least one table selected)

**Validation**:
- At least one multiplication table must be selected
- Player name is optional (defaults to "Pilote")

### 2. Game Screen

**Purpose**: Main racing and problem-solving interface

**Layout**:
- **Center viewport**: Top-down view of racing track with car sprite
- **Center overlay**: Current multiplication problem with timer bar (displayed over track)
- **Top-left HUD**: Lap count, accuracy percentage, correct/incorrect count
- **Top-right HUD**: Lap times (current, last, best), total race time
- **Top-right corner**: Restart button

**Camera**: Fixed overhead view showing entire track (no scrolling/following)

**Visual Feedback**:
- Timer bar color changes (green → yellow → red) as time runs out
- Boost effect (flame particles) when car accelerates
- Current answer display below problem
- Feedback messages for correct/incorrect answers
- Speed indicator showing current velocity

**Audio Feedback**:
- Engine sound (pitch increases with speed, silent when stopped)
- Correct answer sound (uplifting chime)
- Incorrect answer sound (brief buzzer, doesn't interrupt gameplay)

### 3. Game Over Screen

**Purpose**: Display final results and allow replay

**Triggered by**: Completing 3 laps

**Elements**:
- "Course Terminée!" (Race Finished) message
- **Total race time** (primary metric)
- **Best lap time**
- **Accuracy percentage**
- **Total correct/incorrect answers**
- "Rejouer" (Play Again) button → Returns to Welcome Screen

**No scoring system**: Race time is the performance metric. Players compete against their own best times.

## Problem Generation

**Rules**:
- Problems based on selected multiplication tables
- At least one factor must be from selected tables
- Second factor ranges from 2-10
- No duplicate problems in same session
- Random order to prevent pattern memorization

**Example**: If player selects tables 5 and 7:
- Valid: 5 × 3, 7 × 8, 4 × 5, 9 × 7
- Invalid: 3 × 4 (neither factor from selected tables)

## Performance Metrics

**No point-based scoring** - Time is the only score that matters.

**Tracked statistics**:
- **Total race time** (primary goal: minimize this)
- **Individual lap times** (current, last, best)
- **Accuracy percentage** (correct answers / total attempts)
- **Correct vs. incorrect answers** (for learning feedback)

**Performance incentive**:
- Faster answers → stronger boosts → faster lap times
- Wrong answers → wasted timer → weaker/no boost → slower times
- Perfect accuracy with fast answers = optimal race time

## Input Methods

**Primary**: Voice recognition (French)
- Continuous listening during gameplay
- Accepts number words ("douze") and digits ("12")
- Tolerant of homophones (e.g., "sang" → "cent")

**Secondary**: Keyboard (fallback/testing)
- Numeric keys for digits
- Enter to submit
- Backspace to delete

## Game Parameters (MVP)

- **Lap count to complete**: 3 laps
- **Problem timer**: 6 seconds
- **Boost calculation**: Linear mapping (6s remaining = max boost, 0s = no boost)
- **Wrong answers**: Don't stop timer, player can retry until timeout
- **Delay after correct answer**: ~0.5 seconds before next problem
- **Delay after timeout**: ~0.2 seconds before next problem
- **Car can stop**: Yes, if momentum is lost (no boost + friction)
- **Target browser**: Chrome/Edge (best speech recognition support)

## Success Metrics

A successful game session achieves:
- Fluid gameplay with no awkward pauses
- Responsive voice recognition (<1 second recognition time)
- Clear correlation between answer speed and car performance
- Engaging visual/audio feedback
- Educational value: reinforced multiplication fluency

## Future Enhancements (Post-MVP)

- Multiple track designs with varying difficulty
- Power-ups (shields, mega-boost, time freeze)
- Multiplayer racing
- Leaderboards
- Different game modes (time trial, survival)
- Customizable car appearance
- Achievement system

