# Room page layout redesign

## Problem

`src/pages/Room.tsx` currently has four different mechanisms competing for
attention at the bottom of the screen:

1. A full-width danger button ("จบห้อง (ลบข้อมูลทั้งหมด)") sitting inline in
   the content flow, host-only.
2. A floating "+" FAB for adding items, positioned with a fragile
   `right: calc(50% - 240px + 18px)` calculation tied to the container width.
3. A sticky bottom bar for the primary "ดูสรุปหารเงิน" (view settlement)
   action.
4. Inline "+" links in the Members ("+ เพิ่มชื่อ") and Groups
   ("+ สร้างกลุ่ม") section headers — a pattern the Items section doesn't
   follow, despite being the same kind of action.

This inconsistency (three different CTA patterns for equivalent "add a
thing" actions, plus a host-only action dropped into the middle of the
content flow) is what reads as ad hoc / unpolished.

## Goals

- One consistent interaction pattern for "add a thing" across Members,
  Groups, and Items sections.
- Exactly one floating element on the page (the settlement sticky bar).
- The host-only "end room" action moved out of the content flow into the
  app bar, since it's an administrative action, not a primary flow action.
- Light visual separation between the three sections (members/groups/items)
  so the page reads as distinct modules on a single scroll, without a full
  restructure into tabs.

Explicitly out of scope: any change to state management, API calls, sheet/
dialog components (`AddMemberSheet`, `AddItemSheet`, `CreateGroupSheet`,
`ClaimSheet`, `ManageGroupSheet`, `FinishDialog`), or the settlement page.
This is a presentational reshuffle of `Room.tsx` and `index.css` only.

## Design

### Component structure (`Room.tsx`)

- Remove the FAB (`<button className="fab">+</button>`) entirely.
- Add a "+ เพิ่มรายการ" link in the "รายการ" section header (`.sec-title`),
  matching the existing Members/Groups pattern. It calls the same
  `setSheet("addItem")` handler the FAB used to call.
- Remove the inline `<button className="btn btn-danger mt-lg">จบห้อง...`
  from the content flow.
- Add a small circular icon button in the app bar, next to the code chip,
  visible only when `isHost` is true. Clicking it calls `setShowFinish(true)`
  directly — no dropdown/menu, since it's the only host action today.
  `FinishDialog` itself is unchanged; only the trigger moves.
- Wrap each section's title + body in a `<div className="section-panel
  section-panel--members">` / `--groups` / `--items` container for the
  tinted background treatment. No changes to the sheets/dialogs rendered
  at the bottom of the component.
- The sticky settlement bar (`.sticky-bar`) remains, and becomes the only
  floating element on the page.

### Visual styling (`index.css`)

- New `.section-panel` base class: rounded corners, internal padding,
  wraps a section's `.sec-title` + content.
- Three tint variants:
  - `.section-panel--members` — reuses the existing `--primary-soft` green
    tint (same green already used for avatar circles), so it stays
    consistent with a color already established in this page.
  - `.section-panel--groups` — a light neutral sand tint, deliberately
    *not* another green, since `.group-card` already carries its own green
    identity and doubling the tint would visually compete with it.
  - `.section-panel--items` — a light neutral blue-gray tint. Existing
    item-card semantics (green left border = claimed, dashed border =
    pending) are untouched inside the panel.
- New `.icon-btn` class for the host "end room" button: small circle, thin
  border, icon colored with the existing `--red` token, sized similarly to
  the code chip so the app bar stays visually balanced.
- Remove the now-dead `.fab` rule and its `@media (max-width: 512px)`
  override.
- Simplify `.sticky-bar`'s bottom offset now that it no longer needs to
  avoid overlapping a FAB.

### Data flow

No changes. Same state (`sheet`, `showFinish`, etc.), same handlers, same
API calls (`api.getRoomFull`, SSE refetch, etc.). This is UI-only.

### Testing / verification

No new automated tests (UI-only reshuffle with no new logic branches).
Verify manually by running the dev server and opening an existing room:

- As host: confirm the icon button next to the code chip opens the
  finish-room confirm dialog; confirm no FAB is present; confirm
  "+ เพิ่มรายการ" opens the add-item sheet.
- As non-host: confirm the icon button is absent (same `isHost` gating as
  before), everything else behaves the same.
- Confirm the three section panels render with visually distinct tints,
  and existing item-card claimed/pending styling still reads clearly on
  top of the items panel tint.
- Confirm the sticky settlement bar still hides while a sheet/dialog is
  open (`overlayOpen` logic unchanged) and no longer competes visually
  with anything else near the bottom of the screen.
