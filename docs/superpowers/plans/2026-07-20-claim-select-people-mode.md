# Claim "select people" split mode — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.
>
> **Note for this project:** the learner is writing the code themselves,
> step by step, and reading along. Steps show code for load-bearing / tricky
> parts (mode mapping, prefill, filtering, display) and describe the
> mechanical parts precisely, pointing at the existing pattern to mirror.

**Goal:** Add a third item-split mode "เลือกคน" (select people) to the claim
UI that lets a user pick specific room members to split one item among,
backed by the existing anonymous-group support in the API.

**Architecture:** Introduce a frontend-only `SplitUiMode = "all" | "group" |
"people"`. The shared `PaySplitFields` component renders a 3-way toggle;
`ClaimSheet` and `AddItemSheet` own the mode state and map it back to the
2-mode API on submit (`people` → `splitMode:"group"` + `userIds`). Anonymous
groups (`isCreatedByItem`) are filtered out of user-facing group lists and
rendered by member name in the item label.

**Tech Stack:** React 19, TypeScript, Vite, react-router. No test runner in
this repo — verification is `npm run build` (tsc typecheck) + manual browser
checks on `npm run dev`, matching the existing spec/plan convention.

## Global Constraints

- No backend changes. All needed data (`isCreatedByItem`, anon group members)
  already comes from `GET /rooms/:roomId/full`.
- Toggle label for the new mode is exactly **`เลือกคน`**.
- People-mode items display the member **names** (`หาร เอ, บี, ซี`), not a
  group name.
- Follow existing code style: Thai inline comments, controlled components,
  no new dependencies.
- The backend API contract stays `splitMode: "all" | "group"`; `"people"` is
  frontend-only.

---

### Task 1: Data layer — types and API body

**Files:**
- Modify: `src/lib/types.ts`
- Modify: `src/lib/api.ts` (`claimItem`, lines ~65-78)

**Interfaces:**
- Produces: `SplitUiMode` type; `GroupFull.isCreatedByItem: boolean`;
  `api.claimItem` body accepting optional `userIds?: string[]`.

- [ ] **Step 1: Add the `SplitUiMode` type to `types.ts`**

Add near the top of `src/lib/types.ts`:

```ts
// โหมดหารฝั่ง UI — "people" เป็นของ frontend ล้วน (ยิง API เป็น splitMode:"group" + userIds)
export type SplitUiMode = "all" | "group" | "people";
```

- [ ] **Step 2: Declare `isCreatedByItem` on `GroupFull`**

In `GroupFull` (currently lines 20-25), add the field the backend already
sends:

```ts
export type GroupFull = {
  id: string;
  name: string;
  roomId: string;
  isCreatedByItem: boolean; // true = กลุ่มลับที่ระบบสร้างตอนเลือกคน (ไม่โชว์เป็นกลุ่มปกติ)
  members: { userId: string; name: string }[];
};
```

- [ ] **Step 3: Add `userIds` to the `claimItem` body type in `api.ts`**

In `api.claimItem`, extend the `body` type (lines ~68-73) to include
`userIds?: string[]` alongside `groupIds?`. Nothing else in the function
changes — it already `JSON.stringify`s the whole body.

- [ ] **Step 4: Typecheck**

Run: `npm run build`
Expected: PASS. (No consumer sends `userIds` yet; adding an optional field
and a required field the backend already returns is type-safe. If `tsc`
flags a place that constructs a `GroupFull` literal without
`isCreatedByItem`, fix that literal — but there should be none; groups come
from the API as `RoomFull`.)

---

### Task 2: `PaySplitFields` — 3-way toggle + people checklist

**Files:**
- Modify: `src/components/PaySplitFields.tsx`

**Interfaces:**
- Consumes: `SplitUiMode` from `types.ts`.
- Produces: new prop surface —
  `mode: SplitUiMode`, `onMode: (v: SplitUiMode) => void`,
  `userIds: string[]`, `onToggleUser: (id: string) => void`,
  keeps `groupIds`, `onToggleGroup`, `members`, `groups`, `required`.
  The `groups` passed in are already anon-filtered by the parent.

> This task changes the prop contract, so `ClaimSheet` and `AddItemSheet`
> will not typecheck again until Tasks 3 and 4. That is expected.

- [ ] **Step 1: Swap the `splitMode` props for `mode` props**

Replace `splitMode` / `onSplitMode` in the props type and destructure with
`mode: SplitUiMode` / `onMode: (v: SplitUiMode) => void`. Add
`userIds: string[]` and `onToggleUser: (id: string) => void`. Import
`SplitUiMode` from `../lib/types`.

- [ ] **Step 2: Make the toggle 3-way**

The toggle currently has two `.opt` divs (`หารทั้งห้อง`, `เฉพาะกลุ่ม`).
Update the two existing ones to read `mode` instead of `splitMode` and call
`onMode(...)`, then add a third:

```tsx
<div
  className={`opt ${mode === "people" ? "active" : ""}`}
  onClick={() => onMode("people")}
>
  เลือกคน
</div>
```

