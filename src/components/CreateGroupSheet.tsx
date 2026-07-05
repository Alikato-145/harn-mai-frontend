import { useState } from "react";
import BottomSheet from "./BottomSheet";
import { api } from "../lib/api";
import { LIMITS, sanitizeText } from "../lib/sanitize";
import type { Member } from "../lib/types";

export default function CreateGroupSheet({
  code,
  members,
  onClose,
  onDone,
}: {
  code: string;
  members: Member[];
  onClose: () => void;
  onDone: () => void;
}) {
  const [name, setName] = useState("");
  const [userIds, setUserIds] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  function toggle(id: string) {
    setUserIds((prev) =>
      prev.includes(id) ? prev.filter((u) => u !== id) : [...prev, id],
    );
  }

  async function submit() {
    setLoading(true);
    try {
      await api.createGroup(code, { name: name.trim(), userIds });
      onDone();
      onClose();
    } finally {
      setLoading(false);
    }
  }

  return (
    <BottomSheet title="สร้างกลุ่ม" onClose={onClose}>
      <label className="label">ชื่อกลุ่ม</label>
      <input
        className="field"
        placeholder="เช่น กลุ่มเหล้า"
        value={name}
        autoFocus
        maxLength={LIMITS.groupName}
        onChange={(e) => setName(sanitizeText(e.target.value, LIMITS.groupName))}
      />
      <label className="label">เลือกสมาชิก</label>
      <div className="check-list">
        {members.map((m) => (
          <div
            key={m.id}
            className={`chk ${userIds.includes(m.id) ? "on" : ""}`}
            onClick={() => toggle(m.id)}
          >
            <span className="box" />
            {m.name}
          </div>
        ))}
      </div>
      <button
        className="btn btn-primary mt"
        disabled={!name.trim() || userIds.length === 0 || loading}
        onClick={submit}
      >
        สร้างกลุ่ม
      </button>
    </BottomSheet>
  );
}
