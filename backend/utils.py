"""
Utility functions for managing training results and model metadata
"""
import os
import json
from datetime import datetime

RESULTS_FOLDER = 'results'
LATEST_TRAINING_FILE = os.path.join(RESULTS_FOLDER, 'latest_training.json')
TRAINING_HISTORY_FILE = os.path.join(RESULTS_FOLDER, 'training_history.json')

def save_latest_training(training_data):
    """
    Save the latest training results for dashboard display
    """
    os.makedirs(RESULTS_FOLDER, exist_ok=True)
    
    with open(LATEST_TRAINING_FILE, 'w') as f:
        json.dump(training_data, f, indent=2)
    
    # Also append to history
    append_to_training_history(training_data)

def get_latest_training():
    """
    Get the latest training results
    """
    if not os.path.exists(LATEST_TRAINING_FILE):
        return None
    
    with open(LATEST_TRAINING_FILE, 'r') as f:
        return json.load(f)

def append_to_training_history(training_data):
    """
    Append training results to history
    """
    history = []
    
    if os.path.exists(TRAINING_HISTORY_FILE):
        with open(TRAINING_HISTORY_FILE, 'r') as f:
            history = json.load(f)
    
    # Add timestamp if not present
    if 'timestamp' not in training_data:
        training_data['timestamp'] = datetime.now().isoformat()
    
    history.append(training_data)
    
    # Keep only last 50 training sessions
    history = history[-50:]
    
    with open(TRAINING_HISTORY_FILE, 'w') as f:
        json.dump(history, f, indent=2)

def get_training_history():
    """
    Get all training history
    """
    if not os.path.exists(TRAINING_HISTORY_FILE):
        return []
    
    with open(TRAINING_HISTORY_FILE, 'r') as f:
        return json.load(f)

def save_prediction_metadata(prediction_data):
    """
    Save metadata about predictions for dashboard
    """
    metadata_file = os.path.join(RESULTS_FOLDER, 'latest_prediction.json')
    
    with open(metadata_file, 'w') as f:
        json.dump(prediction_data, f, indent=2)

def get_latest_prediction():
    """
    Get the latest prediction metadata
    """
    metadata_file = os.path.join(RESULTS_FOLDER, 'latest_prediction.json')
    
    if not os.path.exists(metadata_file):
        return None
    
    with open(metadata_file, 'r') as f:
        return json.load(f)
