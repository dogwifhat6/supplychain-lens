"""
Database connection and operations for ML service
"""

import asyncpg
import redis
import logging
from typing import Dict, List, Any, Optional
import json
from datetime import datetime
import asyncio

logger = logging.getLogger(__name__)

class DatabaseConnection:
    """Database connection manager"""
    
    def __init__(self, database_url: str, redis_url: str):
        self.database_url = database_url
        self.redis_url = redis_url
        self.pool = None
        self.redis_client = None
    
    async def connect(self):
        """Establish database connections"""
        try:
            # PostgreSQL connection pool
            self.pool = await asyncpg.create_pool(
                self.database_url,
                min_size=5,
                max_size=20,
                command_timeout=60
            )
            logger.info("PostgreSQL connection pool created")
            
            # Redis connection
            self.redis_client = redis.from_url(self.redis_url)
            self.redis_client.ping()  # Test connection
            logger.info("Redis connection established")
            
        except Exception as e:
            logger.error(f"Error connecting to databases: {e}")
            raise
    
    async def close(self):
        """Close database connections"""
        try:
            if self.pool:
                await self.pool.close()
            if self.redis_client:
                self.redis_client.close()
            logger.info("Database connections closed")
        except Exception as e:
            logger.error(f"Error closing database connections: {e}")
    
    async def execute_query(self, query: str, *args) -> List[Dict[str, Any]]:
        """Execute a SELECT query"""
        try:
            async with self.pool.acquire() as conn:
                rows = await conn.fetch(query, *args)
                return [dict(row) for row in rows]
        except Exception as e:
            logger.error(f"Error executing query: {e}")
            raise
    
    async def execute_command(self, command: str, *args) -> str:
        """Execute a command (INSERT, UPDATE, DELETE)"""
        try:
            async with self.pool.acquire() as conn:
                result = await conn.execute(command, *args)
                return result
        except Exception as e:
            logger.error(f"Error executing command: {e}")
            raise
    
    async def fetch_one(self, query: str, *args) -> Optional[Dict[str, Any]]:
        """Fetch a single row"""
        try:
            async with self.pool.acquire() as conn:
                row = await conn.fetchrow(query, *args)
                return dict(row) if row else None
        except Exception as e:
            logger.error(f"Error fetching one row: {e}")
            raise
    
    def get_redis_client(self) -> redis.Redis:
        """Get Redis client"""
        return self.redis_client

# Global database instance
_db_connection = None

async def get_database() -> DatabaseConnection:
    """Get database connection instance"""
    global _db_connection
    if _db_connection is None:
        from ..config import settings
        _db_connection = DatabaseConnection(
            settings.DATABASE_URL,
            settings.REDIS_URL
        )
        await _db_connection.connect()
    return _db_connection

