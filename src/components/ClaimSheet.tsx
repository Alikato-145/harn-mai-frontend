import { useState } from "react";
import BottomSheet from "./BottomSheet";
import { api } from "../lib/api";
import { LIMITS, sanitizePrice } from "../lib/sanitize";
import type { ItemFull, Member, GroupFull } from "../lib/types";

export default function ClaimSheet({
  code,
  item,
  members,
  groups,
  onClose,
  onDone,
}: {
  code: string;
  item: ItemFull;
  members: Member[];
  groups: GroupFull[];
  onClose: () => void;
  onDone: () => void;
}) {
  // prefill ถ้า item เคย claim แล้ว (กรณีแก้)
  const [price, setPrice] = useState(item.price != null ? String(item.price) : "");
  const [claimedBy, setClaimedBy] = useState(item.claimedBy ?? "");
  const [splitMode, setSplitMode] = useState<"all" | "group">(item.splitMode);
  const [groupIds, setGroupIds] = useState<string[]>(item.groupIds ?? []);
  const [loading, setLoading] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  const alreadyClaimed = item.claimedBy != null;

  function toggleGroup(id: string) {
    setGroupIds((prev) =>
      prev.includes(id) ? prev.filter((g) => g !== id) : [...prev, id],
    );
  }

  async function submit() {
    setLoading(true);
    try {
      await api.claimItem(code, item.id, {
        price: Number(price),
        claimedBy,
        splitMode,
        groupIds: splitMode === "group" ? groupIds : undefined,
      });
      onDone();
      onClose();
    } finally {
      setLoading(false);
    }
  }

  // ลบรายการ — กดครั้งแรกเป็นขอยืนยัน กดซ้ำถึงลบจริง
  async function removeItem() {
    if (!confirmDelete) {
      setConfirmDelete(true);
      return;
    }
    setLoading(true);
    try {
      await api.deleteItem(code, item.id);
      onDone();
      onClose();
    } finally {
      setLoading(false);
    }
  }

  async function unclaim() {
    setLoading(true);
    try {
      await api.unclaimItem(code, item.id);
      onDone();
      onClose();
    } finally {
      setLoading(false);
    }
  }

  const canSubmit =
    Number(price) > 0 &&
    claimedBy !== "" &&
    (splitMode === "all" || groupIds.length > 0);

  return (
    <BottomSheet title={`จ่าย / หาร: ${item.name}`} onClose={onClose}>
      <label className="label">ราคา (บาท) *</label>
      <input
        className="field"
        type="text"
        inputMode="decimal"
        placeholder="0"
        value={price}
        maxLength={LIMITS.price}
        onChange={(e) => setPrice(sanitizePrice(e.target.value))}
      />

      <label className="label">ใครจ่าย</label>
      <div className="payer-picker">
        {members.map((m) => (
          <span
            key={m.id}
            className={`payer-chip ${claimedBy === m.id ? "active" : ""}`}
            onClick={() => setClaimedBy(m.id)}
          >
            {m.name}
          </span>
        ))}
      </div>

      <label className="label mt">วิธีหาร</label>
      <div className="toggle">
        <div
          className={`opt ${splitMode === "all" ? "active" : ""}`}
          onClick={() => setSplitMode("all")}
        >
          หารทั้งห้อง
        </div>
        <div
          className={`opt ${splitMode === "group" ? "active" : ""} ${
            groups.length === 0 ? "disabled" : ""
          }`}
          onClick={() => groups.length > 0 && setSplitMode("group")}
        >
          เฉพาะกลุ่ม
        </div>
      </div>

      {/* โชว์รายการกลุ่มเฉพาะตอนเลือก "เฉพาะกลุ่ม" */}
      {splitMode === "group" && (
        <div className="check-list">
          {groups.length === 0 && (
            <p className="muted small">ยังไม่มีกลุ่ม — สร้างกลุ่มก่อน</p>
          )}
          {groups.map((g) => (
            <div
              key={g.id}
              className={`chk ${groupIds.includes(g.id) ? "on" : ""}`}
              onClick={() => toggleGroup(g.id)}
            >
              <span className="box" />
              {g.name} <span className="muted">({g.members.length})</span>
            </div>
          ))}
        </div>
      )}

      <button
        className="btn btn-primary mt"
        disabled={!canSubmit || loading}
        onClick={submit}
      >
        ยืนยัน claim
      </button>
      {alreadyClaimed && (
        <button className="btn btn-ghost" disabled={loading} onClick={unclaim}>
          ยกเลิก claim
        </button>
      )}
      <button
        className={`btn ${confirmDelete ? "btn-danger-solid" : "btn-danger"}`}
        disabled={loading}
        onClick={removeItem}
      >
        {confirmDelete ? "แน่ใจนะ? กดอีกครั้งเพื่อลบ" : "ลบรายการนี้"}
      </button>
    </BottomSheet>
  );
}
