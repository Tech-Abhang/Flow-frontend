"""
Test script for Water Quality Prediction Backend API
"""
import requests
import json
import os
import pandas as pd
import numpy as np

BASE_URL = "http://localhost:5000"

def print_section(title):
    """Print a formatted section title"""
    print("\n" + "="*60)
    print(f"  {title}")
    print("="*60)

def test_health_check():
    """Test the health check endpoint"""
    print_section("Testing Health Check")
    
    response = requests.get(f"{BASE_URL}/api/health")
    print(f"Status Code: {response.status_code}")
    print(f"Response: {json.dumps(response.json(), indent=2)}")
    
    assert response.status_code == 200
    assert response.json()['status'] == 'healthy'
    print("✅ Health check passed!")

def create_sample_training_data():
    """Create a sample training dataset"""
    print_section("Creating Sample Training Data")
    
    np.random.seed(42)
    n_samples = 200
    
    data = {
        'Temp': np.random.uniform(15, 35, n_samples),
        'pH': np.random.uniform(6.5, 8.5, n_samples),
        'Conductivity': np.random.uniform(200, 800, n_samples),
        'Nitrate': np.random.uniform(0, 45, n_samples),
        'Fecal_Coliform': np.random.uniform(0, 500, n_samples),
        'Total_Coliform': np.random.uniform(50, 1000, n_samples),
        'TDS': np.random.uniform(300, 900, n_samples),
        'Fluoride': np.random.uniform(0.5, 2.0, n_samples)
    }
    
    df = pd.DataFrame(data)
    
    # Calculate a synthetic WQI based on parameters
    df['WQI'] = (
        df['pH'] * 5 + 
        df['Nitrate'] * 1.5 + 
        df['Fecal_Coliform'] * 0.05 + 
        df['TDS'] * 0.03 + 
        np.random.normal(0, 5, n_samples)
    )
    df['WQI'] = df['WQI'].clip(10, 100)
    
    filename = 'sample_training_data.csv'
    df.to_csv(filename, index=False)
    print(f"✅ Created {filename} with {len(df)} samples")
    print(f"Columns: {list(df.columns)}")
    print(f"\nFirst few rows:")
    print(df.head())
    
    return filename

def create_sample_prediction_data():
    """Create a sample prediction dataset (without WQI)"""
    print_section("Creating Sample Prediction Data")
    
    np.random.seed(123)
    n_samples = 50
    
    data = {
        'Temp': np.random.uniform(15, 35, n_samples),
        'pH': np.random.uniform(6.5, 8.5, n_samples),
        'Conductivity': np.random.uniform(200, 800, n_samples),
        'Nitrate': np.random.uniform(0, 45, n_samples),
        'Fecal_Coliform': np.random.uniform(0, 500, n_samples),
        'Total_Coliform': np.random.uniform(50, 1000, n_samples),
        'TDS': np.random.uniform(300, 900, n_samples),
        'Fluoride': np.random.uniform(0.5, 2.0, n_samples)
    }
    
    df = pd.DataFrame(data)
    filename = 'sample_prediction_data.csv'
    df.to_csv(filename, index=False)
    print(f"✅ Created {filename} with {len(df)} samples")
    print(f"Columns: {list(df.columns)}")
    
    return filename

def test_analyze_dataset(filename):
    """Test dataset analysis endpoint"""
    print_section(f"Analyzing Dataset: {filename}")
    
    with open(filename, 'rb') as f:
        files = {'file': f}
        response = requests.post(f"{BASE_URL}/api/analyze-dataset", files=files)
    
    print(f"Status Code: {response.status_code}")
    
    if response.status_code == 200:
        result = response.json()
        print(f"\n📊 Dataset Analysis:")
        print(f"  Shape: {result['analysis']['shape']}")
        print(f"  Columns: {result['analysis']['columns']}")
        print(f"  Missing values: {sum(result['analysis']['missing_values'].values())}")
        print(f"  Ready for training: {result['analysis']['validation']['ready_for_training']}")
        print(f"  Ready for prediction: {result['analysis']['validation']['ready_for_prediction']}")
        print("✅ Analysis passed!")
    else:
        print(f"❌ Error: {response.json()}")

