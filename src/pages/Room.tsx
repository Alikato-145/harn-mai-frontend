import { useEffect, useState, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { api } from "../lib/api";
import { storage } from "../lib/storage";
import { money } from "../lib/format";
import type { RoomFull, ItemFull, Member } from "../lib/types";
import AddMemberSheet from "../components/AddMemberSheet";
import EditMemberSheet from "../components/EditMemberSheet";
import AddItemSheet from "../components/AddItemSheet";
import CreateGroupSheet from "../components/CreateGroupSheet";
import ClaimSheet from "../components/ClaimSheet";
import ManageGroupSheet from "../components/ManageGroupSheet";
import FinishDialog from "../components/FinishDialog";
import LoadingScreen from "../components/LoadingScreen";

type Sheet = "addMember" | "addItem" | "createGroup" | null;

export default function Room() {
  const { idRoom = "" } = useParams(); // idRoom = roomId (UUID) — ใช้ยิงตรงทุก endpoint
  const navigate = useNavigate();
  const [data, setData] = useState<RoomFull | null>(null);
  const [error, setError] = useState("");
  const [sheet, setSheet] = useState<Sheet>(null);
  const [claimItem, setClaimItem] = useState<ItemFull | null>(null);
  const [manageGroupId, setManageGroupId] = useState<string | null>(null);
  const [editMember, setEditMember] = useState<Member | null>(null);
  const [showFinish, setShowFinish] = useState(false);
  const [copied, setCopied] = useState(false);

  const session = storage.load();

  function copyCode(codeStr: string) {
    navigator.clipboard.writeText(codeStr);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }

  // silent = true สำหรับ background refetch → ไม่เด้งหน้า error ถ้าพลาดแวบเดียว (เน็ต/429)
  // ยิง /full ด้วย idRoom (roomId) ตรง ๆ — ถ้าห้องไม่มี/ถูกจบ /full จะ 404 เอง
  const load = useCallback(
    async (opts?: { silent?: boolean }) => {
      if (!idRoom) return;
      try {
        setData(await api.getRoomFull(idRoom));
      } catch {
        if (!opts?.silent) setError("ห้องนี้ถูกจบไปแล้ว หรือไม่มีอยู่");
      }
    },
    [idRoom],
  );

  // โหลดข้อมูล + เปิดสาย SSE (realtime)
  useEffect(() => {
    if (!idRoom) return;
    load();
    const es = new EventSource(
      `${import.meta.env.VITE_API_URL}/rooms/${idRoom}/events`,
    );
    es.onmessage = () => load({ silent: true }); // มีสัญญาณ → refetch
    // EventSource รีคอนเน็คเองอัตโนมัติถ้าสายหลุด (ข้อดีใหญ่)
    return () => es.close();
  }, [idRoom, load]);

  function goHome() {
    storage.clear();
    navigate("/");
  }

  if (error) {
    return (
      <div className="container">
        <div className="banner-error">{error}</div>
        <button className="btn btn-primary" onClick={goHome}>
          กลับหน้าแรก
        </button>
      </div>
    );
  }
  if (!data) return <LoadingScreen message="กำลังโหลดห้อง…" />;

  const { room, members, groups, items } = data;
  const isHost = session?.userId === room.hostUserId;
  const overlayOpen =
    sheet !== null ||
    claimItem !== null ||
    manageGroupId !== null ||
    editMember !== null ||
    showFinish;

  return (
    <div className="container">
      <div className="appbar">
        <span className="rname">{room.name}</span>
        <div className="appbar-right">
          <span
            className={`code-chip ${copied ? "copied" : ""}`}
            onClick={() => copyCode(room.code)}
            title="แตะเพื่อคัดลอกโค้ด"
          >
            {copied ? (
              <svg
                className="chip-ic"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <polyline points="20 6 9 17 4 12" />
              </svg>
            ) : (
              <svg
                className="chip-ic"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
                <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
              </svg>
            )}
            {copied ? "คัดลอกแล้ว" : room.code}
          </span>
          {isHost && (
            <button
              className="icon-btn"
              onClick={() => setShowFinish(true)}
              title="จบห้อง"
              aria-label="จบห้อง"
            >
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <path d="M18.36 6.64a9 9 0 1 1-12.73 0" />
                <line x1="12" y1="2" x2="12" y2="12" />
              </svg>
            </button>
          )}
        </div>
      </div>

      {/* สมาชิก */}
      <div className="section-panel section-panel--members">
        <div className="sec-title">
          <span>
            สมาชิก <span className="count">{members.length}</span>
          </span>
          <span className="link" onClick={() => setSheet("addMember")}>
            + เพิ่มชื่อ
          </span>
        </div>
        <div className="members">
          {members.map((m) => (
            <div
              className="avatar"
              key={m.id}
              onClick={() => setEditMember(m)}
              title="แตะเพื่อแก้ชื่อ/เบอร์"
            >
              <div className="circ">{m.name.charAt(0)}</div>
              <small>{m.name}</small>
            </div>
          ))}
        </div>
      </div>

      {/* กลุ่มย่อย */}
      <div className="section-panel section-panel--groups">
        <div className="sec-title">
          <span>
            กลุ่มย่อย <span className="count">{groups.length}</span>
          </span>
          <span className="link" onClick={() => setSheet("createGroup")}>
            + สร้างกลุ่ม
          </span>
        </div>
        {groups.length === 0 && <p className="muted small">ยังไม่มีกลุ่ม</p>}
        <div className="group-list">
          {groups.map((g) => (
            <div
              className="group-card"
              key={g.id}
              onClick={() => setManageGroupId(g.id)}
            >
              <div className="group-head">
                <span className="group-name">{g.name}</span>
                <span className="manage-link">จัดการ ›</span>
              </div>
              <div className="member-tags">
                {g.members.length === 0 && (
                  <span className="muted small">ยังไม่มีสมาชิก</span>
                )}
                {g.members.map((m) => (
                  <span className="member-tag sm" key={m.userId}>
                    {m.name}
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* รายการ */}
      <div className="section-panel section-panel--items">
        <div className="sec-title">
          <span>
            รายการ <span className="count">{items.length}</span>
          </span>
          <span className="link" onClick={() => setSheet("addItem")}>
            + เพิ่มรายการ
          </span>
        </div>
        {items.length === 0 && <p className="muted small">ยังไม่มีรายการ</p>}
        {items.map((it) => {
          const claimed = it.claimedBy != null;
          return (
            <div
              className={`card ${claimed ? "item-claimed" : "item-pending"}`}
              key={it.id}
              onClick={() => setClaimItem(it)}
            >
              <div className="row">
                <span className="item-name">{it.name}</span>
                {claimed ? (
                  <span className="price">{money(it.price ?? 0)}</span>
                ) : (
                  <button className="mini-btn">claim</button>
                )}
              </div>
              {it.note && <div className="item-note">{it.note}</div>}
              {claimed && (
                <div className="item-meta">
                  <span className="pill pill-green">จ่ายโดย {it.payerName}</span>
                  <span>
                    {it.splitMode === "all"
                      ? "หารทั้งห้อง"
                      : `หาร ${it.groupNames.join(", ")}`}
                  </span>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* actions — ซ่อนตอนมี sheet/dialog เปิด กันปุ่มลอยทับแป้นพิมพ์ */}
      {!overlayOpen && (
        <div className="sticky-bar">
          <button
            className="btn btn-primary"
            onClick={() => navigate(`/room/${idRoom}/settlement`)}
          >
            ดูสรุปหารเงิน
          </button>
        </div>
      )}

      {/* sheets / dialogs */}
      {sheet === "addMember" && (
        <AddMemberSheet
          roomId={idRoom}
          onClose={() => setSheet(null)}
          onDone={load}
        />
      )}
      {editMember && (
        <EditMemberSheet
          roomId={idRoom}
          member={editMember}
          isHost={editMember.id === data?.room.hostUserId}
          onClose={() => setEditMember(null)}
          onDone={load}
        />
      )}
      {sheet === "addItem" && (
        <AddItemSheet
          roomId={idRoom}
          members={members}
          groups={groups}
          onClose={() => setSheet(null)}
          onDone={load}
        />
      )}
      {sheet === "createGroup" && (
        <CreateGroupSheet
          roomId={idRoom}
          members={members}
          onClose={() => setSheet(null)}
          onDone={load}
        />
      )}
      {claimItem && (
        <ClaimSheet
          roomId={idRoom}
          item={claimItem}
          members={members}
          groups={groups}
          onClose={() => setClaimItem(null)}
          onDone={load}
        />
      )}
      {manageGroupId &&
        (() => {
          // หา group ล่าสุดจาก data ทุก render → หลัง refetch ได้ของใหม่
          const g = groups.find((x) => x.id === manageGroupId);
          if (!g) return null;
          return (
            <ManageGroupSheet
              roomId={idRoom}
              group={g}
              members={members}
              onClose={() => setManageGroupId(null)}
              onDone={load}
            />
          );
        })()}
      {showFinish && session && (
        <FinishDialog
          roomId={idRoom}
          userId={session.userId}
          roomName={room.name}
          onClose={() => setShowFinish(false)}
          onHome={goHome}
        />
      )}
    </div>
  );
}
