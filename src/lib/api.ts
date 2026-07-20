import type { Room, RoomFull, Settlement, ItemFull } from "./types";

const API = import.meta.env.VITE_API_URL as string;

// helper กลาง: ยิง fetch + แปลง json + โยน error ถ้า !ok
async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${API}${path}`, {
    headers: { "Content-Type": "application/json" },
    ...options,
  });
  const data = await res.json().catch(() => null);
  if (!res.ok) {
    const msg = (data && (data.error || data.message)) || `HTTP ${res.status}`;
    throw new Error(msg);
  }
  return data as T;
}

// รวม endpoint ทั้งหมดไว้ที่เดียว — หน้าอื่นเรียก api.xxx ไม่ต้องเขียน fetch ซ้ำ
export const api = {
  // rooms
  createRoom: (body: { roomName: string; hostName: string }) =>
    request<{ code: string; userId: string; roomId: string }>("/rooms", {
      method: "POST",
      body: JSON.stringify(body),
    }),
  // หาห้องจาก roomId (UUID) → คืน room row (มี code) ไว้ resolve code จาก URL
  getRoomById: (roomId: string) => request<Room>(`/rooms/id/${roomId}`),
  // หาห้องจาก code (เส้นเบา + rate limit เข้ม) → ใช้ตอน join เพื่อเอา room.id ไป navigate
  getRoom: (code: string) => request<Room>(`/rooms/code/${code}`),
  getRoomFull: (roomId: string) => request<RoomFull>(`/rooms/${roomId}/full`),
  finish: (roomId: string, userId: string) =>
    request<{ message: string }>(`/rooms/${roomId}/finish`, {
      method: "POST",
      body: JSON.stringify({ userId }),
    }),

  // users
  addUser: (roomId: string, name: string, phone?: string) =>
    request<{ userId: string; name: string; phone: string | null }>(
      `/rooms/${roomId}/users`,
      {
        method: "POST",
        body: JSON.stringify(phone ? { name, phone } : { name }),
      },
    ),
  updateUser: (
    roomId: string,
    userId: string,
    body: { name?: string; phone?: string },
  ) =>
    request<{ userId: string; name: string; phone: string | null }>(
      `/rooms/${roomId}/users/${userId}`,
      { method: "PATCH", body: JSON.stringify(body) },
    ),
  deleteUser: (roomId: string, userId: string) =>
    request(`/rooms/${roomId}/users/${userId}`, { method: "DELETE" }),

  // items
  addItem: (roomId: string, body: { name: string; note?: string }) =>
    request<ItemFull>(`/rooms/${roomId}/items`, {
      method: "POST",
      body: JSON.stringify(body),
    }),
  claimItem: (
    roomId: string,
    itemId: string,
    body: {
      price: number;
      claimedBy: string;
      splitMode: "all" | "group";
      groupIds?: string[];
      userIds?: string[];
    },
  ) =>
    request(`/rooms/${roomId}/items/${itemId}/claim`, {
      method: "POST",
      body: JSON.stringify(body),
    }),
  unclaimItem: (roomId: string, itemId: string) =>
    request(`/rooms/${roomId}/items/${itemId}/unclaim`, { method: "POST" }),
  deleteItem: (roomId: string, itemId: string) =>
    request(`/rooms/${roomId}/items/${itemId}`, { method: "DELETE" }),

  // groups
  createGroup: (roomId: string, body: { name: string; userIds: string[] }) =>
    request(`/rooms/${roomId}/groups`, {
      method: "POST",
      body: JSON.stringify(body),
    }),
  deleteGroup: (roomId: string, groupId: string) =>
    request(`/rooms/${roomId}/groups/${groupId}`, { method: "DELETE" }),
  addGroupMembers: (roomId: string, groupId: string, userIds: string[]) =>
    request(`/rooms/${roomId}/groups/${groupId}/members`, {
      method: "POST",
      body: JSON.stringify({ userIds }),
    }),
  removeGroupMember: (roomId: string, groupId: string, userId: string) =>
    request(`/rooms/${roomId}/groups/${groupId}/members/${userId}`, {
      method: "DELETE",
    }),

  // settlement
  settlement: (roomId: string) =>
    request<Settlement>(`/rooms/${roomId}/settlement`),
  // สร้าง QR พร้อมเพย์ใหม่ตามยอดที่ระบุ (ใช้ตอน toggle ปัดเศษ → ขอ payload ยอดที่ปัดแล้ว)
  qrcode: (roomId: string, phoneNumber: string, amount: number) =>
    request<{ payload: string }>(`/rooms/${roomId}/settlement/qrcode`, {
      method: "POST",
      body: JSON.stringify({ phoneNumber, amount }),
    }),
};
