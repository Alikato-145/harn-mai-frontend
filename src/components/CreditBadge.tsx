// เครดิตผู้ทำ — ลิงก์ไป Instagram
// signature: วงแหวนไล่สีแบบ "สตอรี่ IG" ล้อมไอคอน (หมุนตอน hover)
export default function CreditBadge() {
  return (
    <a
      className="credit-badge"
      href="https://www.instagram.com/nxsmnt/"
      target="_blank"
      rel="noopener noreferrer"
      aria-label="made by nxsmnt — เปิด Instagram"
    >
      <span className="credit-ring">
        <span className="credit-ring-inner">
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
            <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
            <line x1="17.5" y1="6.5" x2="17.51" y2="6.5" />
          </svg>
        </span>
      </span>
      <span className="credit-label">
        made by <b>@nxsmnt</b>
      </span>
    </a>
  );
}
