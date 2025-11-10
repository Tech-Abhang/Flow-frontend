"""
Flask Backend for Water Quality Prediction System
Features:
- Dynamic dataset upload
- Feature engineering
- Train 5 ML models (Ridge, SVR, RandomForest, GradientBoosting, XGBoost)
- Model comparison and analysis
- WQI prediction and classification
"""

import os
import warnings
import traceback
from datetime import datetime

warnings.filterwarnings("ignore")

from flask import Flask, request, jsonify, send_file
from flask_cors import CORS
from werkzeug.utils import secure_filename
import pandas as pd
import numpy as np
import joblib

from sklearn.model_selection import train_test_split, KFold, cross_val_score, RandomizedSearchCV
from sklearn.preprocessing import StandardScaler
from sklearn.pipeline import Pipeline
from sklearn.metrics import r2_score, mean_absolute_error, mean_squared_error, mean_absolute_percentage_error

from sklearn.linear_model import Ridge
from sklearn.ensemble import RandomForestRegressor, GradientBoostingRegressor
from sklearn.svm import SVR
from xgboost import XGBRegressor

import math
import json

# Import utilities
from utils import (
    save_latest_training, 
    get_latest_training, 
    get_training_history,
    save_prediction_metadata,
    get_latest_prediction
)

# Initialize Flask app
app = Flask(__name__)
CORS(app)

# Configuration
UPLOAD_FOLDER = 'uploads'
MODEL_FOLDER = 'models'
RESULTS_FOLDER = 'results'
ALLOWED_EXTENSIONS = {'csv'}

for folder in [UPLOAD_FOLDER, MODEL_FOLDER, RESULTS_FOLDER]:
    os.makedirs(folder, exist_ok=True)

app.config['UPLOAD_FOLDER'] = UPLOAD_FOLDER
app.config['MODEL_FOLDER'] = MODEL_FOLDER
app.config['RESULTS_FOLDER'] = RESULTS_FOLDER
app.config['MAX_CONTENT_LENGTH'] = 50 * 1024 * 1024  # 50MB max file size

# Global variables to store training state
training_state = {
    'is_training': False,
    'progress': 0,
    'current_model': '',
    'models_trained': []
}

# Feature configuration
FEATURES = ['Temp', 'pH', 'Conductivity', 'Nitrate', 'Fecal_Coliform', 
            'Total_Coliform', 'TDS', 'Fluoride']
TARGET = 'WQI'

# Column renaming map for compatibility
RENAME_MAP = {
    'Temperature ⁰C': 'Temp',
    'Temperature': 'Temp',
    'Conductivity (μmhos/cm)': 'Conductivity',
    'Nitrate N (mg/L)': 'Nitrate',
    'Nitrate': 'Nitrate',
    'Faecal Coliform (MPN/100ml)': 'Fecal_Coliform',
    'Fecal Coliform (MPN/100ml)': 'Fecal_Coliform',
    'Total Coliform (MPN/100ml)': 'Total_Coliform',
    'Total Dissolved Solids (mg/L)': 'TDS',
    'Fluoride (mg/L)': 'Fluoride'
}

def allowed_file(filename):
    """Check if file has allowed extension"""
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

def classify_wqi(wqi):
    """Classify WQI value into quality categories"""
    if wqi <= 25:
        return 'Excellent'
    elif wqi <= 50:
        return 'Good'
    elif wqi <= 75:
        return 'Poor'
    elif wqi <= 100:
        return 'Very Poor'
    else:
        return 'Unsuitable for Drinking'

