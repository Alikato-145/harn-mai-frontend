import { LIMITS, sanitizePrice } from "../lib/sanitize";
import type { Member, GroupFull } from "../lib/types";

// ฟิลด์ ราคา / คนจ่าย / วิธีหาร ที่ใช้ร่วมกันทั้ง ClaimSheet และ AddItemSheet
// controlled: state อยู่ที่ parent — component นี้แค่ render + ยิง event กลับ
export default function PaySplitFields({
  price,
  onPrice,
  claimedBy,
  onClaimedBy,
  splitMode,
  onSplitMode,
  groupIds,
  onToggleGroup,
  members,
  groups,
  required = false,
}: {
  price: string;
  onPrice: (v: string) => void;
  claimedBy: string;
  onClaimedBy: (v: string) => void;
  splitMode: "all" | "group";
  onSplitMode: (v: "all" | "group") => void;
  groupIds: string[];
  onToggleGroup: (id: string) => void;
  members: Member[];
  groups: GroupFull[];
  required?: boolean; // โชว์ * หลัง "ราคา" (ClaimSheet บังคับ, AddItemSheet ไม่บังคับ)
}) {
  return (
    <>
      <label className="label">ราคา (บาท){required ? " *" : ""}</label>
      <input
        className="field"
        type="text"
        inputMode="decimal"
        placeholder="0"
        value={price}
        maxLength={LIMITS.price}
        onChange={(e) => onPrice(sanitizePrice(e.target.value))}
      />

      <label className="label">ใครจ่าย</label>
      <div className="payer-picker">
        {members.map((m) => (
          <span
            key={m.id}
            className={`payer-chip ${claimedBy === m.id ? "active" : ""}`}
            onClick={() => onClaimedBy(m.id)}
          >
            {m.name}
          </span>
        ))}
      </div>

      <label className="label mt">วิธีหาร</label>
      <div className="toggle">
        <div
          className={`opt ${splitMode === "all" ? "active" : ""}`}
          onClick={() => onSplitMode("all")}
        >
          หารทั้งห้อง
        </div>
        <div
          className={`opt ${splitMode === "group" ? "active" : ""} ${
            groups.length === 0 ? "disabled" : ""
          }`}
          onClick={() => groups.length > 0 && onSplitMode("group")}
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
              onClick={() => onToggleGroup(g.id)}
            >
              <span className="box" />
              {g.name} <span className="muted">({g.members.length})</span>
            </div>
          ))}
        </div>
      )}
    </>
  );
}
