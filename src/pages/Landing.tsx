import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../lib/api";
import { storage } from "../lib/storage";
import { LIMITS, sanitizeText, sanitizeCode } from "../lib/sanitize";
import CreditBadge from "../components/CreditBadge";

export default function Landing() {
  const navigate = useNavigate();
  const [code, setCode] = useState("");
  const [creating, setCreating] = useState(false);
  const [roomName, setRoomName] = useState("");
  const [hostName, setHostName] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  // เข้าห้องด้วย code — เช็คว่ามีจริงก่อน (ยิง /full)
  async function enterRoom() {
    setError("");
    setLoading(true);
    try {
      // เช็คว่ามีจริง (เส้นเบา by-code) + เอา room.id ไปใช้เป็น path แทน code
      const room = await api.getRoom(code.trim().toUpperCase());
      navigate(`/room/${room.id}`);
    } catch {
      setError("ไม่พบห้องนี้ ลองเช็คโค้ดอีกครั้ง");
    } finally {
      setLoading(false);
    }
  }

  // สร้างห้องใหม่ → เก็บ session (เป็น host) → เข้าห้อง
  async function createRoom() {
    setError("");
    setLoading(true);
    try {
      const {
        code: newCode,
        userId,
        roomId,
      } = await api.createRoom({
        roomName,
        hostName,
      });
      storage.save({ code: newCode, userId, isHost: true });
      navigate(`/room/${roomId}`);
    } catch (e) {
      setError(e instanceof Error ? e.message : "สร้างห้องไม่สำเร็จ");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="container landing">
      <div className="brand">
        harnmai<span className="dot">.</span>
      </div>
      <div className="tagline">
        หารไหม — หารบิลเท่ากัน/แยกกลุ่มหารกันกับเพื่อนๆ สร้างห้องได้เลย
      </div>

      {error && <div className="banner-error">{error}</div>}

      {!creating ? (
        <>
          <label className="label">มีโค้ดห้องอยู่แล้ว?</label>
          <div className="row-inline">
            <input
              className="field code-input"
              placeholder="ใส่โค้ด 6 ตัว"
              value={code}
              maxLength={6}
              onChange={(e) => setCode(sanitizeCode(e.target.value, 6))}
            />
            <button
              className="btn btn-primary btn-auto"
              disabled={code.length < 6 || loading}
              onClick={enterRoom}
            >
              เข้า
            </button>
          </div>
          <div className="divider">
            <span>หรือ</span>
          </div>
          <button className="btn btn-outline" onClick={() => setCreating(true)}>
            + สร้างห้องใหม่
          </button>
        </>
      ) : (
        <>
          <label className="label">ชื่อห้อง</label>
          <input
            className="field"
            placeholder="เช่น ทริปเชียงใหม่"
            value={roomName}
            maxLength={LIMITS.roomName}
            onChange={(e) =>
              setRoomName(sanitizeText(e.target.value, LIMITS.roomName))
            }
          />
          <label className="label">ชื่อคุณ (เป็นสมาชิกคนแรก + host)</label>
          <input
            className="field"
            placeholder="เช่น นัส"
            value={hostName}
            maxLength={LIMITS.memberName}
            onChange={(e) =>
              setHostName(sanitizeText(e.target.value, LIMITS.memberName))
            }
          />
          <button
            className="btn btn-primary"
            disabled={!roomName || !hostName || loading}
            onClick={createRoom}
          >
            สร้างห้อง
          </button>
          <button className="btn btn-ghost" onClick={() => setCreating(false)}>
            ย้อนกลับ
          </button>
        </>
      )}

      <CreditBadge />
    </div>
  );
}