class MLDatabaseOperations:
    """Database operations specific to ML service"""
    
    def __init__(self, db_connection: DatabaseConnection):
        self.db = db_connection
    
    async def store_detection(self, detection_data: Dict[str, Any]) -> str:
        """Store detection result in database"""
        try:
            query = """
                INSERT INTO detections (
                    type, confidence, coordinates, area, metadata, 
                    image_url, processed_at, created_at
                ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
                RETURNING id
            """
            
            detection_id = await self.db.execute_command(
                query,
                detection_data.get("type"),
                detection_data.get("confidence"),
                json.dumps(detection_data.get("coordinates", {})),
                detection_data.get("area_hectares", 0),
                json.dumps(detection_data.get("metadata", {})),
                detection_data.get("image_url"),
                datetime.utcnow(),
                datetime.utcnow()
            )
            
            return detection_id
        except Exception as e:
            logger.error(f"Error storing detection: {e}")
            raise
    
    async def store_detections(self, image_id: str, detections: List[Dict[str, Any]], 
                             geospatial_analysis: Dict[str, Any]) -> List[str]:
        """Store multiple detections for an image"""
        try:
            detection_ids = []
            
            for detection in detections:
                # Add geospatial context to detection metadata
                detection_metadata = detection.get("metadata", {})
                detection_metadata.update({
                    "geospatial_analysis": geospatial_analysis,
                    "image_id": image_id
                })
                
                detection_data = {
                    "type": detection.get("type"),
                    "confidence": detection.get("confidence"),
                    "coordinates": detection.get("center_coordinates", {}),
                    "area_hectares": detection.get("area_hectares", 0),
                    "metadata": detection_metadata,
                    "image_url": detection.get("image_url"),
                    "processed_at": datetime.utcnow(),
                    "created_at": datetime.utcnow()
                }
                
                detection_id = await self.store_detection(detection_data)
                detection_ids.append(detection_id)
            
            return detection_ids
        except Exception as e:
            logger.error(f"Error storing detections: {e}")
            raise
    
    async def fetch_detections_by_supplier(self, supplier_id: str, limit: int = 100) -> List[Dict[str, Any]]:
        """Fetch detections for a specific supplier"""
        try:
            query = """
                SELECT d.*, s.name as supplier_name, s.country
                FROM detections d
                JOIN satellite_data sd ON d.image_url = sd.image_url
                JOIN suppliers s ON sd.supplier_id = s.id
                WHERE s.id = $1
                ORDER BY d.created_at DESC
                LIMIT $2
            """
            
            detections = await self.db.execute_query(query, supplier_id, limit)
            return detections
        except Exception as e:
            logger.error(f"Error fetching detections by supplier: {e}")
            raise
    
    async def fetch_detections_by_type(self, detection_type: str, limit: int = 100) -> List[Dict[str, Any]]:
        """Fetch detections by type"""
        try:
            query = """
                SELECT d.*, s.name as supplier_name, s.country
                FROM detections d
                LEFT JOIN satellite_data sd ON d.image_url = sd.image_url
                LEFT JOIN suppliers s ON sd.supplier_id = s.id
                WHERE d.type = $1
                ORDER BY d.created_at DESC
                LIMIT $2
            """
            
            detections = await self.db.execute_query(query, detection_type, limit)
            return detections
        except Exception as e:
            logger.error(f"Error fetching detections by type: {e}")
            raise
    
    async def store_risk_assessment(self, assessment_data: Dict[str, Any]) -> str:
        """Store risk assessment result"""
        try:
            query = """
                INSERT INTO risk_assessments (
                    supplier_id, type, score, confidence, factors, 
                    details, assessed_at, created_at
                ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
                RETURNING id
            """
            
            assessment_id = await self.db.execute_command(
                query,
                assessment_data.get("supplier_id"),
                assessment_data.get("type"),
                assessment_data.get("risk_score"),
                assessment_data.get("confidence"),
                json.dumps(assessment_data.get("factors", {})),
                json.dumps(assessment_data.get("details", {})),
                datetime.utcnow(),
                datetime.utcnow()
            )
            
            return assessment_id
        except Exception as e:
            logger.error(f"Error storing risk assessment: {e}")
            raise
    
    async def get_supplier_data(self, supplier_id: str) -> Optional[Dict[str, Any]]:
        """Get supplier data"""
        try:
            query = """
                SELECT s.*, o.name as organization_name
                FROM suppliers s
                JOIN organizations o ON s.organization_id = o.id
                WHERE s.id = $1
            """
            
            supplier = await self.db.fetch_one(query, supplier_id)
            return supplier
        except Exception as e:
            logger.error(f"Error getting supplier data: {e}")
            raise
    
    async def get_recent_detections(self, supplier_id: str, days: int = 30) -> List[Dict[str, Any]]:
        """Get recent detections for a supplier"""
        try:
            query = """
                SELECT d.*, s.name as supplier_name
                FROM detections d
                JOIN satellite_data sd ON d.image_url = sd.image_url
                JOIN suppliers s ON sd.supplier_id = s.id
                WHERE s.id = $1 
                AND d.created_at >= NOW() - INTERVAL '%s days'
                ORDER BY d.created_at DESC
            """ % days
            
            detections = await self.db.execute_query(query, supplier_id)
            return detections
        except Exception as e:
            logger.error(f"Error getting recent detections: {e}")
            raise
    
    async def get_historical_risk_data(self, supplier_id: str, days: int = 365) -> List[Dict[str, Any]]:
        """Get historical risk data for a supplier"""
        try:
            query = """
                SELECT ra.*, s.name as supplier_name
                FROM risk_assessments ra
                JOIN suppliers s ON ra.supplier_id = s.id
                WHERE s.id = $1 
                AND ra.assessed_at >= NOW() - INTERVAL '%s days'
                ORDER BY ra.assessed_at DESC
            """ % days
            
            risk_data = await self.db.execute_query(query, supplier_id)
            return risk_data
        except Exception as e:
            logger.error(f"Error getting historical risk data: {e}")
            raise
    
    async def get_analytics_trends(self, organization_id: str, start_date: str = None, 
                                 end_date: str = None) -> Dict[str, Any]:
        """Get analytics trends for an organization"""
        try:
            # Base query for detections
            detection_query = """
                SELECT 
                    DATE(d.created_at) as date,
                    d.type,
                    COUNT(*) as count,
                    AVG(d.confidence) as avg_confidence,
                    SUM(d.area) as total_area
                FROM detections d
                JOIN satellite_data sd ON d.image_url = sd.image_url
                JOIN suppliers s ON sd.supplier_id = s.id
                WHERE s.organization_id = $1
            """
            
            params = [organization_id]
            
            if start_date:
                detection_query += " AND d.created_at >= $2"
                params.append(start_date)
            
            if end_date:
                detection_query += " AND d.created_at <= $3"
                params.append(end_date)
            
            detection_query += """
                GROUP BY DATE(d.created_at), d.type
                ORDER BY date DESC
            """
            
            detections = await self.db.execute_query(detection_query, *params)
            
            # Process trends data
            trends = {
                "deforestation": [],
                "mining": [],
                "other": []
            }
            
            for detection in detections:
                date_str = detection["date"].strftime("%Y-%m-%d")
                detection_type = detection["type"]
                
                if "FOREST" in detection_type:
                    trends["deforestation"].append({
                        "date": date_str,
                        "count": detection["count"],
                        "confidence": float(detection["avg_confidence"]),
                        "area": float(detection["total_area"])
                    })
                elif "MINING" in detection_type:
                    trends["mining"].append({
                        "date": date_str,
                        "count": detection["count"],
                        "confidence": float(detection["avg_confidence"]),
                        "area": float(detection["total_area"])
                    })
                else:
                    trends["other"].append({
                        "date": date_str,
                        "count": detection["count"],
                        "confidence": float(detection["avg_confidence"]),
                        "area": float(detection["total_area"])
                    })
            
            return trends
        except Exception as e:
            logger.error(f"Error getting analytics trends: {e}")
            raise
    
    async def cache_result(self, key: str, data: Any, ttl: int = 3600):
        """Cache result in Redis"""
        try:
            if self.db.redis_client:
                serialized_data = json.dumps(data, default=str)
                self.db.redis_client.setex(key, ttl, serialized_data)
        except Exception as e:
            logger.error(f"Error caching result: {e}")
    
    async def get_cached_result(self, key: str) -> Optional[Any]:
        """Get cached result from Redis"""
        try:
            if self.db.redis_client:
                cached_data = self.db.redis_client.get(key)
                if cached_data:
                    return json.loads(cached_data)
            return None
        except Exception as e:
            logger.error(f"Error getting cached result: {e}")
            return None