def preprocess_dataframe(df, is_training=True):
    """
    Preprocess dataframe with feature engineering
    - Rename columns to standard names
    - Drop non-numeric columns (e.g., State Name, Location)
    - Handle missing values
    - Create derived features
    """
    # Make a copy
    df = df.copy()
    
    # Rename columns
    present_map = {k: v for k, v in RENAME_MAP.items() if k in df.columns}
    df = df.rename(columns=present_map)
    
    # Drop non-numeric/categorical columns immediately
    # Common non-numeric columns in water quality datasets
    cols_to_drop = ['State Name', 'State', 'Location', 'Station', 'Date', 
                    'Monitoring Location', 'Station Code', 'District', 'Block',
                    'WQI_Classification', 'WQI_Class', 'WQI_Class_Encoded']
    for col in cols_to_drop:
        if col in df.columns:
            df = df.drop(columns=[col])
    
    # Also drop any remaining non-numeric columns
    for col in df.columns:
        if df[col].dtype == 'object' or df[col].dtype == 'string':
            print(f"⚠️ Dropping non-numeric column: {col}")
            df = df.drop(columns=[col])
    
    # Check for required features
    missing_cols = [c for c in FEATURES if c not in df.columns]
    if is_training:
        missing_cols_with_target = [c for c in FEATURES + [TARGET] if c not in df.columns]
        if missing_cols_with_target:
            raise ValueError(f"Missing required columns: {missing_cols_with_target}. Available: {df.columns.tolist()}")
    elif missing_cols:
        raise ValueError(f"Missing required columns: {missing_cols}. Available: {df.columns.tolist()}")
    
    # Feature Engineering
    # 1. Handle missing values with intelligent imputation
    for col in FEATURES:
        if col in df.columns:
            if df[col].isna().any():
                # Use median for numerical features
                df[col].fillna(df[col].median(), inplace=True)
    
    if is_training and TARGET in df.columns:
        if df[TARGET].isna().any():
            df[TARGET].fillna(df[TARGET].median(), inplace=True)
    
    # 2. Create interaction features
    if all(col in df.columns for col in ['pH', 'Temp']):
        df['pH_Temp_interaction'] = df['pH'] * df['Temp']
    
    if all(col in df.columns for col in ['TDS', 'Conductivity']):
        df['TDS_Conductivity_ratio'] = df['TDS'] / (df['Conductivity'] + 1)
    
    if all(col in df.columns for col in ['Fecal_Coliform', 'Total_Coliform']):
        df['Coliform_ratio'] = df['Fecal_Coliform'] / (df['Total_Coliform'] + 1)
    
    # 3. Log transformations for skewed features
    for col in ['Fecal_Coliform', 'Total_Coliform', 'TDS']:
        if col in df.columns:
            df[f'{col}_log'] = np.log1p(df[col])
    
    # 4. Polynomial features for key parameters
    if 'pH' in df.columns:
        df['pH_squared'] = df['pH'] ** 2
    
    if 'Temp' in df.columns:
        df['Temp_squared'] = df['Temp'] ** 2
    
    return df

def build_models():
    """Build all 5 ML model pipelines"""
    models = {}
    
    # 1. Ridge Regression
    models['Ridge'] = Pipeline([
        ('scaler', StandardScaler()),
        ('model', Ridge(random_state=42))
    ])
    
    # 2. Support Vector Regression
    models['SVR'] = Pipeline([
        ('scaler', StandardScaler()),
        ('model', SVR())
    ])
    
    # 3. Random Forest
    models['RandomForest'] = Pipeline([
        ('scaler', 'passthrough'),
        ('model', RandomForestRegressor(random_state=42, n_jobs=-1))
    ])
    
    # 4. Gradient Boosting
    models['GradientBoosting'] = Pipeline([
        ('scaler', 'passthrough'),
        ('model', GradientBoostingRegressor(random_state=42))
    ])
    
    # 5. XGBoost
    models['XGBoost'] = Pipeline([
        ('scaler', 'passthrough'),
        ('model', XGBRegressor(
            random_state=42, 
            n_estimators=300, 
            learning_rate=0.05, 
            max_depth=6,
            subsample=0.8, 
            colsample_bytree=0.8, 
            objective='reg:squarederror', 
            n_jobs=-1
        ))
    ])
    
    return models

def get_param_spaces():
    """Get hyperparameter search spaces for each model"""
    return {
        'Ridge': {
            'model__alpha': np.logspace(-3, 2, 20)
        },
        'SVR': {
            'model__C': np.logspace(-2, 3, 15),
            'model__epsilon': np.logspace(-3, 0, 8),
            'model__gamma': ['scale', 'auto']
        },
        'RandomForest': {
            'model__n_estimators': [200, 400, 600],
            'model__max_depth': [None, 6, 8, 10],
            'model__min_samples_split': [2, 5, 10],
            'model__min_samples_leaf': [1, 2, 4],
            'model__max_features': ['sqrt', 0.7, 0.9]
        },
        'GradientBoosting': {
            'model__n_estimators': [200, 400, 600],
            'model__learning_rate': [0.01, 0.03, 0.05, 0.1],
            'model__max_depth': [3, 4, 5],
            'model__subsample': [0.8, 1.0],
            'model__min_samples_split': [2, 5],
            'model__min_samples_leaf': [1, 2]
        },
        'XGBoost': {
            'model__n_estimators': [300, 500, 800],
            'model__learning_rate': [0.01, 0.03, 0.05, 0.1],
            'model__max_depth': [4, 6, 8],
            'model__subsample': [0.7, 0.8, 1.0],
            'model__colsample_bytree': [0.6, 0.8, 1.0],
            'model__reg_lambda': [0.0, 0.5, 1.0],
            'model__reg_alpha': [0.0, 0.1, 0.5]
        }
    }

