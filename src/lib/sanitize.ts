// จำกัดความยาว + กันอักขระแปลกๆ ใน text input ทุก field
// อนุญาต: ไทย (U+0E00–U+0E7F), อังกฤษ, ตัวเลข, เว้นวรรค และเครื่องหมายพื้นฐาน . , - _ ( ) / + &
export const LIMITS = {
  roomName: 50,
  memberName: 30,
  groupName: 30,
  itemName: 50,
  note: 100,
  price: 15,
  phone: 10,
} as const;

const DISALLOWED = /[^a-zA-Z0-9฀-๿ .,\-_()/+&]/g;

export function sanitizeText(value: string, maxLength: number): string {
  return value.replace(DISALLOWED, "").slice(0, maxLength);
}

// โค้ดห้อง: ตัวอักษรอังกฤษพิมพ์ใหญ่กับตัวเลขเท่านั้น
export function sanitizeCode(value: string, maxLength: number): string {
  return value.toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, maxLength);
}

// เบอร์โทร: ตัวเลขล้วน สูงสุด 10 หลัก
export function sanitizePhone(value: string): string {
  return value.replace(/[^0-9]/g, "").slice(0, LIMITS.phone);
}

// เบอร์ถูกต้อง = ว่าง (ไม่ใส่) หรือ 0 นำหน้า + 10 หลัก (ตรงกับ backend ^0[0-9]{9}$)
export function isValidPhone(value: string): boolean {
  return value === "" || /^0[0-9]{9}$/.test(value);
}

// ราคา: ตัวเลข + จุดทศนิยมจุดเดียว
export function sanitizePrice(value: string): string {
  const cleaned = value.replace(/[^0-9.]/g, "");
  const [int = "", ...rest] = cleaned.split(".");
  const dec = rest.join("");
  const result = rest.length > 0 ? `${int}.${dec}` : int;
  return result.slice(0, LIMITS.price);
}
