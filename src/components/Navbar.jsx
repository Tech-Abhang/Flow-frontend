import { useNavigate, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import {
  Home,
  Upload,
  BarChart3,
  Sparkles,
  Target,
  Activity,
} from "lucide-react";

export default function Navbar() {
  const navigate = useNavigate();
  const location = useLocation();

  const handleNavigation = (path) => {
    // Check if navigating to pages that require trained model
    if (path === "/predictions" || path === "/model-insights") {
      const trainingResults = sessionStorage.getItem("trainingResults");
      const dataset = sessionStorage.getItem("uploadedDataset");

      // If no training results or dataset exists, redirect to upload page
      if (!trainingResults || !dataset) {
        alert("Please upload a dataset and train models first!");
        navigate("/upload");
        return;
      }
    }

    navigate(path);
  };

  const navItems = [
    { path: "/", label: "Home", icon: Home },
    { path: "/upload", label: "Upload", icon: Upload },
    { path: "/model-analysis", label: "Model Comparison", icon: BarChart3 },
    { path: "/model-insights", label: "Advanced Insights", icon: Sparkles },
    { path: "/predictions", label: "Predictions", icon: Target },
    { path: "/dashboard", label: "Dashboard", icon: Activity },
  ];

  return (
    <nav className="bg-white border-b border-gray-200 sticky top-0 z-50 shadow-sm">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center">
              <Activity className="w-6 h-6 text-white" />
            </div>
            <span className="text-xl font-bold text-gray-800">
              Water Quality AI
            </span>
          </div>

          {/* Navigation Items */}
          <div className="flex items-center gap-2">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.path;

              return (
                <Button
                  key={item.path}
                  variant={isActive ? "default" : "ghost"}
                  size="sm"
                  onClick={() => handleNavigation(item.path)}
                  className={`flex items-center gap-2 ${
                    isActive
                      ? "bg-blue-600 text-white hover:bg-blue-700"
                      : "text-gray-700 hover:bg-gray-100"
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span className="hidden md:inline">{item.label}</span>
                </Button>
              );
            })}
          </div>
        </div>
      </div>
    </nav>
  );
}