@app.route('/api/health', methods=['GET'])
def health_check():
    """Health check endpoint"""
    return jsonify({
        'status': 'healthy',
        'timestamp': datetime.now().isoformat()
    })

@app.route('/api/train', methods=['POST'])
def train_models():
    """
    Train all 5 models on uploaded dataset OR use pre-trained model for inference
    Performs feature engineering, hyperparameter tuning, and model comparison
    """
    try:
        # Check if file is present
        if 'file' not in request.files:
            return jsonify({'error': 'No file provided'}), 400
        
        file = request.files['file']
        
        if file.filename == '':
            return jsonify({'error': 'No file selected'}), 400
        
        if not allowed_file(file.filename):
            return jsonify({'error': 'Invalid file type. Only CSV files allowed'}), 400
        
        # Clear old model files and results before training new models
        print("🗑️ Clearing old models and results...")
        for folder in [app.config['MODEL_FOLDER'], app.config['RESULTS_FOLDER']]:
            for filename in os.listdir(folder):
                filepath = os.path.join(folder, filename)
                try:
                    if os.path.isfile(filepath):
                        os.remove(filepath)
                        print(f"  Deleted: {filename}")
                except Exception as e:
                    print(f"  Error deleting {filename}: {e}")
        
        # Save uploaded file
        filename = secure_filename(file.filename)
        timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
        filename = f"train_{timestamp}_{filename}"
        filepath = os.path.join(app.config['UPLOAD_FOLDER'], filename)
        file.save(filepath)
        
        # Load data
        df = pd.read_csv(filepath)
        print(f"✅ Loaded dataset: {df.shape}")
        print(f"📋 Columns: {df.columns.tolist()}")
        
        # Check if WQI column exists (training mode vs inference mode)
        has_wqi = TARGET in df.columns or 'WQI' in df.columns
        
        if not has_wqi:
            print("⚠️ No WQI column found - switching to inference mode")
            return jsonify({
                'error': 'No WQI column found in dataset. Cannot train models without target variable.',
                'suggestion': 'This dataset appears to be for inference only. Please upload a dataset with WQI values for training, or use the predictions endpoint instead.'
            }), 400
        
        # Preprocess with feature engineering
        df = preprocess_dataframe(df, is_training=True)
        
        # Select only numeric columns for features
        # Get all feature columns (original + engineered), excluding target and non-numeric
        numeric_df = df.select_dtypes(include=[np.number])
        feature_cols = [col for col in numeric_df.columns if col != TARGET and 
                       col not in ['WQI_Class', 'WQI_Class_Encoded', 'WQI_Classification']]
        
        # Ensure we have the required features
        if TARGET not in numeric_df.columns:
            return jsonify({'error': f'Target column "{TARGET}" not found in dataset'}), 400
        
        # Prepare X and y
        X = numeric_df[feature_cols].copy()
        y = numeric_df[TARGET].copy()
        
        # Remove any rows with NaN values
        valid_indices = ~(X.isna().any(axis=1) | y.isna())
        X = X[valid_indices]
        y = y[valid_indices]
        
        if len(X) == 0:
            return jsonify({'error': 'No valid rows after preprocessing'}), 400
        
        print(f"🔧 Features: {len(feature_cols)} columns, {len(X)} samples")
        
        # Train-test split
        X_train, X_test, y_train, y_test = train_test_split(
            X, y, test_size=0.20, random_state=42
        )
        
        print(f"🔧 Split: Train={X_train.shape}, Test={X_test.shape}")
        
        # Build models
        models = build_models()
        param_spaces = get_param_spaces()
        
        # Cross-validation
        cv = KFold(n_splits=5, shuffle=True, random_state=42)
        results = []
        best_estimators = {}
        
        training_state['is_training'] = True
        total_models = len(models)
        
        # Train each model
        for idx, (name, pipe) in enumerate(models.items()):
            training_state['current_model'] = name
            training_state['progress'] = int((idx / total_models) * 100)
            
            print(f"\n⏳ Tuning {name} ({idx+1}/{total_models})...")
            
            params = param_spaces.get(name, {})
            n_iter = 30 if len(params) > 0 else 1
            
            if len(params) > 0:
                # Hyperparameter tuning
                search = RandomizedSearchCV(
                    estimator=pipe,
                    param_distributions=params,
                    n_iter=n_iter,
                    scoring='neg_root_mean_squared_error',
                    n_jobs=-1,
                    cv=cv,
                    random_state=42,
                    verbose=0
                )
                search.fit(X_train, y_train)
                best_pipe = search.best_estimator_
                best_score = -search.best_score_
                best_params = search.best_params_
            else:
                # No tuning needed
                pipe.fit(X_train, y_train)
                scores = -cross_val_score(
                    pipe, X_train, y_train, 
                    scoring='neg_root_mean_squared_error', 
                    cv=cv, n_jobs=-1
                )
                best_pipe = pipe
                best_score = scores.mean()
                best_params = {}
            
            # Evaluate on test set
            best_pipe.fit(X_train, y_train)
            y_pred = best_pipe.predict(X_test)
            
            # Calculate metrics
            r2 = r2_score(y_test, y_pred)
            mae = mean_absolute_error(y_test, y_pred)
            rmse = math.sqrt(mean_squared_error(y_test, y_pred))
            
            # Calculate MAPE safely (avoid division by very small numbers)
            # MAPE = mean(|actual - predicted| / |actual|) * 100
            # Add epsilon to avoid division by zero
            epsilon = 1e-10
            mape = np.mean(np.abs((y_test - y_pred) / (y_test + epsilon))) * 100
            
            # Clip MAPE to reasonable range (0-100%)
            mape = min(mape, 100.0)
            
            # Save model
            model_filename = f"{name}_model_{timestamp}.pkl"
            model_path = os.path.join(app.config['MODEL_FOLDER'], model_filename)
            joblib.dump(best_pipe, model_path)
            
            # Feature importance (for tree-based models)
            feature_importance = None
            try:
                mdl = best_pipe.named_steps['model']
                if hasattr(mdl, 'feature_importances_'):
                    importances = mdl.feature_importances_
                    feature_importance = {
                        'features': feature_cols,
                        'importances': importances.tolist()
                    }
            except:
                pass
            
            results.append({
                'model_name': name,
                'cv_rmse': float(best_score),
                'test_r2': float(r2),
                'test_mae': float(mae),
                'test_rmse': float(rmse),
                'test_mape': float(mape),  # already as percentage (0-100)
                'best_params': {k: str(v) for k, v in best_params.items()},
                'model_file': model_filename,
                'feature_importance': feature_importance
            })
            
            best_estimators[name] = best_pipe
            training_state['models_trained'].append(name)
            
            print(f"✅ {name}: CV RMSE={best_score:.3f}, Test R²={r2:.3f}")
        
        # Sort by test RMSE
        results.sort(key=lambda x: x['test_rmse'])
        best_model = results[0]
        
        # Save training summary
        summary = {
            'timestamp': timestamp,
            'dataset_file': filename,
            'dataset_shape': df.shape,
            'features_used': feature_cols,
            'train_size': len(X_train),
            'test_size': len(X_test),
            'models_trained': results,
            'best_model': best_model['model_name']
        }
        
        summary_path = os.path.join(app.config['RESULTS_FOLDER'], f'training_summary_{timestamp}.json')
        with open(summary_path, 'w') as f:
            json.dump(summary, f, indent=2)
        
        # Save as latest training for dashboard
        save_latest_training(summary)
        
        training_state['is_training'] = False
        training_state['progress'] = 100
        
        return jsonify({
            'success': True,
            'message': 'All models trained successfully',
            'summary': summary,
            'models': results,
            'best_model': best_model['model_name']
        })
        
    except Exception as e:
        training_state['is_training'] = False
        print(f"❌ Training error: {str(e)}")
        traceback.print_exc()
        return jsonify({'error': str(e), 'traceback': traceback.format_exc()}), 500

