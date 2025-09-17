# SupplyChainLens ML Service

A comprehensive machine learning service for satellite image processing and ESG risk assessment in supply chains.

## Features

### Core ML Models
- **Deforestation Detection**: U-Net + Vision Transformer for forest loss detection
- **Mining Activity Detection**: SegFormer-based semantic segmentation for mining activities
- **Risk Assessment**: XGBoost + Neural Network for comprehensive ESG risk scoring

### Image Processing
- Multi-spectral satellite image processing
- Atmospheric correction and cloud masking
- Image enhancement and augmentation
- Feature extraction and analysis

### Geospatial Analysis
- Protected area proximity analysis
- Country-level risk assessment
- Land use classification
- Environmental factor analysis

### API Endpoints
- Real-time image processing
- Batch processing capabilities
- Risk assessment and scoring
- Analytics and trend analysis

## Quick Start

### Prerequisites
- Python 3.9+
- CUDA-capable GPU (optional but recommended)
- PostgreSQL 15+
- Redis 7+

### Installation

1. **Clone and navigate to ML service directory:**
   ```bash
   cd ml-service
   ```

2. **Create virtual environment:**
   ```bash
   python -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   ```

3. **Install dependencies:**
   ```bash
   pip install -r requirements.txt
   ```

4. **Set up environment variables:**
   ```bash
   cp .env.example .env
   # Edit .env with your configuration
   ```

5. **Start the service:**
   ```bash
   python -m uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
   ```

### Using Docker

1. **Build the image:**
   ```bash
   docker build -t supplychain-ml-service .
   ```

2. **Run the container:**
   ```bash
   docker run -p 8000:8000 \
     -e DATABASE_URL="postgresql://user:pass@host:5432/db" \
     -e REDIS_URL="redis://host:6379" \
     supplychain-ml-service
   ```

## API Documentation

### Core Endpoints

#### Health Check
```http
GET /health
```

#### Process Single Image
```http
POST /process/satellite-image
Content-Type: application/json

{
  "image_id": "sentinel-2-20240115-001",
  "image_url": "https://example.com/image.tif",
  "coordinates": {"lat": -3.119, "lng": -60.021},
  "bounds": {"type": "Polygon", "coordinates": [...]},
  "detect_deforestation": true,
  "detect_mining": true
}
```

#### Risk Assessment
```http
POST /assess/risk
Content-Type: application/json

{
  "supplier_id": "supplier-123",
  "assessment_period": 30,
  "include_historical": true
}
```

#### Batch Processing
```http
POST /process/batch
Content-Type: application/json

{
  "batch_id": "batch-001",
  "images": [...],
  "priority": "high"
}
```

### Response Examples

#### Processing Response
```json
{
  "image_id": "sentinel-2-20240115-001",
  "status": "completed",
  "detections": [
    {
      "type": "FOREST_LOSS",
      "confidence": 0.89,
      "bbox": [100, 150, 200, 250],
      "area_hectares": 45.2,
      "center_coordinates": {"x": 200, "y": 200},
      "severity": "HIGH"
    }
  ],
  "geospatial_analysis": {
    "protected_areas": {...},
    "country_context": {...},
    "risk_zones": {...}
  }
}
```

#### Risk Assessment Response
```json
{
  "supplier_id": "supplier-123",
  "risk_score": 75.5,
  "risk_level": "HIGH",
  "factors": {
    "deforestation_rate": {"score": 0.8, "impact": "HIGH"},
    "mining_activity_score": {"score": 0.6, "impact": "MEDIUM"}
  },
  "confidence": 87.3,
  "recommendations": [
    "Implement strict deforestation monitoring",
    "Conduct compliance audit"
  ]
}
```

## Model Architecture

### Deforestation Detection
- **Architecture**: U-Net with Vision Transformer blocks
- **Input**: 4-channel satellite image (RGB + NIR)
- **Output**: Segmentation mask with forest/deforested/water/other classes
- **Features**: Change detection, temporal analysis, confidence scoring

### Mining Detection
- **Architecture**: SegFormer (Vision Transformer for segmentation)
- **Input**: 3-channel RGB satellite image
- **Output**: Mining activity segmentation
- **Features**: Activity type classification, shape analysis, severity assessment

### Risk Assessment
- **Architecture**: XGBoost + Neural Network ensemble
- **Input**: 20+ features (deforestation rate, mining activity, etc.)
- **Output**: Risk score (0-100) with factor breakdown
- **Features**: Multi-factor analysis, confidence scoring, recommendations

## Configuration

### Environment Variables

```env
# Database
DATABASE_URL="postgresql://user:pass@host:5432/db"
REDIS_URL="redis://host:6379"

# Satellite APIs
SENTINEL_HUB_CLIENT_ID="your-client-id"
SENTINEL_HUB_CLIENT_SECRET="your-client-secret"
PLANET_API_KEY="your-planet-api-key"

# AWS
AWS_ACCESS_KEY_ID="your-access-key"
AWS_SECRET_ACCESS_KEY="your-secret-key"
AWS_REGION="us-east-1"
AWS_S3_BUCKET="your-bucket"

# ML Settings
ENABLE_GPU=true
CONFIDENCE_THRESHOLD=0.5
MAX_IMAGE_SIZE=2048
BATCH_SIZE=4

# Logging
LOG_LEVEL=INFO
```

## Development

### Project Structure
```
ml-service/
├── app/
│   ├── models/              # ML model implementations
│   │   ├── deforestation_detector.py
│   │   ├── mining_detector.py
│   │   └── risk_assessor.py
│   ├── services/            # Business logic services
│   │   ├── satellite_service.py
│   │   ├── image_processor.py
│   │   └── geospatial_service.py
│   ├── schemas/             # Pydantic schemas
│   ├── database/            # Database operations
│   ├── utils/               # Utility functions
│   └── main.py              # FastAPI application
├── models/                  # Trained model files
├── logs/                    # Application logs
├── tests/                   # Test files
└── requirements.txt         # Dependencies
```

### Available Scripts

```bash
# Development server
python -m uvicorn app.main:app --reload

# Run tests
pytest

# Format code
black app/
isort app/

# Type checking
mypy app/

# Linting
flake8 app/
```

### Model Training

```bash
# Train deforestation model
python scripts/train_deforestation_model.py

# Train mining detection model
python scripts/train_mining_model.py

# Train risk assessment model
python scripts/train_risk_assessor.py
```

## Performance

### Optimization Features
- GPU acceleration with CUDA
- Batch processing for multiple images
- Redis caching for frequent queries
- Async/await for concurrent processing
- Model quantization for faster inference

### Monitoring
- Performance metrics logging
- Model inference timing
- Resource usage monitoring
- Error tracking and alerting

## Deployment

### Docker Deployment
```bash
# Build image
docker build -t supplychain-ml-service .

# Run with GPU support
docker run --gpus all -p 8000:8000 supplychain-ml-service

# Run with docker-compose
docker-compose up -d
```

### Production Considerations
- Use GPU-enabled instances for better performance
- Set up proper logging and monitoring
- Configure auto-scaling based on load
- Use CDN for model file distribution
- Implement proper error handling and retries

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests
5. Submit a pull request

## License

MIT License - see LICENSE file for details
