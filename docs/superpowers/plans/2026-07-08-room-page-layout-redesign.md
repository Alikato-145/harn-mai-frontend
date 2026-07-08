# Room Page Layout Redesign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Unify the room page's "add a thing" interaction pattern, remove the floating "+" FAB, move the host-only "end room" action into the app bar, and give the members/groups/items sections a light tinted-panel treatment — all without touching state, API calls, or any sheet/dialog component.

**Architecture:** Pure presentational change to two files: `src/index.css` (new `.section-panel` / `.icon-btn` styles, removal of dead `.fab` rules) and `src/pages/Room.tsx` (JSX restructure only — same state, same handlers).

**Tech Stack:** React 19 + TypeScript, Vite, plain CSS (no CSS-in-JS, no Tailwind). No test framework is configured in this repo (`npm run build` = `tsc -b && vite build`, `npm run lint` = `eslint .`). Verification is via typecheck/build/lint plus manual visual checks in the browser — there is no automated test suite to add unit tests to.

## Global Constraints

- No changes to `AddMemberSheet`, `AddItemSheet`, `CreateGroupSheet`, `ClaimSheet`, `ManageGroupSheet`, `FinishDialog`, or any state/handler logic in `Room.tsx` — this is UI-only.
- `.btn-danger` CSS class stays (used by `ManageGroupSheet.tsx`, `FinishDialog.tsx`, `ClaimSheet.tsx`) — only Room's specific usage of it is removed.
- `.fab` CSS class is fully removed (only ever referenced in `Room.tsx` and `index.css`) — confirmed via grep, safe to delete.
- Exactly one floating element remains on the room page: the `.sticky-bar` settlement button.
- Members panel tint reuses the existing `--primary-soft` (`#e8efe9`) token. Groups panel uses a new light sand tint `#f3f1ea`. Items panel uses a new light blue-gray tint `#eef1f6`.

---

### Task 1: CSS — section panels, icon button, remove dead FAB styles

**Files:**
- Modify: `src/index.css`

**Interfaces:**
- Produces: CSS classes `.appbar-right`, `.icon-btn`, `.section-panel`, `.section-panel--members`, `.section-panel--groups`, `.section-panel--items` — consumed by Task 2's JSX changes.
- Consumes: existing `--primary-soft`, `--line`, `--red` CSS custom properties defined in `:root` (index.css:1-13).

- [ ] **Step 1: Add `.appbar-right` and `.icon-btn` next to the appbar rules**

Open `src/index.css`. Find the appbar block (currently lines 142-155):

```css
/* appbar */
.appbar {
  display: flex; align-items: center; justify-content: space-between;
  padding: 4px 2px 14px; border-bottom: 1px solid var(--line); margin-bottom: 12px;
}
.rname { font-size: 19px; font-weight: 700; letter-spacing: -0.01em; }
.code-chip {
  display: inline-flex; align-items: center; gap: 6px;
  background: transparent; color: var(--ink); font-weight: 700;
  font-size: 13px; letter-spacing: 1.5px; font-family: ui-monospace, "SF Mono", monospace;
  padding: 5px 10px; border: 1px solid var(--line); border-radius: 8px; cursor: pointer;
}
.code-chip .chip-ic { width: 15px; height: 15px; flex-shrink: 0; opacity: 0.65; }
.code-chip.copied { color: var(--primary); border-color: var(--primary); background: var(--primary-soft); }
.code-chip.copied .chip-ic { opacity: 1; }
```

Replace it with (adds `.appbar-right` and `.icon-btn`, everything else unchanged):