@app.route('/api/predict', methods=['POST'])
def predict():
    """
    Make predictions on new dataset using a trained model
    """
    try:
        # Check file
        if 'file' not in request.files:
            return jsonify({'error': 'No file provided'}), 400
        
        file = request.files['file']
        model_name = request.form.get('model_name', 'XGBoost')
        
        if file.filename == '':
            return jsonify({'error': 'No file selected'}), 400
        
        if not allowed_file(file.filename):
            return jsonify({'error': 'Invalid file type. Only CSV files allowed'}), 400
        
        # Save file
        filename = secure_filename(file.filename)
        timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
        filename = f"predict_{timestamp}_{filename}"
        filepath = os.path.join(app.config['UPLOAD_FOLDER'], filename)
        file.save(filepath)
        
        # Load data
        df = pd.read_csv(filepath)
        df_original = df.copy()
        
        print(f"✅ Loaded prediction dataset: {df.shape}")
        
        # Preprocess
        df = preprocess_dataframe(df, is_training=False)
        
        # Get feature columns (same as training)
        feature_cols = [col for col in df.columns if col in FEATURES or 
                       any(feat in col for feat in ['interaction', 'ratio', 'log', 'squared'])]
        
        # Load model
        model_files = [f for f in os.listdir(app.config['MODEL_FOLDER']) 
                      if f.startswith(f"{model_name}_model_") and f.endswith('.pkl')]
        
        if not model_files:
            return jsonify({'error': f'No trained model found for {model_name}'}), 404
        
        # Use most recent model
        model_files.sort(reverse=True)
        model_path = os.path.join(app.config['MODEL_FOLDER'], model_files[0])
        
        print(f"📦 Loading model: {model_files[0]}")
        model = joblib.load(model_path)
        
        # Make predictions
        X_pred = df[feature_cols]
        predictions = model.predict(X_pred)
        
        # Add predictions to original dataframe
        df_original['Predicted_WQI'] = predictions
        df_original['WQI_Class'] = df_original['Predicted_WQI'].apply(classify_wqi)
        
        # Calculate statistics
        stats = {
            'mean_wqi': float(predictions.mean()),
            'median_wqi': float(np.median(predictions)),
            'min_wqi': float(predictions.min()),
            'max_wqi': float(predictions.max()),
            'std_wqi': float(predictions.std())
        }
        
        # Class distribution
        class_counts = df_original['WQI_Class'].value_counts().to_dict()
        
        # Save predictions
        output_filename = f"predictions_{model_name}_{timestamp}.csv"
        output_path = os.path.join(app.config['RESULTS_FOLDER'], output_filename)
        df_original.to_csv(output_path, index=False)
        
        # Prepare response with sample predictions
        # Exclude the target column (WQI) if it exists, but include all other columns
        columns_to_send = [col for col in df_original.columns if col != TARGET]
        sample_size = min(100, len(df_original))
        sample_predictions = df_original[columns_to_send].head(sample_size).to_dict(orient='records')
        
        # Save prediction metadata
        prediction_metadata = {
            'timestamp': timestamp,
            'model_used': model_name,
            'total_predictions': len(predictions),
            'statistics': stats,
            'class_distribution': class_counts,
            'output_file': output_filename
        }
        save_prediction_metadata(prediction_metadata)
        
        return jsonify({
            'success': True,
            'message': f'Predictions generated using {model_name}',
            'model_used': model_name,
            'total_predictions': len(predictions),
            'statistics': stats,
            'class_distribution': class_counts,
            'sample_predictions': sample_predictions,
            'output_file': output_filename
        })
        
    except Exception as e:
        print(f"❌ Prediction error: {str(e)}")
        traceback.print_exc()
        return jsonify({'error': str(e), 'traceback': traceback.format_exc()}), 500

