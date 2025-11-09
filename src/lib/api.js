// API utility functions for backend communication

const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

/**
 * Check if backend is healthy
 * @returns {Promise} - Health status
 */
export async function checkHealth() {
  const response = await fetch(`${API_BASE_URL}/api/health`);

  if (!response.ok) {
    throw new Error("Backend server is not responding");
  }

  return response.json();
}

/**
 * Analyze dataset before training or prediction
 * @param {File} file - CSV file to analyze
 * @returns {Promise} - Dataset analysis
 */
export async function analyzeDataset(file) {
  const formData = new FormData();
  formData.append("file", file);

  const response = await fetch(`${API_BASE_URL}/api/analyze-dataset`, {
    method: "POST",
    body: formData,
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || "Failed to analyze dataset");
  }

  return response.json();
}

/**
 * Train multiple ML models on the dataset
 * @param {File} file - CSV file with WQI column for training
 * @returns {Promise} - Model comparison results
 */
export async function trainModels(file) {
  const formData = new FormData();
  formData.append("file", file);

  const response = await fetch(`${API_BASE_URL}/api/train`, {
    method: "POST",
    body: formData,
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || "Failed to train models");
  }

  return response.json();
}

/**
 * Make predictions on new dataset
 * @param {File} file - CSV file for predictions
 * @param {string} modelName - Name of the trained model to use
 * @returns {Promise} - Prediction results
 */
export async function makePredictions(file, modelName = "XGBoost") {
  const formData = new FormData();
  formData.append("file", file);
  formData.append("model_name", modelName);

  const response = await fetch(`${API_BASE_URL}/api/predict`, {
    method: "POST",
    body: formData,
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || "Failed to make predictions");
  }

  return response.json();
}

/**
 * Get list of all trained models
 * @returns {Promise} - List of models
 */
export async function listModels() {
  const response = await fetch(`${API_BASE_URL}/api/models`);

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || "Failed to fetch models");
  }

  return response.json();
}

/**
 * Get training status
 * @returns {Promise} - Training status
 */
export async function getTrainingStatus() {
  const response = await fetch(`${API_BASE_URL}/api/training-status`);

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || "Failed to fetch training status");
  }

  return response.json();
}

/**
 * Download prediction results
 * @param {string} filename - Name of the results file
 * @returns {Promise} - File blob
 */
export async function downloadPredictions(filename) {
  const response = await fetch(
    `${API_BASE_URL}/api/download-predictions/${filename}`
  );

  if (!response.ok) {
    throw new Error("Failed to download predictions");
  }

  return response.blob();
}

/**
 * Get dashboard summary with latest training and prediction data
 * @returns {Promise} - Dashboard summary
 */
export async function getDashboardSummary() {
  const response = await fetch(`${API_BASE_URL}/api/dashboard/summary`);

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || "Failed to fetch dashboard summary");
  }

  return response.json();
}

/**
 * Get latest training results for dashboard
 * @returns {Promise} - Latest training data
 */
export async function getLatestTraining() {
  const response = await fetch(`${API_BASE_URL}/api/dashboard/latest-training`);

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || "No training data available");
  }

  return response.json();
}

/**
 * Get latest prediction results for dashboard
 * @returns {Promise} - Latest prediction data
 */
export async function getLatestPrediction() {
  const response = await fetch(
    `${API_BASE_URL}/api/dashboard/latest-prediction`
  );

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || "No prediction data available");
  }

  return response.json();
}

/**
 * Get training history for charts
 * @returns {Promise} - Training history
 */
export async function getTrainingHistory() {
  const response = await fetch(
    `${API_BASE_URL}/api/dashboard/training-history`
  );

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || "Failed to fetch training history");
  }

  return response.json();
}

/**
 * Parse CSV text into structured data
 * @param {string} csvText - CSV content as string
 * @returns {Object} - Parsed data with headers and rows
 */
export function parseCSV(csvText) {
  const lines = csvText.split("\n").filter((line) => line.trim());
  if (lines.length < 2) {
    throw new Error("CSV file is empty or has no data rows");
  }

  const headers = lines[0].split(",").map((h) => h.trim());
  const rows = lines.slice(1).map((line) => {
    const values = line.split(",").map((v) => v.trim());
    const row = {};
    headers.forEach((header, idx) => {
      row[header] = values[idx];
    });
    return row;
  });

  return { headers, rows, totalRows: rows.length };
}

/**
 * Convert CSV text to File object
 * @param {string} csvText - CSV content
 * @param {string} filename - Name for the file
 * @returns {File} - File object
 */
export function csvTextToFile(csvText, filename = "dataset.csv") {
  const blob = new Blob([csvText], { type: "text/csv" });
  return new File([blob], filename, { type: "text/csv" });
}
