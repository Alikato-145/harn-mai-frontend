import { useState } from "react";
import BottomSheet from "./BottomSheet";
import PaySplitFields from "./PaySplitFields";
import { api } from "../lib/api";
import type { ItemFull, Member, GroupFull, SplitUiMode } from "../lib/types";

export default function ClaimSheet({
  roomId,
  item,
  members,
  groups,
  onClose,
  onDone,
}: {
  roomId: string;
  item: ItemFull;
  members: Member[];
  groups: GroupFull[];
  onClose: () => void;
  onDone: () => void;
}) {
  // item ที่เคย claim แบบ "เลือกคน" จะผูกกับกลุ่มลับ (isCreatedByItem) 1 กลุ่ม
  // เจอ → prefill โหมด people + ติ๊กสมาชิกกลุ่มลับนั้นกลับมา
  const anonGroup =
    item.splitMode === "group"
      ? groups.find((g) => g.id === item.groupIds[0] && g.isCreatedByItem)
      : undefined;

  // prefill ถ้า item เคย claim แล้ว (กรณีแก้)
  const [price, setPrice] = useState(item.price != null ? String(item.price) : "");
  const [claimedBy, setClaimedBy] = useState(item.claimedBy ?? "");
  const [mode, setMode] = useState<SplitUiMode>(
    anonGroup ? "people" : item.splitMode,
  );
  const [groupIds, setGroupIds] = useState<string[]>(
    anonGroup ? [] : (item.groupIds ?? []),
  );
  const [userIds, setUserIds] = useState<string[]>(
    anonGroup ? anonGroup.members.map((m) => m.userId) : [],
  );
  const [loading, setLoading] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  const alreadyClaimed = item.claimedBy != null;

  // กลุ่มปกติ (กรองกลุ่มลับออก) — ส่งให้ checklist "เฉพาะกลุ่ม"
  const namedGroups = groups.filter((g) => !g.isCreatedByItem);

  function toggleGroup(id: string) {
    setGroupIds((prev) =>
      prev.includes(id) ? prev.filter((g) => g !== id) : [...prev, id],
    );
  }

  function toggleUser(id: string) {
    setUserIds((prev) =>
      prev.includes(id) ? prev.filter((u) => u !== id) : [...prev, id],
    );
  }

  async function submit() {
    setLoading(true);
    try {
      await api.claimItem(roomId, item.id, {
        price: Number(price),
        claimedBy,
        splitMode: mode === "all" ? "all" : "group",
        groupIds: mode === "group" ? groupIds : undefined,
        userIds: mode === "people" ? userIds : undefined,
      });
      onDone();
      onClose();
    } finally {
      setLoading(false);
    }
  }

  // ลบรายการ — กดครั้งแรกเป็นขอยืนยัน กดซ้ำถึงลบจริง
  async function removeItem() {
    if (!confirmDelete) {
      setConfirmDelete(true);
      return;
    }
    setLoading(true);
    try {
      await api.deleteItem(roomId, item.id);
      onDone();
      onClose();
    } finally {
      setLoading(false);
    }
  }

  async function unclaim() {
    setLoading(true);
    try {
      await api.unclaimItem(roomId, item.id);
      onDone();
      onClose();
    } finally {
      setLoading(false);
    }
  }

  const canSubmit =
    Number(price) > 0 &&
    claimedBy !== "" &&
    (mode === "all" ||
      (mode === "group" && groupIds.length > 0) ||
      (mode === "people" && userIds.length > 0));

  return (
    <BottomSheet title={`จ่าย / หาร: ${item.name}`} onClose={onClose}>
      <PaySplitFields
        required
        price={price}
        onPrice={setPrice}
        claimedBy={claimedBy}
        onClaimedBy={setClaimedBy}
        mode={mode}
        onMode={setMode}
        groupIds={groupIds}
        onToggleGroup={toggleGroup}
        userIds={userIds}
        onToggleUser={toggleUser}
        members={members}
        groups={namedGroups}
      />

      <button
        className="btn btn-primary mt"
        disabled={!canSubmit || loading}
        onClick={submit}
      >
        ยืนยัน claim
      </button>
      {alreadyClaimed && (
        <button className="btn btn-ghost" disabled={loading} onClick={unclaim}>
          ยกเลิก claim
        </button>
      )}
      <button
        className={`btn ${confirmDelete ? "btn-danger-solid" : "btn-danger"}`}
        disabled={loading}
        onClick={removeItem}
      >
        {confirmDelete ? "แน่ใจนะ? กดอีกครั้งเพื่อลบ" : "ลบรายการนี้"}
      </button>
    </BottomSheet>
  );
}
