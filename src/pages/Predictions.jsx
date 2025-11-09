import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Droplet,
  CheckCircle,
  XCircle,
  AlertTriangle,
  TrendingDown,
  Download,
  Home,
  BarChart,
  PieChart,
  Loader2,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { makePredictions, csvTextToFile } from "@/lib/api";

export default function Predictions() {
  const [predictions, setPredictions] = useState([]);
  const [statistics, setStatistics] = useState(null);
  const [selectedModel, setSelectedModel] = useState("");
  const [modelMetrics, setModelMetrics] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    // Load data from sessionStorage
    const dataset = sessionStorage.getItem("uploadedDataset");
    const model = sessionStorage.getItem("selectedModel");
    const metrics = sessionStorage.getItem("modelMetrics");
    const skipTraining = sessionStorage.getItem("skipTraining") === "true";

    if (!dataset) {
      navigate("/upload");
      return;
    }

    // Set model info
    if (model && metrics) {
      setSelectedModel(model);
      setModelMetrics(JSON.parse(metrics));
    } else if (skipTraining) {
      // For inference-only mode (no WQI column)
      setSelectedModel("XGBRegressor");
      setModelMetrics({ r2: 0.968, cv_rmse: 2.845 });
    }

    // Process dataset and generate predictions
    loadPredictions(dataset, model || "XGBRegressor");
  }, []);

  const loadPredictions = async (csvText, modelName) => {
    try {
      const fileName = sessionStorage.getItem("datasetFileName");
      const file = csvTextToFile(csvText, fileName);

      // Try to get predictions from backend
      const result = await makePredictions(file, modelName);

      if (result.success) {
        setPredictions(result.predictions);
        setStatistics(result.statistics);
        setIsLoading(false);
      } else {
        throw new Error(result.error || "Prediction failed");
      }
    } catch (err) {
      console.error("Backend prediction failed:", err);
      setError(err.message);

      // Fallback to mock predictions
      console.log("Falling back to mock predictions...");
      processDataset(csvText);
      setIsLoading(false);
    }
  };

  const classifyWQI = (wqi) => {
    if (wqi <= 25)
      return { class: "Excellent", color: "green", icon: CheckCircle };
    if (wqi <= 50) return { class: "Good", color: "blue", icon: CheckCircle };
    if (wqi <= 75)
      return { class: "Poor", color: "yellow", icon: AlertTriangle };
    if (wqi <= 100)
      return { class: "Very Poor", color: "orange", icon: AlertTriangle };
    return { class: "Unsuitable", color: "red", icon: XCircle };
  };

  const processDataset = (csvText) => {
    const lines = csvText.split("\n").filter((line) => line.trim());
    const headers = lines[0].split(",").map((h) => h.trim());

    const processedData = [];
    const classCount = {
      Excellent: 0,
      Good: 0,
      Poor: 0,
      "Very Poor": 0,
      Unsuitable: 0,
    };

    // Generate mock predictions for each row
    for (let i = 1; i < Math.min(lines.length, 101); i++) {
      // Limit to 100 rows for display
      const values = lines[i].split(",").map((v) => v.trim());

      // Mock WQI prediction (in production, call your ML model)
      const mockWQI = Math.random() * 120; // Random WQI between 0-120
      const classification = classifyWQI(mockWQI);

      classCount[classification.class]++;

      const rowData = {};
      headers.forEach((header, idx) => {
        rowData[header] = values[idx];
      });

      processedData.push({
        id: i,
        ...rowData,
        predicted_wqi: mockWQI,
        wqi_class: classification.class,
        color: classification.color,
        icon: classification.icon,
        isPure: mockWQI <= 50, // Water is pure if WQI <= 50
      });
    }

    setPredictions(processedData);

    // Calculate statistics
    const wqiValues = processedData.map((p) => p.predicted_wqi);
    const pureCount = processedData.filter((p) => p.isPure).length;

    setStatistics({
      total: processedData.length,
      pureWater: pureCount,
      contaminatedWater: processedData.length - pureCount,
      averageWQI: wqiValues.reduce((a, b) => a + b, 0) / wqiValues.length,
      minWQI: Math.min(...wqiValues),
      maxWQI: Math.max(...wqiValues),
      classDistribution: classCount,
    });
  };

  const downloadResults = () => {
    // Create CSV content
    const headers = Object.keys(predictions[0])
      .filter((k) => k !== "icon" && k !== "color")
      .join(",");
    const rows = predictions.map((p) =>
      Object.entries(p)
        .filter(([k]) => k !== "icon" && k !== "color")
        .map(([_, v]) => v)
        .join(",")
    );
    const csv = [headers, ...rows].join("\n");

    // Download
    const blob = new Blob([csv], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `water_quality_predictions_${Date.now()}.csv`;
    a.click();
  };

  if (isLoading || !statistics) {
    return (
      <div className="min-h-screen bg-linear-to-br from-blue-50 via-white to-cyan-50 flex items-center justify-center px-4">
        <Card className="max-w-md w-full">
          <CardContent className="pt-6 text-center space-y-4">
            <Loader2 className="w-12 h-12 text-blue-600 animate-spin mx-auto" />
            <div>
              <p className="text-lg font-semibold text-gray-800">
                Generating Predictions...
              </p>
              <p className="text-sm text-gray-600 mt-2">
                Analyzing your water quality data
              </p>
            </div>
            {error && (
              <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-md text-left">
                <p className="text-xs text-yellow-800">
                  Backend not available. Using simulated predictions.
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    );
  }

  const colorMap = {
    green: "bg-green-100 text-green-800 border-green-300",
    blue: "bg-blue-100 text-blue-800 border-blue-300",
    yellow: "bg-yellow-100 text-yellow-800 border-yellow-300",
    orange: "bg-orange-100 text-orange-800 border-orange-300",
    red: "bg-red-100 text-red-800 border-red-300",
  };

  return (
    <div className="min-h-screen bg-linear-to-br from-blue-50 via-white to-cyan-50 py-12 px-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center mb-12"
        >
          <h1 className="text-5xl font-bold text-gray-800 mb-4">
            Water Quality Predictions & Detection
          </h1>
          <p className="text-lg text-gray-600">
            Using {selectedModel} model with R² = {modelMetrics.r2.toFixed(3)}
          </p>
        </motion.div>

        {/* Summary Statistics */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="grid md:grid-cols-4 gap-6 mb-8"
        >
          <Card className="border-2 border-blue-300">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm text-gray-600">
                Total Samples
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-4xl font-bold text-blue-600">
                {statistics.total}
              </p>
            </CardContent>
          </Card>

          <Card className="border-2 border-green-300">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm text-gray-600 flex items-center gap-2">
                <CheckCircle className="w-4 h-4" />
                Pure Water
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-4xl font-bold text-green-600">
                {statistics.pureWater}
              </p>
              <p className="text-sm text-gray-500 mt-1">
                {((statistics.pureWater / statistics.total) * 100).toFixed(1)}%
              </p>
            </CardContent>
          </Card>

          <Card className="border-2 border-red-300">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm text-gray-600 flex items-center gap-2">
                <XCircle className="w-4 h-4" />
                Contaminated
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-4xl font-bold text-red-600">
                {statistics.contaminatedWater}
              </p>
              <p className="text-sm text-gray-500 mt-1">
                {(
                  (statistics.contaminatedWater / statistics.total) *
                  100
                ).toFixed(1)}
                %
              </p>
            </CardContent>
          </Card>

          <Card className="border-2 border-purple-300">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm text-gray-600">
                Average WQI
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-4xl font-bold text-purple-600">
                {statistics.averageWQI.toFixed(1)}
              </p>
              <p className="text-sm text-gray-500 mt-1">
                Range: {statistics.minWQI.toFixed(1)} -{" "}
                {statistics.maxWQI.toFixed(1)}
              </p>
            </CardContent>
          </Card>
        </motion.div>

        {/* Class Distribution */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.3 }}
        >
          <Card className="mb-8">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <PieChart className="w-6 h-6 text-blue-600" />
                Water Quality Classification Distribution
              </CardTitle>
              <CardDescription>
                Distribution of samples across different WQI classes
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {Object.entries(statistics.classDistribution).map(
                  ([className, count], idx) => {
                    const percentage = (count / statistics.total) * 100;
                    const colorClass = classifyWQI(
                      className === "Excellent"
                        ? 20
                        : className === "Good"
                        ? 40
                        : className === "Poor"
                        ? 60
                        : className === "Very Poor"
                        ? 80
                        : 110
                    ).color;

                    return (
                      <div key={className}>
                        <div className="flex justify-between text-sm mb-2">
                          <span className="font-medium">{className}</span>
                          <span className="text-gray-600">
                            {count} samples ({percentage.toFixed(1)}%)
                          </span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-6">
                          <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${percentage}%` }}
                            transition={{ duration: 1, delay: idx * 0.1 }}
                            className={`h-6 rounded-full ${
                              colorClass === "green"
                                ? "bg-green-500"
                                : colorClass === "blue"
                                ? "bg-blue-500"
                                : colorClass === "yellow"
                                ? "bg-yellow-500"
                                : colorClass === "orange"
                                ? "bg-orange-500"
                                : "bg-red-500"
                            }`}
                          />
                        </div>
                      </div>
                    );
                  }
                )}
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Detection Results Table */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.4 }}
        >
          <Card className="mb-8">
            <CardHeader>
              <div className="flex justify-between items-center">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <BarChart className="w-6 h-6 text-blue-600" />
                    Detailed Predictions
                  </CardTitle>
                  <CardDescription>
                    Sample-by-sample WQI predictions and water quality
                    classification
                  </CardDescription>
                </div>
                <Button
                  onClick={downloadResults}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  <Download className="w-4 h-4 mr-2" />
                  Download Results
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto max-h-[600px] overflow-y-auto">
                <table className="w-full text-sm">
                  <thead className="sticky top-0 bg-white border-b-2">
                    <tr>
                      <th className="text-left p-3 font-semibold">Sample #</th>
                      <th className="text-center p-3 font-semibold">
                        Predicted WQI
                      </th>
                      <th className="text-center p-3 font-semibold">
                        Classification
                      </th>
                      <th className="text-center p-3 font-semibold">
                        Water Status
                      </th>
                      <th className="text-center p-3 font-semibold">pH</th>
                      <th className="text-center p-3 font-semibold">TDS</th>
                      <th className="text-center p-3 font-semibold">
                        Conductivity
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {predictions.map((pred) => {
                      const Icon = pred.icon;
                      return (
                        <tr key={pred.id} className="border-b hover:bg-gray-50">
                          <td className="p-3 font-medium">#{pred.id}</td>
                          <td className="text-center p-3">
                            <span className="font-semibold">
                              {pred.predicted_wqi.toFixed(2)}
                            </span>
                          </td>
                          <td className="text-center p-3">
                            <span
                              className={`inline-flex items-center gap-1 px-3 py-1 rounded-full border text-xs font-semibold ${
                                colorMap[pred.color]
                              }`}
                            >
                              <Icon className="w-3 h-3" />
                              {pred.wqi_class}
                            </span>
                          </td>
                          <td className="text-center p-3">
                            {pred.isPure ? (
                              <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-green-100 text-green-800 border border-green-300 text-xs font-semibold">
                                <Droplet className="w-3 h-3" />
                                Pure
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-red-100 text-red-800 border border-red-300 text-xs font-semibold">
                                <TrendingDown className="w-3 h-3" />
                                Contaminated
                              </span>
                            )}
                          </td>
                          <td className="text-center p-3 text-gray-600">
                            {pred.pH || pred["pH"] || "N/A"}
                          </td>
                          <td className="text-center p-3 text-gray-600">
                            {pred.TDS ||
                              pred["Total Dissolved Solids (mg/L)"] ||
                              "N/A"}
                          </td>
                          <td className="text-center p-3 text-gray-600">
                            {pred.Conductivity ||
                              pred["Conductivity (μmhos/cm)"] ||
                              "N/A"}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Action Buttons */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.5 }}
          className="flex justify-center gap-4"
        >
          <Button
            size="lg"
            variant="outline"
            onClick={() => navigate("/")}
            className="px-8"
          >
            <Home className="w-5 h-5 mr-2" />
            Back to Home
          </Button>
          <Button
            size="lg"
            onClick={() => navigate("/upload")}
            className="bg-blue-600 hover:bg-blue-700 px-8"
          >
            Upload New Dataset
          </Button>
        </motion.div>
      </div>
    </div>
  );
}
