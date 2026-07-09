import { useState } from "react";
import BottomSheet from "./BottomSheet";
import PaySplitFields from "./PaySplitFields";
import { api } from "../lib/api";
import type { ItemFull, Member, GroupFull } from "../lib/types";

export default function ClaimSheet({
  code,
  item,
  members,
  groups,
  onClose,
  onDone,
}: {
  code: string;
  item: ItemFull;
  members: Member[];
  groups: GroupFull[];
  onClose: () => void;
  onDone: () => void;
}) {
  // prefill ถ้า item เคย claim แล้ว (กรณีแก้)
  const [price, setPrice] = useState(item.price != null ? String(item.price) : "");
  const [claimedBy, setClaimedBy] = useState(item.claimedBy ?? "");
  const [splitMode, setSplitMode] = useState<"all" | "group">(item.splitMode);
  const [groupIds, setGroupIds] = useState<string[]>(item.groupIds ?? []);
  const [loading, setLoading] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  const alreadyClaimed = item.claimedBy != null;

  function toggleGroup(id: string) {
    setGroupIds((prev) =>
      prev.includes(id) ? prev.filter((g) => g !== id) : [...prev, id],
    );
  }

  async function submit() {
    setLoading(true);
    try {
      await api.claimItem(code, item.id, {
        price: Number(price),
        claimedBy,
        splitMode,
        groupIds: splitMode === "group" ? groupIds : undefined,
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
      await api.deleteItem(code, item.id);
      onDone();
      onClose();
    } finally {
      setLoading(false);
    }
  }

  async function unclaim() {
    setLoading(true);
    try {
      await api.unclaimItem(code, item.id);
      onDone();
      onClose();
    } finally {
      setLoading(false);
    }
  }

  const canSubmit =
    Number(price) > 0 &&
    claimedBy !== "" &&
    (splitMode === "all" || groupIds.length > 0);

  return (
    <BottomSheet title={`จ่าย / หาร: ${item.name}`} onClose={onClose}>
      <PaySplitFields
        required
        price={price}
        onPrice={setPrice}
        claimedBy={claimedBy}
        onClaimedBy={setClaimedBy}
        splitMode={splitMode}
        onSplitMode={setSplitMode}
        groupIds={groupIds}
        onToggleGroup={toggleGroup}
        members={members}
        groups={groups}
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
