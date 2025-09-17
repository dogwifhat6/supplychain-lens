"""
Geospatial Analysis Service
Handles geospatial operations and analysis
"""

import numpy as np
import geopandas as gpd
from shapely.geometry import Point, Polygon, box
from shapely.ops import unary_union
import pandas as pd
import logging
from typing import Dict, List, Any, Optional, Tuple
import requests
import json
from datetime import datetime, timedelta

logger = logging.getLogger(__name__)

class GeospatialService:
    """Service for geospatial analysis operations"""
    
    def __init__(self):
        # Protected areas data (simplified - in production would use real data)
        self.protected_areas = self._load_protected_areas()
        
        # Country boundaries (simplified)
        self.country_boundaries = self._load_country_boundaries()
        
        # Risk zones (simplified)
        self.risk_zones = self._load_risk_zones()
    
    def _load_protected_areas(self) -> gpd.GeoDataFrame:
        """Load protected areas data"""
        # Simplified protected areas for demo
        # In production, this would load from WDPA or similar database
        
        protected_data = [
            {
                "name": "Amazon National Park",
                "geometry": box(-60, -10, -50, -5),
                "type": "National Park",
                "area_km2": 10000
            },
            {
                "name": "Congo Basin Reserve",
                "geometry": box(15, -5, 25, 5),
                "type": "Reserve",
                "area_km2": 5000
            },
            {
                "name": "Borneo Rainforest",
                "geometry": box(110, -5, 120, 5),
                "type": "Forest Reserve",
                "area_km2": 8000
            }
        ]
        
        gdf = gpd.GeoDataFrame(protected_data, crs="EPSG:4326")
        return gdf
    
    def _load_country_boundaries(self) -> Dict[str, Polygon]:
        """Load country boundaries"""
        # Simplified country boundaries
        return {
            "Brazil": box(-75, -35, -35, 5),
            "Congo": box(12, -5, 30, 5),
            "Indonesia": box(95, -10, 145, 10),
            "Malaysia": box(100, 1, 120, 7),
            "Peru": box(-85, -20, -70, 0),
            "Colombia": box(-80, -5, -65, 15)
        }
    
    def _load_risk_zones(self) -> Dict[str, Polygon]:
        """Load high-risk zones"""
        return {
            "deforestation_hotspot_1": box(-60, -10, -50, -5),
            "deforestation_hotspot_2": box(15, -5, 25, 5),
            "mining_risk_zone_1": box(-70, -15, -60, -5),
            "mining_risk_zone_2": box(20, -3, 30, 3)
        }
    
    async def analyze_location(self, coordinates: Dict[str, float], 
                             bounds: Dict[str, Any]) -> Dict[str, Any]:
        """Analyze geospatial context of a location"""
        try:
            lat = coordinates.get("lat", 0)
            lng = coordinates.get("lng", 0)
            point = Point(lng, lat)
            
            # Analyze proximity to protected areas
            protected_analysis = self._analyze_protected_areas(point)
            
            # Analyze country context
            country_analysis = self._analyze_country_context(point)
            
            # Analyze risk zones
            risk_analysis = self._analyze_risk_zones(point)
            
            # Analyze land use
            land_use_analysis = self._analyze_land_use(point, bounds)
            
            # Calculate environmental factors
            environmental_factors = self._calculate_environmental_factors(point)
            
            return {
                "coordinates": coordinates,
                "protected_areas": protected_analysis,
                "country_context": country_analysis,
                "risk_zones": risk_analysis,
                "land_use": land_use_analysis,
                "environmental_factors": environmental_factors,
                "analysis_timestamp": datetime.utcnow().isoformat()
            }
            
        except Exception as e:
            logger.error(f"Error analyzing location: {e}")
            raise
    
    def _analyze_protected_areas(self, point: Point) -> Dict[str, Any]:
        """Analyze proximity to protected areas"""
        try:
            # Find nearest protected area
            distances = []
            nearest_areas = []
            
            for idx, row in self.protected_areas.iterrows():
                distance = point.distance(row.geometry)
                distances.append(distance)
                nearest_areas.append({
                    "name": row["name"],
                    "type": row["type"],
                    "distance_km": distance * 111,  # Rough conversion to km
                    "area_km2": row["area_km2"]
                })
            
            if distances:
                min_distance_idx = np.argmin(distances)
                nearest_area = nearest_areas[min_distance_idx]
                min_distance_km = min(distances) * 111
            else:
                nearest_area = None
                min_distance_km = float('inf')
            
            # Determine risk level based on proximity
            if min_distance_km < 1:
                proximity_risk = "CRITICAL"
            elif min_distance_km < 5:
                proximity_risk = "HIGH"
            elif min_distance_km < 20:
                proximity_risk = "MEDIUM"
            else:
                proximity_risk = "LOW"
            
            return {
                "nearest_protected_area": nearest_area,
                "min_distance_km": min_distance_km,
                "proximity_risk": proximity_risk,
                "total_protected_areas_nearby": len([d for d in distances if d * 111 < 50])
            }
            
        except Exception as e:
            logger.error(f"Error analyzing protected areas: {e}")
            return {"error": str(e)}
    
    def _analyze_country_context(self, point: Point) -> Dict[str, Any]:
        """Analyze country context and risk factors"""
        try:
            # Find which country the point is in
            country = None
            for country_name, boundary in self.country_boundaries.items():
                if boundary.contains(point):
                    country = country_name
                    break
            
            if not country:
                country = "Unknown"
            
            # Get country-specific risk factors
            risk_factors = self._get_country_risk_factors(country)
            
            return {
                "country": country,
                "risk_factors": risk_factors,
                "governance_score": risk_factors.get("governance_score", 0.5),
                "environmental_regulations": risk_factors.get("environmental_regulations", 0.5),
                "enforcement_capacity": risk_factors.get("enforcement_capacity", 0.5)
            }
            
        except Exception as e:
            logger.error(f"Error analyzing country context: {e}")
            return {"error": str(e)}
    
    def _analyze_risk_zones(self, point: Point) -> Dict[str, Any]:
        """Analyze proximity to high-risk zones"""
        try:
            risk_zone_analysis = {}
            
            for zone_name, zone_geometry in self.risk_zones.items():
                if zone_geometry.contains(point):
                    risk_zone_analysis[zone_name] = {
                        "inside": True,
                        "distance_km": 0,
                        "risk_level": "HIGH"
                    }
                else:
                    distance = point.distance(zone_geometry) * 111
                    risk_zone_analysis[zone_name] = {
                        "inside": False,
                        "distance_km": distance,
                        "risk_level": "HIGH" if distance < 10 else "MEDIUM" if distance < 50 else "LOW"
                    }
            
            # Calculate overall risk
            high_risk_zones = [z for z in risk_zone_analysis.values() if z["risk_level"] == "HIGH"]
            overall_risk = "HIGH" if len(high_risk_zones) > 0 else "MEDIUM" if any(z["risk_level"] == "MEDIUM" for z in risk_zone_analysis.values()) else "LOW"
            
            return {
                "zone_analysis": risk_zone_analysis,
                "overall_risk": overall_risk,
                "high_risk_zones_count": len(high_risk_zones)
            }
            
        except Exception as e:
            logger.error(f"Error analyzing risk zones: {e}")
            return {"error": str(e)}
    
    def _analyze_land_use(self, point: Point, bounds: Dict[str, Any]) -> Dict[str, Any]:
        """Analyze land use patterns"""
        try:
            # Simplified land use analysis
            # In production, this would use actual land use data
            
            # Create bounding box
            if "coordinates" in bounds:
                coords = bounds["coordinates"][0]  # First ring of polygon
                min_lng = min(coord[0] for coord in coords)
                max_lng = max(coord[0] for coord in coords)
                min_lat = min(coord[1] for coord in coords)
                max_lat = max(coord[1] for coord in coords)
                
                bbox = box(min_lng, min_lat, max_lng, max_lat)
            else:
                # Default bounding box
                bbox = box(point.x - 0.01, point.y - 0.01, point.x + 0.01, point.y + 0.01)
            
            # Simulate land use classification
            land_use_distribution = {
                "forest": np.random.uniform(0.3, 0.8),
                "agriculture": np.random.uniform(0.1, 0.4),
                "urban": np.random.uniform(0.0, 0.2),
                "water": np.random.uniform(0.0, 0.1),
                "other": 1.0 - sum([0.3, 0.1, 0.0, 0.0])  # Normalize
            }
            
            # Normalize to sum to 1
            total = sum(land_use_distribution.values())
            land_use_distribution = {k: v/total for k, v in land_use_distribution.items()}
            
            return {
                "land_use_distribution": land_use_distribution,
                "dominant_land_use": max(land_use_distribution, key=land_use_distribution.get),
                "forest_coverage": land_use_distribution["forest"],
                "agricultural_intensity": land_use_distribution["agriculture"],
                "urbanization_level": land_use_distribution["urban"]
            }
            
        except Exception as e:
            logger.error(f"Error analyzing land use: {e}")
            return {"error": str(e)}
    
    def _calculate_environmental_factors(self, point: Point) -> Dict[str, Any]:
        """Calculate environmental factors"""
        try:
            # Simplified environmental factors
            # In production, this would use real environmental data
            
            lat = point.y
            
            # Climate zone based on latitude
            if abs(lat) < 10:
                climate_zone = "tropical"
                temperature = np.random.uniform(25, 35)
                precipitation = np.random.uniform(1500, 3000)
            elif abs(lat) < 30:
                climate_zone = "subtropical"
                temperature = np.random.uniform(15, 25)
                precipitation = np.random.uniform(500, 1500)
            else:
                climate_zone = "temperate"
                temperature = np.random.uniform(5, 20)
                precipitation = np.random.uniform(300, 1000)
            
            # Biodiversity index (simplified)
            biodiversity_index = np.random.uniform(0.3, 0.9)
            
            # Water stress index
            water_stress = np.random.uniform(0.1, 0.8)
            
            # Carbon sequestration potential
            carbon_potential = np.random.uniform(0.2, 0.8)
            
            return {
                "climate_zone": climate_zone,
                "temperature_c": temperature,
                "precipitation_mm_year": precipitation,
                "biodiversity_index": biodiversity_index,
                "water_stress_index": water_stress,
                "carbon_sequestration_potential": carbon_potential,
                "ecosystem_services_value": np.random.uniform(0.3, 0.9)
            }
            
        except Exception as e:
            logger.error(f"Error calculating environmental factors: {e}")
            return {"error": str(e)}
    
    def _get_country_risk_factors(self, country: str) -> Dict[str, Any]:
        """Get country-specific risk factors"""
        # Simplified risk factors for demo
        # In production, this would use real governance and risk data
        
        risk_factors = {
            "Brazil": {
                "governance_score": 0.6,
                "environmental_regulations": 0.7,
                "enforcement_capacity": 0.5,
                "corruption_index": 0.4,
                "political_stability": 0.6,
                "economic_development": 0.7
            },
            "Congo": {
                "governance_score": 0.3,
                "environmental_regulations": 0.4,
                "enforcement_capacity": 0.2,
                "corruption_index": 0.8,
                "political_stability": 0.3,
                "economic_development": 0.3
            },
            "Indonesia": {
                "governance_score": 0.5,
                "environmental_regulations": 0.6,
                "enforcement_capacity": 0.4,
                "corruption_index": 0.6,
                "political_stability": 0.7,
                "economic_development": 0.6
            },
            "Malaysia": {
                "governance_score": 0.7,
                "environmental_regulations": 0.8,
                "enforcement_capacity": 0.7,
                "corruption_index": 0.4,
                "political_stability": 0.8,
                "economic_development": 0.8
            }
        }
        
        return risk_factors.get(country, {
            "governance_score": 0.5,
            "environmental_regulations": 0.5,
            "enforcement_capacity": 0.5,
            "corruption_index": 0.5,
            "political_stability": 0.5,
            "economic_development": 0.5
        })
    
    async def calculate_distance_to_features(self, coordinates: Dict[str, float], 
                                           feature_type: str) -> Dict[str, float]:
        """Calculate distance to specific features"""
        try:
            point = Point(coordinates["lng"], coordinates["lat"])
            distances = {}
            
            if feature_type == "protected_areas":
                for idx, row in self.protected_areas.iterrows():
                    distance = point.distance(row.geometry) * 111  # Convert to km
                    distances[row["name"]] = distance
            elif feature_type == "risk_zones":
                for zone_name, zone_geometry in self.risk_zones.items():
                    distance = point.distance(zone_geometry) * 111
                    distances[zone_name] = distance
            elif feature_type == "country_boundaries":
                for country, boundary in self.country_boundaries.items():
                    distance = point.distance(boundary) * 111
                    distances[country] = distance
            
            return distances
            
        except Exception as e:
            logger.error(f"Error calculating distances: {e}")
            return {}
    
    async def get_historical_analysis(self, coordinates: Dict[str, float], 
                                    start_date: str, end_date: str) -> Dict[str, Any]:
        """Get historical analysis for a location"""
        try:
            # Simplified historical analysis
            # In production, this would analyze historical satellite data
            
            start = datetime.strptime(start_date, "%Y-%m-%d")
            end = datetime.strptime(end_date, "%Y-%m-%d")
            
            # Simulate historical trends
            months = (end.year - start.year) * 12 + (end.month - start.month)
            
            # Deforestation trend
            deforestation_trend = np.random.uniform(0.1, 0.3, months)
            
            # Mining activity trend
            mining_trend = np.random.uniform(0.05, 0.2, months)
            
            # Land use change trend
            land_use_change = np.random.uniform(0.02, 0.15, months)
            
            return {
                "period": f"{start_date} to {end_date}",
                "deforestation_trend": deforestation_trend.tolist(),
                "mining_activity_trend": mining_trend.tolist(),
                "land_use_change_trend": land_use_change.tolist(),
                "average_deforestation_rate": float(np.mean(deforestation_trend)),
                "average_mining_rate": float(np.mean(mining_trend)),
                "total_land_use_change": float(np.sum(land_use_change))
            }
            
        except Exception as e:
            logger.error(f"Error getting historical analysis: {e}")
            return {"error": str(e)}
    
    async def create_risk_map(self, bounds: Dict[str, Any], 
                            risk_type: str = "deforestation") -> Dict[str, Any]:
        """Create risk map for given bounds"""
        try:
            # Simplified risk mapping
            # In production, this would create actual risk maps
            
            if "coordinates" in bounds:
                coords = bounds["coordinates"][0]
                min_lng = min(coord[0] for coord in coords)
                max_lng = max(coord[0] for coord in coords)
                min_lat = min(coord[1] for coord in coords)
                max_lat = max(coord[1] for coord in coords)
            else:
                # Default bounds
                min_lng, max_lng = -60, -50
                min_lat, max_lat = -10, -5
            
            # Create grid
            lng_points = np.linspace(min_lng, max_lng, 20)
            lat_points = np.linspace(min_lat, max_lat, 20)
            
            risk_grid = []
            for lat in lat_points:
                row = []
                for lng in lng_points:
                    point = Point(lng, lat)
                    
                    # Calculate risk score
                    risk_score = self._calculate_point_risk(point, risk_type)
                    row.append(risk_score)
                risk_grid.append(row)
            
            return {
                "bounds": bounds,
                "risk_type": risk_type,
                "risk_grid": risk_grid,
                "lng_points": lng_points.tolist(),
                "lat_points": lat_points.tolist(),
                "max_risk": float(np.max(risk_grid)),
                "min_risk": float(np.min(risk_grid)),
                "average_risk": float(np.mean(risk_grid))
            }
            
        except Exception as e:
            logger.error(f"Error creating risk map: {e}")
            return {"error": str(e)}
    
    def _calculate_point_risk(self, point: Point, risk_type: str) -> float:
        """Calculate risk score for a point"""
        try:
            risk_score = 0.0
            
            if risk_type == "deforestation":
                # Check proximity to protected areas
                for idx, row in self.protected_areas.iterrows():
                    distance = point.distance(row.geometry) * 111
                    if distance < 5:
                        risk_score += 0.8
                    elif distance < 20:
                        risk_score += 0.4
                
                # Check if in risk zones
                for zone_name, zone_geometry in self.risk_zones.items():
                    if "deforestation" in zone_name and zone_geometry.contains(point):
                        risk_score += 0.6
                
            elif risk_type == "mining":
                # Check if in mining risk zones
                for zone_name, zone_geometry in self.risk_zones.items():
                    if "mining" in zone_name and zone_geometry.contains(point):
                        risk_score += 0.8
                
                # Check proximity to protected areas
                for idx, row in self.protected_areas.iterrows():
                    distance = point.distance(row.geometry) * 111
                    if distance < 10:
                        risk_score += 0.6
            
            return min(risk_score, 1.0)
            
        except Exception as e:
            logger.error(f"Error calculating point risk: {e}")
            return 0.0
