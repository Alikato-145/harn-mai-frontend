# Claim: "select people" split mode

## Problem

When claiming an item, the split UI currently offers two modes: `all` (split
across the whole room) and `group` (split across pre-created named groups).
The `group` mode requires the user to have already created a named group in
the room — there is no way to say "just split this one item among these
specific people" without first going to create a throwaway group.

The backend already supports this (see backend work on `develop`): the claim
endpoint accepts a `userIds` array, and when given, it creates an anonymous
group on the fly (`name: ""`, `isCreatedByItem: true`), attaches the item to
it, and cleans it up on re-claim / unclaim / delete. The frontend does not
use this capability yet.

## Goals

- Add a third split mode, **"เลือกคน"** (select people), to the claim/split
  UI. Selecting it shows a checklist of all room members; the user ticks who
  shares the cost, and on submit the backend creates the anonymous group.
- The new mode is available in **both** `ClaimSheet` and `AddItemSheet`,
  because both render the shared `PaySplitFields` component.
- Anonymous groups (backend `isCreatedByItem: true`) must never surface as
  real, user-facing groups in the UI.
- Re-editing an item that was claimed via "select people" restores the mode
  and the previously selected people.
- No backend changes. All required data (`isCreatedByItem`, anon group
  members) is already returned by `GET /rooms/:roomId/full`.

Out of scope: any change to backend routes/services; group-management sheets
(`CreateGroupSheet`, `ManageGroupSheet`) beyond hiding anon groups from lists;
the settlement page (backend already computes shares from the anon group).

## Design

### The core model: 3 UI modes → 2 backend modes

The frontend introduces a local mode with three values, replacing the current
`splitMode: "all" | "group"` that is passed around the split UI:

```
type SplitUiMode = "all" | "group" | "people";
```

On submit it maps back to the backend's two-mode API:

| UI mode  | API body sent to `claimItem`              |
| -------- | ----------------------------------------- |
| `all`    | `{ splitMode: "all" }`                     |
| `group`  | `{ splitMode: "group", groupIds }`        |
| `people` | `{ splitMode: "group", userIds }`         |

The backend continues to see only `splitMode: "all" | "group"`. "people" is
purely a frontend construct that chooses to send `userIds` instead of
`groupIds`.

### Data layer (`src/lib/types.ts`, `src/lib/api.ts`)

- `api.claimItem` body type gains `userIds?: string[]`.
- `GroupFull` gains `isCreatedByItem: boolean`. The backend already includes
  this field in the `/full` response (it spreads the full group row); the
  type just needs to declare it so the frontend can read it.

### `PaySplitFields.tsx` (shared split UI)

This is the component both sheets use, so the mode logic lives here.

- Replace the `splitMode` / `onSplitMode` / `groupIds` / `onToggleGroup`
  prop surface with:
  - `mode: SplitUiMode`, `onMode: (m: SplitUiMode) => void`
  - `groupIds: string[]`, `onToggleGroup: (id: string) => void`
  - `userIds: string[]`, `onToggleUser: (id: string) => void`
- The toggle grows from 2 to 3 options: `หารทั้งห้อง` | `เฉพาะกลุ่ม` |
  `เลือกคน`.
- `เฉพาะกลุ่ม` stays disabled when there are no named groups (unchanged).
  `เลือกคน` is **always enabled** — it works directly off the member list and
  needs no pre-existing group.
- When `mode === "group"`: render the named-group checklist (as today), but
  the `groups` it receives are already filtered to exclude anon groups (see
  filtering below).
- When `mode === "people"`: render a member checklist reusing the exact
  `check-list` / `chk` / `box` markup pattern from `CreateGroupSheet.tsx`,
  toggling `userIds`.

### `ClaimSheet.tsx` and `AddItemSheet.tsx`

Both switch their local state from `splitMode` to `mode: SplitUiMode` and add
`userIds: string[]` with a `toggleUser` handler mirroring `toggleGroup`.

Submit mapping:

```
await api.claimItem(roomId, item.id, {
  price: Number(price),
  claimedBy,
  splitMode: mode === "all" ? "all" : "group",
  groupIds: mode === "group" ? groupIds : undefined,
  userIds:  mode === "people" ? userIds : undefined,
});
```

