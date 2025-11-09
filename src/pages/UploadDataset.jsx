import { useState } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Upload, FileCheck, AlertCircle, ArrowRight } from "lucide-react";
import { useNavigate } from "react-router-dom";

export default function UploadDataset() {
  const [file, setFile] = useState(null);
  const [fileName, setFileName] = useState("");
  const [filePreview, setFilePreview] = useState(null);
  const [error, setError] = useState("");
  const [dragActive, setDragActive] = useState(false);
  const navigate = useNavigate();

  const requiredColumns = [
    "Temp",
    "pH",
    "Conductivity",
    "Nitrate",
    "Fecal_Coliform",
    "Total_Coliform",
    "TDS",
    "Fluoride",
  ];

  const alternateColumnNames = {
    "Temperature ⁰C": "Temp",
    "Conductivity (μmhos/cm)": "Conductivity",
    "Nitrate N (mg/L)": "Nitrate",
    "Faecal Coliform (MPN/100ml)": "Fecal_Coliform",
    "Total Coliform (MPN/100ml)": "Total_Coliform",
    "Total Dissolved Solids (mg/L)": "TDS",
    "Fluoride (mg/L)": "Fluoride",
  };

  const validateCSV = (csvText) => {
    const lines = csvText.split("\n");
    if (lines.length < 2) {
      throw new Error("CSV file is empty or has no data rows");
    }

    const headers = lines[0].split(",").map((h) => h.trim());

    // Check if columns match (either exact or alternate names)
    const hasRequiredColumns = requiredColumns.every((col) => {
      return (
        headers.includes(col) ||
        Object.keys(alternateColumnNames).some(
          (altName) =>
            headers.includes(altName) && alternateColumnNames[altName] === col
        )
      );
    });

    if (!hasRequiredColumns) {
      const missingCols = requiredColumns.filter(
        (col) =>
          !headers.includes(col) &&
          !Object.keys(alternateColumnNames).some(
            (altName) =>
              headers.includes(altName) && alternateColumnNames[altName] === col
          )
      );
      throw new Error(`Missing required columns: ${missingCols.join(", ")}`);
    }

    // Create preview (first 5 rows)
    const previewData = lines
      .slice(0, 6)
      .map((line) => line.split(",").map((cell) => cell.trim()));

    return {
      headers: previewData[0],
      rows: previewData.slice(1),
      totalRows: lines.length - 1,
    };
  };

  const handleFile = (uploadedFile) => {
    setError("");
    setFile(null);
    setFilePreview(null);

    if (!uploadedFile) return;

    if (!uploadedFile.name.endsWith(".csv")) {
      setError("Please upload a CSV file");
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const text = e.target.result;
        const preview = validateCSV(text);
        setFile(uploadedFile);
        setFileName(uploadedFile.name);
        setFilePreview(preview);
      } catch (err) {
        setError(err.message);
      }
    };
    reader.readAsText(uploadedFile);
  };

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0]);
    }
  };

  const handleProceed = () => {
    if (file && filePreview) {
      // Check if dataset has WQI column (training data) or not (inference data)
      const hasWQI = filePreview.headers.includes("WQI");

      // Store file data in sessionStorage
      const reader = new FileReader();
      reader.onload = (e) => {
        sessionStorage.setItem("uploadedDataset", e.target.result);
        sessionStorage.setItem("datasetFileName", fileName);
        sessionStorage.setItem("hasWQI", hasWQI.toString());

        // Store the actual file object as a data URL for re-uploading to backend
        const fileReader = new FileReader();
        fileReader.onload = (event) => {
          sessionStorage.setItem("uploadedFileData", event.target.result);
          navigate("/model-analysis");
        };
        fileReader.readAsDataURL(file);
      };
      reader.readAsText(file);
    }
  };

  return (
    <div className="min-h-screen bg-linear-to-br from-blue-50 via-white to-cyan-50 py-12 px-4">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center mb-12"
        >
          <h1 className="text-5xl font-bold text-gray-800 mb-4">
            Upload Your Water Quality Dataset
          </h1>
          <p className="text-lg text-gray-600">
            Upload a CSV file with water quality parameters to analyze purity
            and predict WQI
          </p>
        </motion.div>

        {/* Required Columns Info */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
        >
          <Card className="mb-8 border-blue-200">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertCircle className="w-5 h-5 text-blue-600" />
                Required Columns
              </CardTitle>
              <CardDescription>
                Your CSV file must contain the following columns (exact names or
                alternate formats):
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {requiredColumns.map((col) => (
                  <div
                    key={col}
                    className="bg-blue-50 px-3 py-2 rounded-md text-sm font-medium text-blue-700"
                  >
                    {col}
                  </div>
                ))}
              </div>
              <p className="text-xs text-gray-500 mt-4">
                Alternate column names like "Temperature ⁰C", "Conductivity
                (μmhos/cm)", etc. are also accepted
              </p>
            </CardContent>
          </Card>
        </motion.div>

        {/* Upload Area */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.4 }}
        >
          <Card className="mb-8">
            <CardContent className="p-8">
              <div
                className={`border-2 border-dashed rounded-lg p-12 text-center transition-all ${
                  dragActive
                    ? "border-blue-500 bg-blue-50"
                    : "border-gray-300 hover:border-blue-400"
                }`}
                onDragEnter={handleDrag}
                onDragLeave={handleDrag}
                onDragOver={handleDrag}
                onDrop={handleDrop}
              >
                <input
                  type="file"
                  accept=".csv"
                  onChange={(e) => handleFile(e.target.files[0])}
                  className="hidden"
                  id="file-upload"
                />
                <label htmlFor="file-upload" className="cursor-pointer">
                  {!file ? (
                    <div className="flex flex-col items-center gap-4">
                      <Upload className="w-16 h-16 text-gray-400" />
                      <div>
                        <p className="text-lg font-semibold text-gray-700 mb-2">
                          Drop your CSV file here or click to browse
                        </p>
                        <p className="text-sm text-gray-500">
                          Supported format: CSV (Max size: 50MB)
                        </p>
                      </div>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center gap-4">
                      <FileCheck className="w-16 h-16 text-green-500" />
                      <div>
                        <p className="text-lg font-semibold text-gray-700 mb-1">
                          {fileName}
                        </p>
                        <p className="text-sm text-gray-500">
                          {filePreview?.totalRows} rows detected
                        </p>
                        <Button
                          variant="outline"
                          size="sm"
                          className="mt-4"
                          onClick={(e) => {
                            e.preventDefault();
                            setFile(null);
                            setFileName("");
                            setFilePreview(null);
                          }}
                        >
                          Remove File
                        </Button>
                      </div>
                    </div>
                  )}
                </label>
              </div>

              {error && (
                <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-md">
                  <p className="text-sm text-red-700 flex items-center gap-2">
                    <AlertCircle className="w-4 h-4" />
                    {error}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>

        {/* Preview */}
        {filePreview && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <Card className="mb-8">
              <CardHeader>
                <CardTitle>Data Preview</CardTitle>
                <CardDescription>First 5 rows of your dataset</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b">
                        {filePreview.headers.map((header, idx) => (
                          <th
                            key={idx}
                            className="text-left p-2 font-semibold text-gray-700"
                          >
                            {header}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {filePreview.rows.map((row, rowIdx) => (
                        <tr key={rowIdx} className="border-b hover:bg-gray-50">
                          {row.map((cell, cellIdx) => (
                            <td key={cellIdx} className="p-2 text-gray-600">
                              {cell}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* Proceed Button */}
        {file && filePreview && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6 }}
            className="flex justify-center"
          >
            <Button
              size="lg"
              onClick={handleProceed}
              className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-6 text-lg"
            >
              Proceed to Model Analysis
              <ArrowRight className="ml-2 w-5 h-5" />
            </Button>
          </motion.div>
        )}
      </div>
    </div>
  );
}
