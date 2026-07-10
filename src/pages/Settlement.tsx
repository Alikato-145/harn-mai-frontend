import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { QRCodeSVG } from "qrcode.react";
import { api } from "../lib/api";
import { money, buildSettlementText } from "../lib/format";
import type { Settlement as SettlementType } from "../lib/types";
import LoadingScreen from "../components/LoadingScreen";

export default function Settlement() {
  const { idRoom = "" } = useParams();
  const navigate = useNavigate();
  const [data, setData] = useState<SettlementType | null>(null);
  const [roomName, setRoomName] = useState("");
  const [copied, setCopied] = useState(false);
  const [openTx, setOpenTx] = useState<number | null>(null); // transaction ที่กาง QR อยู่
  const [roundUp, setRoundUp] = useState(false); // toggle ปัดเศษขึ้นเป็นบาทเต็ม
  // index ของ transaction -> payload QR ที่ gen ใหม่ตามยอดที่ปัดขึ้น
  const [roundedPayloads, setRoundedPayloads] = useState<Record<number, string>>({});

  // ใช้ idRoom (roomId) ยิงตรง — ไม่ต้อง resolve code ก่อนแล้ว
  useEffect(() => {
    if (!idRoom) return;
    api.settlement(idRoom).then(setData).catch(() => {});
    // เอาชื่อห้องไว้ทำ export text
    api.getRoomFull(idRoom).then((f) => setRoomName(f.room.name)).catch(() => {});
  }, [idRoom]);

  // ตอนเปิด toggle ปัดเศษ: ขอ payload QR ใหม่ (ยอดปัดขึ้น) เฉพาะรายการที่มีทศนิยม + มีเบอร์
  useEffect(() => {
    if (!roundUp || !data) return;
    const need = data.transactions
      .map((t, i) => ({ t, i }))
      .filter(({ t }) => t.toPhone && !Number.isInteger(t.amount));
    if (need.length === 0) return;
    let cancelled = false;
    Promise.all(
      need.map(({ t, i }) =>
        api
          .qrcode(idRoom, t.toPhone!, Math.ceil(t.amount))
          .then((r) => [i, r.payload] as const),
      ),
    )
      .then((entries) => {
        if (!cancelled) setRoundedPayloads(Object.fromEntries(entries));
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [roundUp, data, idRoom]);

  if (!data) return <LoadingScreen message="กำลังคำนวณ…" />;

  const text = buildSettlementText(roomName, data, roundUp);

  function copy() {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }

  return (
    <div className="container">
      <div className="appbar">
        <span className="rname">สรุปหารเงิน</span>
        <span className="x" onClick={() => navigate(`/room/${idRoom}`)}>
          ✕
        </span>
      </div>

      <div className="stat">
        <div className="stat-n">{money(data.totalClaimed)}</div>
        <div className="stat-l">ยอดรวมที่ claim แล้ว</div>
      </div>

      {data.pendingItems > 0 && (
        <div className="banner-warn">
          ยังมี {data.pendingItems} รายการยังไม่ claim — ผลอาจไม่ครบ
        </div>
      )}

      {/* ยอดแต่ละคน */}
      <div className="sec-title">
        ยอดแต่ละคน <span className="muted small">จ่าย / หาร / คงเหลือ</span>
      </div>
      <div className="card">
        {data.balances.map((b) => (
          <div className="bal-row" key={b.userId}>
            <span>
              {b.name}{" "}
              <span className="muted small">
                {money(b.paid)} / {money(b.owes)}
              </span>
            </span>
            <span className={b.balance >= 0 ? "amt-pos" : "amt-neg"}>
              {b.balance >= 0 ? "+" : "−"}
              {money(Math.abs(b.balance)).slice(1)}
            </span>
          </div>
        ))}
      </div>

      {/* ต้องโอน */}
      <div className="sec-title">ต้องโอน</div>
      {data.transactions.length > 0 && (
        <div className="toggle">
          <div
            className={`opt ${!roundUp ? "active" : ""}`}
            onClick={() => setRoundUp(false)}
          >
            ทศนิยม
          </div>
          <div
            className={`opt ${roundUp ? "active" : ""}`}
            onClick={() => setRoundUp(true)}
          >
            ปัดขึ้นบาทเต็ม
          </div>
        </div>
      )}
      {data.transactions.length === 0 && (
        <p className="muted small">ไม่มีรายการต้องโอน</p>
      )}
      {data.transactions.map((t, i) => {
        const open = openTx === i;
        return (
          <div className="tx-acc" key={i}>
            <div
              className={`tx tx-head ${open ? "open" : ""}`}
              onClick={() => setOpenTx(open ? null : i)}
            >
              <span>{t.fromName}</span>
              <span className="arrow">→</span>
              <span>{t.toName}</span>
              <span className="tx-amt">{money(t.amount, roundUp)}</span>
              <svg
                className={`chev ${open ? "open" : ""}`}
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <polyline points="6 9 12 15 18 9" />
              </svg>
            </div>
            {open && (
              <div className="tx-panel">
                {(() => {
                  // ยอดมีทศนิยม + ปัดขึ้น → ใช้ QR ที่ gen ใหม่ตามยอดปัด, ไม่งั้นใช้ของเดิม
                  const needRounded = roundUp && !Number.isInteger(t.amount);
                  const qrVal = needRounded
                    ? roundedPayloads[i]
                    : t.promptPayPayload;
                  if (!t.promptPayPayload) {
                    return (
                      <p className="muted small">
                        {t.toName} ยังไม่มีเบอร์ PromptPay — ให้เจ้าตัวแตะโปรไฟล์ในห้องเพื่อเพิ่มเบอร์
                      </p>
                    );
                  }
                  if (!qrVal) {
                    return <p className="muted small">กำลังสร้าง QR…</p>;
                  }
                  return (
                    <>
                      <QRCodeSVG value={qrVal} size={180} />
                      <p className="muted small">
                        สแกนพร้อมเพย์เพื่อโอนให้ {t.toName} ·{" "}
                        {money(t.amount, roundUp)}
                      </p>
                    </>
                  );
                })()}
              </div>
            )}
          </div>
        );
      })}

      {/* export */}
      <pre className="export-box mt">{text}</pre>
      <button className="btn btn-outline mt" onClick={copy}>
        {copied ? "คัดลอกแล้ว" : "คัดลอกข้อความ"}
      </button>
    </div>
  );
}
