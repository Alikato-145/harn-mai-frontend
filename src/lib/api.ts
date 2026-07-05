import type { RoomFull, Settlement, ItemFull } from "./types";

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
    request<{ code: string; userId: string }>("/rooms", {
      method: "POST",
      body: JSON.stringify(body),
    }),
  getRoomFull: (code: string) => request<RoomFull>(`/rooms/${code}/full`),
  finish: (code: string, userId: string) =>
    request<{ message: string }>(`/rooms/${code}/finish`, {
      method: "POST",
      body: JSON.stringify({ userId }),
    }),

  // users
  addUser: (code: string, name: string) =>
    request<{ userId: string; name: string }>(`/rooms/${code}/users`, {
      method: "POST",
      body: JSON.stringify({ name }),
    }),

  // items
  addItem: (code: string, body: { name: string; note?: string }) =>
    request<ItemFull>(`/rooms/${code}/items`, {
      method: "POST",
      body: JSON.stringify(body),
    }),
  claimItem: (
    code: string,
    itemId: string,
    body: {
      price: number;
      claimedBy: string;
      splitMode: "all" | "group";
      groupIds?: string[];
    },
  ) =>
    request(`/rooms/${code}/items/${itemId}/claim`, {
      method: "POST",
      body: JSON.stringify(body),
    }),
  unclaimItem: (code: string, itemId: string) =>
    request(`/rooms/${code}/items/${itemId}/unclaim`, { method: "POST" }),
  deleteItem: (code: string, itemId: string) =>
    request(`/rooms/${code}/items/${itemId}`, { method: "DELETE" }),

  // groups
  createGroup: (code: string, body: { name: string; userIds: string[] }) =>
    request(`/rooms/${code}/groups`, {
      method: "POST",
      body: JSON.stringify(body),
    }),
  deleteGroup: (code: string, groupId: string) =>
    request(`/rooms/${code}/groups/${groupId}`, { method: "DELETE" }),
  addGroupMembers: (code: string, groupId: string, userIds: string[]) =>
    request(`/rooms/${code}/groups/${groupId}/members`, {
      method: "POST",
      body: JSON.stringify({ userIds }),
    }),
  removeGroupMember: (code: string, groupId: string, userId: string) =>
    request(`/rooms/${code}/groups/${groupId}/members/${userId}`, {
      method: "DELETE",
    }),

  // settlement
  settlement: (code: string) => request<Settlement>(`/rooms/${code}/settlement`),
};
