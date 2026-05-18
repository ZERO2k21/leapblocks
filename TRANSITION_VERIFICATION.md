# Proprietary Transition Verification Checklist

Please follow this checklist to verify the successful transition of the codebase to closed-source proprietary under Creoleap Technologies Pvt. Ltd.

### Phase 1: Pre-run
- [ ] **Git Backup:** Ensure your working tree is clean or create a branch: `git checkout -b chore/proprietary-transition`
- [ ] **Node.js:** Verify Node.js is available: `node -v`
- [ ] **Script Location:** Confirm `proprietary-transition.js` is at the project root (`d:\Creoleap Company\leapLap\leapblocks\proprietary-transition.js`).

### Phase 2: Execution
- [ ] **Dry Run:** Execute the script in dry run mode to verify targets and exclusions:
  ```bash
  node proprietary-transition.js --dry-run
  ```
  *Confirm the console output correctly targets `src/`, `server/` root files, and skips excluded paths.*
- [ ] **Live Run:** If the dry run looks correct, execute the script:
  ```bash
  node proprietary-transition.js
  ```

### Phase 3: Post-run Verification
- [ ] **Package Verification:** Check that both `package.json` and `server/package.json` have `"license": "UNLICENSED"` and `"private": true`.
- [ ] **Source Verification (src/):** Spot-check at least one `.ts` or `.tsx` file inside `src/` to ensure the Creoleap copyright header was injected at the top.
- [ ] **Source Verification (server/ root):** Spot-check `server/index.ts` to ensure the Creoleap copyright header was injected at the top.
- [ ] **Vendor Verification (avr8js):** Ensure files inside `src/modules/leapforge/lib/avr8js/` are untouched.
- [ ] **Vendor Verification (leap-elements):** Ensure files inside `src/modules/leapforge/elements/leap-elements/` are untouched.
- [ ] **Exclusion Verification:** Confirm `arduino-cli/` and `cp210x_drivers/` were not modified.
- [ ] **Licenses Document:** Confirm `THIRD_PARTY_LICENSES.md` exists exactly at the project root with the MIT credits.

### Final Step: Git Commit
Once verified, commit the changes using the following exact message:
```bash
git add .
git commit -m "chore: transition project to proprietary (Creoleap Technologies Pvt. Ltd.)"
```
