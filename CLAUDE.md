# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**Math Racer** - Educational racing game teaching multiplication tables through voice-controlled gameplay.

- **Target audience:** French-speaking children (ages 7-12)
- **Core mechanic:** Answer multiplication problems with voice to boost car speed
- **Tech stack:** Phaser 3, Vite, JavaScript ES6+, Web Speech API
- **Browser:** Chrome only (for Web Speech API support)

**Key documentation:**

- [`README.md`](./README.md) - Quick start and project structure
- [`docs/game-specifications.md`](./docs/game-specifications.md) - Complete game design and mechanics
- [`docs/technical-architecture.md`](./docs/technical-architecture.md) - System design and implementation details
- [`docs/implementation-plan.md`](./docs/implementation-plan.md) - Development milestones

## Code Style & Philosophy

Follow these principles when writing or modifying code:

- **Simplicity over abstraction** - Prefer direct, straightforward code. Only introduce abstraction when there's a concrete need.

- **Readability is paramount** - Code will be read by junior developers. Write clear, explicit code over clever or terse code.

- **Ample comments** - Add more comments than typical. Explain _why_ decisions were made, especially when using third-party libraries. Less common libraries need more explanation.

- **Minimal exception handling** - Don't add excessive try/catch blocks initially. Focus on core functionality. Exception handling can be enhanced later if needed.

- **Minimal test coverage (for now)** - Write tests for core logic and major functions, but don't aim for 100% coverage. Code will likely be refactored. Test enough to catch major breaks.


## Git & Version Control

- **Do NOT commit changes** unless explicitly asked by the user
- **Do NOT push to remote** unless explicitly instructed
- Check git status before making assumptions about repository state

### Branch Workflow

When merging feature branches into main:

1. **Always use `--no-ff` (no fast-forward) flag** to preserve branch history

   ```bash
   git merge --no-ff feature/my-feature
   ```

2. **Branch naming conventions:**

   - `feature/` - New features
   - `refactor/` - Code refactoring
   - `fix/` - Bug fixes
   - `docs/` - Documentation updates

3. **Typical workflow:**

   ```bash
   # Create feature branch from main
   git checkout main
   git checkout -b feature/my-feature

   # ... make changes and commit ...

   # Rebase onto main if needed (to ensure clean history)
   git rebase --onto main <parent-branch>

   # Switch to main and merge with --no-ff
   git checkout main
   git merge --no-ff feature/my-feature -m "Merge feature: description"

   # Delete the feature branch after merging
   git branch -d feature/my-feature
   ```

- CLAUDE.md is for coding workflow only, not implementation details.
