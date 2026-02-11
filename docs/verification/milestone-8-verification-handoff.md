# Milestone 8: Verification and Handoff

## Completed scope

- Created a concrete verification checklist mapped to accepted behavior from Milestones 1-7.
- Added manual QA scenarios for core configurator behavior.
- Added manual QA scenarios for Print/PDF correctness and fallback behavior.
- Captured implementation handoff notes for future work.
- Verified build health with `bun run build`.

## Acceptance checklist

Legend: `PASS` = verified in current implementation (code review and/or runnable checks), `MANUAL` = requires browser/manual QA execution.

| Area | Acceptance criteria | Verification method | Status |
| --- | --- | --- | --- |
| Functional scope | Paper size supports A4 and A3 | Confirmed options + dimensions mapping in `src/components/PaperConfigurator.tsx` | PASS |
| Functional scope | Orientation supports portrait and landscape | Confirmed orientation options + dimension swap logic in `src/components/PaperConfigurator.tsx` | PASS |
| Functional scope | Pattern color defaults to light gray and is editable | Confirmed default `#d3d3d3` + color input binding in `src/components/PaperConfigurator.tsx` | PASS |
| Functional scope | Pattern currently supports dots only | Confirmed single pattern option (`dots`) in settings and form | PASS |
| Functional scope | Dot width default is 1 mm | Confirmed default settings value in `src/components/PaperConfigurator.tsx` | PASS |
| Functional scope | Dot spacing default is 5 mm | Confirmed default settings value in `src/components/PaperConfigurator.tsx` | PASS |
| Functional scope | Page padding default is 5 mm | Confirmed default settings value in `src/components/PaperConfigurator.tsx` | PASS |
| Functional scope | Print action exists in configuration panel | Confirmed Print button and handler in `src/components/PaperConfigurator.tsx` | PASS |
| Layout/responsive | Desktop uses two-panel layout and mobile uses stacked layout | Existing implementation already delivered in milestone scope; validate via manual QA scenarios below | MANUAL |
| Sizing/scaling | Preview keeps correct page proportions for size+orientation | Confirmed aspect-ratio from resolved mm dimensions + manual scenario coverage | PASS + MANUAL |
| Sizing/scaling | mm-based settings map consistently to preview | Confirmed px/mm scaling and metadata calculations in `src/components/PaperConfigurator.tsx` | PASS |
| Validation | Numeric controls enforce ranges/minimums with fallback on commit | Confirmed constraints, validation messages, sanitize/clamp logic in `src/components/PaperConfigurator.tsx` | PASS |
| Preview behavior | Dot pattern renders inside printable area and respects padding | Confirmed printable inset + radial-gradient pattern logic in `src/components/PaperConfigurator.tsx` | PASS |
| Preview behavior | Color/width/spacing update preview immediately (no Apply button) | Confirmed state binding updates on change events in `src/components/PaperConfigurator.tsx` | PASS |
| State integration | Single source of truth keeps form and preview synchronized | Confirmed reducer-driven `settings` state and bound controls/preview | PASS |
| Print/PDF | PDF uses selected paper size and orientation | Confirmed `jsPDF` format and orientation derived from current settings | PASS |
| Print/PDF | PDF applies current pattern, spacing, width, color, and padding | Confirmed PDF drawing loop and printable bounds from current settings | PASS |
| Print/PDF | Print/download flow triggers from generated PDF | Confirmed new-tab flow (`window.open`) with download fallback | PASS |
| Print/PDF fallback | Failure path surfaces user-facing error message | Confirmed catch handler and error status message | PASS |

## Manual QA scenarios: core configurator behavior

Run these in `bun run dev` on desktop and mobile viewport.

