# Water Quality Prediction & Classification Pipeline Explanation

## Overview
This document explains how the system performs **prediction** (regression) and **classification** for water quality assessment using machine learning models.

---

## 1. **PREDICTION vs CLASSIFICATION**

### Prediction (Regression)
- **Task**: Predict a continuous **WQI (Water Quality Index)** value (e.g., 45.67, 78.23)
- **Model Type**: Regression models (predict numeric values)
- **Output**: A single numeric WQI score

### Classification
- **Task**: Categorize water quality into classes based on the predicted WQI
- **Method**: Post-processing rule-based classification (not a separate ML model)
- **Output**: Quality category (Excellent, Good, Poor, Very Poor, Unsuitable)

**Classification Rules** (from `classify_wqi()` function):
```python
WQI ≤ 25    → "Excellent"
WQI 26-50   → "Good"
WQI 51-75   → "Poor"
WQI 76-100  → "Very Poor"
WQI > 100   → "Unsuitable for Drinking"
```

---

## 2. **FEATURES USED DURING TRAINING**

### 2.1 Base Features (8 Required Features)
The system requires these **8 core water quality parameters**:

```python
FEATURES = [
    'Temp',              # Temperature (°C)
    'pH',                # pH level
    'Conductivity',      # Electrical conductivity (μmhos/cm)
    'Nitrate',           # Nitrate N (mg/L)
    'Fecal_Coliform',    # Fecal coliform bacteria (MPN/100ml)
    'Total_Coliform',    # Total coliform bacteria (MPN/100ml)
    'TDS',               # Total Dissolved Solids (mg/L)
    'Fluoride'           # Fluoride (mg/L)
]
```

### 2.2 Feature Engineering (Automatic Creation)
The system automatically creates **additional derived features** to improve model performance:

#### A. **Interaction Features** (capture relationships between features)
- `pH_Temp_interaction` = pH × Temperature
  - *Why*: pH and temperature often interact in water chemistry

#### B. **Ratio Features** (normalize related measurements)
- `TDS_Conductivity_ratio` = TDS / (Conductivity + 1)
  - *Why*: TDS and conductivity are related; ratio captures their relationship
- `Coliform_ratio` = Fecal_Coliform / (Total_Coliform + 1)
  - *Why*: Ratio of fecal to total coliform indicates contamination severity

#### C. **Log Transformations** (handle skewed distributions)
- `Fecal_Coliform_log` = log(Fecal_Coliform + 1)
- `Total_Coliform_log` = log(Total_Coliform + 1)
- `TDS_log` = log(TDS + 1)
  - *Why*: Coliform and TDS values are often highly skewed; log transform normalizes them

#### D. **Polynomial Features** (capture non-linear relationships)
- `pH_squared` = pH²
- `Temp_squared` = Temperature²
  - *Why*: pH and temperature may have quadratic effects on water quality

### 2.3 Total Features Used in Training
**Total feature count**: 8 base features + ~7 engineered features = **~15 features**

**Example feature set**:
```
Base: Temp, pH, Conductivity, Nitrate, Fecal_Coliform, Total_Coliform, TDS, Fluoride
Engineered: pH_Temp_interaction, TDS_Conductivity_ratio, Coliform_ratio,
            Fecal_Coliform_log, Total_Coliform_log, TDS_log,
            pH_squared, Temp_squared
```

---

## 3. **FEATURES USED DURING TESTING/PREDICTION**

