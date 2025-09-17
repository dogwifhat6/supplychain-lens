"""
Response schemas for ML service API
"""

from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any
from datetime import datetime

class DetectionResponse(BaseModel):
    """Response schema for individual detections"""
    type: str = Field(..., description="Type of detection")
    confidence: float = Field(..., description="Confidence score (0-1)")
    bbox: List[int] = Field(..., description="Bounding box [x, y, width, height]")
    area_hectares: float = Field(..., description="Area in hectares")
    center_coordinates: Dict[str, int] = Field(..., description="Center coordinates")
    class_name: str = Field(..., description="Class name of the detection")
    severity: str = Field(..., description="Severity level: LOW, MEDIUM, HIGH, CRITICAL")
    metadata: Optional[Dict[str, Any]] = Field(None, description="Additional detection metadata")

class GeospatialAnalysisResponse(BaseModel):
    """Response schema for geospatial analysis"""
    coordinates: Dict[str, float] = Field(..., description="Analysis coordinates")
    radius: float = Field(..., description="Analysis radius in meters")
    deforestation_risk: float = Field(..., description="Deforestation risk score")
    mining_risk: float = Field(..., description="Mining risk score")
    protected_area_proximity: float = Field(..., description="Distance to nearest protected area")
    land_use_classification: Dict[str, float] = Field(..., description="Land use classification")
    environmental_factors: Dict[str, Any] = Field(..., description="Environmental factors")

class ProcessingResponse(BaseModel):
    """Response schema for image processing"""
    image_id: str = Field(..., description="Image identifier")
    status: str = Field(..., description="Processing status")
    detections: List[DetectionResponse] = Field(..., description="List of detections")
    geospatial_analysis: GeospatialAnalysisResponse = Field(..., description="Geospatial analysis results")
    processing_time: str = Field(..., description="Processing completion time")
    model_versions: Dict[str, str] = Field(..., description="Model versions used")

class RiskAssessmentResponse(BaseModel):
    """Response schema for risk assessment"""
    supplier_id: str = Field(..., description="Supplier identifier")
    risk_score: float = Field(..., description="Overall risk score (0-100)")
    risk_level: str = Field(..., description="Risk level: LOW, MEDIUM, HIGH, CRITICAL")
    factors: Dict[str, Any] = Field(..., description="Risk factors breakdown")
    confidence: float = Field(..., description="Assessment confidence (0-100)")
    assessed_at: str = Field(..., description="Assessment timestamp")
    recommendations: List[str] = Field(..., description="Risk mitigation recommendations")

class BatchProcessingResponse(BaseModel):
    """Response schema for batch processing"""
    batch_id: str = Field(..., description="Batch identifier")
    total_images: int = Field(..., description="Total number of images")
    successful: int = Field(..., description="Number of successfully processed images")
    failed: int = Field(..., description="Number of failed images")
    results: List[ProcessingResponse] = Field(..., description="Processing results")
    errors: List[Dict[str, str]] = Field(..., description="Error details for failed images")
    completed_at: str = Field(..., description="Batch completion time")

class ModelInfoResponse(BaseModel):
    """Response schema for model information"""
    model_name: str = Field(..., description="Model name")
    version: str = Field(..., description="Model version")
    architecture: str = Field(..., description="Model architecture")
    input_size: List[int] = Field(..., description="Input size")
    output_classes: List[str] = Field(..., description="Output classes")
    accuracy: Optional[float] = Field(None, description="Model accuracy")
    last_trained: Optional[str] = Field(None, description="Last training date")

class AnalyticsResponse(BaseModel):
    """Response schema for analytics data"""
    period: str = Field(..., description="Analysis period")
    total_detections: int = Field(..., description="Total number of detections")
    detection_types: Dict[str, int] = Field(..., description="Count by detection type")
    risk_distribution: Dict[str, int] = Field(..., description="Risk level distribution")
    geographic_coverage: Dict[str, Any] = Field(..., description="Geographic coverage")
    trends: Dict[str, List[float]] = Field(..., description="Trend data")
    top_risk_areas: List[Dict[str, Any]] = Field(..., description="Top risk areas")

class ErrorResponse(BaseModel):
    """Response schema for errors"""
    error: str = Field(..., description="Error message")
    error_code: str = Field(..., description="Error code")
    details: Optional[Dict[str, Any]] = Field(None, description="Error details")
    timestamp: str = Field(..., description="Error timestamp")

class HealthResponse(BaseModel):
    """Response schema for health check"""
    status: str = Field(..., description="Service status")
    timestamp: str = Field(..., description="Health check timestamp")
    models_loaded: Dict[str, bool] = Field(..., description="Model loading status")
    database_connected: bool = Field(..., description="Database connection status")
    redis_connected: bool = Field(..., description="Redis connection status")
    version: str = Field(..., description="Service version")
