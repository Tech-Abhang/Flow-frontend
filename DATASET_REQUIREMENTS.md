# Dataset Requirements for Water Quality Prediction

## ✅ For Model Training

To train the 5 ML models (Ridge, SVR, RandomForest, GradientBoosting, XGBoost), your dataset MUST include:

### Required Columns:

1. **Temperature** or **Temp** - Temperature in °C
2. **pH** - pH value (0-14)
3. **Conductivity** - Conductivity in μmhos/cm
4. **Nitrate** or **Nitrate N** - Nitrate concentration in mg/L
5. **Fecal_Coliform** or **Faecal Coliform** - Fecal Coliform count in MPN/100ml
6. **Total_Coliform** - Total Coliform count in MPN/100ml
7. **TDS** or **Total Dissolved Solids** - TDS in mg/L
8. **Fluoride** - Fluoride concentration in mg/L
9. **WQI** - Water Quality Index (TARGET VARIABLE) ⚠️ **REQUIRED FOR TRAINING**

### Optional Columns (will be dropped):

- State Name
- Location
- Station
- Date
- Any other non-numeric columns

---

## ⚠️ Current Dataset Issue

Your current dataset (`NWMP Data 2021 Final Trimmed.csv`) contains:

- ✅ All 8 water quality parameters
- ❌ **Missing WQI column**

**This means:**

- ✅ Can be used for **predictions** (if you have a pre-trained model)
- ❌ Cannot be used for **training** new models

---

## 🔧 Solution Options

### Option 1: Get Training Data with WQI

Find or create a dataset that includes pre-calculated WQI values. The WQI should be calculated using standard formulas based on the 8 water parameters.

### Option 2: Calculate WQI First

Before training, calculate WQI for your dataset using the standard formula:

```
WQI = Σ(Qi × Wi)
```

Where:

- Qi = Quality rating for each parameter
- Wi = Unit weight for each parameter

### Option 3: Use for Inference Only

Keep your current dataset and only use it with pre-trained models for making predictions (not for training).

---

## 📊 Dataset Structure Example

### Training Dataset (WITH WQI):

```csv
State Name,Temperature,pH,Conductivity,Nitrate,Fecal_Coliform,Total_Coliform,TDS,Fluoride,WQI
ANDHRA PRADESH,29.5,7.35,1160.5,8.82,3.0,69.5,782.0,0.6,45.2
KARNATAKA,28.3,7.12,980.3,5.21,1.0,45.3,650.1,0.4,38.7
...
```

### Inference Dataset (WITHOUT WQI):

```csv
State Name,Temperature,pH,Conductivity,Nitrate,Fecal_Coliform,Total_Coliform,TDS,Fluoride
ANDHRA PRADESH,29.5,7.35,1160.5,8.82,3.0,69.5,782.0,0.6
KARNATAKA,28.3,7.12,980.3,5.21,1.0,45.3,650.1,0.4
...
```

---

## 🚀 Next Steps

1. **To Train Models**: Upload a CSV file with all 9 columns (8 parameters + WQI)
2. **To Make Predictions**: Use your current dataset with a pre-trained model (not yet implemented in backend)

---

## 💡 Frontend Fix Needed

The frontend currently doesn't check if the uploaded dataset has WQI before calling the training endpoint. You should add validation in the upload page to:

1. Parse the uploaded CSV
2. Check if 'WQI' column exists
3. Show appropriate message:
   - If WQI exists → "Ready for training"
   - If WQI missing → "This dataset can only be used for predictions"