```css
/* appbar */
.appbar {
  display: flex; align-items: center; justify-content: space-between;
  padding: 4px 2px 14px; border-bottom: 1px solid var(--line); margin-bottom: 12px;
}
.rname { font-size: 19px; font-weight: 700; letter-spacing: -0.01em; }
.appbar-right { display: flex; align-items: center; gap: 8px; }
.code-chip {
  display: inline-flex; align-items: center; gap: 6px;
  background: transparent; color: var(--ink); font-weight: 700;
  font-size: 13px; letter-spacing: 1.5px; font-family: ui-monospace, "SF Mono", monospace;
  padding: 5px 10px; border: 1px solid var(--line); border-radius: 8px; cursor: pointer;
}
.code-chip .chip-ic { width: 15px; height: 15px; flex-shrink: 0; opacity: 0.65; }
.code-chip.copied { color: var(--primary); border-color: var(--primary); background: var(--primary-soft); }
.code-chip.copied .chip-ic { opacity: 1; }
.icon-btn {
  display: inline-flex; align-items: center; justify-content: center;
  width: 34px; height: 34px; border-radius: 50%; flex-shrink: 0;
  border: 1px solid var(--line); background: transparent; color: var(--red); cursor: pointer;
}
.icon-btn svg { width: 17px; height: 17px; }
.icon-btn:active { background: #fdf2f0; }
```

- [ ] **Step 2: Add `.section-panel` classes to the sections block**

Find the sections block (currently lines 157-163):

```css
/* sections */
.sec-title {
  font-size: 13px; font-weight: 700; color: var(--ink);
  margin: 26px 2px 12px; display: flex; justify-content: space-between; align-items: baseline;
}
.sec-title .count { color: var(--muted); font-weight: 500; font-size: 12px; }
.link { color: var(--primary); font-weight: 600; font-size: 13px; cursor: pointer; }
```

