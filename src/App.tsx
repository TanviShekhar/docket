import { Route, Routes } from "react-router-dom";
import TopBar from "./components/TopBar";
import Today from "./pages/Today";
import Item from "./pages/Item";
import Contracts from "./pages/Contracts";
import Supplier from "./pages/Supplier";
import Value from "./pages/Value";
import CaseStudy from "./pages/CaseStudy";
import Welcome, { usePicking } from "./pages/Welcome";
import SupplierPortal from "./pages/SupplierPortal";
import Toast from "./components/Toast";
import TourGuide from "./components/TourGuide";
import { useStore } from "./lib/store";
import { useTour } from "./lib/tour";

export default function App() {
  const signedIn = useStore((s) => s.signedIn);
  const picking = usePicking((s) => s.picking);
  const touring = useTour((t) => t.chapter !== null);
  const pickerOpen = useTour((t) => t.open);
  const role = useStore((s) => s.role);
  if (!signedIn || picking) return <><Welcome /><Toast /></>;
  // A supplier sees a separate portal with only their own facts. There is no role switch and no internal screen.
  if (role === "supplier") return (
    <div className={touring ? "tour-pad" : ""}>
      <SupplierPortal />
      {touring && <div aria-hidden className="h-[58vh] lg:hidden" />}
      {pickerOpen && <TourGuide />}
      <Toast />
    </div>
  );
  return (
    <div className={touring ? "tour-pad" : ""}>
      <TopBar />
      <Routes>
        <Route path="/" element={<Today />} />
        <Route path="/item/:id" element={<Item />} />
        <Route path="/contracts" element={<Contracts />} />
        <Route path="/supplier/:id" element={<Supplier />} />
        <Route path="/value" element={<Value />} />
        <Route path="/case-study" element={<CaseStudy />} />
      </Routes>
      <footer className="page py-6 text-sm text-[var(--muted)]">
        Docket is a prototype. All companies, people and data are fictional. Demo date Mon 23 Nov 2026.{" "}
        <a className="underline" href="#/case-study?to=assumptions">See the assumptions</a> <span className="chip-assume">A1 to A10</span>
      </footer>
      {touring && <div aria-hidden className="h-[58vh] lg:hidden" />}
      {pickerOpen && <TourGuide />}
      <Toast />
    </div>
  );
}
