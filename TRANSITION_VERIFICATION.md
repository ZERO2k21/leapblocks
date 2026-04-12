# Proprietary Transition Verification Checklist

Follow these steps to safely transition the project to a proprietary license model.

## Phase 1: Pre-Run (Preparation)
- [ ] **Git Backup**: Ensure all current changes are committed or stashed.
- [ ] **Node.js**: Confirm Node.js is installed (`node -v`).
- [ ] **Script Location**: Confirm `proprietary-transition.js` is in the project root.

## Phase 2: Execution
- [ ] **Dry Run**: Execute the preview command first:
  ```bash
  node proprietary-transition.js --dry-run
  ```
- [ ] **Audit Output**: Confirm the console log shows correct targets (src/, server/ root) and skips the excluded paths (`arduino-cli/`, `cp210x_drivers/`, `avr8js`, etc.).
- [ ] **Live Run**: Execute the actual transition:
  ```bash
  node proprietary-transition.js
  ```

## Phase 3: Post-Run Verification
- [ ] **Root Package**: Verify `package.json` has `"license": "UNLICENSED"` and `"private": true`.
- [ ] **Server Package**: Verify `server/package.json` has `"license": "UNLICENSED"` and `"private": true`.
- [ ] **Source Check (src/)**: Open a random file in `src/` (e.g., `src/App.tsx`) and confirm the 2026 proprietary header is at the top.
- [ ] **Source Check (server/)**: Open a root file in `server/` (e.g., `server/index.ts`) and confirm the proprietary header is present.
- [ ] **Vendor Headers**: Verify `src/modules/leapforge/lib/avr8js/index.ts` still contains the original **Uri Shaked** copyright.
- [ ] **Exclusion Check**: Confirm `arduino-cli/` and `cp210x_drivers/` folders do not contain the new proprietary headers.
- [ ] **Compliance File**: Confirm `THIRD_PARTY_LICENSES.md` exists at the project root with correct MIT attributions.

## Phase 4: Finalize
- [ ] **Commit**: Run the following command to finalize the transition:
  ```bash
  git add .
  git commit -m "chore: transition project to proprietary (Creoleap Technologies Pvt. Ltd.)"
  ```