Keep `เฉพาะกลุ่ม` disabled when `groups.length === 0` (unchanged logic, now
calling `onMode("group")`). `เลือกคน` has no disabled guard — it is always
selectable.

- [ ] **Step 3: Render the member checklist for people mode**

After the existing `{mode === "group" && (...)}` group checklist, add a
sibling block. Reuse the exact markup from `CreateGroupSheet.tsx` (the
`check-list` / `chk` / `box` pattern):

```tsx
{mode === "people" && (
  <div className="check-list">
    {members.map((m) => (
      <div
        key={m.id}
        className={`chk ${userIds.includes(m.id) ? "on" : ""}`}
        onClick={() => onToggleUser(m.id)}
      >
        <span className="box" />
        {m.name}
      </div>
    ))}
  </div>
)}
```

- [ ] **Step 4: Typecheck the component in isolation**

Run: `npm run build`
Expected: FAIL — but only in `ClaimSheet.tsx` and `AddItemSheet.tsx`
("Property 'mode' is missing" / "'splitMode' does not exist"). There should
be **no** errors reported inside `PaySplitFields.tsx` itself. Read the error
list to confirm the only failures are the two consumers. Proceed to Task 3.

---

### Task 3: `ClaimSheet` — mode state, prefill, submit mapping

**Files:**
- Modify: `src/components/ClaimSheet.tsx`

**Interfaces:**
- Consumes: `SplitUiMode`; `PaySplitFields` new props; full `groups`
  (includes anon groups) via existing `groups` prop from `Room.tsx`.

- [ ] **Step 1: Compute prefill from the item before `useState`**

At the top of the component body, before the state hooks, detect whether this
item was claimed via people mode by finding its attached anon group:

```tsx
// item ที่ claim แบบ "เลือกคน" จะผูกกับกลุ่มลับ (isCreatedByItem) 1 กลุ่ม
const anonGroup =
  item.splitMode === "group"
    ? groups.find((g) => g.id === item.groupIds[0] && g.isCreatedByItem)
    : undefined;
```

- [ ] **Step 2: Replace `splitMode` state with `mode` + add `userIds`**

Change the split state to seed from `anonGroup`:

```tsx
const [mode, setMode] = useState<SplitUiMode>(
  anonGroup ? "people" : item.splitMode,
);
const [groupIds, setGroupIds] = useState<string[]>(
  anonGroup ? [] : (item.groupIds ?? []),
);
const [userIds, setUserIds] = useState<string[]>(
  anonGroup ? anonGroup.members.map((m) => m.userId) : [],
);
```

Import `SplitUiMode` from `../lib/types`.

- [ ] **Step 3: Add `toggleUser`**

Mirror the existing `toggleGroup` function exactly, operating on `userIds` /
`setUserIds` instead of `groupIds` / `setGroupIds`.

- [ ] **Step 4: Derive anon-filtered groups for the child**

Add above the return:

```tsx
const namedGroups = groups.filter((g) => !g.isCreatedByItem);
```

- [ ] **Step 5: Update the submit mapping**

In `submit()`, replace the `api.claimItem` body with the 3→2 mode mapping:

```tsx
await api.claimItem(roomId, item.id, {
  price: Number(price),
  claimedBy,
  splitMode: mode === "all" ? "all" : "group",
  groupIds: mode === "group" ? groupIds : undefined,
  userIds: mode === "people" ? userIds : undefined,
});
```

- [ ] **Step 6: Update `canSubmit`**

```tsx
const canSubmit =
  Number(price) > 0 &&
  claimedBy !== "" &&
  (mode === "all" ||
    (mode === "group" && groupIds.length > 0) ||
    (mode === "people" && userIds.length > 0));
```

- [ ] **Step 7: Update the `<PaySplitFields />` props**

Pass `mode={mode}`, `onMode={setMode}`, `userIds={userIds}`,
`onToggleUser={toggleUser}`, and `groups={namedGroups}` (anon-filtered).
Keep `groupIds`, `onToggleGroup`, `members`, `required`.

- [ ] **Step 8: Typecheck**

Run: `npm run build`
Expected: `ClaimSheet.tsx` errors gone; `AddItemSheet.tsx` still fails
(handled in Task 4).

---

### Task 4: `AddItemSheet` — mode state, submit mapping

**Files:**
- Modify: `src/components/AddItemSheet.tsx`

**Interfaces:**
- Consumes: `SplitUiMode`; `PaySplitFields` new props. No prefill (always a
  brand-new item), so mode starts at `"all"`.

- [ ] **Step 1: Replace `splitMode` state with `mode` + add `userIds`**

```tsx
const [mode, setMode] = useState<SplitUiMode>("all");
const [userIds, setUserIds] = useState<string[]>([]);
```

Import `SplitUiMode`. Add a `toggleUser` mirroring `toggleGroup`.

- [ ] **Step 2: Update the "has all / missing" guards**

This sheet's optional block validates before claiming. Update the split
checks to be mode-aware:

```tsx
const hasAll =
  Number(price) > 0 &&
  claimedBy !== "" &&
  (mode === "all" ||
    (mode === "group" && groupIds.length > 0) ||
    (mode === "people" && userIds.length > 0));
```

