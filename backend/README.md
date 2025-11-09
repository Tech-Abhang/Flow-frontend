# Water Quality Prediction Backend

A Flask-based REST API for water quality prediction using machine learning.

## Features

- 🚀 **Dynamic Dataset Upload**: Upload CSV files for training and prediction
- 🔬 **Feature Engineering**: Automatic feature creation including:
  - Interaction features (pH × Temperature)
  - Ratio features (TDS/Conductivity, Fecal/Total Coliform)
  - Log transformations for skewed distributions
  - Polynomial features (squared terms)
- 🤖 **5 ML Models**:
  - Ridge Regression
  - Support Vector Regression (SVR)
  - Random Forest
  - Gradient Boosting
  - XGBoost
- 📊 **Model Analysis**: Comprehensive metrics including R², RMSE, MAE, MAPE
- 🎯 **Hyperparameter Tuning**: Automated using RandomizedSearchCV
- 🔮 **WQI Prediction**: Predict and classify water quality
- 💾 **Model Persistence**: Save and load trained models

## Installation

### 1. Create Virtual Environment

```bash
cd backend
python -m venv venv

# On macOS/Linux:
source venv/bin/activate

# On Windows:
venv\Scripts\activate
```

### 2. Install Dependencies

```bash
pip3 install -r requirements.txt
```

## Usage

### Start the Server

```bash
python app.py
```

The server will start on `http://localhost:5000`

### API Endpoints

#### 1. Health Check

```bash
GET /api/health
```

#### 2. Train Models

Upload a CSV file with WQI values to train all 5 models.

```bash
POST /api/train
Content-Type: multipart/form-data

Body:
  file: <csv_file>
```

**Required columns in CSV:**

- `Temp` or `Temperature ⁰C`
- `pH`
- `Conductivity` or `Conductivity (μmhos/cm)`
- `Nitrate` or `Nitrate N (mg/L)`
- `Fecal_Coliform` or `Faecal Coliform (MPN/100ml)`
- `Total_Coliform` or `Total Coliform (MPN/100ml)`
- `TDS` or `Total Dissolved Solids (mg/L)`
- `Fluoride` or `Fluoride (mg/L)`
- `WQI` (target variable for training)

**Response:**

```json
{
  "success": true,
  "message": "All models trained successfully",
  "models": [
    {
      "model_name": "XGBoost",
      "cv_rmse": 5.234,
      "test_r2": 0.945,
      "test_mae": 3.456,
      "test_rmse": 4.987,
      "test_mape": 8.23,
      "best_params": {...},
      "model_file": "XGBoost_model_20231109_143022.pkl",
      "feature_importance": {...}
    },
    ...
  ],
  "best_model": "XGBoost"
}
```

#### 3. Make Predictions

Upload a CSV file to get WQI predictions.

```bash
POST /api/predict
Content-Type: multipart/form-data

Body:
  file: <csv_file>
  model_name: XGBoost  (optional, defaults to XGBoost)
```

**Response:**

```json
{
  "success": true,
  "message": "Predictions generated using XGBoost",
  "model_used": "XGBoost",
  "total_predictions": 1500,
  "statistics": {
    "mean_wqi": 45.67,
    "median_wqi": 43.21,
    "min_wqi": 12.34,
    "max_wqi": 98.76,
    "std_wqi": 15.43
  },
  "class_distribution": {
    "Good": 650,
    "Excellent": 320,
    "Poor": 450,
    "Very Poor": 80
  },
  "sample_predictions": [...],
  "output_file": "predictions_XGBoost_20231109_143522.csv"
}
```

#### 4. List Trained Models

```bash
GET /api/models
```

#### 5. Training Status

Check the progress of model training.

```bash
GET /api/training-status
```

#### 6. Analyze Dataset

Analyze a dataset before training/prediction.

```bash
POST /api/analyze-dataset
Content-Type: multipart/form-data

Body:
  file: <csv_file>
```

#### 7. Download Predictions

```bash
GET /api/download-predictions/<filename>
```

## Data Format

### Input CSV Format

