# 🔄 Dynamic Dashboard - Complete Flow Guide

## How It Works

Every time you upload a new dataset and train models, the dashboard automatically updates with fresh results. Here's the complete flow:

### 📊 Step-by-Step Process

#### 1. Upload Dataset

1. Go to **http://localhost:5173/upload**
2. Upload a CSV file with WQI column (for training)
3. System validates the file
4. Click "Proceed to Model Analysis"

#### 2. Model Training (2-5 minutes)

1. Training page shows animated progress:
   - Progress bar (0-100%)
   - Current step (e.g., "Training XGBoost...")
   - Model indicators turning green as they complete
2. Backend trains all 5 models:
   - Ridge Regression
   - SVR
   - Random Forest
   - Gradient Boosting
   - XGBoost
3. Backend saves results to `backend/results/latest_training.json`
4. Training complete message appears

#### 3. View Results

After training completes, you have two options:

**Option A: View Dashboard**

- Click "View Dashboard" button
- Dashboard automatically loads latest training results
- Shows:
  - Best model metrics
  - All 5 models comparison
  - Training timestamp
  - Fresh data from your new dataset

**Option B: Make Predictions**

- Click "Make Predictions" button
- Upload new data (without WQI)
- Get predictions using best model

#### 4. Dashboard Auto-Updates

The dashboard:

- ✅ Fetches data from `/api/dashboard/summary`
- ✅ Shows latest training results
- ✅ Auto-refreshes every 30 seconds
- ✅ Updates immediately when you navigate to it
- ✅ Always displays most recent data

---

## 🎯 Testing the Dynamic Dashboard

### Test 1: First Training Run

```bash
# 1. Start backend
cd backend
source venv/bin/activate
python app.py

# 2. Start frontend (new terminal)
npm run dev

# 3. Upload first dataset
# Go to http://localhost:5173/upload
# Upload: Dataset/NWMP Data 2021 Final Trimmed.csv
# Wait for training to complete

# 4. View Dashboard
# Click "View Dashboard" button
# Note the metrics (R², RMSE, timestamp)
```

**Expected Result:**

- Dashboard shows metrics from first training
- Timestamp shows current date/time
- Best model displayed (likely XGBoost)

---

### Test 2: Second Training Run (Shows Dynamic Update)

```bash
# 5. Upload different/modified dataset
# Go back to http://localhost:5173/upload
# Upload a different CSV or modified version
# Wait for training to complete

# 6. View Dashboard Again
# Click "View Dashboard" button
# Metrics should be DIFFERENT from first run
# Timestamp should be NEW
```

**Expected Result:**

- ✅ Dashboard shows NEW metrics
- ✅ Timestamp updated to latest training
- ✅ Model comparison reflects new dataset
- ✅ Different R² / RMSE values if dataset changed

---

### Test 3: Auto-Refresh

```bash
# 7. Keep dashboard open
# In another tab, train with new dataset
# Watch dashboard auto-update after 30 seconds
```

**Expected Result:**

- Dashboard automatically refreshes
- New data appears without manual reload
- Smooth transition to updated metrics

---

## 🔍 Verifying Dynamic Updates

### Check Backend Files

After each training, verify files are being updated:

```bash
# Check latest training file
cat backend/results/latest_training.json

# Should show:
{
  "timestamp": "2025-11-09T16:45:22",  # Current timestamp
  "best_model": "XGBoost",
  "models_trained": [...]
}

# Check training history
cat backend/results/training_history.json

# Should show array of all training sessions
```

### Check API Endpoint

Test the dashboard API directly:

```bash
# Test dashboard summary endpoint
curl http://localhost:5000/api/dashboard/summary

# Should return:
{
  "success": true,
  "summary": {
    "has_training_data": true,
    "latest_training": {
      "timestamp": "...",  # Latest timestamp
      "best_model": "...",
      "models_trained": [...]
    }
  }
}
```

### Check Browser Console

1. Open dashboard: http://localhost:5173/dashboard
2. Open DevTools (F12)
3. Go to Network tab
4. Look for `/api/dashboard/summary` requests
5. Every 30 seconds, should see new request
6. Response should have latest data

---

## 🎨 Visual Indicators of Dynamic Updates

When dashboard loads fresh data, you'll see:

1. **Updated Timestamp**

   - "Last updated: [current date/time]"
   - Changes after each new training

2. **New Metrics**

   - R² Score changes based on dataset
   - RMSE varies with data quality
   - MAE reflects dataset complexity

3. **Model Rankings**

   - Best model may change
   - Performance order updates
   - Green highlighting on top model

4. **Training Sessions Counter**

   - Increments with each training
   - Shows total number of runs

5. **Prediction Statistics**
   - Updates after new predictions
   - Class distribution reflects new data
   - Sample counts change

---

## 🐛 Troubleshooting

### Dashboard Shows Old Data

**Problem:** Dashboard displays results from previous training

**Solutions:**

