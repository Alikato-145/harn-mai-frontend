import { useEffect, useState } from "react";
import { api } from "../lib/api";
import { money, buildSettlementText } from "../lib/format";
import type { Settlement } from "../lib/types";

export default function FinishDialog({
  code,
  userId,
  roomName,
  onClose,
  onHome,
}: {
  code: string;
  userId: string;
  roomName: string;
  onClose: () => void; // ยกเลิก
  onHome: () => void; // กลับหน้าแรก (เคลียร์ session)
}) {
  const [settlement, setSettlement] = useState<Settlement | null>(null);
  const [done, setDone] = useState(false); // true = จบห้องแล้ว โชว์สรุปสุดท้าย
  const [loading, setLoading] = useState(false);

  // ดึงสรุปมาโชว์ก่อนลบ (ให้ก็อปเก็บได้)
  useEffect(() => {
    api.settlement(code).then(setSettlement).catch(() => {});
  }, [code]);

  const text = settlement ? buildSettlementText(roomName, settlement) : "";

  async function confirmFinish() {
    setLoading(true);
    try {
      await api.finish(code, userId); // ลบข้อมูลทั้งห้อง
      setDone(true); // ห้องหายแล้ว → โชว์สรุปที่ดึงไว้ (frozen)
    } catch {
      alert("จบห้องไม่สำเร็จ (คุณเป็น host ไหม?)");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="dialog-overlay">
      <div className="dialog">
        {!done ? (
          <>
            <h3>จบห้อง?</h3>
            <p className="muted small">
              ข้อมูลจะถูกลบถาวร กู้คืนไม่ได้ — คัดลอกสรุปเก็บไว้ก่อนนะ
            </p>
            {settlement && <pre className="export-box">{text}</pre>}
            <button
              className="btn btn-outline mt"
              onClick={() => navigator.clipboard.writeText(text)}
            >
              คัดลอกสรุปก่อน
            </button>
            <button
              className="btn btn-danger"
              disabled={loading}
              onClick={confirmFinish}
            >
              จบห้องถาวร
            </button>
            <div className="link center mt" onClick={onClose}>
              ยกเลิก
            </div>
          </>
        ) : (
          <>
            <h3>จบห้องแล้ว</h3>
            <p className="muted small">สรุปสุดท้าย (ข้อมูลถูกลบแล้ว)</p>
            {settlement && (
              <div className="tx-list">
                {settlement.transactions.length === 0 && (
                  <p className="muted small">ไม่มีรายการต้องโอน</p>
                )}
                {settlement.transactions.map((t, i) => (
                  <div className="tx" key={i}>
                    <span>{t.fromName}</span>
                    <span className="arrow">→</span>
                    <span>{t.toName}</span>
                    <span className="tx-amt">{money(t.amount)}</span>
                  </div>
                ))}
              </div>
            )}
            <button
              className="btn btn-outline mt"
              onClick={() => navigator.clipboard.writeText(text)}
            >
              คัดลอกสรุป
            </button>
            <button className="btn btn-primary" onClick={onHome}>
              กลับหน้าแรก
            </button>
          </>
        )}
      </div>
    </div>
  );
}
