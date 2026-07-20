// types ตรงกับ response ของ backend (ดู backend/CLAUDE.md)

// โหมดหารฝั่ง UI — "people" เป็นของ frontend ล้วน (ยิง API เป็น splitMode:"group" + userIds)
export type SplitUiMode = "all" | "group" | "people";

export type Room = {
  id: string;
  code: string;
  name: string;
  hostUserId: string;
  status: "open" | "locked" | "finished";
  createdAt: string | null;
};

export type Member = {
  id: string;
  name: string;
  phone: string | null;
  roomId: string;
  joinedAt: string | null;
};

export type GroupFull = {
  id: string;
  name: string;
  roomId: string;
  isCreatedByItem: boolean; // true = กลุ่มลับที่ระบบสร้างตอนเลือกคน (ไม่โชว์เป็นกลุ่มปกติ)
  members: { userId: string; name: string }[];
};

export type ItemFull = {
  id: string;
  name: string;
  note: string | null;
  price: number | null;
  claimedBy: string | null;
  splitMode: "all" | "group";
  payerName: string | null;
  groupIds: string[];
  groupNames: string[];
};

export type RoomFull = {
  room: Room;
  members: Member[];
  groups: GroupFull[];
  items: ItemFull[];
};

export type Settlement = {
  totalClaimed: number;
  pendingItems: number;
  balances: {
    userId: string;
    name: string;
    paid: number;
    owes: number;
    balance: number;
  }[];
  transactions: {
    fromId: string;
    fromName: string;
    toId: string;
    toName: string;
    amount: number;
    toPhone: string | null;
    promptPayPayload: string | null;
  }[];
};