Replace it with (adds the panel classes, adds a nested-in-panel override for `.sec-title`'s top margin):

```css
/* sections */
.sec-title {
  font-size: 13px; font-weight: 700; color: var(--ink);
  margin: 26px 2px 12px; display: flex; justify-content: space-between; align-items: baseline;
}
.sec-title .count { color: var(--muted); font-weight: 500; font-size: 12px; }
.link { color: var(--primary); font-weight: 600; font-size: 13px; cursor: pointer; }

.section-panel { border-radius: 16px; padding: 10px 12px 14px; margin-bottom: 18px; }
.section-panel .sec-title { margin: 0 0 10px; }
.section-panel--members { background: var(--primary-soft); }
.section-panel--groups { background: #f3f1ea; }
.section-panel--items { background: #eef1f6; }
```

- [ ] **Step 3: Remove the dead `.fab` rule and its media query**

Find the fab + sticky block (currently lines 191-206):

```css
/* fab + sticky */
.fab {
  position: fixed; right: calc(50% - 240px + 18px); bottom: 128px;
  width: 52px; height: 52px; border-radius: 50%; background: var(--primary);
  color: #fff; font-size: 26px; line-height: 1; border: none; cursor: pointer;
  box-shadow: 0 4px 14px rgba(18, 77, 49, 0.28); z-index: 20;
}
.sticky-bar {
  position: fixed; bottom: 46px; left: 50%; transform: translateX(-50%);
  width: 100%; max-width: 480px; padding: 12px 16px;
  background: linear-gradient(transparent, #f1f5f4 30%);
}

@media (max-width: 512px) {
  .fab { right: 16px; }
}
```

Replace it with (keeps `.sticky-bar` verbatim, deletes `.fab` and its media query — `.sticky-bar`'s own positioning never depended on the FAB, only the FAB depended on it, so no value changes here):

```css
/* sticky */
.sticky-bar {
  position: fixed; bottom: 46px; left: 50%; transform: translateX(-50%);
  width: 100%; max-width: 480px; padding: 12px 16px;
  background: linear-gradient(transparent, #f1f5f4 30%);
}
```

- [ ] **Step 4: Verify the stylesheet has no leftover `.fab` references**

Run: `grep -n "\.fab" src/index.css`
Expected: no output (empty).

- [ ] **Step 5: Commit**

```bash
git add src/index.css
git commit -m "style: add section-panel/icon-btn styles, remove dead FAB rules"
```

---

### Task 2: Room.tsx — JSX restructure

**Files:**
- Modify: `src/pages/Room.tsx`

**Interfaces:**
- Consumes: CSS classes from Task 1 (`.appbar-right`, `.icon-btn`, `.section-panel`, `.section-panel--members`, `.section-panel--groups`, `.section-panel--items`).
- Consumes existing component state/handlers unchanged: `isHost` (Room.tsx:90), `setShowFinish` (Room.tsx:28), `setSheet` (Room.tsx:24), `overlayOpen` (Room.tsx:91-96), `members`, `groups`, `items`, `copyCode`, `copied`, `navigate`, `idRoom`.
- Produces: no new exports — this is the page component's own render output.

- [ ] **Step 1: Wrap the app bar's right-hand side and add the host icon button**

Find (Room.tsx:98-137):

```tsx
  return (
    <div className="container">
      <div className="appbar">
        <span className="rname">{room.name}</span>
        <span
          className={`code-chip ${copied ? "copied" : ""}`}
          onClick={() => copyCode(room.code)}
          title="แตะเพื่อคัดลอกโค้ด"
        >
          {copied ? (
            <svg
              className="chip-ic"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <polyline points="20 6 9 17 4 12" />
            </svg>
          ) : (
            <svg
              className="chip-ic"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
              <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
            </svg>
          )}
          {copied ? "คัดลอกแล้ว" : room.code}
        </span>
      </div>
```

Replace with:

```tsx
  return (
    <div className="container">
      <div className="appbar">
        <span className="rname">{room.name}</span>
        <div className="appbar-right">
          <span
            className={`code-chip ${copied ? "copied" : ""}`}
            onClick={() => copyCode(room.code)}
            title="แตะเพื่อคัดลอกโค้ด"
          >
            {copied ? (
              <svg
                className="chip-ic"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <polyline points="20 6 9 17 4 12" />
              </svg>
            ) : (
              <svg
                className="chip-ic"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
                <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
              </svg>
            )}
            {copied ? "คัดลอกแล้ว" : room.code}
          </span>
          {isHost && (
            <button
              className="icon-btn"
              onClick={() => setShowFinish(true)}
              title="จบห้อง"
              aria-label="จบห้อง"
            >
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <path d="M18.36 6.64a9 9 0 1 1-12.73 0" />
                <line x1="12" y1="2" x2="12" y2="12" />
              </svg>
            </button>
          )}
        </div>
      </div>
```

- [ ] **Step 2: Wrap the members section in `.section-panel--members`**

Find (Room.tsx:139-160):

```tsx
      {/* สมาชิก */}
      <div className="sec-title">
        <span>
          สมาชิก <span className="count">{members.length}</span>
        </span>
        <span className="link" onClick={() => setSheet("addMember")}>
          + เพิ่มชื่อ
        </span>
      </div>
      <div className="members">
        {members.map((m) => (
          <div
            className="avatar"
            key={m.id}
            onClick={() => setEditMember(m)}
            title="แตะเพื่อแก้ชื่อ/เบอร์"
          >
            <div className="circ">{m.name.charAt(0)}</div>
            <small>{m.name}</small>
          </div>
        ))}
      </div>
```

Replace with:

```tsx
      {/* สมาชิก */}
      <div className="section-panel section-panel--members">
        <div className="sec-title">
          <span>
            สมาชิก <span className="count">{members.length}</span>
          </span>
          <span className="link" onClick={() => setSheet("addMember")}>
            + เพิ่มชื่อ
          </span>
        </div>
        <div className="members">
          {members.map((m) => (
            <div
              className="avatar"
              key={m.id}
              onClick={() => setEditMember(m)}
              title="แตะเพื่อแก้ชื่อ/เบอร์"
            >
              <div className="circ">{m.name.charAt(0)}</div>
              <small>{m.name}</small>
            </div>
          ))}
        </div>
      </div>
```

- [ ] **Step 3: Wrap the groups section in `.section-panel--groups`**

Find (Room.tsx:162-195):

```tsx
      {/* กลุ่มย่อย */}
      <div className="sec-title">
        <span>
          กลุ่มย่อย <span className="count">{groups.length}</span>
        </span>
        <span className="link" onClick={() => setSheet("createGroup")}>
          + สร้างกลุ่ม
        </span>
      </div>
      {groups.length === 0 && <p className="muted small">ยังไม่มีกลุ่ม</p>}
      <div className="group-list">
        {groups.map((g) => (
          <div
            className="group-card"
            key={g.id}
            onClick={() => setManageGroupId(g.id)}
          >
            <div className="group-head">
              <span className="group-name">{g.name}</span>
              <span className="manage-link">จัดการ ›</span>
            </div>
            <div className="member-tags">
              {g.members.length === 0 && (
                <span className="muted small">ยังไม่มีสมาชิก</span>
              )}
              {g.members.map((m) => (
                <span className="member-tag sm" key={m.userId}>
                  {m.name}
                </span>
              ))}
            </div>
          </div>
        ))}
      </div>
```

Replace with:

```tsx
      {/* กลุ่มย่อย */}
      <div className="section-panel section-panel--groups">
        <div className="sec-title">
          <span>
            กลุ่มย่อย <span className="count">{groups.length}</span>
          </span>
          <span className="link" onClick={() => setSheet("createGroup")}>
            + สร้างกลุ่ม
          </span>
        </div>
        {groups.length === 0 && <p className="muted small">ยังไม่มีกลุ่ม</p>}
        <div className="group-list">
          {groups.map((g) => (
            <div
              className="group-card"
              key={g.id}
              onClick={() => setManageGroupId(g.id)}
            >
              <div className="group-head">
                <span className="group-name">{g.name}</span>
                <span className="manage-link">จัดการ ›</span>
              </div>
              <div className="member-tags">
                {g.members.length === 0 && (
                  <span className="muted small">ยังไม่มีสมาชิก</span>
                )}
                {g.members.map((m) => (
                  <span className="member-tag sm" key={m.userId}>
                    {m.name}
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
```

- [ ] **Step 4: Wrap the items section, add the inline "+ เพิ่มรายการ" link, remove the FAB, and remove the inline "จบห้อง" button**

Find (Room.tsx:197-262):

```tsx
      {/* รายการ */}
      <div className="sec-title">
        <span>
          รายการ <span className="count">{items.length}</span>
        </span>
      </div>
      {items.length === 0 && <p className="muted small">ยังไม่มีรายการ</p>}
      {items.map((it) => {
        const claimed = it.claimedBy != null;
        return (
          <div
            className={`card ${claimed ? "item-claimed" : "item-pending"}`}
            key={it.id}
            onClick={() => setClaimItem(it)}
          >
            <div className="row">
              <span className="item-name">{it.name}</span>
              {claimed ? (
                <span className="price">{money(it.price ?? 0)}</span>
              ) : (
                <button className="mini-btn">claim</button>
              )}
            </div>
            {claimed && (
              <div className="item-meta">
                <span className="pill pill-green">จ่ายโดย {it.payerName}</span>
                <span>
                  {it.splitMode === "all"
                    ? "หารทั้งห้อง"
                    : `หาร ${it.groupNames.join(", ")}`}
                </span>
              </div>
            )}
          </div>
        );
      })}

      {isHost && (
        <button
          className="btn btn-danger mt-lg"
          onClick={() => setShowFinish(true)}
        >
          จบห้อง (ลบข้อมูลทั้งหมด)
        </button>
      )}

      {/* actions — ซ่อนตอนมี sheet/dialog เปิด กันปุ่มลอยทับแป้นพิมพ์ */}
      {!overlayOpen && (
        <>
          <button
            className="fab"
            onClick={() => setSheet("addItem")}
            aria-label="เพิ่มรายการ"
          >
            +
          </button>
          <div className="sticky-bar">
            <button
              className="btn btn-primary"
              onClick={() => navigate(`/room/${idRoom}/settlement`)}
            >
              ดูสรุปหารเงิน
            </button>
          </div>
        </>
      )}
```

Replace with:

```tsx
      {/* รายการ */}
      <div className="section-panel section-panel--items">
        <div className="sec-title">
          <span>
            รายการ <span className="count">{items.length}</span>
          </span>
          <span className="link" onClick={() => setSheet("addItem")}>
            + เพิ่มรายการ
          </span>
        </div>
        {items.length === 0 && <p className="muted small">ยังไม่มีรายการ</p>}
        {items.map((it) => {
          const claimed = it.claimedBy != null;
          return (
            <div
              className={`card ${claimed ? "item-claimed" : "item-pending"}`}
              key={it.id}
              onClick={() => setClaimItem(it)}
            >
              <div className="row">
                <span className="item-name">{it.name}</span>
                {claimed ? (
                  <span className="price">{money(it.price ?? 0)}</span>
                ) : (
                  <button className="mini-btn">claim</button>
                )}
              </div>
              {claimed && (
                <div className="item-meta">
                  <span className="pill pill-green">จ่ายโดย {it.payerName}</span>
                  <span>
                    {it.splitMode === "all"
                      ? "หารทั้งห้อง"
                      : `หาร ${it.groupNames.join(", ")}`}
                  </span>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* actions — ซ่อนตอนมี sheet/dialog เปิด กันปุ่มลอยทับแป้นพิมพ์ */}
      {!overlayOpen && (
        <div className="sticky-bar">
          <button
            className="btn btn-primary"
            onClick={() => navigate(`/room/${idRoom}/settlement`)}
          >
            ดูสรุปหารเงิน
          </button>
        </div>
      )}
```

Note: the `<>...</>` fragment that used to wrap the FAB + sticky bar is gone — only one element remains, so it renders directly.

- [ ] **Step 5: Typecheck, build, and lint**

Run: `npm run build`
Expected: exits 0, no TypeScript errors (in particular, no unused-variable errors — `isHost` is still used in the app bar, `setSheet`/`setShowFinish` still used).

Run: `npm run lint`
Expected: exits 0, no new lint errors.

- [ ] **Step 6: Commit**

```bash
git add src/pages/Room.tsx
git commit -m "feat: unify room page actions and add section panels"
```

---

### Task 3: Manual visual verification

**Files:** none (verification only, no code changes expected unless a check below fails)

- [ ] **Step 1: Start the dev server**

Run: `npm run dev`
Expected: Vite prints a local URL (e.g. `http://localhost:5173`).

- [ ] **Step 2: Open an existing room as the host**

Navigate to `/room/<idRoom>` for a room where the current session is the host (`storage.load().userId === room.hostUserId`).

Check all of the following:
- No floating "+" button anywhere on the screen.
- A small circular icon button (red outline "power" icon) sits next to the room code chip in the app bar.
- Clicking that icon button opens the same finish-room confirmation dialog that the old "จบห้อง" button used to open.
- The "รายการ" section header shows a "+ เพิ่มรายการ" link (styled the same as "+ เพิ่มชื่อ" and "+ สร้างกลุ่ม") and clicking it opens the add-item sheet.
- The members, groups, and items sections each render inside a visibly tinted rounded panel (green / sand / blue-gray respectively), distinct from the page background and from each other.
- Existing item-card styling (green left border for claimed items, dashed border for pending items) still reads clearly against the items panel's tint.
- The "ดูสรุปหารเงิน" sticky bar is the only element floating/fixed at the bottom of the screen, and it disappears while any sheet or dialog is open.

- [ ] **Step 3: Open the same room as a non-host member**

Load the room with a session where `userId !== room.hostUserId` (or clear `storage` and rejoin as a different member).

Check:
- The icon button next to the code chip is absent.
- Everything else (sections, add links, sticky bar) behaves identically to the host view.

- [ ] **Step 4: Fix any discrepancy found**

If any check in Step 2 or 3 fails, fix it in `src/pages/Room.tsx` or `src/index.css`, re-run Steps 1-3, then commit the fix with a message describing what was wrong (e.g. `fix: icon button not gated on isHost`).
