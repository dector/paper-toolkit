# TODO

## Project Description

This project is a simple React-based paper pattern configurator page embedded in the Astro app. The UI has two areas: a live paper preview on the left and a configuration form on the right. Users can choose paper size and orientation, adjust dot pattern appearance, and immediately see changes reflected in the preview. The configuration also includes a Print action that generates a PDF using the selected paper settings.

## Paper Pattern Page Plan

- [x] Finalize functional scope and defaults
  - [x] Paper size: A4, A3
  - [x] Orientation: portrait, landscape
  - [x] Pattern color: default light gray
  - [x] Pattern: dots only (for now)
  - [x] Dot width: default 1mm
  - [x] Dot spacing: default 5mm
  - [x] Page padding: default 5mm
  - [x] Include Print button in configuration panel
  - [ ] Print action generates PDF from current settings

- [x] Define page layout and responsiveness
  - [x] Two-panel desktop layout: left preview, right form
  - [x] Mobile stacked layout with usable controls and readable preview

- [x] Define sizing/scaling rules
  - [x] Keep correct page proportions for A4/A3 + orientation
  - [x] Map mm-based settings to on-screen preview consistently
  - [x] Set valid ranges/minimums for numeric controls

- [x] Define preview rendering behavior
  - [x] Render dot pattern inside printable area (respect padding)
  - [x] Apply color, width, spacing changes immediately
  - [x] No manual apply action; preview auto-updates on each change

- [ ] Define form behavior and validation
  - [ ] Control types per setting (choice/color/numeric)
  - [ ] Validation and fallback behavior for invalid input
  - [ ] Optional reset-to-defaults behavior

- [ ] Define React integration plan
  - [ ] Single source of truth for settings state
  - [ ] Synchronized updates between form controls and preview

- [ ] Define PDF generation and print flow
  - [ ] Generate PDF with selected paper size and orientation
  - [ ] Apply current dot pattern, spacing, width, color, and padding in PDF output
  - [ ] Trigger browser print/download flow from generated PDF
  - [ ] Define fallback/error behavior if PDF generation fails

- [ ] Verification and handoff
  - [ ] Check all requirements against acceptance criteria
  - [ ] Manual QA scenarios (size/orientation toggles, edge numeric values)
  - [ ] Manual QA scenarios for Print/PDF output correctness
  - [ ] Prepare implementation handoff notes
