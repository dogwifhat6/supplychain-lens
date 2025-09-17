"""
SupplyChainLens ML Service
Satellite Image Processing and Analysis Pipeline
"""

from fastapi import FastAPI, HTTPException, BackgroundTasks, Depends
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
import uvicorn
import os
import logging
from typing import List, Optional, Dict, Any
import asyncio
from datetime import datetime

from .models.deforestation_detector import DeforestationDetector
from .models.mining_detector import MiningDetector
from .models.risk_assessor import RiskAssessor
from .services.satellite_service import SatelliteService
from .services.image_processor import ImageProcessor
from .services.geospatial_service import GeospatialService
from .database.connection import get_database
from .schemas.requests import (
    ProcessImageRequest,
    RiskAssessmentRequest,
    BatchProcessRequest
)
from .schemas.responses import (
    ProcessingResponse,
    DetectionResponse,
    RiskAssessmentResponse,
    BatchProcessingResponse
)
from .utils.logger import setup_logger
from .config import settings

# Setup logging
logger = setup_logger(__name__)

# Initialize FastAPI app
app = FastAPI(
    title="SupplyChainLens ML Service",
    description="Satellite image processing and ESG risk assessment ML pipeline",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc"
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize ML models
deforestation_detector = None
mining_detector = None
risk_assessor = None
satellite_service = None
image_processor = None
geospatial_service = None

@app.on_event("startup")
async def startup_event():
    """Initialize ML models and services on startup"""
    global deforestation_detector, mining_detector, risk_assessor
    global satellite_service, image_processor, geospatial_service
    
    logger.info("Initializing ML Service...")
    
    try:
        # Initialize services
        satellite_service = SatelliteService()
        image_processor = ImageProcessor()
        geospatial_service = GeospatialService()
        
        # Initialize ML models
        logger.info("Loading deforestation detection model...")
        deforestation_detector = DeforestationDetector()
        await deforestation_detector.load_model()
        
        logger.info("Loading mining detection model...")
        mining_detector = MiningDetector()
        await mining_detector.load_model()
        
        logger.info("Loading risk assessment model...")
        risk_assessor = RiskAssessor()
        await risk_assessor.load_model()
        
        logger.info("ML Service initialized successfully!")
        
    except Exception as e:
        logger.error(f"Failed to initialize ML Service: {e}")
        raise

@app.on_event("shutdown")
async def shutdown_event():
    """Cleanup on shutdown"""
    logger.info("Shutting down ML Service...")

@app.get("/health")
async def health_check():
    """Health check endpoint"""
    return {
        "status": "healthy",
        "timestamp": datetime.utcnow().isoformat(),
        "models_loaded": {
            "deforestation": deforestation_detector is not None,
            "mining": mining_detector is not None,
            "risk_assessment": risk_assessor is not None
        }
    }

@app.get("/models/info")
async def get_models_info():
    """Get information about loaded models"""
    return {
        "deforestation_detector": {
            "name": "DeforestationDetector",
            "version": "1.0.0",
            "architecture": "U-Net + Vision Transformer",
            "input_size": [512, 512, 4],
            "output_classes": ["forest", "deforested", "water", "other"]
        },
        "mining_detector": {
            "name": "MiningDetector",
            "version": "1.0.0",
            "architecture": "SegFormer + ResNet",
            "input_size": [512, 512, 3],
            "output_classes": ["mining", "infrastructure", "vegetation", "water"]
        },
        "risk_assessor": {
            "name": "RiskAssessor",
            "version": "1.0.0",
            "architecture": "XGBoost + Neural Network",
            "features": ["deforestation_rate", "mining_activity", "proximity_risk", "historical_data"]
        }
    }

@app.post("/process/satellite-image", response_model=ProcessingResponse)
async def process_satellite_image(
    request: ProcessImageRequest,
    background_tasks: BackgroundTasks
):
    """Process a single satellite image for deforestation and mining detection"""
    try:
        logger.info(f"Processing satellite image: {request.image_id}")
        
        # Download and preprocess image
        image_data = await satellite_service.download_image(
            request.image_url,
            request.coordinates,
            request.bounds
        )
        
        # Preprocess image
        processed_image = await image_processor.preprocess_image(
            image_data,
            target_size=(512, 512)
        )
        
        # Run detections
        detections = []
        
        # Deforestation detection
        if request.detect_deforestation:
            deforestation_results = await deforestation_detector.predict(processed_image)
            detections.extend(deforestation_results)
        
        # Mining detection
        if request.detect_mining:
            mining_results = await mining_detector.predict(processed_image)
            detections.extend(mining_results)
        
        # Geospatial analysis
        geospatial_analysis = await geospatial_service.analyze_location(
            request.coordinates,
            request.bounds
        )
        
        # Store results in database
        background_tasks.add_task(
            store_processing_results,
            request.image_id,
            detections,
            geospatial_analysis
        )
        
        return ProcessingResponse(
            image_id=request.image_id,
            status="completed",
            detections=detections,
            geospatial_analysis=geospatial_analysis,
            processing_time=datetime.utcnow().isoformat()
        )
        
    except Exception as e:
        logger.error(f"Error processing image {request.image_id}: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/assess/risk", response_model=RiskAssessmentResponse)
async def assess_risk(request: RiskAssessmentRequest):
    """Assess ESG risk for a supplier based on multiple factors"""
    try:
        logger.info(f"Assessing risk for supplier: {request.supplier_id}")
        
        # Gather data for risk assessment
        risk_data = await gather_risk_data(request.supplier_id, request.assessment_period)
        
        # Run risk assessment
        risk_score = await risk_assessor.assess_risk(risk_data)
        
        # Generate risk factors breakdown
        risk_factors = await risk_assessor.get_risk_factors(risk_data)
        
        return RiskAssessmentResponse(
            supplier_id=request.supplier_id,
            risk_score=risk_score,
            risk_level=get_risk_level(risk_score),
            factors=risk_factors,
            confidence=risk_score.get('confidence', 0.0),
            assessed_at=datetime.utcnow().isoformat()
        )
        
    except Exception as e:
        logger.error(f"Error assessing risk for supplier {request.supplier_id}: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/process/batch", response_model=BatchProcessingResponse)
async def process_batch(request: BatchProcessRequest, background_tasks: BackgroundTasks):
    """Process multiple satellite images in batch"""
    try:
        logger.info(f"Processing batch of {len(request.images)} images")
        
        # Process images in parallel
        tasks = []
        for image_request in request.images:
            task = process_satellite_image(image_request, background_tasks)
            tasks.append(task)
        
        results = await asyncio.gather(*tasks, return_exceptions=True)
        
        # Filter out exceptions and collect results
        successful_results = []
        failed_results = []
        
        for i, result in enumerate(results):
            if isinstance(result, Exception):
                failed_results.append({
                    "image_id": request.images[i].image_id,
                    "error": str(result)
                })
            else:
                successful_results.append(result)
        
        return BatchProcessingResponse(
            batch_id=request.batch_id,
            total_images=len(request.images),
            successful=len(successful_results),
            failed=len(failed_results),
            results=successful_results,
            errors=failed_results,
            completed_at=datetime.utcnow().isoformat()
        )
        
    except Exception as e:
        logger.error(f"Error processing batch {request.batch_id}: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/detections/{supplier_id}")
async def get_supplier_detections(supplier_id: str, limit: int = 100):
    """Get detections for a specific supplier"""
    try:
        db = await get_database()
        
        # Query detections from database
        detections = await db.fetch_detections_by_supplier(supplier_id, limit)
        
        return {
            "supplier_id": supplier_id,
            "detections": detections,
            "count": len(detections)
        }
        
    except Exception as e:
        logger.error(f"Error fetching detections for supplier {supplier_id}: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/analytics/trends")
async def get_analytics_trends(
    organization_id: str,
    start_date: Optional[str] = None,
    end_date: Optional[str] = None
):
    """Get analytics trends for an organization"""
    try:
        db = await get_database()
        
        trends = await db.get_analytics_trends(
            organization_id,
            start_date,
            end_date
        )
        
        return trends
        
    except Exception as e:
        logger.error(f"Error fetching analytics trends: {e}")
        raise HTTPException(status_code=500, detail=str(e))

# Helper functions
async def store_processing_results(image_id: str, detections: List[Dict], geospatial_analysis: Dict):
    """Store processing results in database"""
    try:
        db = await get_database()
        await db.store_detections(image_id, detections, geospatial_analysis)
    except Exception as e:
        logger.error(f"Error storing processing results: {e}")

async def gather_risk_data(supplier_id: str, assessment_period: int) -> Dict:
    """Gather data needed for risk assessment"""
    try:
        db = await get_database()
        
        # Get supplier data
        supplier_data = await db.get_supplier_data(supplier_id)
        
        # Get recent detections
        detections = await db.get_recent_detections(supplier_id, assessment_period)
        
        # Get historical data
        historical_data = await db.get_historical_risk_data(supplier_id, assessment_period)
        
        return {
            "supplier": supplier_data,
            "detections": detections,
            "historical": historical_data,
            "assessment_period": assessment_period
        }
        
    except Exception as e:
        logger.error(f"Error gathering risk data for supplier {supplier_id}: {e}")
        raise

def get_risk_level(risk_score: float) -> str:
    """Convert risk score to risk level"""
    if risk_score >= 80:
        return "CRITICAL"
    elif risk_score >= 60:
        return "HIGH"
    elif risk_score >= 40:
        return "MEDIUM"
    else:
        return "LOW"

if __name__ == "__main__":
    uvicorn.run(
        "app.main:app",
        host="0.0.0.0",
        port=8000,
        reload=True,
        log_level="info"
    )
