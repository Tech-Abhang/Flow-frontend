import { useState, useEffect } from "react";
import { Card } from "../components/ui/card";
import {
  Activity,
  TrendingUp,
  Droplets,
  AlertCircle,
  CheckCircle2,
  Clock,
} from "lucide-react";
import { getDashboardSummary } from "../lib/api";
import Navbar from "../components/Navbar";

export default function Dashboard() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [dashboardData, setDashboardData] = useState(null);

  // Function to fetch dashboard data
  const fetchDashboard = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await getDashboardSummary();
      setDashboardData(response.summary);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboard();
    // Auto-refresh every 30 seconds
    const interval = setInterval(fetchDashboard, 30000);
    return () => clearInterval(interval);
  }, []);

  if (loading && !dashboardData) {
    return (
      <>
        <Navbar />
        <div className="min-h-screen bg-linear-to-br from-blue-50 via-white to-cyan-50 p-6">
          <div className="max-w-7xl mx-auto">
            <div className="flex items-center justify-center h-96">
              <div className="text-center">
                <Activity className="w-12 h-12 animate-spin text-blue-600 mx-auto mb-4" />
                <p className="text-gray-600">Loading dashboard...</p>
              </div>
            </div>
          </div>
        </div>
      </>
    );
  }

  if (error && !dashboardData) {
    return (
      <>
        <Navbar />
        <div className="min-h-screen bg-linear-to-br from-blue-50 via-white to-cyan-50 p-6">
          <div className="max-w-7xl mx-auto">
            <Card className="p-8 text-center">
              <AlertCircle className="w-16 h-16 text-amber-500 mx-auto mb-4" />
              <h2 className="text-2xl font-bold text-gray-800 mb-2">
                Welcome to Water Quality Dashboard
              </h2>
              <p className="text-gray-600 mb-6">
                No data available yet. Start by training models with your
                dataset.
              </p>
              <div className="flex gap-4 justify-center">
                <a
                  href="/upload"
                  className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Upload Dataset & Train Models
                </a>
              </div>
            </Card>
          </div>
        </div>
      </>
    );
  }

  const {
    latest_training,
    latest_prediction,
    total_models,
    total_training_sessions,
  } = dashboardData || {};

  // Get the best model from latest training
  const bestModel = latest_training?.models_trained?.[0] || {};
  const allModels = latest_training?.models_trained || [];

  // Calculate quality distribution if prediction data exists
  const classDistribution = latest_prediction?.class_distribution || {};
  const totalSamples =
    Object.values(classDistribution).reduce((a, b) => a + b, 0) || 0;

  // Format timestamp
  const formatTimestamp = (timestamp) => {
    if (!timestamp) return "N/A";
    const date = new Date(timestamp);
    return date.toLocaleString();
  };

  return (
    <>
      <Navbar />
      <div className="min-h-screen bg-linear-to-br from-blue-50 via-white to-cyan-50 p-6">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-4xl font-bold text-gray-800 mb-2">
                  Water Quality Dashboard
                </h1>
                <p className="text-gray-600">
                  Real-time insights and model performance
                </p>
              </div>
              <button
                onClick={fetchDashboard}
                className="px-4 py-2 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors flex items-center gap-2"
                disabled={loading}
              >
                <Activity
                  className={`w-4 h-4 ${loading ? "animate-spin" : ""}`}
                />
                Refresh
              </button>
            </div>
            {latest_training && (
              <div className="mt-4 flex items-center gap-2 text-sm text-gray-500">
                <Clock className="w-4 h-4" />
                Last updated: {formatTimestamp(latest_training.timestamp)}
              </div>
            )}
          </div>

          {/* Stats Overview */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <Card className="p-6 bg-white">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 mb-1">Total Models</p>
                  <p className="text-3xl font-bold text-blue-600">
                    {total_models || 0}
                  </p>
                </div>
                <Activity className="w-12 h-12 text-blue-600 opacity-20" />
              </div>
            </Card>

            <Card className="p-6 bg-white">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 mb-1">
                    Training Sessions
                  </p>
                  <p className="text-3xl font-bold text-purple-600">
                    {total_training_sessions || 0}
                  </p>
                </div>
                <TrendingUp className="w-12 h-12 text-purple-600 opacity-20" />
              </div>
            </Card>

            <Card className="p-6 bg-white">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 mb-1">Predictions Made</p>
                  <p className="text-3xl font-bold text-green-600">
                    {latest_prediction?.total_predictions || 0}
                  </p>
                </div>
                <Droplets className="w-12 h-12 text-green-600 opacity-20" />
              </div>
            </Card>

            <Card className="p-6 bg-white">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 mb-1">Best Model R²</p>
                  <p className="text-3xl font-bold text-amber-600">
                    {bestModel.test_r2 ? bestModel.test_r2.toFixed(3) : "N/A"}
                  </p>
                </div>
                <CheckCircle2 className="w-12 h-12 text-amber-600 opacity-20" />
              </div>
            </Card>
          </div>

          {/* Model Performance */}
          {latest_training && (
            <Card className="p-6 mb-8 bg-white">
              <h2 className="text-2xl font-bold text-gray-800 mb-6 flex items-center gap-2">
                <TrendingUp className="w-6 h-6 text-blue-600" />
                Model Performance Comparison
              </h2>

              <div className="mb-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-blue-700 font-medium">
                      Best Model
                    </p>
                    <p className="text-2xl font-bold text-blue-900">
                      {latest_training.best_model}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-blue-700">Dataset</p>
                    <p className="text-lg font-semibold text-blue-900">
                      {latest_training.train_size + latest_training.test_size}{" "}
                      samples
                    </p>
                    <p className="text-xs text-blue-600">
                      Train: {latest_training.train_size} | Test:{" "}
                      {latest_training.test_size}
                    </p>
                  </div>
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b-2 border-gray-200">
                      <th className="text-left py-3 px-4 font-semibold text-gray-700">
                        Model
                      </th>
                      <th className="text-center py-3 px-4 font-semibold text-gray-700">
                        R² Score
                      </th>
                      <th className="text-center py-3 px-4 font-semibold text-gray-700">
                        RMSE
                      </th>
                      <th className="text-center py-3 px-4 font-semibold text-gray-700">
                        MAE
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {allModels.map((model, idx) => (
                      <tr
                        key={model.model_name}
                        className={`border-b border-gray-100 hover:bg-gray-50 ${
                          idx === 0 ? "bg-green-50" : ""
                        }`}
                      >
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-2">
                            <span className="font-medium text-gray-800">
                              {model.model_name}
                            </span>
                            {idx === 0 && (
                              <span className="px-2 py-1 bg-green-100 text-green-700 text-xs rounded-full">
                                Best
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="text-center py-3 px-4 font-semibold text-blue-600">
                          {model.test_r2?.toFixed(3) || "N/A"}
                        </td>
                        <td className="text-center py-3 px-4 text-gray-700">
                          {model.test_rmse?.toFixed(3) || "N/A"}
                        </td>
                        <td className="text-center py-3 px-4 text-gray-700">
                          {model.test_mae?.toFixed(3) || "N/A"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>
          )}

          {/* Prediction Results */}
          {latest_prediction && (
            <Card className="p-6 bg-white">
              <h2 className="text-2xl font-bold text-gray-800 mb-6 flex items-center gap-2">
                <Droplets className="w-6 h-6 text-green-600" />
                Latest Prediction Results
              </h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Statistics */}
                <div>
                  <h3 className="text-lg font-semibold text-gray-700 mb-4">
                    WQI Statistics
                  </h3>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                      <span className="text-gray-600">Mean WQI:</span>
                      <span className="font-bold text-gray-800">
                        {latest_prediction.statistics.mean_wqi.toFixed(2)}
                      </span>
                    </div>
                    <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                      <span className="text-gray-600">Median WQI:</span>
                      <span className="font-bold text-gray-800">
                        {latest_prediction.statistics.median_wqi.toFixed(2)}
                      </span>
                    </div>
                    <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                      <span className="text-gray-600">Range:</span>
                      <span className="font-bold text-gray-800">
                        {latest_prediction.statistics.min_wqi.toFixed(2)} -{" "}
                        {latest_prediction.statistics.max_wqi.toFixed(2)}
                      </span>
                    </div>
                    <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                      <span className="text-gray-600">Std Dev:</span>
                      <span className="font-bold text-gray-800">
                        {latest_prediction.statistics.std_wqi.toFixed(2)}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Class Distribution */}
                <div>
                  <h3 className="text-lg font-semibold text-gray-700 mb-4">
                    Water Quality Distribution
                  </h3>
                  <div className="space-y-3">
                    {Object.entries(classDistribution).map(
                      ([className, count]) => {
                        const percentage = (
                          (count / totalSamples) *
                          100
                        ).toFixed(1);
                        const colorMap = {
                          Excellent: "bg-green-500",
                          Good: "bg-blue-500",
                          Poor: "bg-yellow-500",
                          "Very Poor": "bg-orange-500",
                          "Unsuitable for Drinking": "bg-red-500",
                        };
                        return (
                          <div key={className} className="space-y-1">
                            <div className="flex justify-between text-sm">
                              <span className="font-medium text-gray-700">
                                {className}
                              </span>
                              <span className="text-gray-600">
                                {count} ({percentage}%)
                              </span>
                            </div>
                            <div className="w-full bg-gray-200 rounded-full h-2">
                              <div
                                className={`h-2 rounded-full ${
                                  colorMap[className] || "bg-gray-500"
                                }`}
                                style={{ width: `${percentage}%` }}
                              />
                            </div>
                          </div>
                        );
                      }
                    )}
                  </div>
                </div>
              </div>

              <div className="mt-6 p-4 bg-gray-50 rounded-lg">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Model Used</p>
                    <p className="text-lg font-bold text-gray-800">
                      {latest_prediction.model_used}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-gray-600">Predicted At</p>
                    <p className="text-sm font-medium text-gray-700">
                      {formatTimestamp(latest_prediction.timestamp)}
                    </p>
                  </div>
                </div>
              </div>
            </Card>
          )}

          {/* Call to Action if no data */}
          {!latest_training && !latest_prediction && (
            <Card className="p-8 text-center bg-white">
              <Droplets className="w-16 h-16 text-blue-500 mx-auto mb-4 opacity-50" />
              <h3 className="text-2xl font-bold text-gray-800 mb-2">
                Ready to get started?
              </h3>
              <p className="text-gray-600 mb-6">
                Upload your water quality dataset to train models and make
                predictions.
              </p>
              <div className="flex gap-4 justify-center">
                <a
                  href="/upload"
                  className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Upload Dataset
                </a>
                <a
                  href="/model-analysis"
                  className="px-6 py-3 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  View Models
                </a>
              </div>
            </Card>
          )}
        </div>
      </div>
    </>
  );
}