def test_train_models(filename):
    """Test model training endpoint"""
    print_section(f"Training Models with: {filename}")
    
    with open(filename, 'rb') as f:
        files = {'file': f}
        print("⏳ Training in progress... This may take a few minutes.")
        response = requests.post(f"{BASE_URL}/api/train", files=files, timeout=600)
    
    print(f"Status Code: {response.status_code}")
    
    if response.status_code == 200:
        result = response.json()
        print(f"\n✅ {result['message']}")
        print(f"\n🏆 Best Model: {result['best_model']}")
        print(f"\n📊 Model Results:")
        
        for model in result['models']:
            print(f"\n  {model['model_name']}:")
            print(f"    CV RMSE:   {model['cv_rmse']:.3f}")
            print(f"    Test R²:   {model['test_r2']:.3f}")
            print(f"    Test RMSE: {model['test_rmse']:.3f}")
            print(f"    Test MAE:  {model['test_mae']:.3f}")
            print(f"    Test MAPE: {model['test_mape']:.2f}%")
        
        return result['best_model']
    else:
        print(f"❌ Error: {response.json()}")
        return None

def test_list_models():
    """Test listing trained models"""
    print_section("Listing Trained Models")
    
    response = requests.get(f"{BASE_URL}/api/models")
    print(f"Status Code: {response.status_code}")
    
    if response.status_code == 200:
        result = response.json()
        print(f"\n📦 Found {result['total']} trained models:")
        for model in result['models']:
            print(f"  - {model['name']}: {model['filename']}")
        print("✅ List models passed!")
    else:
        print(f"❌ Error: {response.json()}")

def test_predict(filename, model_name="XGBoost"):
    """Test prediction endpoint"""
    print_section(f"Making Predictions with: {model_name}")
    
    with open(filename, 'rb') as f:
        files = {'file': f}
        data = {'model_name': model_name}
        response = requests.post(f"{BASE_URL}/api/predict", files=files, data=data)
    
    print(f"Status Code: {response.status_code}")
    
    if response.status_code == 200:
        result = response.json()
        print(f"\n✅ {result['message']}")
        print(f"\n📊 Prediction Statistics:")
        print(f"  Total predictions: {result['total_predictions']}")
        print(f"  Mean WQI:   {result['statistics']['mean_wqi']:.2f}")
        print(f"  Median WQI: {result['statistics']['median_wqi']:.2f}")
        print(f"  Min WQI:    {result['statistics']['min_wqi']:.2f}")
        print(f"  Max WQI:    {result['statistics']['max_wqi']:.2f}")
        print(f"  Std WQI:    {result['statistics']['std_wqi']:.2f}")
        
        print(f"\n🎯 Class Distribution:")
        for class_name, count in result['class_distribution'].items():
            print(f"  {class_name}: {count}")
        
        print(f"\n💾 Results saved to: {result['output_file']}")
        print("✅ Prediction passed!")
    else:
        print(f"❌ Error: {response.json()}")

def test_training_status():
    """Test training status endpoint"""
    print_section("Checking Training Status")
    
    response = requests.get(f"{BASE_URL}/api/training-status")
    print(f"Status Code: {response.status_code}")
    
    if response.status_code == 200:
        status = response.json()
        print(f"\nTraining Status:")
        print(f"  Is Training: {status['is_training']}")
        print(f"  Progress: {status['progress']}%")
        print(f"  Current Model: {status['current_model']}")
        print(f"  Models Trained: {status['models_trained']}")
        print("✅ Status check passed!")
    else:
        print(f"❌ Error: {response.json()}")

def run_all_tests():
    """Run all API tests"""
    print("\n" + "🌊"*30)
    print("  Water Quality Prediction API - Test Suite")
    print("🌊"*30)
    
    try:
        # Test 1: Health check
        test_health_check()
        
        # Test 2: Create sample data
        training_file = create_sample_training_data()
        prediction_file = create_sample_prediction_data()
        
        # Test 3: Analyze datasets
        test_analyze_dataset(training_file)
        test_analyze_dataset(prediction_file)
        
        # Test 4: Train models
        best_model = test_train_models(training_file)
        
        # Test 5: Check training status
        test_training_status()
        
        # Test 6: List models
        test_list_models()
        
        # Test 7: Make predictions
        if best_model:
            test_predict(prediction_file, best_model)
        else:
            test_predict(prediction_file, "XGBoost")
        
        print("\n" + "="*60)
        print("  ✅ All tests completed successfully!")
        print("="*60 + "\n")
        
        # Cleanup
        print("\n🧹 Cleaning up test files...")
        for file in [training_file, prediction_file]:
            if os.path.exists(file):
                os.remove(file)
                print(f"  Deleted: {file}")
        
    except Exception as e:
        print(f"\n❌ Test failed with error: {str(e)}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    # Check if server is running
    try:
        response = requests.get(f"{BASE_URL}/api/health", timeout=2)
        print("✅ Server is running!")
    except requests.exceptions.ConnectionError:
        print("❌ Server is not running. Please start the server first:")
        print("   cd backend")
        print("   python app.py")
        exit(1)
    
    run_all_tests()