### 3.1 Input Requirements
During prediction (testing), the system needs:
- **Same 8 base features** as training
- **WQI column is NOT required** (this is what we're predicting!)

### 3.2 Feature Processing Pipeline
1. **Column Renaming**: Maps alternative column names to standard names
   ```python
   'Temperature ⁰C' → 'Temp'
   'Conductivity (μmhos/cm)' → 'Conductivity'
   'Total Dissolved Solids (mg/L)' → 'TDS'
   # ... etc
   ```

2. **Feature Engineering**: Creates the same engineered features as training
   - Same interaction, ratio, log, and polynomial features

3. **Feature Selection**: Selects only the features the model was trained on
   ```python
   feature_cols = [col for col in df.columns if col in FEATURES or 
                   any(feat in col for feat in ['interaction', 'ratio', 'log', 'squared'])]
   ```

### 3.3 Important Note
- The model expects **exactly the same features** it was trained on
- If features are missing or different, prediction will fail
- The system automatically creates engineered features from base features

---

## 4. **MODEL OUTPUTS**

### 4.1 During Training
The model learns to predict WQI from features:
- **Input (X)**: Feature matrix (15 features × N samples)
- **Target (y)**: WQI values (N samples)
- **Output**: Trained model that maps features → WQI

### 4.2 During Prediction
The model provides:

#### A. **Primary Output**: Predicted WQI
```python
Predicted_WQI = model.predict(features)
# Example: Predicted_WQI = 45.67
```

#### B. **Derived Output**: WQI Classification
```python
WQI_Class = classify_wqi(Predicted_WQI)
# Example: WQI_Class = "Good" (if WQI is 45.67)
```

### 4.3 Complete Output Structure
For each prediction sample, the system returns:

```json
{
  "Sample #": 1,
  "Predicted_WQI": 45.67,
  "WQI_Class": "Good",
  "pH": 7.2,
  "Temp": 25.5,
  "TDS": 450,
  "Conductivity": 680,
  "Nitrate": 12.5,
  "Fecal_Coliform": 5,
  "Total_Coliform": 15,
  "Fluoride": 0.8
  // ... all original input features
}
```

**Note**: The WQI target column (if present in testing data) is **excluded** from the output to avoid confusion.

---

## 5. **TRAINING PIPELINE FLOW**

```
1. Upload CSV with WQI column
   ↓
2. Preprocess & Feature Engineering
   - Rename columns
   - Create interaction/ratio/log/polynomial features
   ↓
3. Split Data (80% train, 20% test)
   ↓
4. Train 5 Models (with hyperparameter tuning)
   - Ridge Regression
   - SVR
   - Random Forest
   - Gradient Boosting
   - XGBoost
   ↓
5. Evaluate Models (Cross-validation RMSE)
   ↓
6. Select Best Model (lowest CV RMSE)
   ↓
7. Save Model & Results
```

---

## 6. **PREDICTION PIPELINE FLOW**

```
1. Upload CSV WITHOUT WQI column
   ↓
2. Preprocess & Feature Engineering
   - Same as training (create same engineered features)
   ↓
3. Load Trained Model
   ↓
4. Make Predictions
   - Input: Feature matrix
   - Output: Predicted_WQI values
   ↓
5. Classify Predictions
   - Apply classify_wqi() to each Predicted_WQI
   ↓
6. Return Results
   - Predicted_WQI
   - WQI_Class
   - All original input features
```

---

## 7. **KEY DIFFERENCES: TRAINING vs TESTING**

| Aspect | Training | Testing/Prediction |
|--------|----------|-------------------|
| **WQI Column** | ✅ Required | ❌ Not required (we predict it) |
| **Base Features** | ✅ 8 required | ✅ 8 required (same) |
| **Engineered Features** | ✅ Auto-created | ✅ Auto-created (same) |
| **Model** | 🏗️ Build & train | 📦 Load pre-trained |
| **Output** | Model metrics | Predicted_WQI + WQI_Class |

---

## 8. **MODEL ARCHITECTURE**

### Models Used
1. **Ridge Regression**: Linear model with L2 regularization
2. **SVR**: Support Vector Regression (non-linear)
3. **Random Forest**: Ensemble of decision trees
4. **Gradient Boosting**: Sequential boosting
5. **XGBoost**: Optimized gradient boosting (usually best)

### Model Selection
- **Criterion**: Lowest Cross-Validated RMSE (Root Mean Squared Error)
- **Method**: 5-fold cross-validation
- **Best Model**: Saved and used for all predictions

---

## 9. **EXAMPLE WORKFLOW**

### Training Example:
```
Input CSV:
- Temp, pH, Conductivity, ..., WQI (target)

After Preprocessing:
- 8 base features + 7 engineered features = 15 features
- Target: WQI

Model Training:
- Learns: features → WQI mapping
- Saves: trained_model.pkl
```

### Prediction Example:
```
Input CSV:
- Temp, pH, Conductivity, ... (NO WQI column)

After Preprocessing:
- Same 15 features as training

Model Prediction:
- Input: 15 features
- Output: Predicted_WQI = 45.67
- Classification: WQI_Class = "Good"

Final Output:
- All original columns + Predicted_WQI + WQI_Class
- (WQI target column excluded if present)
```

---

## 10. **SUMMARY**

- **Prediction**: Regression model predicts continuous WQI values
- **Classification**: Rule-based categorization of predicted WQI
- **Training Features**: 8 base + ~7 engineered = ~15 total features
- **Testing Features**: Same 15 features (derived from 8 base features)
- **Model Output**: Predicted_WQI (numeric) + WQI_Class (category)
- **Key Point**: Model learns feature → WQI mapping during training, then predicts WQI from features during testing

