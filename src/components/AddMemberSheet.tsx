import { useState } from "react";
import BottomSheet from "./BottomSheet";
import { api } from "../lib/api";
import { LIMITS, sanitizeText } from "../lib/sanitize";

export default function AddMemberSheet({
  code,
  onClose,
  onDone,
}: {
  code: string;
  onClose: () => void;
  onDone: () => void; // เรียกหลังสำเร็จ (ให้ parent refetch)
}) {
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);

  async function submit() {
    setLoading(true);
    try {
      await api.addUser(code, name.trim());
      onDone();
      onClose();
    } finally {
      setLoading(false);
    }
  }

  return (
    <BottomSheet title="เพิ่มสมาชิก" onClose={onClose}>
      <input
        className="field"
        placeholder="ชื่อสมาชิก"
        value={name}
        autoFocus
        maxLength={LIMITS.memberName}
        onChange={(e) => setName(sanitizeText(e.target.value, LIMITS.memberName))}
      />
      <button
        className="btn btn-primary"
        disabled={!name.trim() || loading}
        onClick={submit}
      >
        เพิ่ม
      </button>
    </BottomSheet>
  );
}
