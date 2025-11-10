import { useState, useEffect } from "react";
import React from "react";
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
  TrendingUp,
  BarChart3,
  Activity,
  Sparkles,
  GitBranch,
  Zap,
  ArrowLeft,
  Download,
  ArrowRight,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import Navbar from "@/components/Navbar";
import {
  ScatterChart,
  Scatter,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
  BarChart,
  Bar,
  Cell,
  Legend,
} from "recharts";

export default function ModelInsights() {
  const [insights, setInsights] = useState(null);
  const [selectedFeature, setSelectedFeature] = useState("pH");
  const navigate = useNavigate();

  useEffect(() => {
    // Get model results from session storage
    const modelMetrics = sessionStorage.getItem("modelMetrics");
    const bestModel = sessionStorage.getItem("selectedModel");
    const trainingResults = sessionStorage.getItem("trainingResults");

    // If no direct model info but training results exist, extract from there
    if ((!modelMetrics || !bestModel) && trainingResults) {
      const results = JSON.parse(trainingResults);
      const extractedModel = results.bestModel;
      const extractedMetrics = results.models?.[0] || {};

      sessionStorage.setItem("selectedModel", extractedModel);
      sessionStorage.setItem("modelMetrics", JSON.stringify(extractedMetrics));

      generateInsights(extractedMetrics, extractedModel);
      return;
    }

    if (!modelMetrics || !bestModel) {
      navigate("/upload");
      return;
    }

    // Generate mock insights data
    generateInsights(JSON.parse(modelMetrics), bestModel);
  }, []);

  const generateInsights = (metrics, modelName) => {
    // Generate Predicted vs Actual data
    const predictedVsActual = Array.from({ length: 100 }, (_, i) => {
      const actual = 20 + Math.random() * 80;
      const noise = (Math.random() - 0.5) * 10;
      return {
        actual: actual,
        predicted: actual + noise,
        residual: noise,
      };
    });

    // Generate Residual plot data
    const residuals = predictedVsActual.map((d, i) => ({
      index: i,
      residual: d.residual,
      predicted: d.predicted,
    }));

    // Generate Error Distribution (histogram bins)
    const errorBins = [];
    const binSize = 2;
    for (let i = -15; i <= 15; i += binSize) {
      const count = residuals.filter(
        (r) => r.residual >= i && r.residual < i + binSize
      ).length;
      errorBins.push({
        bin: `${i.toFixed(0)}`,
        count: count,
        density: count / residuals.length,
      });
    }

    // Generate SHAP values for features
    const features = [
      "pH",
      "TDS",
      "Total_Coliform",
      "Fecal_Coliform",
      "Conductivity",
      "Fluoride",
      "Nitrate",
      "Temp",
    ];

    const shapValues = features.map((feature) => ({
      feature: feature,
      importance: Math.random() * 0.3,
      positiveImpact: Math.random() * 100,
      negativeImpact: -Math.random() * 100,
    }));

    // Generate Partial Dependence Plot data per feature
    const pdpByFeature = features.reduce((acc, feature, idx) => {
      const amplitude = 18 - idx * 1.5;
      const phaseShift = idx * 0.6;
      acc[feature] = Array.from({ length: 50 }, (_, i) => {
        const value = 5 + (i * 4) / 50;
        const pdp =
          30 +
          amplitude * Math.sin((value - 6 + phaseShift) * 1.8) +
          idx * 2;
        return { value, pdp };
      });
      return acc;
    }, {});

    // Generate Correlation Matrix
    const correlationMatrix = features.map((feature1, i) =>
      features.map((feature2, j) => {
        if (i === j) return 1;
        const corr = Math.random() * 0.8 - 0.4;
        return corr;
      })
    );

    setInsights({
      modelName,
      metrics,
      predictedVsActual,
      residuals,
      shapValues,
      pdpByFeature,
      correlationMatrix,
      features,
    });

    setSelectedFeature(features[0]);
  };

  if (!insights) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading insights...</p>
        </div>
      </div>
    );
  }

  const { predictedVsActual, residuals, shapValues, pdpByFeature, correlationMatrix, features } =
    insights;

  // Calculate R² for the scatter plot
  const meanActual =
    predictedVsActual.reduce((sum, d) => sum + d.actual, 0) /
    predictedVsActual.length;
  const ssTotal = predictedVsActual.reduce(
    (sum, d) => sum + Math.pow(d.actual - meanActual, 2),
    0
  );
  const ssResidual = predictedVsActual.reduce(
    (sum, d) => sum + Math.pow(d.residual, 2),
    0
  );
  const r2Score = (1 - ssResidual / ssTotal).toFixed(3);

  return (
    <>
      <Navbar />
      <div className="min-h-screen bg-linear-to-br from-blue-50 via-white to-cyan-50 py-8 px-4">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8"
          >
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-4xl font-bold text-gray-900 mb-2">
                  Advanced Model Insights
                </h1>
                <p className="text-gray-600">
                  Deep dive into model predictions and feature relationships
                </p>
              </div>
              <Button className="bg-blue-600 hover:bg-blue-700">
                <Download className="w-4 h-4 mr-2" />
                Export Report
              </Button>
            </div>
          </motion.div>

          {/* 1. Predicted vs Actual Scatter Plot */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <Card className="mb-6">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-blue-600" />
                  Predicted vs Actual WQI Values
                </CardTitle>
                <CardDescription>
                  Scatter plot showing prediction accuracy (R² = {r2Score})
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-96">
                  <ResponsiveContainer width="100%" height="100%">
                    <ScatterChart
                      margin={{ top: 20, right: 30, left: 20, bottom: 20 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis
                        type="number"
                        dataKey="actual"
                        name="Actual WQI"
                        label={{
                          value: "Actual WQI",
                          position: "insideBottom",
                          offset: -10,
                        }}
                      />
                      <YAxis
                        type="number"
                        dataKey="predicted"
                        name="Predicted WQI"
                        label={{
                          value: "Predicted WQI",
                          angle: -90,
                          position: "insideLeft",
                        }}
                      />
                      <Tooltip
                        cursor={{ strokeDasharray: "3 3" }}
                        content={({ active, payload }) => {
                          if (active && payload && payload.length) {
                            return (
                              <div className="bg-white p-3 border border-gray-200 rounded shadow-lg">
                                <p className="text-sm font-semibold">
                                  Actual: {payload[0].value.toFixed(2)}
                                </p>
                                <p className="text-sm font-semibold">
                                  Predicted: {payload[1].value.toFixed(2)}
                                </p>
                                <p className="text-xs text-gray-600">
                                  Error:{" "}
                                  {(
                                    payload[1].value - payload[0].value
                                  ).toFixed(2)}
                                </p>
                              </div>
                            );
                          }
                          return null;
                        }}
                      />
                      <Scatter
                        name="Predictions"
                        data={predictedVsActual}
                        fill="#3b82f6"
                        fillOpacity={0.6}
                      />
                      {/* Perfect prediction line */}
                      <Line
                        type="linear"
                        dataKey="actual"
                        data={[
                          { actual: 0, predicted: 0 },
                          { actual: 100, predicted: 100 },
                        ]}
                        stroke="#3b82f6"
                        strokeWidth={2}
                        dot={false}
                        strokeDasharray="5 5"
                      />
                    </ScatterChart>
                  </ResponsiveContainer>
                </div>
                <div className="mt-4 grid grid-cols-3 gap-4">
                  <div className="p-3 rounded-lg">
                    <p className="text-xs text-blue-600 font-medium">
                      R² Score
                    </p>
                    <p className="text-2xl font-bold text-blue-700">
                      {r2Score}
                    </p>
                  </div>
                  <div className="p-3 rounded-lg">
                    <p className="text-xs text-blue-600 font-medium">
                      Mean Error
                    </p>
                    <p className="text-2xl font-bold text-blue-700">
                      {(
                        residuals.reduce(
                          (sum, d) => sum + Math.abs(d.residual),
                          0
                        ) / residuals.length
                      ).toFixed(2)}
                    </p>
                  </div>
                  <div className="p-3 rounded-lg">
                    <p className="text-xs text-blue-600 font-medium">
                      Std Dev
                    </p>
                    <p className="text-2xl font-bold text-blue-700">
                      {Math.sqrt(
                        residuals.reduce(
                          (sum, d) => sum + Math.pow(d.residual, 2),
                          0
                        ) / residuals.length
                      ).toFixed(2)}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* 2. Residual Plot */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <Card className="mb-6">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Activity className="w-5 h-5 text-blue-600" />
                  Residual Plot
                </CardTitle>
                <CardDescription>
                  Visualize prediction errors to detect bias and variance
                  patterns
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <ScatterChart
                      margin={{ top: 20, right: 30, left: 20, bottom: 20 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis
                        type="number"
                        dataKey="predicted"
                        name="Predicted Value"
                        label={{
                          value: "Predicted WQI",
                          position: "insideBottom",
                          offset: -10,
                        }}
                      />
                      <YAxis
                        type="number"
                        dataKey="residual"
                        name="Residual"
                        label={{
                          value: "Residual (Error)",
                          angle: -90,
                          position: "insideLeft",
                        }}
                      />
                      <Tooltip
                        cursor={{ strokeDasharray: "3 3" }}
                        content={({ active, payload }) => {
                          if (active && payload && payload.length) {
                            return (
                              <div className="bg-white p-3 border border-gray-200 rounded shadow-lg">
                                <p className="text-sm font-semibold">
                                  Predicted: {payload[0].value.toFixed(2)}
                                </p>
                                <p className="text-sm font-semibold">
                                  Residual: {payload[1].value.toFixed(2)}
                                </p>
                              </div>
                            );
                          }
                          return null;
                        }}
                      />
                      <Scatter
                        name="Residuals"
                        data={residuals}
                        fill="#3b82f6"
                        fillOpacity={0.6}
                      />
                      {/* Zero line */}
                      <Line
                        type="linear"
                        dataKey={() => 0}
                        data={residuals}
                        stroke="#3b82f6"
                        strokeWidth={2}
                        dot={false}
                        strokeDasharray="5 5"
                      />
                    </ScatterChart>
                  </ResponsiveContainer>
                </div>
                <div className="mt-4 p-4 bg-blue-50 rounded-lg">
                  <h4 className="font-semibold text-blue-800 mb-2 text-base">
                    Interpretation
                  </h4>
                  <p className="text-sm text-blue-700">
                    Even scatter around the zero line signals balanced errors. If points flare out on
                    one side, investigate bias or variance jumps.
                  </p>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          <div className="grid md:grid-cols-2 gap-6 mb-6">
            {/* 3. SHAP Values */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3 }}
            >
              <Card className="h-full">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Sparkles className="w-5 h-5 text-blue-600" />
                    SHAP Feature Importance
                  </CardTitle>
                  <CardDescription>
                    How each feature influences predictions
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="h-96">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart
                        data={[...shapValues].sort(
                          (a, b) => b.importance - a.importance
                        )}
                        layout="vertical"
                        margin={{ top: 20, right: 30, left: 80, bottom: 20 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis type="number" />
                        <YAxis type="category" dataKey="feature" width={80} />
                        <Tooltip
                          content={({ active, payload }) => {
                            if (active && payload && payload.length) {
                              return (
                                <div className="bg-white p-3 border border-gray-200 rounded shadow-lg">
                                  <p className="text-sm font-semibold">
                                    {payload[0].payload.feature}
                                  </p>
                                  <p className="text-xs text-gray-600">
                                    SHAP Value: {payload[0].value.toFixed(3)}
                                  </p>
                                </div>
                              );
                            }
                            return null;
                          }}
                        />
                        <Bar dataKey="importance" radius={[0, 8, 8, 0]}>
                          {shapValues.map((entry, index) => (
                            <Cell
                              key={`cell-${index}`}
                              fill={`hsl(${210 + index * 5}, 80%, ${
                                60 - index * 3
                              }%)`}
                            />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="mt-4 p-3 bg-blue-50 rounded-lg">
                    <p className="text-sm text-blue-800">
                      SHAP shows how each input nudges the predicted WQI up or down.
                    </p>
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            {/* 4. Partial Dependence Plot */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.4 }}
            >
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <GitBranch className="w-5 h-5 text-blue-600" />
                    Partial Dependence Plot
                  </CardTitle>
                  <CardDescription>
                    Non-linear relationship between feature and WQI
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {/* Feature Selector */}
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Select Feature
                    </label>
                    <select
                      value={selectedFeature}
                      onChange={(e) => setSelectedFeature(e.target.value)}
                      className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      {features.map((feature) => (
                        <option key={feature} value={feature}>
                          {feature}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart
                        data={pdpByFeature[selectedFeature] || []}
                        margin={{ top: 20, right: 30, left: 20, bottom: 20 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis
                          dataKey="value"
                          label={{
                            value: selectedFeature,
                            position: "insideBottom",
                            offset: -10,
                          }}
                        />
                        <YAxis
                          label={{
                            value: "Partial Dependence",
                            angle: -90,
                            position: "insideLeft",
                          }}
                        />
                        <Tooltip
                          content={({ active, payload }) => {
                            if (active && payload && payload.length) {
                              return (
                                <div className="bg-white p-3 border border-gray-200 rounded shadow-lg">
                                  <p className="text-sm font-semibold">
                                    {selectedFeature}:{" "}
                                    {payload[0].payload.value.toFixed(2)}
                                  </p>
                                  <p className="text-sm">
                                    PD: {payload[0].value.toFixed(2)}
                                  </p>
                                </div>
                              );
                            }
                            return null;
                          }}
                        />
                        <Line
                          type="monotone"
                          dataKey="pdp"
                          stroke="#3b82f6"
                          strokeWidth={2}
                          dot={false}
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="mt-4 p-3 bg-blue-50 rounded-lg">
                    <p className="text-sm text-blue-800">
                      PDP traces how changing this feature alone shifts the expected WQI.
                    </p>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </div>

          {/* 5. Correlation Heatmap */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
          >
            <Card className="mb-6">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Zap className="w-5 h-5 text-blue-600" />
                  Feature Correlation Heatmap
                </CardTitle>
                <CardDescription>
                  Correlation matrix showing relationships between features
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <div className="inline-block min-w-full">
                    <div
                      className="grid gap-1"
                      style={{
                        gridTemplateColumns: `40px repeat(${features.length}, 60px)`,
                      }}
                    >
                      {/* Header row */}
                      <div></div>
                      {features.map((feature) => (
                        <div
                          key={`header-${feature}`}
                          className="text-xs font-medium text-gray-700 text-center transform -rotate-45 origin-bottom-left h-16 flex items-end justify-center"
                        >
                          <span>{feature}</span>
                        </div>
                      ))}

                      {/* Data rows */}
                      {features.map((feature1, i) => (
                        <React.Fragment key={`row-${feature1}-${i}`}>
                          <div
                            key={`label-${feature1}`}
                            className="text-xs font-medium text-gray-700 flex items-center justify-end pr-2"
                          >
                            {feature1}
                          </div>
                          {features.map((feature2, j) => {
                            const correlation = correlationMatrix[i][j];
                            const absCorr = Math.abs(correlation);
                            const hue = correlation > 0 ? 210 : 210; // All blue theme
                            const saturation = absCorr * 80;
                            const lightness = 95 - absCorr * 50;

                            return (
                              <div
                                key={`cell-${i}-${j}`}
                                className="h-12 w-full flex items-center justify-center text-xs font-semibold rounded"
                                style={{
                                  backgroundColor: `hsl(${hue}, ${saturation}%, ${lightness}%)`,
                                  color: absCorr > 0.5 ? "white" : "#374151",
                                }}
                                title={`${feature1} vs ${feature2}: ${correlation.toFixed(
                                  2
                                )}`}
                              >
                                {correlation.toFixed(2)}
                              </div>
                            );
                          })}
                        </React.Fragment>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Legend */}
                <div className="mt-6 flex items-center justify-center gap-4">
                  <div className="flex items-center gap-2">
                    <div className="w-12 h-4 bg-linear-to-r from-blue-100 to-white rounded"></div>
                    <span className="text-xs text-gray-600">
                      Weak Correlation
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-12 h-4 bg-linear-to-r from-blue-300 to-blue-500 rounded"></div>
                    <span className="text-xs text-gray-600">
                      Moderate Correlation
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-12 h-4 bg-linear-to-r from-blue-600 to-blue-900 rounded"></div>
                    <span className="text-xs text-gray-600">
                      Strong Correlation
                    </span>
                  </div>
                </div>

                <div className="mt-4 p-4 bg-blue-50 rounded-lg">
                  <h4 className="font-semibold text-blue-800 mb-2 text-base">
                    Quick Takeaways
                  </h4>
                  <p className="text-sm text-blue-700">
                    Darker cells highlight pairs that move together. Watch for heavily correlated
                    inputs before training linear models.
                  </p>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </div>
    </>
  );
}