@app.route('/api/models', methods=['GET'])
def list_models():
    """List all trained models"""
    try:
        model_files = [f for f in os.listdir(app.config['MODEL_FOLDER']) if f.endswith('.pkl')]
        
        models = []
        for filename in model_files:
            parts = filename.replace('.pkl', '').split('_')
            model_name = parts[0]
            timestamp = '_'.join(parts[2:4]) if len(parts) >= 4 else 'unknown'
            
            models.append({
                'name': model_name,
                'filename': filename,
                'timestamp': timestamp,
                'path': os.path.join(app.config['MODEL_FOLDER'], filename)
            })
        
        models.sort(key=lambda x: x['timestamp'], reverse=True)
        
        return jsonify({
            'success': True,
            'models': models,
            'total': len(models)
        })
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/training-status', methods=['GET'])
def training_status():
    """Get current training status"""
    return jsonify(training_state)

@app.route('/api/dashboard/latest-training', methods=['GET'])
def get_dashboard_training():
    """Get latest training results for dashboard"""
    latest = get_latest_training()
    
    if not latest:
        return jsonify({
            'success': False,
            'message': 'No training data available. Please train models first.'
        }), 404
    
    return jsonify({
        'success': True,
        'data': latest
    })

@app.route('/api/dashboard/latest-prediction', methods=['GET'])
def get_dashboard_prediction():
    """Get latest prediction results for dashboard"""
    latest = get_latest_prediction()
    
    if not latest:
        return jsonify({
            'success': False,
            'message': 'No prediction data available. Please make predictions first.'
        }), 404
    
    return jsonify({
        'success': True,
        'data': latest
    })

