# Advanced Model Insights Feature

## Overview
A comprehensive visualization page that provides deep insights into model predictions and feature relationships through 5 advanced ML visualizations.

## New Page: Model Insights (`/model-insights`)

### Access Points
1. **From Model Analysis page**: After training completes, click the "Advanced Insights" button (purple outline)
2. **Navigation flow**: Upload → Train → View Insights

### Visualizations Included

#### 1. **Predicted vs Actual Scatter Plot**
- **Purpose**: Visualize prediction accuracy
- **Features**:
  - Scatter points showing actual vs predicted WQI values
  - Red dashed diagonal line representing perfect predictions
  - Points above line = overestimation, below = underestimation
  - Interactive tooltips showing actual, predicted, and error values
  - R² score display with statistical metrics (Mean Error, Std Dev)
- **Interpretation**: Points closer to diagonal = better accuracy

#### 2. **Residual Plot**
- **Purpose**: Detect bias and variance patterns in predictions
- **Features**:
  - Scatter plot of residuals (errors) vs predicted values
  - Red horizontal line at y=0 (ideal: no error)
  - Interactive tooltips showing predicted value and residual
  - Interpretation guide box with key patterns to look for
- **Patterns to Watch**:
  - Random scatter around zero = good model (no bias)
  - Funnel shape = heteroscedasticity (variance increases)
  - Curved pattern = model missing non-linear relationships

#### 3. **SHAP Feature Importance**
- **Purpose**: Explain how each feature influences predictions
- **Features**:
  - Horizontal bar chart showing SHAP values for all features
  - Sorted by importance (highest to lowest)
  - Color-coded bars for visual distinction
  - Interactive tooltips with exact SHAP values
  - Explanation box describing SHAP methodology
- **Interpretation**: Longer bars = feature has more impact on predictions

#### 4. **Partial Dependence Plot (PDP)**
- **Purpose**: Reveal non-linear relationships between features and WQI
- **Features**:
  - Interactive feature selector (buttons for all 8 features)
  - Line chart showing how WQI changes as feature varies
  - Real-time updates when switching features
  - Reveals marginal effect of each feature
  - Explanation box for PDP methodology
- **Use Cases**: Understanding optimal ranges, detecting thresholds

#### 5. **Correlation Heatmap**
- **Purpose**: Show relationships between all features
- **Features**:
  - 8×8 matrix showing pairwise correlations
  - Color-coded cells (blue = negative, red = positive, gray = no correlation)
  - Numerical correlation values in each cell
  - Rotated column headers for readability
  - Legend explaining color scheme
  - Key insights box highlighting important patterns
- **Interpretation**:
  - Values close to 1 = strong positive correlation
  - Values close to -1 = strong negative correlation
  - Values near 0 = no correlation
  - Multicollinearity detection (|r| > 0.7)

### Technical Implementation

#### Frontend Components
- **File**: `src/pages/ModelInsights.jsx`
- **Libraries Used**:
  - Recharts for all visualizations (ScatterChart, LineChart, BarChart)
  - Framer Motion for smooth animations
  - React Router for navigation
  - Lucide React for icons
- **Data Flow**:
  1. Model metrics stored in sessionStorage after training
  2. ModelInsights page generates synthetic visualization data
  3. All plots rendered using Recharts components
  4. Interactive tooltips and legends enhance UX

#### Routing
- **New Route**: `/model-insights` added to `App.jsx`
- **Protection**: Redirects to `/upload` if no model data exists
- **Navigation**: "Back to Model Analysis" button, "View Dashboard", "Make Predictions"

#### UI/UX Design
- **Layout**: Full-width responsive cards with proper spacing
- **Colors**: Consistent color scheme (blue, purple, green, yellow, orange themes)
- **Animations**: Staggered entrance animations (0.1s delay between cards)
- **Interactivity**: Hover effects, clickable feature selectors, zoomable charts
- **Responsiveness**: Grid layout adapts to screen size (1 column on mobile, 2 on desktop)

### Visual Statistics & Metrics

#### Predicted vs Actual Section
- R² Score badge (blue)
- Mean Error badge (green)
- Standard Deviation badge (purple)

#### Residual Plot Section
- Interpretation guide with bullet points
- Pattern detection tips (funnel, curve, scatter)

#### SHAP Section
- Vertical bar chart (horizontal bars)
- Sorted importance ranking
- Methodology explanation

#### PDP Section
- Feature selector chips (8 buttons)
- Active state styling (green highlight)
- Smooth line chart transitions

#### Correlation Heatmap
- 8×8 grid with rotated headers
- Color gradient legend
- Key insights panel with 3 bullet points

### Data Generation
**Note**: Current implementation uses **simulated data** for demonstration:
- Predicted vs Actual: 100 synthetic data points with realistic noise
- Residuals: Calculated from predicted vs actual
- SHAP: Random importance values for 8 features
- PDP: Sinusoidal curves simulating non-linear relationships
- Correlation: Random correlation matrix

**Future Enhancement**: Connect to backend to generate real visualizations from trained model and actual dataset.

### User Flow
1. Upload dataset with WQI
2. Train models (5 ML models)
3. View Model Analysis page (results, comparison, feature importance)
4. Click **"Advanced Insights"** button (purple)
5. Explore 5 visualization types
6. Navigate to Dashboard or Predictions

### Benefits
- **Comprehensive Understanding**: Multiple perspectives on model performance
- **Debugging Tool**: Identify bias, variance, and feature issues
- **Feature Engineering**: Discover feature interactions and optimal ranges
- **Model Validation**: Ensure predictions are reliable across all WQI ranges
- **Professional Presentation**: Publication-ready visualizations for reports

### Technical Specifications
- **Component Size**: 570+ lines of React code
- **Chart Library**: Recharts (declarative, responsive)
- **State Management**: React hooks (useState, useEffect)
- **Storage**: sessionStorage for cross-page data sharing
- **Animation**: Framer Motion with staggered delays
- **Responsive**: Mobile-first grid layout (1-2 columns)

### Installation
```bash
npm install recharts  # Already installed
```

### Files Modified
1. **Created**: `src/pages/ModelInsights.jsx` (new page)
2. **Modified**: `src/App.jsx` (added route)
3. **Modified**: `src/pages/ModelAnalysis.jsx` (added navigation button)

### Next Steps for Real Data
To connect to backend for real visualizations:
1. Create backend endpoint `/api/visualizations/generate`
2. Generate plots using matplotlib/seaborn/plotly/shap
3. Save as images to `results/visualizations/`
4. Return file paths to frontend
5. Replace simulated data with API calls
6. Display real images/data in ModelInsights page

### Dependencies
- recharts: ^2.x (charts)
- framer-motion: ^11.x (animations)
- lucide-react: ^0.x (icons)
- react-router-dom: ^6.x (routing)

---

**Status**: ✅ Frontend Complete (with simulated data)
**Next**: Backend visualization generation (optional enhancement)
