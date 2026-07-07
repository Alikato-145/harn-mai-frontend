import { useEffect, useState, type ReactNode } from "react";

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
  // ความสูงที่คีย์บอร์ดกินพื้นที่อยู่ — ไว้ดันชีตขึ้นให้พ้น
  // (in-app browser เช่น Instagram ไม่ย่อจอเองตาม interactive-widget)
  const [kbInset, setKbInset] = useState(0);

  useEffect(() => {
    const vv = window.visualViewport;
    if (!vv) return;
    const update = () => {
      // layout viewport ที่สูงเกิน visual viewport = ส่วนที่คีย์บอร์ดบังอยู่
      const inset = window.innerHeight - vv.height - vv.offsetTop;
      setKbInset(Math.max(0, inset));
    };
    update();
    vv.addEventListener("resize", update);
    vv.addEventListener("scroll", update);
    return () => {
      vv.removeEventListener("resize", update);
      vv.removeEventListener("scroll", update);
    };
  }, []);

  return (
    // แตะพื้นหลังมืด = ปิด; แตะในแผ่นไม่ปิด (stopPropagation)
    <div className="sheet-overlay" onClick={onClose}>
      <div
        className="sheet"
        style={{ marginBottom: kbInset }}
        onClick={(e) => e.stopPropagation()}
      >
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
