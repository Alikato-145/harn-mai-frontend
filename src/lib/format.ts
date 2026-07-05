import type { Settlement } from "./types";

// แสดงเงิน  2 ตำแหน่ง
export const money = (n: number) => `฿${n.toFixed(2)}`;

// สร้างข้อความสรุปสำหรับ export/แชร์ (ใช้ทั้งหน้า settlement + ตอนจบห้อง)
export function buildSettlementText(roomName: string, s: Settlement): string {
  const lines = [`harnmai — ${roomName}`, `ยอดรวม ${money(s.totalClaimed)}`, ""];
  if (s.transactions.length === 0) {
    lines.push("ไม่มีรายการต้องโอน");
  } else {
    lines.push("โอนเงิน:");
    for (const t of s.transactions) {
      lines.push(`- ${t.fromName} → ${t.toName}  ${money(t.amount)}`);
    }
  }
  return lines.join("\n");
}
