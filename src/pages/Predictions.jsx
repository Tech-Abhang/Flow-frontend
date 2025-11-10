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
  Loader2,
  PieChart,
  BarChart,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { makePredictions, csvTextToFile } from "@/lib/api";
import Navbar from "@/components/Navbar";

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
    const trainingResults = sessionStorage.getItem("trainingResults");
    const skipTraining = sessionStorage.getItem("skipTraining") === "true";

    if (!dataset) {
      navigate("/upload");
      return;
    }

    // If no model info but training results exist, extract from there
    if (!model && trainingResults) {
      const results = JSON.parse(trainingResults);
      const bestModel = results.bestModel;
      const bestModelMetrics = results.models?.[0] || {};

      sessionStorage.setItem("selectedModel", bestModel);
      sessionStorage.setItem("modelMetrics", JSON.stringify(bestModelMetrics));

      setSelectedModel(bestModel);
      setModelMetrics(bestModelMetrics);
      loadPredictions(dataset, bestModel);
      return;
    }

    // Set model info
    if (model && metrics) {
      setSelectedModel(model);
      setModelMetrics(JSON.parse(metrics));
      loadPredictions(dataset, model);
    } else if (skipTraining) {
      // For inference-only mode (no WQI column)
      setSelectedModel("XGBRegressor");
      setModelMetrics({ r2: 0.968, cv_rmse: 2.845 });
      loadPredictions(dataset, "XGBRegressor");
    } else {
      // No model data available
      setError("No trained model found. Please train models first.");
      setIsLoading(false);
    }
  }, []);

  const loadPredictions = async (csvText, modelName) => {
    try {
      const fileName = sessionStorage.getItem("datasetFileName");
      const file = csvTextToFile(csvText, fileName);

      // Get predictions from backend
      const result = await makePredictions(file, modelName);

      if (result.success) {
        // Transform backend response to match frontend expectations
        const backendPredictions = result.sample_predictions || [];
        const backendStats = result.statistics || {};
        const classDistribution = result.class_distribution || {};

        // Transform predictions data - remove redundancy and rename predicted columns
        const transformedPredictions = backendPredictions.map((pred, idx) => {
          const wqi = pred.Predicted_WQI || pred.predicted_wqi || 0;
          const classification = classifyWQI(wqi);

          // Create a clean prediction object
          const cleanPred = {};
          
          // Add all original input features (exclude predicted columns and WQI target)
          Object.keys(pred).forEach((key) => {
            // Skip predicted columns, WQI target, and any duplicates - we'll add them separately with prefix
            if (key !== 'Predicted_WQI' && key !== 'predicted_wqi' && 
                key !== 'WQI_Class' && key !== 'WQI' &&
                key !== 'predicted_WQI' && key !== 'predicted_WQI_Class') {
              cleanPred[key] = pred[key];
            }
          });

          // Add predicted columns with prefix (only these, no duplicates)
          cleanPred['predicted_WQI'] = wqi;
          cleanPred['predicted_WQI_Class'] = pred.WQI_Class || classification.class;

          return {
            id: idx + 1,
            // Internal fields for UI display only (not in CSV)
            predicted_wqi: wqi,
            wqi_class: pred.WQI_Class || classification.class,
            color: classification.color,
            icon: classification.icon,
            isPure: wqi <= 50,
            // All data columns including predicted_WQI and predicted_WQI_Class
            ...cleanPred,
          };
        });

        // Transform statistics
        const transformedStats = {
          total: result.total_predictions || backendPredictions.length,
          pureWater: transformedPredictions.filter((p) => p.isPure).length,
          contaminatedWater: transformedPredictions.filter((p) => !p.isPure)
            .length,
          averageWQI: backendStats.mean_wqi || 0,
          minWQI: backendStats.min_wqi || 0,
          maxWQI: backendStats.max_wqi || 0,
          classDistribution: classDistribution,
        };

        setPredictions(transformedPredictions);
        setStatistics(transformedStats);
        setIsLoading(false);
      } else {
        throw new Error(result.error || "Prediction failed");
      }
    } catch (err) {
      console.error("Backend prediction failed:", err);

      // Check if it's the WQI_Class_Encoded error
      if (
        err.message.includes("WQI_Class_Encoded") ||
        err.message.includes("feature_names mismatch")
      ) {
        setError(
          "The trained model expects different features than your dataset. This usually happens when the dataset structure doesn't match the training data. Please upload the same dataset you used for training, or train a new model with this dataset."
        );
      } else {
        setError(err.message);
      }
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

  const downloadResults = () => {
    if (predictions.length === 0) return;

    // Exclude internal fields and WQI target column
    const excludeFields = [
      "id",
      "icon",
      "color",
      "isPure",
      "WQI", // Target column
      "predicted_wqi", // Use predicted_WQI instead
      "wqi_class", // Use predicted_WQI_Class instead
      "Predicted_WQI", // Use predicted_WQI instead
      "WQI_Class", // Use predicted_WQI_Class instead
    ];

    // Get all columns excluding internal fields and WQI
    const headers = Object.keys(predictions[0]).filter(
      (k) => !excludeFields.includes(k)
    );

    // Create CSV content
    const csvHeaders = headers.join(",");
    const rows = predictions.map((p) =>
      headers
        .map((header) => {
          const value = p[header];
          // Handle null, undefined, NaN, and wrap strings with commas in quotes
          if (
            value === null ||
            value === undefined ||
            (typeof value === "number" && isNaN(value))
          ) {
            return "";
          }
          const strValue = String(value);
          // Wrap in quotes if contains comma, newline, or quote
          return strValue.includes(",") ||
            strValue.includes("\n") ||
            strValue.includes('"')
            ? `"${strValue.replace(/"/g, '""')}"`
            : strValue;
        })
        .join(",")
    );
    const csv = [csvHeaders, ...rows].join("\n");

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
      <>
        <Navbar />
        <div className="min-h-screen bg-linear-to-br from-blue-50 via-white to-cyan-50 flex items-center justify-center px-4">
          <Card className="max-w-md w-full">
            <CardContent className="pt-6 text-center space-y-4">
              {error ? (
                <>
                  <AlertTriangle className="w-12 h-12 text-red-600 mx-auto" />
                  <div>
                    <p className="text-lg font-semibold text-gray-800">
                      Prediction Failed
                    </p>
                    <p className="text-sm text-gray-600 mt-2">{error}</p>
                    <div className="mt-4 space-y-2">
                      <Button
                        onClick={() => navigate("/upload")}
                        className="w-full"
                      >
                        Upload New Dataset
                      </Button>
                      <Button
                        onClick={() => navigate("/model-analysis")}
                        variant="outline"
                        className="w-full"
                      >
                        Train Models
                      </Button>
                    </div>
                  </div>
                </>
              ) : (
                <>
                  <Loader2 className="w-12 h-12 text-blue-600 animate-spin mx-auto" />
                  <div>
                    <p className="text-lg font-semibold text-gray-800">
                      Generating Predictions...
                    </p>
                    <p className="text-sm text-gray-600 mt-2">
                      Analyzing your water quality data
                    </p>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </div>
      </>
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
    <>
      <Navbar />
      <div className="min-h-screen bg-linear-to-br from-blue-50 via-white to-cyan-50 py-12 px-4">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="mb-12"
          >
            <h1 className="text-4xl font-bold text-gray-800 mb-4">
              Water Quality Predictions & Detection
            </h1>
          </motion.div>

          {/* Summary Statistics */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="grid md:grid-cols-4 gap-6 mb-8"
          >
            <Card className="border-2">
              <CardHeader className="pb-0">
                <CardTitle className="text-2xl text-gray-600">
                  Total Samples
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-4xl font-bold text-blue-600">
                  {statistics.total}
                </p>
              </CardContent>
            </Card>

            <Card className="border-2">
              <CardHeader className="pb-0">
                <CardTitle className="text-2xl text-gray-600 flex items-center gap-2">
                  Pure Water
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-4xl font-bold text-green-600">
                  {statistics.pureWater}
                </p>
                <p className="text-sm text-gray-500 mt-1">
                  {((statistics.pureWater / statistics.total) * 100).toFixed(1)}
                  %
                </p>
              </CardContent>
            </Card>

            <Card className="border-2">
              <CardHeader className="pb-0">
                <CardTitle className="text-2xl text-gray-600 flex items-center gap-2">
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

            <Card className="border-2">
              <CardHeader className="pb-0">
                <CardTitle className="text-2xl text-gray-600">
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
                <CardTitle className="flex items-center gap-2 text-3xl">
                  Water Quality Classification Distribution
                </CardTitle>
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
                          <div className="w-full bg-gray-200 rounded-full h-3">
                            <motion.div
                              initial={{ width: 0 }}
                              animate={{ width: `${percentage}%` }}
                              transition={{ duration: 1, delay: idx * 0.1 }}
                              className={`h-3 rounded-full ${
                                colorClass === "green"
                                  ? "bg-green-500/50"
                                  : colorClass === "blue"
                                  ? "bg-blue-500/50"
                                  : colorClass === "yellow"
                                  ? "bg-yellow-500/50"
                                  : colorClass === "orange"
                                  ? "bg-orange-500/50"
                                  : "bg-red-500/50"
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
                    <CardTitle className="flex items-center gap-2 text-3xl">
                      Detailed Predictions
                    </CardTitle>
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
                        <th className="text-left p-3 font-semibold">
                          Sample #
                        </th>
                        <th className="text-center p-3 font-semibold">
                          Predicted WQI
                        </th>
                        <th className="text-center p-3 font-semibold">
                          Predicted WQI Class 
                        </th>
                        <th className="text-center p-3 font-semibold">
                          Water Status
                        </th>
                        {predictions.length > 0 &&
                          Object.keys(predictions[0])
                            .filter(
                              (key) =>
                                ![
                                  "id",
                                  "icon",
                                  "color",
                                  "isPure",
                                  "predicted_wqi",
                                  "wqi_class",
                                  "Predicted_WQI",
                                  "WQI_Class",
                                  "predicted_WQI",
                                  "predicted_WQI_Class",
                                ].includes(key)
                            )
                            .map((column) => (
                              <th
                                key={column}
                                className="text-center p-3 font-semibold"
                              >
                                {column}
                              </th>
                            ))}
                      </tr>
                    </thead>
                    <tbody>
                      {predictions.map((pred) => {
                        const Icon = pred.icon;
                        // Get all data columns (exclude internal fields, old predicted column names, and predicted_WQI/predicted_WQI_Class since they're shown in first 2 columns)
                        const dataColumns = Object.keys(pred).filter(
                          (key) =>
                            ![
                              "id",
                              "icon",
                              "color",
                              "isPure",
                              "predicted_wqi",
                              "wqi_class",
                              "Predicted_WQI",
                              "WQI_Class",
                              "predicted_WQI",
                              "predicted_WQI_Class",
                            ].includes(key)
                        );

                        return (
                          <tr
                            key={pred.id}
                            className="border-b hover:bg-gray-50"
                          >
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

                                  Pure
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-red-100 text-red-800 border border-red-300 text-xs font-semibold">

                                  Contaminated
                                </span>
                              )}
                            </td>
                            {dataColumns.map((column) => {
                              const value = pred[column];
                              // Format the value - handle null, undefined, and NaN
                              const displayValue =
                                value === null ||
                                value === undefined ||
                                (typeof value === "number" && isNaN(value))
                                  ? ""
                                  : typeof value === "number"
                                  ? value.toFixed(2)
                                  : String(value);

                              return (
                                <td
                                  key={column}
                                  className="text-center p-3 text-gray-600"
                                >
                                  {displayValue}
                                </td>
                              );
                            })}
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </div>
    </>
  );
}
