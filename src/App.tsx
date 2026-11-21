import { Route, Routes } from "react-router-dom";
import TopBar from "./components/TopBar";
import Today from "./pages/Today";
import Item from "./pages/Item";
import Contracts from "./pages/Contracts";
import Supplier from "./pages/Supplier";
import Value from "./pages/Value";
import CaseStudy from "./pages/CaseStudy";
import Toast from "./components/Toast";
import TourCard from "./components/TourCard";
import { useTour } from "./lib/tour";

export default function App() {
  const touring = useTour((t) => t.open);
  return (
    <>
      <TopBar />
      <Routes>
        <Route path="/" element={<Today />} />
        <Route path="/item/:id" element={<Item />} />
        <Route path="/contracts" element={<Contracts />} />
        <Route path="/supplier/:id" element={<Supplier />} />
        <Route path="/value" element={<Value />} />
        <Route path="/case-study" element={<CaseStudy />} />
      </Routes>
      <footer className="mx-auto max-w-6xl px-4 py-6 text-sm text-[var(--muted)]">
        Docket is a prototype. All companies, people and data are fictional. Demo date Mon 23 Nov 2026.{" "}
        <a className="underline" href="#/case-study?to=assumptions">See assumptions.</a>
      </footer>
      {touring && <div aria-hidden className="h-60 sm:h-44" />}
      <TourCard />
      <Toast />
    </>
  );
}
