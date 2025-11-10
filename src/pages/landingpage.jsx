import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { Droplet, BarChart3, Brain, Shield } from "lucide-react";
import Lottie from "lottie-react";
import dropletAnimation from "@/assets/droplet-animation.json";

export default function LandingPage() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen flex flex-col bg-linear-to-b from-blue-50 to-white text-gray-800">
      {/* Transparent Navbar */}
      <header className="flex justify-between items-center px-8 py-4 bg-transparent fixed top-0 w-full z-10">
        <h1 className="text-2xl font-bold text-blue-600 flex items-center gap-2">
          <Droplet className="w-7 h-7" />
          Flow
        </h1>
        <nav className="space-x-6">
          <Button
            variant="outline"
            onClick={() => navigate("/dashboard")}
            className="mr-2"
          >
            Dashboard
          </Button>
          <Button
            className="bg-blue-600 text-white hover:bg-blue-700 transition"
            onClick={() => navigate("/upload")}
          >
            Get Started
          </Button>
        </nav>
      </header>

      {/* Hero Section */}
      <section className="flex flex-col md:flex-row items-center justify-between px-8 md:px-20 py-40">
        {/* Left side text */}
        <motion.div
          initial={{ opacity: 0, x: -40 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.8 }}
          className="md:w-1/2"
        >
          <h1 className="text-6xl md:text-7xl font-extrabold mb-8 leading-tight">
            Water <br /> Purity <span className="text-blue-600">Detection</span>
          </h1>
          <p className="text-lg text-gray-600 mb-8 max-w-lg">
            Detect . Analyze . Protect
          </p>
          <p className="text-base text-gray-500 mb-8 max-w-lg">
            Upload your water quality dataset and let our AI-powered system
            analyze, predict WQI, and classify water purity using advanced
            machine learning models.
          </p>
          <div className="space-x-4">
            <Button
              size="lg"
              onClick={() => navigate("/upload")}
              className="bg-blue-600 hover:bg-blue-700"
            >
              Get Started
            </Button>
          </div>
        </motion.div>

        {/* Right side — Lottie Animation */}
        <motion.div
          initial={{ opacity: 0, x: 40 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.8, delay: 0.2 }}
          className="hidden md:flex md:w-1/2 items-center justify-center"
        >
          <div className="w-full max-w-lg">
            <Lottie
              animationData={dropletAnimation}
              loop={true}
              autoplay={true}
              style={{ width: "100%", height: "100%" }}
            />
          </div>
        </motion.div>
      </section>

      {/* Features Section */}
      {/* <section id="features" className="px-8 md:px-20 py-20 bg-white">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <h2 className="text-4xl font-bold text-gray-800 mb-4">
            Powerful Features
          </h2>
          <p className="text-lg text-gray-600">
            Everything you need for comprehensive water quality analysis
          </p>
        </motion.div>

        <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            viewport={{ once: true }}
            className="p-6 bg-blue-50 rounded-lg border border-blue-200"
          >
            <Brain className="w-12 h-12 text-blue-600 mb-4" />
            <h3 className="text-xl font-semibold text-gray-800 mb-3">
              AI Model Selection
            </h3>
            <p className="text-gray-600">
              Automatically trains and compares multiple ML models (XGBoost,
              Random Forest, Gradient Boosting, SVR, Ridge) to select the best
              performer for your data.
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            viewport={{ once: true }}
            className="p-6 bg-green-50 rounded-lg border border-green-200"
          >
            <BarChart3 className="w-12 h-12 text-green-600 mb-4" />
            <h3 className="text-xl font-semibold text-gray-800 mb-3">
              Detailed Analysis
            </h3>
            <p className="text-gray-600">
              Get comprehensive insights with feature importance, model metrics,
              R² scores, RMSE, MAE, and visual charts to understand predictions.
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            viewport={{ once: true }}
            className="p-6 bg-purple-50 rounded-lg border border-purple-200"
          >
            <Shield className="w-12 h-12 text-purple-600 mb-4" />
            <h3 className="text-xl font-semibold text-gray-800 mb-3">
              Water Quality Detection
            </h3>
            <p className="text-gray-600">
              Predict WQI values and classify water as Excellent, Good, Poor,
              Very Poor, or Unsuitable. Detect contaminated samples instantly.
            </p>
          </motion.div>
        </div>
      </section> */}
    </div>
  );
}
