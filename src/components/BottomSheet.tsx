import type { ReactNode } from "react";

// bottom sheet ที่ใช้ซ้ำทุกฟอร์ม (เพิ่มสมาชิก/รายการ/กลุ่ม/claim)
export default function BottomSheet({
  title,
  onClose,
  children,
}: {
  title: string;
  onClose: () => void;
  children: ReactNode;
}) {
  return (
    // แตะพื้นหลังมืด = ปิด; แตะในแผ่นไม่ปิด (stopPropagation)
    <div className="sheet-overlay" onClick={onClose}>
      <div className="sheet" onClick={(e) => e.stopPropagation()}>
        <div className="grab" />
        <div className="sheet-head">
          <h3>{title}</h3>
          <span className="x" onClick={onClose}>
            ✕
          </span>
        </div>
        {children}
      </div>
    </div>
  );
}
