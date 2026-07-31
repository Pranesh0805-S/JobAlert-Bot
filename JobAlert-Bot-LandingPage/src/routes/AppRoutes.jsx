import { Routes, Route } from "react-router-dom";
import LandingPage from "../pages/LandingPage.jsx";
import JobFinderPage from "../pages/JobFinderPage.jsx";

export default function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<LandingPage />} />
      <Route path="/job-finder" element={<JobFinderPage />} />
    </Routes>
  );
}