1. **Hard Refresh Browser**

   ```
   Mac: Cmd + Shift + R
   Windows: Ctrl + Shift + R
   ```

2. **Check Backend Logs**

   ```bash
   # Look for this after training:
   "💾 Saved best pipeline to: ..."
   "✅ Training complete"
   ```

3. **Verify Backend Files**

   ```bash
   # Check file timestamp
   ls -lh backend/results/latest_training.json

   # Should show recent modification time
   ```

4. **Test API Directly**

   ```bash
   curl http://localhost:5000/api/dashboard/summary | jq .

   # Verify timestamp in response
   ```

5. **Clear Session Storage**
   ```javascript
   // In browser console
   sessionStorage.clear();
   location.reload();
   ```

---

### Training Doesn't Update Backend

**Problem:** Training completes but backend files not updated

**Check:**

1. **Backend Running?**

   ```bash
   curl http://localhost:5000/api/health
   ```

2. **Training API Working?**

   ```bash
   # Check backend terminal for errors
   # Look for: "save_latest_training" calls
   ```

3. **File Permissions**

   ```bash
   ls -la backend/results/
   # Should be writable
   ```

4. **Backend Logs**
   ```bash
   # Look for these messages:
   "✅ Training complete"
   "Saved latest training..."
   ```

---

### Auto-Refresh Not Working

**Problem:** Dashboard doesn't update automatically

**Solutions:**

1. **Check Console for Errors**

   - Open browser DevTools (F12)
   - Look for network errors
   - Check for CORS issues

2. **Verify Interval**

   ```javascript
   // Dashboard.jsx should have:
   useEffect(() => {
     fetchDashboard();
     const interval = setInterval(fetchDashboard, 30000);
     return () => clearInterval(interval);
   }, []);
   ```

3. **Manual Refresh**
   - Click the "Refresh" button on dashboard
   - Should immediately fetch latest data

---

## 📈 Best Practices

### For Testing Dynamic Updates

1. **Use Different Datasets**

   - Modify CSV files between trainings
   - Add/remove rows
   - Change values
   - Results should clearly differ

2. **Check Timestamps**

   - Always note timestamp after training
   - Compare before/after dashboard views
   - Timestamp should match training time

3. **Monitor Backend Logs**

   - Watch for "Training complete" messages
   - Verify "Saved latest training" appears
   - Check for any errors

4. **Clear Cache Between Tests**
   - Hard refresh browser
   - Clear sessionStorage
   - Restart backend if needed

### For Production Use

1. **Regular Backups**

   ```bash
   # Backup training history
   cp backend/results/training_history.json \
      backend/results/training_history_backup.json
   ```

2. **Monitor Disk Space**

   ```bash
   # Check results folder size
   du -sh backend/results/
   ```

3. **Review Old Data**
   ```bash
   # Keep last 50 training sessions
   # Configured in backend/utils.py
   ```

---

## ✅ Success Checklist

After each training run, verify:

- [ ] Training completes without errors
- [ ] "Training complete" message shows
- [ ] Latest timestamp visible
- [ ] Dashboard loads new data
- [ ] Metrics differ from previous run
- [ ] Model comparison shows fresh results
- [ ] Training sessions counter incremented
- [ ] Backend files updated
- [ ] API returns new data

---

## 🚀 Quick Test Script

```bash
#!/bin/bash

echo "Testing Dynamic Dashboard..."

# 1. Check backend
echo "1. Checking backend..."
curl -s http://localhost:5000/api/health && echo "✅ Backend OK"

# 2. Check dashboard API
echo "2. Checking dashboard API..."
TIMESTAMP=$(curl -s http://localhost:5000/api/dashboard/summary | jq -r '.summary.latest_training.timestamp')
echo "   Current timestamp: $TIMESTAMP"

# 3. Train with dataset (you'll need to upload via UI)
echo "3. Upload dataset via UI and train..."
echo "   Go to: http://localhost:5173/upload"
read -p "   Press Enter after training completes..."

# 4. Check updated timestamp
echo "4. Checking for updates..."
NEW_TIMESTAMP=$(curl -s http://localhost:5000/api/dashboard/summary | jq -r '.summary.latest_training.timestamp')
echo "   New timestamp: $NEW_TIMESTAMP"

if [ "$TIMESTAMP" != "$NEW_TIMESTAMP" ]; then
    echo "✅ Dashboard is dynamic! Timestamp updated."
else
    echo "❌ Dashboard not updated. Check backend logs."
fi
```

---

## 📝 Summary

The dashboard is now **fully dynamic**:

✅ **Every new training** → Backend saves to `latest_training.json`  
✅ **Dashboard loads** → Fetches from `/api/dashboard/summary`  
✅ **Auto-refresh** → Updates every 30 seconds  
✅ **Manual refresh** → Click refresh button  
✅ **Navigation** → Always shows latest on page load

**Your dashboard will ALWAYS show the most recent training results!** 🎉
