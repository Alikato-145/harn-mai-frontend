import { useEffect, useState, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { api } from "../lib/api";
import { storage } from "../lib/storage";
import { money } from "../lib/format";
import type { RoomFull, ItemFull } from "../lib/types";
import AddMemberSheet from "../components/AddMemberSheet";
import AddItemSheet from "../components/AddItemSheet";
import CreateGroupSheet from "../components/CreateGroupSheet";
import ClaimSheet from "../components/ClaimSheet";
import ManageGroupSheet from "../components/ManageGroupSheet";
import FinishDialog from "../components/FinishDialog";
import LoadingScreen from "../components/LoadingScreen";

type Sheet = "addMember" | "addItem" | "createGroup" | null;

export default function Room() {
  const { code = "" } = useParams();
  const navigate = useNavigate();
  const [data, setData] = useState<RoomFull | null>(null);
  const [error, setError] = useState("");
  const [sheet, setSheet] = useState<Sheet>(null);
  const [claimItem, setClaimItem] = useState<ItemFull | null>(null);
  const [manageGroupId, setManageGroupId] = useState<string | null>(null);
  const [showFinish, setShowFinish] = useState(false);

  const session = storage.load();

  const load = useCallback(async () => {
    try {
      setData(await api.getRoomFull(code));
    } catch {
      setError("ห้องนี้ถูกจบไปแล้ว หรือไม่มีอยู่");
    }
  }, [code]);

  useEffect(() => {
    load();
  }, [load]);

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
    sheet !== null || claimItem !== null || manageGroupId !== null || showFinish;

  return (
    <div className="container">
      <div className="appbar">
        <span className="rname">{room.name}</span>
        <span
          className="code-chip"
          onClick={() => navigator.clipboard.writeText(room.code)}
          title="แตะเพื่อคัดลอกโค้ด"
        >
          {room.code}
        </span>
      </div>

      {/* สมาชิก */}
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
          <div className="avatar" key={m.id}>
            <div className="circ">{m.name.charAt(0)}</div>
            <small>{m.name}</small>
          </div>
        ))}
      </div>

      {/* กลุ่มย่อย */}
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

      {/* รายการ */}
      <div className="sec-title">
        <span>
          รายการ <span className="count">{items.length}</span>
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

      {isHost && (
        <button className="btn btn-danger mt-lg" onClick={() => setShowFinish(true)}>
          จบห้อง (ลบข้อมูลทั้งหมด)
        </button>
      )}

      {/* actions — ซ่อนตอนมี sheet/dialog เปิด กันปุ่มลอยทับแป้นพิมพ์ */}
      {!overlayOpen && (
        <>
          <button
            className="fab"
            onClick={() => setSheet("addItem")}
            aria-label="เพิ่มรายการ"
          >
            +
          </button>
          <div className="sticky-bar">
            <button
              className="btn btn-primary"
              onClick={() => navigate(`/room/${code}/settlement`)}
            >
              ดูสรุปหารเงิน
            </button>
          </div>
        </>
      )}

      {/* sheets / dialogs */}
      {sheet === "addMember" && (
        <AddMemberSheet code={code} onClose={() => setSheet(null)} onDone={load} />
      )}
      {sheet === "addItem" && (
        <AddItemSheet code={code} onClose={() => setSheet(null)} onDone={load} />
      )}
      {sheet === "createGroup" && (
        <CreateGroupSheet
          code={code}
          members={members}
          onClose={() => setSheet(null)}
          onDone={load}
        />
      )}
      {claimItem && (
        <ClaimSheet
          code={code}
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
              code={code}
              group={g}
              members={members}
              onClose={() => setManageGroupId(null)}
              onDone={load}
            />
          );
        })()}
      {showFinish && session && (
        <FinishDialog
          code={code}
          userId={session.userId}
          roomName={room.name}
          onClose={() => setShowFinish(false)}
          onHome={goHome}
        />
      )}
    </div>
  );
}
