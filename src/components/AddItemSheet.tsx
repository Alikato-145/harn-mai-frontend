import { useState } from "react";
import BottomSheet from "./BottomSheet";
import { api } from "../lib/api";
import { LIMITS, sanitizeText } from "../lib/sanitize";

export default function AddItemSheet({
  code,
  onClose,
  onDone,
}: {
  code: string;
  onClose: () => void;
  onDone: () => void;
}) {
  const [name, setName] = useState("");
  const [note, setNote] = useState("");
  const [loading, setLoading] = useState(false);

  async function submit() {
    setLoading(true);
    try {
      // สร้าง item เปล่า — ราคา/คนจ่ายไปใส่ตอน claim
      await api.addItem(code, { name: name.trim(), note: note.trim() || undefined });
      onDone();
      onClose();
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
      <button
        className="btn btn-primary"
        disabled={!name.trim() || loading}
        onClick={submit}
      >
        เพิ่มรายการ
      </button>
      <p className="muted small center mt">
        รายการเกิดมาเป็น "ยังไม่ claim" — ราคา/คนจ่ายไปใส่ตอนกด claim
      </p>
    </BottomSheet>
  );
}
