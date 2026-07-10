import type { Settlement } from "./types";

// แสดงเงิน — roundUp=true ปัดขึ้นเป็นบาทเต็ม (ไม่มีทศนิยม), ไม่งั้น 2 ตำแหน่ง
export const money = (n: number, roundUp = false) =>
  roundUp ? `฿${Math.ceil(n)}` : `฿${n.toFixed(2)}`;

// สร้างข้อความสรุปสำหรับ export/แชร์ (ใช้ทั้งหน้า settlement + ตอนจบห้อง)
// roundUp ตาม toggle หน้า settlement — มีผลกับยอดที่ต้องโอนแต่ละรายการ
export function buildSettlementText(
  roomName: string,
  s: Settlement,
  roundUp = false,
): string {
  const lines = [`harnmai — ${roomName}`, `ยอดรวม ${money(s.totalClaimed)}`, ""];
  if (s.transactions.length === 0) {
    lines.push("ไม่มีรายการต้องโอน");
  } else {
    lines.push("โอนเงิน:");
    for (const t of s.transactions) {
      lines.push(`- ${t.fromName} → ${t.toName}  ${money(t.amount, roundUp)}`);
    }
  }
  return lines.join("\n");
}
