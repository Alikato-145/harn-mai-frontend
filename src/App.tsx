import { BrowserRouter, Routes, Route } from "react-router-dom";
import Landing from "./pages/Landing";
import Room from "./pages/Room";
import Settlement from "./pages/Settlement";

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/room/:idRoom" element={<Room />} />
        <Route path="/room/:idRoom/settlement" element={<Settlement />} />
      </Routes>
    </BrowserRouter>
  );
}
