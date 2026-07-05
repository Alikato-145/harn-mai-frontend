// เก็บ session ของผู้ใช้ใน localStorage (ไม่มี login → ใช้ userId เป็นตัวตน)

const KEY = "harnmai_session";

export type Session = {
  code: string;
  userId: string;
  isHost: boolean;
};

export const storage = {
  save: (s: Session) => localStorage.setItem(KEY, JSON.stringify(s)),
  load: (): Session | null => {
    const v = localStorage.getItem(KEY);
    return v ? (JSON.parse(v) as Session) : null;
  },
  clear: () => localStorage.removeItem(KEY),
};
