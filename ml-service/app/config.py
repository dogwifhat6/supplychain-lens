"""
Configuration settings for ML service
"""

import os
from typing import List, Optional
from pydantic import BaseSettings

class Settings(BaseSettings):
    """Application settings"""
    
    # API Settings
    API_V1_STR: str = "/api/v1"
    PROJECT_NAME: str = "SupplyChainLens ML Service"
    VERSION: str = "1.0.0"
    
    # Server Settings
    HOST: str = "0.0.0.0"
    PORT: int = 8000
    DEBUG: bool = False
    
    # CORS Settings
    ALLOWED_ORIGINS: List[str] = [
        "http://localhost:3000",
        "http://localhost:3001",
        "http://localhost:5173",
        "http://127.0.0.1:3000",
        "http://127.0.0.1:3001",
        "http://127.0.0.1:5173"
    ]
    
    # Database Settings
    DATABASE_URL: str = os.getenv("DATABASE_URL", "postgresql://postgres:postgres123@localhost:5432/supplychain_lens")
    REDIS_URL: str = os.getenv("REDIS_URL", "redis://localhost:6379")
    
    # Model Settings
    MODEL_DIR: str = "models"
    MAX_IMAGE_SIZE: int = 2048
    DEFAULT_IMAGE_SIZE: int = 512
    BATCH_SIZE: int = 4
    
    # Satellite Data Settings
    SENTINEL_HUB_CLIENT_ID: Optional[str] = os.getenv("SENTINEL_HUB_CLIENT_ID")
    SENTINEL_HUB_CLIENT_SECRET: Optional[str] = os.getenv("SENTINEL_HUB_CLIENT_SECRET")
    PLANET_API_KEY: Optional[str] = os.getenv("PLANET_API_KEY")
    GOOGLE_EARTH_ENGINE_KEY: Optional[str] = os.getenv("GOOGLE_EARTH_ENGINE_KEY")
    
    # AWS Settings
    AWS_ACCESS_KEY_ID: Optional[str] = os.getenv("AWS_ACCESS_KEY_ID")
    AWS_SECRET_ACCESS_KEY: Optional[str] = os.getenv("AWS_SECRET_ACCESS_KEY")
    AWS_REGION: str = os.getenv("AWS_REGION", "us-east-1")
    AWS_S3_BUCKET: Optional[str] = os.getenv("AWS_S3_BUCKET")
    
    # ML Settings
    CONFIDENCE_THRESHOLD: float = 0.5
    MAX_DETECTIONS_PER_IMAGE: int = 100
    ENABLE_GPU: bool = os.getenv("ENABLE_GPU", "false").lower() == "true"
    
    # Logging Settings
    LOG_LEVEL: str = os.getenv("LOG_LEVEL", "INFO")
    LOG_FILE: str = "logs/ml_service.log"
    
    # Monitoring Settings
    ENABLE_METRICS: bool = True
    METRICS_PORT: int = 9090
    
    # Cache Settings
    CACHE_TTL: int = 3600  # 1 hour
    ENABLE_CACHE: bool = True
    
    # Rate Limiting
    RATE_LIMIT_PER_MINUTE: int = 60
    RATE_LIMIT_BURST: int = 10
    
    # File Upload Settings
    MAX_FILE_SIZE: int = 100 * 1024 * 1024  # 100MB
    ALLOWED_EXTENSIONS: List[str] = [".tif", ".tiff", ".jpg", ".jpeg", ".png", ".npy"]
    
    # Processing Settings
    MAX_CONCURRENT_PROCESSING: int = 4
    PROCESSING_TIMEOUT: int = 300  # 5 minutes
    
    # Model-specific Settings
    DEFORESTATION_MODEL_PATH: str = "models/deforestation_model.pth"
    MINING_MODEL_PATH: str = "models/mining_model.pth"
    RISK_ASSESSMENT_MODEL_PATH: str = "models/risk_assessment_model.pkl"
    
    # Geospatial Settings
    DEFAULT_CRS: str = "EPSG:4326"
    MAX_ANALYSIS_AREA_KM2: float = 10000.0  # 10,000 km²
    
    # Alert Settings
    ENABLE_ALERTS: bool = True
    ALERT_WEBHOOK_URL: Optional[str] = os.getenv("ALERT_WEBHOOK_URL")
    
    class Config:
        env_file = ".env"
        case_sensitive = True

# Create settings instance
settings = Settings()

# Create directories if they don't exist
import os
os.makedirs(settings.MODEL_DIR, exist_ok=True)
os.makedirs("logs", exist_ok=True)
os.makedirs("temp", exist_ok=True)
os.makedirs("data", exist_ok=True)
