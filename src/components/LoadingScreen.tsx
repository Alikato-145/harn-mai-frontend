// หน้า loading ตอนรีโหลด/รอข้อมูล — ใช้ทั้งหน้า Room และ Settlement
export default function LoadingScreen({ message }: { message: string }) {
  return (
    <div className="container loading-screen">
      <div className="brand sm">
        harnmai<span className="dot">.</span>
      </div>
      <div className="spinner" aria-hidden="true" />
      <p className="loading-text">{message}</p>
    </div>
  );
}
