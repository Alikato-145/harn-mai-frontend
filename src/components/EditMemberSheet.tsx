import { useState } from "react";
import { Link } from "react-router-dom";
import BottomSheet from "./BottomSheet";
import { api } from "../lib/api";
import type { Member } from "../lib/types";
import { LIMITS, sanitizeText, sanitizePhone, isValidPhone } from "../lib/sanitize";

export default function EditMemberSheet({
  roomId,
  member,
  onClose,
  onDone,
}: {
  roomId: string;
  member: Member;
  onClose: () => void;
  onDone: () => void; // เรียกหลังสำเร็จ (ให้ parent refetch)
}) {
  const [name, setName] = useState(member.name);
  const [phone, setPhone] = useState(member.phone ?? "");
  // เบอร์ที่บันทึกไว้แล้ว = เคยยินยอมมาก่อน → ติ๊กให้เลย, เบอร์ใหม่ต้องยินยอมก่อน
  const [consent, setConsent] = useState(!!member.phone);
  const [loading, setLoading] = useState(false);

  const phoneOk = isValidPhone(phone);
  const consentOk = !phone || consent;

  async function submit() {
    setLoading(true);
    try {
      // ส่ง phone เฉพาะตอนมีค่า (เว้นว่าง = คงเบอร์เดิม, ยังลบเบอร์ผ่านหน้านี้ไม่ได้)
      await api.updateUser(roomId, member.id, {
        name: name.trim(),
        ...(phone ? { phone } : {}),
      });
      onDone();
      onClose();
    } finally {
      setLoading(false);
    }
  }

  return (
    <BottomSheet title="แก้ไขโปรไฟล์" onClose={onClose}>
      <input
        className="field"
        placeholder="ชื่อสมาชิก"
        value={name}
        autoFocus
        maxLength={LIMITS.memberName}
        onChange={(e) => setName(sanitizeText(e.target.value, LIMITS.memberName))}
      />
      <input
        className="field"
        placeholder="เบอร์ PromptPay (ไม่ใส่ก็ได้)"
        value={phone}
        inputMode="numeric"
        maxLength={LIMITS.phone}
        onChange={(e) => setPhone(sanitizePhone(e.target.value))}
      />
      {!phoneOk && (
        <p className="muted small">เบอร์ต้องขึ้นต้นด้วย 0 และมี 10 หลัก</p>
      )}
      {phone && (
        <label className={`consent-chk ${consent ? "on" : ""}`}>
          <input
            type="checkbox"
            checked={consent}
            onChange={(e) => setConsent(e.target.checked)}
          />
          <span className="box" />
          <span>
            ยินยอมให้เก็บเบอร์นี้เพื่อสร้าง QR PromptPay
            โดยคนในห้องจะเห็นเบอร์/QR ของฉัน (
            <Link className="link" to="/privacy" target="_blank">
              นโยบายความเป็นส่วนตัว
            </Link>
            )
          </span>
        </label>
      )}
      <button
        className="btn btn-primary"
        disabled={!name.trim() || !phoneOk || !consentOk || loading}
        onClick={submit}
      >
        บันทึก
      </button>
    </BottomSheet>
  );
}