@app.route('/api/dashboard/training-history', methods=['GET'])
def get_dashboard_history():
    """Get training history for dashboard charts"""
    history = get_training_history()
    
    return jsonify({
        'success': True,
        'history': history,
        'total_sessions': len(history)
    })

@app.route('/api/dashboard/summary', methods=['GET'])
def get_dashboard_summary():
    """Get complete dashboard summary"""
    latest_training = get_latest_training()
    latest_prediction = get_latest_prediction()
    history = get_training_history()
    
    # Count models
    model_files = [f for f in os.listdir(app.config['MODEL_FOLDER']) if f.endswith('.pkl')]
    
    summary = {
        'has_training_data': latest_training is not None,
        'has_prediction_data': latest_prediction is not None,
        'total_models': len(model_files),
        'total_training_sessions': len(history),
        'latest_training': latest_training,
        'latest_prediction': latest_prediction
    }
    
    return jsonify({
        'success': True,
        'summary': summary
    })

@app.route('/api/download-predictions/<filename>', methods=['GET'])
def download_predictions(filename):
    """Download prediction results"""
    try:
        filepath = os.path.join(app.config['RESULTS_FOLDER'], filename)
        
        if not os.path.exists(filepath):
            return jsonify({'error': 'File not found'}), 404
        
        return send_file(filepath, as_attachment=True)
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/analyze-dataset', methods=['POST'])
def analyze_dataset():
    """
    Analyze uploaded dataset and return statistics
    """
    try:
        if 'file' not in request.files:
            return jsonify({'error': 'No file provided'}), 400
        
        file = request.files['file']
        
        if file.filename == '':
            return jsonify({'error': 'No file selected'}), 400
        
        # Read CSV
        df = pd.read_csv(file)
        
        # Basic info
        info = {
            'shape': df.shape,
            'columns': df.columns.tolist(),
            'dtypes': df.dtypes.astype(str).to_dict(),
            'missing_values': df.isna().sum().to_dict(),
            'statistics': df.describe().to_dict()
        }
        
        # Check for required columns
        df_renamed = df.rename(columns={k: v for k, v in RENAME_MAP.items() if k in df.columns})
        has_features = all(feat in df_renamed.columns for feat in FEATURES)
        has_target = TARGET in df_renamed.columns
        
        info['validation'] = {
            'has_all_features': has_features,
            'has_target': has_target,
            'missing_features': [f for f in FEATURES if f not in df_renamed.columns],
            'ready_for_training': has_features and has_target,
            'ready_for_prediction': has_features
        }
        
        return jsonify({
            'success': True,
            'analysis': info
        })
        
    except Exception as e:
        print(f"❌ Analysis error: {str(e)}")
        return jsonify({'error': str(e)}), 500

if __name__ == '__main__':
    print("🚀 Starting Water Quality Prediction Backend...")
    print(f"📁 Upload folder: {UPLOAD_FOLDER}")
    print(f"📁 Model folder: {MODEL_FOLDER}")
    print(f"📁 Results folder: {RESULTS_FOLDER}")
    app.run(debug=True, host='0.0.0.0', port=5000)
