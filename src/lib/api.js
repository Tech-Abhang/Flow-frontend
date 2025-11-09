// API utility functions for backend communication

const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

/**
 * Train multiple ML models on the dataset
 * @param {File} file - CSV file with WQI column for training
 * @returns {Promise} - Model comparison results
 */
export async function trainModels(file) {
  const formData = new FormData();
  formData.append("file", file);

  const response = await fetch(`${API_BASE_URL}/api/train-models`, {
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
export async function makePredictions(file, modelName) {
  const formData = new FormData();
  formData.append("file", file);
  formData.append("modelName", modelName);

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
