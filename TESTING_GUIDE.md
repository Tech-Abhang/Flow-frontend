# 🧪 Testing Guide - Dynamic Dashboard

## Current Setup

✅ **Backend**: Running on http://localhost:5000  
✅ **Frontend**: Running on http://localhost:5173  
✅ **Dashboard API**: Calls `/api/dashboard/summary`  
✅ **Training API**: Calls `/api/train`

## How to Test Dynamic Dashboard

### Step 1: Verify Backend is Running

Open terminal and run:

```bash
curl http://localhost:5000/api/health
```

Expected output:

```json
{
  "status": "healthy",
  "timestamp": "2025-11-09T..."
}
```

### Step 2: Upload Dataset & Train Models

1. Open http://localhost:5173
2. Navigate to "Upload Dataset"
3. Upload a CSV file **with WQI column** (training data)
4. Click "Proceed to Model Analysis"

### Step 3: Watch Console Logs

Open browser console (F12) and you should see:

```
🚀 Starting training process...
Dataset: your_file.csv
Has WQI column: true
📦 Created file object: your_file.csv xxxx bytes
🔄 Calling backend training API...
🎯 trainWithBackend called with file: your_file.csv
📡 Making API call to /api/train...
```

Then after 2-5 minutes:

```
📥 Received response from backend: {...}
✅ Training successful!
Best model: XGBoost
Models trained: 5
```

### Step 4: Check Backend Logs

In the backend terminal, you should see:

```
✅ Training dataset loaded
Shape: (xxx, x)
🔧 Split: Train=(xxx, x), Test=(xxx, x)
⏳ Tuning Ridge (1/5)...
✅ Ridge: CV RMSE=x.xxx, Test R²=x.xxx
⏳ Tuning SVR (2/5)...
...
✅ XGBoost: CV RMSE=x.xxx, Test R²=x.xxx
```

### Step 5: Verify Dashboard Updates

1. Navigate to http://localhost:5173/dashboard
2. You should see:
   - **Total Models**: Updated count
   - **Training Sessions**: Incremented by 1
   - **Best Model R²**: New value from training
   - **Model Performance Table**: Shows all 5 models with new metrics
   - **Timestamp**: Shows when training completed

### Step 6: Train with Different Dataset

1. Go back to "Upload Dataset"
2. Upload a **different** CSV file (or modify the existing one)
3. Train again
4. Check dashboard - **ALL VALUES SHOULD UPDATE**

## Troubleshooting

### Dashboard Shows "No data available"

**Problem**: Backend not running or API call failed

**Check**:

```bash
# Test backend
curl http://localhost:5000/api/health

# Test dashboard endpoint
curl http://localhost:5000/api/dashboard/summary
```

**Fix**:

```bash
cd backend
source venv/bin/activate
python app.py
```

### Training Uses Mock Data

**Problem**: Backend training failed, falling back to simulation

**Check Console**: Look for error messages:

- ❌ Backend training failed
- Error details: ...

**Common Causes**:

1. Backend not running on port 5000
2. CORS issue
3. File upload failed
4. Dependencies not installed

**Fix**:

1. Restart backend
2. Check browser console for CORS errors
3. Verify `.env.local` has: `VITE_API_URL=http://localhost:5000`

### Dashboard Shows Old Data

**Problem**: Training completed but dashboard not updated

**Check**:

1. Look at backend files:

```bash
ls -la backend/results/
cat backend/results/latest_training.json
```

2. Check timestamp in file matches recent training

**Fix**:

1. Click "Refresh" button on dashboard
2. Hard refresh browser: Cmd+Shift+R (Mac) or Ctrl+Shift+R (Windows)
3. Check backend logs for errors saving results

### Models Not Training

**Problem**: ModelAnalysis shows loading but never completes

**Check**:

1. Backend terminal for errors
2. Browser console for failed API call
3. Network tab (F12 → Network) for `/api/train` request

**Common Issues**:

- Request timeout (training takes too long)
- Out of memory
- Missing dependencies

**Fix**:

1. Use smaller dataset for testing
2. Check backend has enough RAM
3. Reinstall dependencies: `pip install -r requirements.txt`

## Expected Behavior

### First Training Session

```
Dashboard before:
- Total Models: 0
- Training Sessions: 0
- No training data message

Dashboard after:
- Total Models: 5 (Ridge, SVR, RandomForest, GradientBoosting, XGBoost)
- Training Sessions: 1
- Best Model R²: ~0.95 (depends on data)
- Model comparison table visible
- Timestamp: Current time
```

### Second Training Session (Different Dataset)

```
Dashboard updates:
- Total Models: 10 (5 new + 5 old saved models)
- Training Sessions: 2
- Best Model R²: NEW VALUE from second training
- Model comparison table: NEW METRICS
- Timestamp: UPDATED to latest training
```

## API Response Structure

### `/api/train` Response

```json
{
  "success": true,
  "message": "All models trained successfully",
  "models": [
    {
      "model_name": "XGBoost",
      "cv_rmse": 4.521,
      "test_r2": 0.945,
      "test_mae": 3.245,
      "test_rmse": 4.521,
      "test_mape": 7.82,
      "best_params": {...},
      "model_file": "XGBoost_model_20251109_162345.pkl"
    },
    // ... 4 more models
  ],
  "best_model": "XGBoost",
  "summary": {...}
}
```

### `/api/dashboard/summary` Response

```json
{
  "success": true,
  "summary": {
    "has_training_data": true,
    "has_prediction_data": false,
    "total_models": 5,
    "total_training_sessions": 1,
    "latest_training": {
      "timestamp": "20251109_162345",
      "dataset_shape": [1500, 9],
      "best_model": "XGBoost",
      "models_trained": [...],
      "train_size": 1200,
      "test_size": 300
    },
    "latest_prediction": null
  }
}
```

## Quick Test Script

Save this as `test_flow.sh`:

```bash
#!/bin/bash

echo "🧪 Testing Dynamic Dashboard Flow"
echo ""

# Test 1: Backend Health
echo "1️⃣ Testing backend health..."
curl -s http://localhost:5000/api/health | grep -q "healthy" && echo "✅ Backend is healthy" || echo "❌ Backend not responding"

# Test 2: Check dashboard endpoint
echo "2️⃣ Testing dashboard endpoint..."
curl -s http://localhost:5000/api/dashboard/summary | grep -q "success" && echo "✅ Dashboard API works" || echo "❌ Dashboard API failed"

# Test 3: Check if training data exists
echo "3️⃣ Checking for training data..."
if [ -f "backend/results/latest_training.json" ]; then
    echo "✅ Training data found"
    echo "   Last trained: $(cat backend/results/latest_training.json | grep timestamp | head -1)"
else
    echo "⚠️  No training data yet - please train models first"
fi

echo ""
echo "Next: Upload a dataset and train models to test dynamic updates!"
```

## Summary

✅ **What's Working**:

- Backend API endpoints
- Dashboard fetches data from API
- Training endpoint accepts files
- Results saved to JSON files

✅ **What's Dynamic**:

- Every training creates new models with timestamp
- Dashboard auto-refreshes every 30 seconds
- Latest training results always shown
- History tracked in training_history.json

⚠️ **What to Check**:

- Are you seeing console logs when training?
- Does backend show training progress in terminal?
- Does dashboard actually call `/api/dashboard/summary`?
- Check Network tab for API calls

---

**If dashboard is still showing old data, open browser console (F12) and share the logs - that will tell us exactly what's happening!**
