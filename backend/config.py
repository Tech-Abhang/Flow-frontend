"""
Configuration module for Flask backend
"""
import os
from datetime import timedelta

class Config:
    """Base configuration"""
    # Flask
    SECRET_KEY = os.environ.get('SECRET_KEY') or 'dev-secret-key-change-in-production'
    
    # File Upload
    UPLOAD_FOLDER = os.environ.get('UPLOAD_FOLDER', 'uploads')
    MODEL_FOLDER = os.environ.get('MODEL_FOLDER', 'models')
    RESULTS_FOLDER = os.environ.get('RESULTS_FOLDER', 'results')
    MAX_CONTENT_LENGTH = int(os.environ.get('MAX_CONTENT_LENGTH', 52428800))  # 50MB
    
    # CORS
    CORS_ORIGINS = os.environ.get('CORS_ORIGINS', '*')
    
    # Model Configuration
    DEFAULT_MODEL = os.environ.get('DEFAULT_MODEL', 'XGBoost')
    CV_FOLDS = int(os.environ.get('CV_FOLDS', 5))
    RANDOM_STATE = int(os.environ.get('RANDOM_STATE', 42))
    TEST_SIZE = float(os.environ.get('TEST_SIZE', 0.2))
    
    # Hyperparameter Tuning
    TUNING_ITERATIONS = int(os.environ.get('TUNING_ITERATIONS', 30))
    N_JOBS = int(os.environ.get('N_JOBS', -1))

class DevelopmentConfig(Config):
    """Development configuration"""
    DEBUG = True
    TESTING = False

class ProductionConfig(Config):
    """Production configuration"""
    DEBUG = False
    TESTING = False

class TestingConfig(Config):
    """Testing configuration"""
    DEBUG = True
    TESTING = True
    TUNING_ITERATIONS = 5  # Faster for tests

config = {
    'development': DevelopmentConfig,
    'production': ProductionConfig,
    'testing': TestingConfig,
    'default': DevelopmentConfig
}
