import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { api } from "../lib/api";
import { money, buildSettlementText } from "../lib/format";
import type { Settlement as SettlementType } from "../lib/types";
import LoadingScreen from "../components/LoadingScreen";

export default function Settlement() {
  const { code = "" } = useParams();
  const navigate = useNavigate();
  const [data, setData] = useState<SettlementType | null>(null);
  const [roomName, setRoomName] = useState("");
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    api.settlement(code).then(setData).catch(() => {});
    // เอาชื่อห้องไว้ทำ export text
    api.getRoomFull(code).then((f) => setRoomName(f.room.name)).catch(() => {});
  }, [code]);

  if (!data) return <LoadingScreen message="กำลังคำนวณ…" />;

  const text = buildSettlementText(roomName, data);

  function copy() {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }

  return (
    <div className="container">
      <div className="appbar">
        <span className="rname">สรุปหารเงิน</span>
        <span className="x" onClick={() => navigate(`/room/${code}`)}>
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
      {data.transactions.length === 0 && (
        <p className="muted small">ไม่มีรายการต้องโอน</p>
      )}
      {data.transactions.map((t, i) => (
        <div className="tx" key={i}>
          <span>{t.fromName}</span>
          <span className="arrow">→</span>
          <span>{t.toName}</span>
          <span className="tx-amt">{money(t.amount)}</span>
        </div>
      ))}

      {/* export */}
      <pre className="export-box mt">{text}</pre>
      <button className="btn btn-outline mt" onClick={copy}>
        {copied ? "คัดลอกแล้ว" : "คัดลอกข้อความ"}
      </button>
    </div>
  );
}
