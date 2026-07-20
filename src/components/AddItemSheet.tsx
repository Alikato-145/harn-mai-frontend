import { useState } from "react";
import BottomSheet from "./BottomSheet";
import PaySplitFields from "./PaySplitFields";
import { api } from "../lib/api";
import { LIMITS, sanitizeText } from "../lib/sanitize";
import type { Member, GroupFull, SplitUiMode } from "../lib/types";

export default function AddItemSheet({
  roomId,
  members,
  groups,
  onClose,
  onDone,
}: {
  roomId: string;
  members: Member[];
  groups: GroupFull[];
  onClose: () => void;
  onDone: () => void;
}) {
  const [name, setName] = useState("");
  const [note, setNote] = useState("");
  // ฟิลด์ไม่บังคับ (บล็อกล่าง) — all-or-nothing
  const [price, setPrice] = useState("");
  const [claimedBy, setClaimedBy] = useState("");
  const [mode, setMode] = useState<SplitUiMode>("all");
  const [groupIds, setGroupIds] = useState<string[]>([]);
  const [userIds, setUserIds] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // กลุ่มปกติ (กรองกลุ่มลับออก) — ส่งให้ checklist "เฉพาะกลุ่ม"
  const namedGroups = groups.filter((g) => !g.isCreatedByItem);

  function toggleGroup(id: string) {
    setGroupIds((prev) =>
      prev.includes(id) ? prev.filter((g) => g !== id) : [...prev, id],
    );
  }

  function toggleUser(id: string) {
    setUserIds((prev) =>
      prev.includes(id) ? prev.filter((u) => u !== id) : [...prev, id],
    );
  }

  // แตะบล็อกล่างไหม (ตัดสินจากราคา/คนจ่าย — วิธีหารมี default อยู่แล้วเลยไม่นับ)
  const hasAny = price.trim() !== "" || claimedBy !== "";
  // กรอกครบพอ claim ได้ไหม
  const hasAll =
    Number(price) > 0 &&
    claimedBy !== "" &&
    (mode === "all" ||
      (mode === "group" && groupIds.length > 0) ||
      (mode === "people" && userIds.length > 0));

  // ถ้าแตะบล็อกล่างแล้วยังไม่ครบ → ขาดอะไรบ้าง (ไว้โชว์เตือน)
  const missing: string[] = [];
  if (hasAny) {
    if (!(Number(price) > 0)) missing.push("ราคา");
    if (claimedBy === "") missing.push("คนจ่าย");
    if (mode === "group" && groupIds.length === 0) missing.push("เลือกกลุ่ม");
    if (mode === "people" && userIds.length === 0) missing.push("เลือกคน");
  }

  const canSubmit = name.trim() !== "" && !loading && (!hasAny || hasAll);

  async function submit() {
    setLoading(true);
    setError("");
    try {
      // 1) สร้าง item ก่อนเสมอ → ได้ id กลับมา
      const item = await api.addItem(roomId, {
        name: name.trim(),
        note: note.trim() || undefined,
      });
      // 2) ถ้ากรอกครบ → claim ต่อทันทีด้วย endpoint เดิม
      if (hasAll) {
        await api.claimItem(roomId, item.id, {
          price: Number(price),
          claimedBy,
          splitMode: mode === "all" ? "all" : "group",
          groupIds: mode === "group" ? groupIds : undefined,
          userIds: mode === "people" ? userIds : undefined,
        });
      }
      onDone();
      onClose();
    } catch (e) {
      // addItem อาจสำเร็จแต่ claim พลาด → refresh เผื่อ item เปล่าโผล่มาแล้ว
      setError(e instanceof Error ? e.message : "เกิดข้อผิดพลาด ลองใหม่อีกครั้ง");
      onDone();
    } finally {
      setLoading(false);
    }
  }

  return (
    <BottomSheet title="เพิ่มรายการ" onClose={onClose}>
      <input
        className="field"
        placeholder="ชื่อรายการ *"
        value={name}
        autoFocus
        maxLength={LIMITS.itemName}
        onChange={(e) => setName(sanitizeText(e.target.value, LIMITS.itemName))}
      />
      <input
        className="field"
        placeholder="โน๊ต (ไม่บังคับ)"
        value={note}
        maxLength={LIMITS.note}
        onChange={(e) => setNote(sanitizeText(e.target.value, LIMITS.note))}
      />

      {/* ─── บล็อกไม่บังคับ: ราคา/คนจ่าย/วิธีหาร (กรอกก็ต้องครบ) ─── */}
      <div className="divider">
        <span>ราคา / คนจ่าย · ไม่บังคับ</span>
      </div>
      <p className="muted small center mb">
        ถ้าเริ่มกรอก ต้องกรอกให้ครบ (ราคา + คนจ่าย) แล้วรายการจะ claim ให้เลย
      </p>

      <PaySplitFields
        price={price}
        onPrice={setPrice}
        claimedBy={claimedBy}
        onClaimedBy={setClaimedBy}
        mode={mode}
        onMode={setMode}
        groupIds={groupIds}
        onToggleGroup={toggleGroup}
        userIds={userIds}
        onToggleUser={toggleUser}
        members={members}
        groups={namedGroups}
      />

      {missing.length > 0 && (
        <p className="hint-warn">ยังกรอกไม่ครบ: {missing.join(", ")}</p>
      )}
      {error && <div className="banner-error mt">{error}</div>}

      <button
        className="btn btn-primary mt"
        disabled={!canSubmit}
        onClick={submit}
      >
        {hasAll ? "เพิ่ม & claim เลย" : "เพิ่มรายการ"}
      </button>
      {!hasAny && (
        <p className="muted small center mt">
          เว้นบล็อกล่างว่างได้ — รายการจะเป็น "ยังไม่ claim" ไปกดใส่ทีหลัง
        </p>
      )}
    </BottomSheet>
  );
}
