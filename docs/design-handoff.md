---
layout: default
title: "DataShare — UI design handoff"
permalink: /design-handoff.html
lang: en
---

# DataShare — UI design handoff

[**Français**](design-handoff.fr.md) · [Technical documentation](index.md)

**Source:** *DataShare UI Design Handoff*, version 1, **17 November 2026**, **23 pages**, based on the Figma exports. [Original Figma design](https://www.figma.com/design/i4HHiGsL7Kc3kVBo41m7F6).

**Full vector PDF:** [DataShare UI Design Handoff v1](design/DataShare_UI_Design_Handoff_v1.pdf), versioned in the repository. If Figma changes, compare against the updated source rather than silently treating this dated PDF as current.

## Role and scope

This handoff is the **visual reference and UI acceptance checklist** for upcoming Angular screens; the **OC specifications and US01–US06** define MVP behavior. TECH-04 established the runtime; US01 now implements a functional upload screen, **but the developer reported deviations from the Figma layout**. Visual alignment remains tracked under [UI-01 #37](https://github.com/jlbokass/datashare/issues/37), separate from functional upload acceptance.

- 12 original design exports, grouped into upload, login/registration, personal space, components, and public download variants (PDF pp. 2–3).
- Desktop **1440 × 1024**, mobile **393 × 852**. Verify intermediate widths **320 / 768 / 1024 px** and mobile navigation (PDF pp. 1, 21).
- Screens: homepage, login, registration, file upload, over-1-GB error, share confirmation, personal file history, download with/without password, expired share (PDF pp. 8–19).
- Component variants: text inputs, select, buttons, headers, filters **All / Active / Expired**, and info/warning/error messages (PDF pp. 6–7).

## Design values from the handoff

| Element | Value | Source status |
| --- | --- | --- |
| Text | `#1E1E1E` | Explicit Figma token |
| Card / neutral border | `#FFFFFF` / `#D9D9D9` | Explicit Figma tokens |
| Gradient top / bottom | `#FFB88C` / `#DE6262` | Visually sampled, not Figma tokens |
| Dark action button / orange accent | `#2C2C2C` / `#E27F29` | Visually sampled |
| Accent outline | `#FFA569` | Visually sampled |
| H1 / H2 | DM Sans Bold, 32/40px and 28/40px | Figma styles |
| Body / input | Inter Regular 16/24px; DM Sans Regular 16/16px | Figma styles |
| Small | DM Sans Regular 14/16px | Figma style |
| Spacing / radius / stroke | 8, 12, 16px / 8px / 1px | Figma tokens |
| Header height | 72px | Measured in design frames |

Do **not** invent exact status colors where the PDF only shows approximations (PDF pp. 4–5).

## Decisions to document before implementing screens

| Priority | Design / specification mismatch | MVP decision at TECH-04 |
| --- | --- | --- |
| **P0** | Password field in transfer/upload and protected download mocks | **Optional US09**: do not display a deceptive working field or promise this backend feature until separately approved/implemented. UI variant pending an explicit decision. |
| **P1** | Mockups frequently show **one file** per transfer | Preserve **multiple files per transfer** under mandatory US01/API contract; adapt the list as needed. |
| **P1** | Mock profile name/avatar (e.g. Claire Marie) | Use **real returned account data**, never fabricated user identity. |
| **P1** | Download error/expired states | Keep server behavior and status semantics; adjust presentation to the Figma states. |
| **P2** | Historic labels, including **© 2025** | Treat as reference copy; document deliberate changes rather than quietly copying outdated text. |

**Historical label caution:** handoff page 23 mentions “PR #32 / FRONT-FINAL”, an original document reference; it is **not** the current GitHub issue #32 (TECH-04) nor a confirmed PR number.

## UI acceptance later — not yet executed

At the actual frontend implementation/review stage, capture DevTools screenshots at 393px and 1440px, check 320/768/1024 widths, typography, color, layout, loading, error, success and expired states. Validate registration, upload limits, multifile handling, public links, deletion, responsive navigation and tests/build before marking anything **conformant**.

The PDF's sign-off section is **blank by design**, not evidence of completed QA.