Your CSV should have the following columns (with any of these naming variations):

| Standard Name  | Alternative Names                                       |
| -------------- | ------------------------------------------------------- |
| Temp           | Temperature ⁰C, Temperature                             |
| pH             | pH                                                      |
| Conductivity   | Conductivity (μmhos/cm)                                 |
| Nitrate        | Nitrate N (mg/L)                                        |
| Fecal_Coliform | Faecal Coliform (MPN/100ml), Fecal Coliform (MPN/100ml) |
| Total_Coliform | Total Coliform (MPN/100ml)                              |
| TDS            | Total Dissolved Solids (mg/L)                           |
| Fluoride       | Fluoride (mg/L)                                         |
| WQI            | WQI (only for training data)                            |

### WQI Classification

| Range  | Classification          |
| ------ | ----------------------- |
| 0-25   | Excellent               |
| 26-50  | Good                    |
| 51-75  | Poor                    |
| 76-100 | Very Poor               |
| >100   | Unsuitable for Drinking |

## Feature Engineering

The backend automatically creates additional features:

1. **Interaction Features**:

   - `pH_Temp_interaction` = pH × Temperature

2. **Ratio Features**:

   - `TDS_Conductivity_ratio` = TDS / (Conductivity + 1)
   - `Coliform_ratio` = Fecal_Coliform / (Total_Coliform + 1)

3. **Log Transformations**:

   - `Fecal_Coliform_log` = log(Fecal_Coliform + 1)
   - `Total_Coliform_log` = log(Total_Coliform + 1)
   - `TDS_log` = log(TDS + 1)

4. **Polynomial Features**:
   - `pH_squared` = pH²
   - `Temp_squared` = Temperature²

## Model Details

### 1. Ridge Regression

- Linear model with L2 regularization
- Best for baseline comparison
- Requires feature scaling

### 2. Support Vector Regression (SVR)

- Non-linear regression using kernel trick
- Good for complex relationships
- Requires feature scaling

### 3. Random Forest

- Ensemble of decision trees
- Robust to outliers
- Provides feature importance

### 4. Gradient Boosting

- Sequential ensemble method
- High accuracy
- Feature importance available

### 5. XGBoost

- Optimized gradient boosting
- State-of-the-art performance
- Fast training with regularization

## Directory Structure

```
backend/
├── app.py                 # Main Flask application
├── requirements.txt       # Python dependencies
├── README.md             # Documentation
├── .gitignore            # Git ignore rules
├── uploads/              # Uploaded datasets (auto-created)
├── models/               # Trained model files (auto-created)
└── results/              # Prediction results (auto-created)
```

## Error Handling

The API returns appropriate HTTP status codes:

- `200`: Success
- `400`: Bad request (invalid input)
- `404`: Resource not found
- `500`: Server error

Error responses include detailed messages:

```json
{
  "error": "Error message here",
  "traceback": "Full traceback for debugging"
}
```

## Performance Tips

1. **File Size**: Maximum upload size is 50MB
2. **Training Time**: Depends on dataset size and model complexity
   - Ridge/SVR: Fast (seconds)
   - Random Forest: Medium (1-2 minutes)
   - Gradient Boosting: Medium-Slow (2-5 minutes)
   - XGBoost: Medium (1-3 minutes)
3. **Hyperparameter Tuning**: Currently set to 30 iterations per model
4. **Cross-Validation**: 5-fold CV for robust evaluation

## Development

### Debug Mode

The server runs in debug mode by default. For production:

```python
app.run(debug=False, host='0.0.0.0', port=5000)
```

### CORS

CORS is enabled for all origins. Configure in production:

```python
CORS(app, resources={r"/api/*": {"origins": "https://your-frontend.com"}})
```

## Troubleshooting

### Import Errors

Make sure all dependencies are installed:

```bash
pip install -r requirements.txt
```

### Model Not Found

If predictions fail with "model not found", train the models first using `/api/train`

### Memory Issues

For large datasets, consider:

- Reducing `n_iter` in hyperparameter search
- Using a smaller test set
- Processing data in chunks

## License

MIT License
