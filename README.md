# 🌊 Water Purity Detection System

An AI-powered web application for analyzing water quality datasets, training machine learning models, and predicting Water Quality Index (WQI) with automatic water purity detection.

## ✨ Features

- 🤖 **Automated ML Model Selection** - Trains and compares 5 ML models (Ridge, SVR, Random Forest, Gradient Boosting, XGBoost)
- 📊 **Comprehensive Analysis** - Feature importance, model metrics, R² scores, RMSE, MAE, MAPE
- 🔍 **Water Quality Detection** - Classifies water as Excellent, Good, Poor, Very Poor, or Unsuitable
- 📈 **Real-time Predictions** - Predicts WQI values for any water quality dataset
- 💾 **Export Results** - Download predictions as CSV
- 🎨 **Beautiful UI** - Modern, responsive interface with smooth animations

## 🚀 Quick Start

### Frontend Only (Demo Mode)

```bash
# Install dependencies
npm install

# Start development server
npm run dev
```

Visit `http://localhost:5173` and upload a CSV file with water quality parameters.

### Full System (With Backend)

**Terminal 1 - Backend:**

```bash
cd backend
pip install flask flask-cors pandas numpy scikit-learn xgboost joblib
python api.py
```

**Terminal 2 - Frontend:**

```bash
npm run dev
```

## 📋 Dataset Requirements

Your CSV file must include these 8 features (exact names or alternate formats):

| Feature        | Primary Name     | Alternate Names                 |
| -------------- | ---------------- | ------------------------------- |
| Temperature    | `Temp`           | `Temperature ⁰C`                |
| pH Level       | `pH`             | -                               |
| Conductivity   | `Conductivity`   | `Conductivity (μmhos/cm)`       |
| Nitrate        | `Nitrate`        | `Nitrate N (mg/L)`              |
| Fecal Coliform | `Fecal_Coliform` | `Faecal Coliform (MPN/100ml)`   |
| Total Coliform | `Total_Coliform` | `Total Coliform (MPN/100ml)`    |
| TDS            | `TDS`            | `Total Dissolved Solids (mg/L)` |
| Fluoride       | `Fluoride`       | `Fluoride (mg/L)`               |

**Optional**: `WQI` column (for training mode)

## 🎯 Usage Modes

### Training Mode (Dataset WITH WQI column)

Upload a CSV with WQI values to train models and see which performs best.

### Inference Mode (Dataset WITHOUT WQI column)

Upload a CSV without WQI to predict water quality for new samples.

## 📖 Documentation

- **[COMPLETE_GUIDE.md](./COMPLETE_GUIDE.md)** - Comprehensive usage guide
- **[WORKFLOW.md](./WORKFLOW.md)** - Detailed workflow documentation
- **[backend/README.md](./backend/README.md)** - Backend API documentation

## 🛠️ Technology Stack

### Frontend

- React + Vite
- React Router for navigation
- Tailwind CSS for styling
- Framer Motion for animations
- shadcn/ui components
- Lucide React icons

### Backend

- Flask (Python web framework)
- scikit-learn (ML models)
- XGBoost (Gradient boosting)
- pandas (Data processing)
- NumPy (Numerical computing)

## 📊 Model Performance

The system trains and compares 5 models:

1. **Ridge Regression** - Linear baseline
2. **Support Vector Regression** - Non-linear kernel methods
3. **Random Forest** - Ensemble of decision trees
4. **Gradient Boosting** - Sequential ensemble learning
5. **XGBoost** - Optimized gradient boosting (typically best performer)

Typical results (varies by dataset):

- R² Score: 0.95-0.97
- RMSE: 2-4 WQI points
- MAE: 1.5-3 WQI points

## 🌊 WQI Classification

| WQI Range | Class      | Status       |
| --------- | ---------- | ------------ |
| 0-25      | Excellent  | Pure         |
| 26-50     | Good       | Pure         |
| 51-75     | Poor       | Contaminated |
| 76-100    | Very Poor  | Contaminated |
| 101+      | Unsuitable | Contaminated |

## 📁 Project Structure

```
water_purity/
├── src/
│   ├── pages/
│   │   ├── landingpage.jsx        # Landing page
│   │   ├── UploadDataset.jsx      # CSV upload & validation
│   │   ├── ModelAnalysis.jsx      # Model training & selection
│   │   └── Predictions.jsx        # Predictions & detection
│   ├── components/
│   │   └── ui/                    # UI components
│   ├── lib/
│   │   ├── api.js                 # Backend API calls
│   │   └── utils.js               # Utilities
│   └── App.jsx                    # Main app with routing
├── backend/
│   ├── api.py                     # Flask API server
│   └── README.md                  # Backend documentation
├── Dataset/
│   └── NWMP Data 2021 Final Trimmed.csv
└── Ipymb/
    └── modelAnalysis.ipynb        # Original Jupyter notebook
```

## 🎨 Features Showcase

### Dynamic Data Validation

- Automatic column name mapping
- Real-time CSV preview
- Missing column detection
- File format validation

### Model Training

- 5-fold cross-validation
- Hyperparameter tuning
- Parallel processing
- Progress tracking

### Analysis Dashboard

- Model comparison table
- Feature importance charts
- Performance metrics
- Visual insights

### Prediction Results

- Sample-by-sample predictions
- Classification distribution
- Statistical summary
- Export functionality

## 🔧 Configuration

Create a `.env` file:

```env
VITE_API_URL=http://localhost:5000
```

## 🤝 Contributing

Contributions welcome! Please read the documentation first.

## 📝 License

MIT License - feel free to use for your projects!

## 🙏 Acknowledgments

- Water quality data from NWMP (National Water Monitoring Programme)
- Built with React, scikit-learn, and XGBoost
- UI components from shadcn/ui

---

Made with 💙 for water quality analysis

## React Compiler

The React Compiler is not enabled on this template because of its impact on dev & build performances. To add it, see [this documentation](https://react.dev/learn/react-compiler/installation).

## Expanding the ESLint configuration

If you are developing a production application, we recommend using TypeScript with type-aware lint rules enabled. Check out the [TS template](https://github.com/vitejs/vite/tree/main/packages/create-vite/template-react-ts) for information on how to integrate TypeScript and [`typescript-eslint`](https://typescript-eslint.io) in your project.
