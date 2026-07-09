import { useState } from "react";
import BottomSheet from "./BottomSheet";
import { api } from "../lib/api";
import type { GroupFull, Member } from "../lib/types";

export default function ManageGroupSheet({
  roomId,
  group,
  members,
  onClose,
  onDone,
}: {
  roomId: string;
  group: GroupFull;
  members: Member[]; // สมาชิกทั้งห้อง
  onClose: () => void;
  onDone: () => void; // refetch room (sheet จะได้ group ใหม่ผ่าน prop)
}) {
  const [addIds, setAddIds] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  // คนในห้องที่ "ยังไม่อยู่" ในกลุ่มนี้ → เอามาให้เลือกเพิ่ม
  const inGroup = new Set(group.members.map((m) => m.userId));
  const addable = members.filter((m) => !inGroup.has(m.id));

  function toggle(id: string) {
    setAddIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
    );
  }

  async function addMembers() {
    setLoading(true);
    try {
      await api.addGroupMembers(roomId, group.id, addIds);
      setAddIds([]);
      onDone(); // group.members จะอัปเดตผ่าน prop
    } finally {
      setLoading(false);
    }
  }

  async function removeMember(userId: string) {
    await api.removeGroupMember(roomId, group.id, userId);
    onDone();
  }

  async function deleteGroup() {
    if (!confirm(`ลบกลุ่ม "${group.name}"?`)) return;
    await api.deleteGroup(roomId, group.id);
    onDone();
    onClose();
  }

  return (
    <BottomSheet title={`จัดการกลุ่ม: ${group.name}`} onClose={onClose}>
      {/* สมาชิกปัจจุบัน — กด ✕ เพื่อเอาออก */}
      <label className="label">สมาชิกในกลุ่ม ({group.members.length})</label>
      {group.members.length === 0 && (
        <p className="muted small">ยังไม่มีสมาชิก</p>
      )}
      <div className="member-tags">
        {group.members.map((m) => (
          <span className="member-tag" key={m.userId}>
            {m.name}
            <span className="tag-x" onClick={() => removeMember(m.userId)}>
              ✕
            </span>
          </span>
        ))}
      </div>

      {/* เพิ่มสมาชิก */}
      {addable.length > 0 && (
        <>
          <label className="label mt">เพิ่มสมาชิก</label>
          <div className="check-list">
            {addable.map((m) => (
              <div
                key={m.id}
                className={`chk ${addIds.includes(m.id) ? "on" : ""}`}
                onClick={() => toggle(m.id)}
              >
                <span className="box" />
                {m.name}
              </div>
            ))}
          </div>
          <button
            className="btn btn-primary"
            disabled={addIds.length === 0 || loading}
            onClick={addMembers}
          >
            เพิ่ม {addIds.length > 0 ? `${addIds.length} คน` : "สมาชิก"}
          </button>
        </>
      )}
      {addable.length === 0 && (
        <p className="muted small mt">ทุกคนในห้องอยู่ในกลุ่มนี้แล้ว</p>
      )}

      <button className="btn btn-danger mt-lg" onClick={deleteGroup}>
        ลบกลุ่มนี้
      </button>
    </BottomSheet>
  );
}
