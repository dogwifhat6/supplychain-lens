"""
Request schemas for ML service API
"""

from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any
from datetime import datetime

class ProcessImageRequest(BaseModel):
    """Request schema for processing a single satellite image"""
    image_id: str = Field(..., description="Unique identifier for the image")
    image_url: str = Field(..., description="URL or path to the satellite image")
    coordinates: Dict[str, float] = Field(..., description="Center coordinates of the image")
    bounds: Dict[str, Any] = Field(..., description="Bounding box of the image area")
    detect_deforestation: bool = Field(True, description="Whether to detect deforestation")
    detect_mining: bool = Field(True, description="Whether to detect mining activities")
    metadata: Optional[Dict[str, Any]] = Field(None, description="Additional image metadata")

class RiskAssessmentRequest(BaseModel):
    """Request schema for risk assessment"""
    supplier_id: str = Field(..., description="Supplier identifier")
    assessment_period: int = Field(30, description="Assessment period in days")
    include_historical: bool = Field(True, description="Include historical data")
    risk_categories: Optional[List[str]] = Field(None, description="Specific risk categories to assess")

class BatchProcessRequest(BaseModel):
    """Request schema for batch processing multiple images"""
    batch_id: str = Field(..., description="Unique identifier for the batch")
    images: List[ProcessImageRequest] = Field(..., description="List of images to process")
    priority: str = Field("normal", description="Processing priority: low, normal, high")
    callback_url: Optional[str] = Field(None, description="URL to call when processing is complete")

class GeospatialAnalysisRequest(BaseModel):
    """Request schema for geospatial analysis"""
    coordinates: Dict[str, float] = Field(..., description="Center coordinates")
    radius: float = Field(1000, description="Analysis radius in meters")
    analysis_types: List[str] = Field(["deforestation", "mining"], description="Types of analysis to perform")
    time_range: Optional[Dict[str, str]] = Field(None, description="Time range for analysis")

class ModelTrainingRequest(BaseModel):
    """Request schema for model training"""
    model_type: str = Field(..., description="Type of model to train")
    training_data: List[Dict[str, Any]] = Field(..., description="Training data")
    validation_data: Optional[List[Dict[str, Any]]] = Field(None, description="Validation data")
    hyperparameters: Optional[Dict[str, Any]] = Field(None, description="Model hyperparameters")
    save_model: bool = Field(True, description="Whether to save the trained model")

class DetectionFilterRequest(BaseModel):
    """Request schema for filtering detections"""
    supplier_id: Optional[str] = Field(None, description="Filter by supplier ID")
    detection_type: Optional[str] = Field(None, description="Filter by detection type")
    confidence_min: Optional[float] = Field(None, description="Minimum confidence threshold")
    date_from: Optional[datetime] = Field(None, description="Start date filter")
    date_to: Optional[datetime] = Field(None, description="End date filter")
    limit: int = Field(100, description="Maximum number of results")
    offset: int = Field(0, description="Number of results to skip")
