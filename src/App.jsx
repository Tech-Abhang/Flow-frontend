import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import "./App.css";
import LandingPage from "./pages/landingpage";
import Dashboard from "./pages/Dashboard";
import UploadDataset from "./pages/UploadDataset";
import ModelAnalysis from "./pages/ModelAnalysis";
import Predictions from "./pages/Predictions";

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/upload" element={<UploadDataset />} />
        <Route path="/model-analysis" element={<ModelAnalysis />} />
        <Route path="/predictions" element={<Predictions />} />
      </Routes>
    </Router>
  );
}

export default App;