| ID | Scenario | Steps | Expected result |
| --- | --- | --- | --- |
| CORE-01 | Default state on first load | Open page without prior interaction | A4 portrait, dot color `#d3d3d3`, dot width `1.0`, spacing `5.0`, padding `5.0`, visible dotted preview |
| CORE-02 | Size toggle preserves orientation state | Change Paper size A4 -> A3 -> A4 | Preview dimensions and metadata update each time; orientation value remains unchanged |
| CORE-03 | Orientation toggle swaps dimensions | Change Orientation portrait -> landscape -> portrait | Preview aspect ratio and metadata width/height swap correctly and restore correctly |
| CORE-04 | Dot width numeric lower edge | Enter `0.1` in Dot width and blur | Validation clears, value persists at `0.1`, dots become visually smaller |
| CORE-05 | Dot width numeric upper edge | Enter `10` in Dot width and blur | Validation clears, value persists at `10`, dots become visibly larger |
| CORE-06 | Dot spacing numeric lower edge | Enter `1` in Dot spacing and blur | Validation clears, denser dot pattern appears |
| CORE-07 | Dot spacing numeric upper edge | Enter `30` in Dot spacing and blur | Validation clears, sparse dot pattern appears |
| CORE-08 | Padding lower edge | Enter `0` in Page padding and blur | Printable area expands to full page bounds |
| CORE-09 | Padding upper edge clamp per page size | Enter value higher than shown max in Page padding and blur | Error appears while invalid; committed value clamps/formats to allowed maximum |
| CORE-10 | Invalid numeric transient input handling | Clear numeric input (blank) then blur | Inline validation appears while blank; on blur value reverts to last valid formatted value |
| CORE-11 | Immediate preview update | Change color/width/spacing/padding one by one | Preview surface updates immediately without additional apply action |
| CORE-12 | Reset behavior | Modify multiple fields then click Reset | All fields and preview return to default settings and messages clear |

## Manual QA scenarios: Print/PDF correctness and fallbacks

| ID | Scenario | Steps | Expected result |
| --- | --- | --- | --- |
| PDF-01 | Print success path | Click Print with popup allowed | Status shows generation progress then success text; PDF opens in new tab; print dialog may auto-open |
| PDF-02 | Popup-blocked fallback | Block popups for site and click Print | Informational message indicates popup blocked; PDF is downloaded with generated filename |
| PDF-03 | Size/orientation correctness in PDF | Generate each combo: A4/A3 x portrait/landscape | PDF page dimensions/orientation match selected combo in viewer/print dialog |
| PDF-04 | Dot style fidelity in PDF | Use distinct values (e.g., width 2.5, spacing 7.5, custom color) and Print | PDF dots reflect chosen width, spacing, color, and consistent grid layout |
| PDF-05 | Padding fidelity in PDF | Compare padding `0` vs near-maximum and Print both | Printable area boundaries in PDF visibly shift to match configured padding |
| PDF-06 | Extreme valid values in PDF | Use min/max valid numeric values and Print | PDF generates successfully and remains visually correct (no crash/blank unless expected from near-zero printable area) |
| PDF-07 | Error fallback messaging | Simulate PDF failure (e.g., temporary runtime import failure in dev tools) and click Print | Error status appears: unable to generate PDF and user can retry |

## Assumptions

- Milestones 1-7 are complete and represent accepted implementation scope.
- This milestone focuses on verification artifacts and handoff documentation, not feature expansion.
- Manual QA execution is performed by reviewer/product owner in a browser environment.

## Known limitations

- Manual QA is documented but not automated as test scripts.
- Pattern support is intentionally limited to dots in current scope.
- Print dialog invocation depends on browser popup/security behavior; fallback is download.
- Runtime print/PDF verification is browser-dependent and requires manual validation across target browsers.

## Commands run

| Command | Result |
| --- | --- |
| `bun run build` | PASS - Astro static build completed successfully (1 page built) |

## Handoff notes for future work

- Add automated coverage for reducer validation and numeric edge clamping (unit tests around state transitions).
- Add browser-driven integration checks for preview rendering and Print/PDF flow (Playwright-style smoke tests).
- Expand pattern system beyond dots only after extracting shared pattern rendering contract for both preview and PDF generators.
- Define target browser matrix and run the manual PDF scenarios against each browser before release sign-off.