In the `missing` block, replace the group check with:

```tsx
if (mode === "group" && groupIds.length === 0) missing.push("เลือกกลุ่ม");
if (mode === "people" && userIds.length === 0) missing.push("เลือกคน");
```

- [ ] **Step 3: Update the submit mapping**

Same 3→2 mapping as ClaimSheet Task 3 Step 5 (the `claimItem` call inside
the `if (hasAll)` branch):

```tsx
await api.claimItem(roomId, item.id, {
  price: Number(price),
  claimedBy,
  splitMode: mode === "all" ? "all" : "group",
  groupIds: mode === "group" ? groupIds : undefined,
  userIds: mode === "people" ? userIds : undefined,
});
```

- [ ] **Step 4: Derive `namedGroups` and update `<PaySplitFields />`**

Add `const namedGroups = groups.filter((g) => !g.isCreatedByItem);` above the
return, then pass `mode`, `onMode={setMode}`, `userIds`,
`onToggleUser={toggleUser}`, `groups={namedGroups}`, keeping the rest.

- [ ] **Step 5: Typecheck — should now be fully green**

Run: `npm run build`
Expected: PASS (all consumers updated).

---

### Task 5: `Room.tsx` — hide anon groups, show people names

**Files:**
- Modify: `src/pages/Room.tsx` (destructure ~line 81; group section
  ~183-212; item label ~248-250)

- [ ] **Step 1: Derive `namedGroups` once**

Right after `const { room, members, groups, items } = data;` (line 81):

```tsx
// กลุ่มลับ (สร้างตอนเลือกคน) ไม่นับเป็นกลุ่มปกติ — ซ่อนจากลิสต์กลุ่ม
const namedGroups = groups.filter((g) => !g.isCreatedByItem);
```

- [ ] **Step 2: Point the "กลุ่มย่อย" section at `namedGroups`**

In the groups section, change the count `{groups.length}` → `{namedGroups.length}`,
the empty check `groups.length === 0` → `namedGroups.length === 0`, and the
`groups.map(...)` → `namedGroups.map(...)`. Leave `ClaimSheet` /
`AddItemSheet` receiving the full `groups` prop unchanged (they filter
internally; ClaimSheet needs the full list for prefill).

- [ ] **Step 3: Add a split-label helper and use it**

Replace the inline label (currently lines 248-250):

```tsx
{it.splitMode === "all"
  ? "หารทั้งห้อง"
  : `หาร ${it.groupNames.join(", ")}`}
```

with a call to a small helper defined inside the component (above `return`):

```tsx
// ป้ายวิธีหารของ item — โหมดเลือกคนโชว์ชื่อคน (กลุ่มลับไม่มีชื่อ)
function splitLabel(it: ItemFull) {
  if (it.splitMode === "all") return "หารทั้งห้อง";
  const anon = groups.find(
    (g) => g.id === it.groupIds[0] && g.isCreatedByItem,
  );
  if (anon) return `หาร ${anon.members.map((m) => m.name).join(", ")}`;
  return `หาร ${it.groupNames.join(", ")}`;
}
```

Then the JSX becomes `<span>{splitLabel(it)}</span>`.

- [ ] **Step 4: Typecheck**

Run: `npm run build`
Expected: PASS.

- [ ] **Step 5: Manual browser verification**

Run: `npm run dev`, open a room, and walk the spec's checklist:
- Claim with **หารทั้งห้อง** → item shows `หารทั้งห้อง`.
- With a named group, claim with **เฉพาะกลุ่ม** → unchanged; no blank group
  card anywhere.
- Claim with **เลือกคน**, tick 2-3 members → item shows `หาร <names>`; the
  "กลุ่มย่อย" section shows no blank card.
- In a room with zero named groups, **เลือกคน** is still selectable.
- Reopen the people-mode item → toggle is on **เลือกคน** with exactly those
  members ticked; change selection, submit, confirm the label updates.
- **เลือกคน** with nobody ticked → submit button disabled.
- Add a brand-new item with **เลือกคน** filled in → claims in one step.

- [ ] **Step 6: Commit** (only if the learner wants it tracked)

```bash
git add src/lib/types.ts src/lib/api.ts src/components/PaySplitFields.tsx \
  src/components/ClaimSheet.tsx src/components/AddItemSheet.tsx \
  src/pages/Room.tsx docs/superpowers
git commit -m "feat: add 'select people' split mode to item claim"
```

---

## Self-review notes

- **Spec coverage:** data layer (T1), 3-way toggle + people checklist (T2),
  submit mapping + validation (T3/T4), prefill (T3), anon-group filtering
  (T2 receives filtered groups, T5 filters display), people-name display
  (T5) — all mapped.
- **Type consistency:** `SplitUiMode` defined in T1 and consumed by T2-T4;
  `isCreatedByItem` added in T1 and read in T3/T5; `namedGroups` filter
  predicate identical across ClaimSheet/AddItemSheet/Room.
- **Anon group reachability:** `manageGroupId` is only ever set from a
  `namedGroups` card (T5 Step 2), so `ManageGroupSheet`'s `groups.find` over
  the full list can never resolve to an anon group.
