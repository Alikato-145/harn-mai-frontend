import { useState } from "react";
import { Link } from "react-router-dom";
import BottomSheet from "./BottomSheet";
import { api } from "../lib/api";
import { LIMITS, sanitizeText, sanitizePhone, isValidPhone } from "../lib/sanitize";

export default function AddMemberSheet({
  roomId,
  onClose,
  onDone,
}: {
  roomId: string;
  onClose: () => void;
  onDone: () => void; // เรียกหลังสำเร็จ (ให้ parent refetch)
}) {
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [consent, setConsent] = useState(false);
  const [loading, setLoading] = useState(false);

  const phoneOk = isValidPhone(phone);
  // ต้องยินยอมเฉพาะตอนกรอกเบอร์ (PDPA: เบอร์ = consent-based) — ไม่กรอกเบอร์ก็ไม่ต้องติ๊ก
  const consentOk = !phone || consent;

  async function submit() {
    setLoading(true);
    try {
      // ส่ง phone เฉพาะตอนใส่จริง (ว่าง = ไม่มีเบอร์)
      await api.addUser(roomId, name.trim(), phone || undefined);
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
        เพิ่ม
      </button>
    </BottomSheet>
  );
}