`canSubmit` (both sheets) updated so that:
- `all` → always ok on the split dimension
- `group` → `groupIds.length > 0`
- `people` → `userIds.length > 0`

Both sheets pass the **anon-filtered** groups to `PaySplitFields`, but
`ClaimSheet` also needs the **unfiltered** groups to compute prefill (below).

### Hiding anonymous groups from lists (correctness)

Anon groups arrive in `RoomFull.groups` with `name: ""` and their selected
members populated. Without filtering they would appear as blank group cards.

- `Room.tsx`: the "กลุ่มย่อย" section card list and its `count` use
  `groups.filter(g => !g.isCreatedByItem)`.
- The named-group checklist inside `PaySplitFields` receives the same filtered
  list.
- Define the filter once in `Room.tsx` (e.g. `namedGroups`) and pass it down,
  keeping the full `groups` available only where prefill needs it.

### Item display for "select people" (`Room.tsx`)

Currently a claimed item shows:

```
it.splitMode === "all" ? "หารทั้งห้อง" : `หาร ${it.groupNames.join(", ")}`
```

For a people-mode item, `groupNames` is `[""]`, which renders as an empty
"หาร ". Instead, detect the people case and show the member names.

Detection uses the anon group looked up from the full groups list:
`groups.find(g => g.id === it.groupIds[0] && g.isCreatedByItem)`. If found,
render `หาร <member names joined with ", ">` using that group's `members`.
Otherwise fall back to the existing named-group / all rendering.

### Prefill on re-edit (`ClaimSheet.tsx`)

When opening an already-claimed item, compute initial state:

```
const anonGroup =
  item.splitMode === "group"
    ? groups.find(g => g.id === item.groupIds[0] && g.isCreatedByItem)
    : undefined;

initial mode     = anonGroup ? "people" : item.splitMode;   // all | group | people
initial userIds  = anonGroup ? anonGroup.members.map(m => m.userId) : [];
initial groupIds = anonGroup ? [] : (item.groupIds ?? []);
```

This requires `ClaimSheet` to receive the full (unfiltered) `groups` so the
anon group and its members are visible for the lookup. `AddItemSheet` always
starts fresh (adding a new item), so it needs no prefill.

## Data flow

`Room.tsx` holds the full `groups` from `api.getRoomFull`. Filtering is
resolved explicitly as follows:

- Both `ClaimSheet` and `AddItemSheet` continue to receive the **full**
  `groups` (unchanged prop). Each derives
  `namedGroups = groups.filter(g => !g.isCreatedByItem)` internally and passes
  `namedGroups` to `PaySplitFields`. `ClaimSheet` also uses the full `groups`
  for prefill lookup. `AddItemSheet` needs only `namedGroups`.
- `Room.tsx` derives its own `namedGroups` for the "กลุ่มย่อย" section card
  list + `count`, and keeps the full `groups` for the item split-label lookup.
- The filter is a single-line predicate; if the duplication across
  `Room.tsx` / the two sheets feels heavy, extract a tiny helper (e.g.
  `isNamedGroup(g)` in `src/lib/`), but that is optional polish, not required.

No new network calls. Still one `getRoomFull` + SSE refetch as today.

## Testing / verification

UI feature with new logic branches; verify via the dev server against a live
room:

- **All mode**: claim an item with "หารทั้งห้อง" — behaves as before.
- **Group mode**: with a named group present, claim with "เฉพาะกลุ่ม" —
  behaves as before; anon groups never appear in the checklist.
- **People mode, happy path**: claim with "เลือกคน", tick 2–3 members, submit.
  Confirm the item shows `หาร <those names>` and no blank group card appears
  in the "กลุ่มย่อย" section.
- **People mode when the room has zero named groups**: "เลือกคน" is still
  selectable and works.
- **Re-edit prefill**: reopen the people-mode item — toggle is on "เลือกคน"
  and exactly the previously chosen members are ticked. Change the selection,
  submit, confirm the label updates and no orphan blank groups accumulate
  (backend reset-then-set already handles cleanup).
- **Validation**: "เลือกคน" with nobody ticked keeps the submit button
  disabled.
- **AddItemSheet parity**: adding a new item with "เลือกคน" filled in claims
  it in one step.
