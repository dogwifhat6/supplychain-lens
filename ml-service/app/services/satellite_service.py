"""
Satellite Data Service
Handles downloading and processing satellite imagery from various sources
"""

import requests
import numpy as np
import rasterio
from rasterio.warp import calculate_default_transform, reproject, Resampling
from rasterio.mask import mask
import geopandas as gpd
from shapely.geometry import box
import logging
from typing import Dict, Any, Optional, Tuple
import asyncio
import aiohttp
from pathlib import Path
import os
from datetime import datetime, timedelta

logger = logging.getLogger(__name__)

class SatelliteService:
    """Service for handling satellite data operations"""
    
    def __init__(self):
        self.sentinel_hub_client_id = os.getenv("SENTINEL_HUB_CLIENT_ID")
        self.sentinel_hub_client_secret = os.getenv("SENTINEL_HUB_CLIENT_SECRET")
        self.planet_api_key = os.getenv("PLANET_API_KEY")
        self.aws_access_key = os.getenv("AWS_ACCESS_KEY_ID")
        self.aws_secret_key = os.getenv("AWS_SECRET_ACCESS_KEY")
        
        # Supported satellite sources
        self.supported_sources = [
            "sentinel-2",
            "landsat-8",
            "landsat-9",
            "planet",
            "modis"
        ]
    
    async def download_image(self, image_url: str, coordinates: Dict[str, float], 
                           bounds: Dict[str, Any]) -> np.ndarray:
        """Download and process satellite image"""
        try:
            logger.info(f"Downloading satellite image from: {image_url}")
            
            # Determine image source and download
            if "sentinel" in image_url.lower():
                image_data = await self._download_sentinel_image(image_url, coordinates, bounds)
            elif "landsat" in image_url.lower():
                image_data = await self._download_landsat_image(image_url, coordinates, bounds)
            elif "planet" in image_url.lower():
                image_data = await self._download_planet_image(image_url, coordinates, bounds)
            else:
                # Generic download
                image_data = await self._download_generic_image(image_url)
            
            # Process and normalize image
            processed_image = self._process_satellite_image(image_data, coordinates, bounds)
            
            return processed_image
            
        except Exception as e:
            logger.error(f"Error downloading satellite image: {e}")
            raise
    
    async def _download_sentinel_image(self, image_url: str, coordinates: Dict[str, float], 
                                     bounds: Dict[str, Any]) -> np.ndarray:
        """Download Sentinel-2 image"""
        try:
            # For demo purposes, create a synthetic Sentinel-2 image
            # In production, this would use the Sentinel Hub API
            logger.info("Generating synthetic Sentinel-2 image for demo")
            
            # Create synthetic 4-band image (RGB + NIR)
            width, height = 512, 512
            image = np.zeros((height, width, 4), dtype=np.float32)
            
            # Simulate different land cover types
            center_x, center_y = width // 2, height // 2
            
            # Forest areas (high NIR, moderate RGB)
            forest_mask = self._create_circular_mask(height, width, center_x, center_y, 150)
            image[forest_mask, 0] = 0.2  # Red
            image[forest_mask, 1] = 0.4  # Green
            image[forest_mask, 2] = 0.1  # Blue
            image[forest_mask, 3] = 0.8  # NIR
            
            # Deforested areas (low NIR, high red)
            deforested_mask = self._create_circular_mask(height, width, center_x + 100, center_y + 50, 80)
            image[deforested_mask, 0] = 0.6  # Red
            image[deforested_mask, 1] = 0.3  # Green
            image[deforested_mask, 2] = 0.2  # Blue
            image[deforested_mask, 3] = 0.3  # NIR
            
            # Water areas (low all bands)
            water_mask = self._create_circular_mask(height, width, center_x - 80, center_y - 60, 60)
            image[water_mask, 0] = 0.1  # Red
            image[water_mask, 1] = 0.2  # Green
            image[water_mask, 2] = 0.4  # Blue
            image[water_mask, 3] = 0.1  # NIR
            
            # Add some noise for realism
            noise = np.random.normal(0, 0.05, image.shape)
            image = np.clip(image + noise, 0, 1)
            
            return image
            
        except Exception as e:
            logger.error(f"Error downloading Sentinel-2 image: {e}")
            raise
    
    async def _download_landsat_image(self, image_url: str, coordinates: Dict[str, float], 
                                    bounds: Dict[str, Any]) -> np.ndarray:
        """Download Landsat image"""
        try:
            # For demo purposes, create a synthetic Landsat image
            logger.info("Generating synthetic Landsat image for demo")
            
            width, height = 512, 512
            image = np.zeros((height, width, 6), dtype=np.float32)  # 6 bands for Landsat
            
            # Simulate Landsat bands
            center_x, center_y = width // 2, height // 2
            
            # Different land cover types with Landsat band characteristics
            forest_mask = self._create_circular_mask(height, width, center_x, center_y, 150)
            image[forest_mask, 0] = 0.15  # Band 1 (Blue)
            image[forest_mask, 1] = 0.25  # Band 2 (Green)
            image[forest_mask, 2] = 0.20  # Band 3 (Red)
            image[forest_mask, 3] = 0.70  # Band 4 (NIR)
            image[forest_mask, 4] = 0.30  # Band 5 (SWIR1)
            image[forest_mask, 5] = 0.20  # Band 6 (SWIR2)
            
            # Mining areas
            mining_mask = self._create_circular_mask(height, width, center_x + 120, center_y + 80, 70)
            image[mining_mask, 0] = 0.30  # Band 1
            image[mining_mask, 1] = 0.35  # Band 2
            image[mining_mask, 2] = 0.40  # Band 3
            image[mining_mask, 3] = 0.25  # Band 4
            image[mining_mask, 4] = 0.50  # Band 5
            image[mining_mask, 5] = 0.45  # Band 6
            
            # Add noise
            noise = np.random.normal(0, 0.03, image.shape)
            image = np.clip(image + noise, 0, 1)
            
            return image
            
        except Exception as e:
            logger.error(f"Error downloading Landsat image: {e}")
            raise
    
    async def _download_planet_image(self, image_url: str, coordinates: Dict[str, float], 
                                   bounds: Dict[str, Any]) -> np.ndarray:
        """Download Planet image"""
        try:
            # For demo purposes, create a synthetic Planet image
            logger.info("Generating synthetic Planet image for demo")
            
            width, height = 512, 512
            image = np.zeros((height, width, 4), dtype=np.float32)  # RGB + NIR
            
            center_x, center_y = width // 2, height // 2
            
            # High-resolution simulation
            forest_mask = self._create_circular_mask(height, width, center_x, center_y, 180)
            image[forest_mask, 0] = 0.18  # Red
            image[forest_mask, 1] = 0.45  # Green
            image[forest_mask, 2] = 0.12  # Blue
            image[forest_mask, 3] = 0.85  # NIR
            
            # Urban/Infrastructure
            urban_mask = self._create_circular_mask(height, width, center_x - 100, center_y - 100, 90)
            image[urban_mask, 0] = 0.50  # Red
            image[urban_mask, 1] = 0.45  # Green
            image[urban_mask, 2] = 0.40  # Blue
            image[urban_mask, 3] = 0.35  # NIR
            
            # Add high-resolution noise
            noise = np.random.normal(0, 0.02, image.shape)
            image = np.clip(image + noise, 0, 1)
            
            return image
            
        except Exception as e:
            logger.error(f"Error downloading Planet image: {e}")
            raise
    
    async def _download_generic_image(self, image_url: str) -> np.ndarray:
        """Download generic image from URL"""
        try:
            async with aiohttp.ClientSession() as session:
                async with session.get(image_url) as response:
                    if response.status == 200:
                        image_data = await response.read()
                        # Process image data (simplified)
                        # In production, this would use proper image processing
                        return np.random.rand(512, 512, 3).astype(np.float32)
                    else:
                        raise Exception(f"Failed to download image: {response.status}")
        except Exception as e:
            logger.error(f"Error downloading generic image: {e}")
            raise
    
    def _process_satellite_image(self, image_data: np.ndarray, coordinates: Dict[str, float], 
                               bounds: Dict[str, Any]) -> np.ndarray:
        """Process and normalize satellite image"""
        try:
            # Ensure image is in the correct format
            if len(image_data.shape) == 2:
                # Grayscale to RGB
                image_data = np.stack([image_data] * 3, axis=-1)
            elif image_data.shape[-1] > 4:
                # Take first 4 channels
                image_data = image_data[:, :, :4]
            
            # Normalize to 0-1 range
            if image_data.max() > 1.0:
                image_data = image_data / 255.0
            
            # Apply atmospheric correction (simplified)
            image_data = self._apply_atmospheric_correction(image_data)
            
            # Apply cloud masking (simplified)
            image_data = self._apply_cloud_masking(image_data)
            
            return image_data
            
        except Exception as e:
            logger.error(f"Error processing satellite image: {e}")
            raise
    
    def _apply_atmospheric_correction(self, image: np.ndarray) -> np.ndarray:
        """Apply atmospheric correction to satellite image"""
        # Simplified atmospheric correction
        # In production, this would use proper atmospheric correction algorithms
        
        # Dark object subtraction
        dark_pixel = np.percentile(image, 2, axis=(0, 1))
        corrected_image = image - dark_pixel
        corrected_image = np.clip(corrected_image, 0, 1)
        
        return corrected_image
    
    def _apply_cloud_masking(self, image: np.ndarray) -> np.ndarray:
        """Apply cloud masking to satellite image"""
        # Simplified cloud detection
        # In production, this would use proper cloud detection algorithms
        
        if image.shape[-1] >= 4:  # Has NIR band
            # Simple cloud detection using NIR and visible bands
            nir = image[:, :, 3]
            red = image[:, :, 0]
            
            # Cloud mask (simplified)
            cloud_mask = (nir > 0.7) & (red > 0.6)
            
            # Apply mask
            image[cloud_mask] = 0  # Set cloud pixels to black
            
        return image
    
    def _create_circular_mask(self, height: int, width: int, center_x: int, center_y: int, 
                            radius: int) -> np.ndarray:
        """Create a circular mask"""
        y, x = np.ogrid[:height, :width]
        mask = (x - center_x)**2 + (y - center_y)**2 <= radius**2
        return mask
    
    async def get_available_images(self, coordinates: Dict[str, float], 
                                 start_date: str, end_date: str, 
                                 source: str = "sentinel-2") -> List[Dict[str, Any]]:
        """Get list of available satellite images for given location and time range"""
        try:
            # For demo purposes, return synthetic data
            # In production, this would query actual satellite data APIs
            
            logger.info(f"Getting available images for coordinates: {coordinates}")
            
            # Generate synthetic image list
            images = []
            start = datetime.strptime(start_date, "%Y-%m-%d")
            end = datetime.strptime(end_date, "%Y-%m-%d")
            
            current_date = start
            while current_date <= end:
                if current_date.weekday() == 0:  # Add image every Monday
                    images.append({
                        "image_id": f"{source}_{current_date.strftime('%Y%m%d')}",
                        "date": current_date.strftime("%Y-%m-%d"),
                        "source": source,
                        "cloud_cover": np.random.uniform(0, 30),
                        "resolution": self._get_resolution(source),
                        "coordinates": coordinates,
                        "url": f"https://example.com/{source}_{current_date.strftime('%Y%m%d')}.tif"
                    })
                current_date += timedelta(days=1)
            
            return images
            
        except Exception as e:
            logger.error(f"Error getting available images: {e}")
            raise
    
    def _get_resolution(self, source: str) -> float:
        """Get resolution for satellite source"""
        resolutions = {
            "sentinel-2": 10.0,
            "landsat-8": 30.0,
            "landsat-9": 30.0,
            "planet": 3.0,
            "modis": 250.0
        }
        return resolutions.get(source, 10.0)
    
    async def calculate_vegetation_indices(self, image: np.ndarray) -> Dict[str, np.ndarray]:
        """Calculate vegetation indices from satellite image"""
        try:
            if image.shape[-1] < 4:
                logger.warning("Image does not have enough bands for vegetation indices")
                return {}
            
            # Extract bands
            red = image[:, :, 0]
            green = image[:, :, 1]
            blue = image[:, :, 2]
            nir = image[:, :, 3]
            
            # Calculate indices
            indices = {}
            
            # NDVI (Normalized Difference Vegetation Index)
            with np.errstate(divide='ignore', invalid='ignore'):
                ndvi = (nir - red) / (nir + red)
                ndvi = np.nan_to_num(ndvi, nan=0, posinf=1, neginf=-1)
            indices['ndvi'] = ndvi
            
            # EVI (Enhanced Vegetation Index)
            with np.errstate(divide='ignore', invalid='ignore'):
                evi = 2.5 * (nir - red) / (nir + 6 * red - 7.5 * blue + 1)
                evi = np.nan_to_num(evi, nan=0, posinf=1, neginf=-1)
            indices['evi'] = evi
            
            # GNDVI (Green Normalized Difference Vegetation Index)
            with np.errstate(divide='ignore', invalid='ignore'):
                gndvi = (nir - green) / (nir + green)
                gndvi = np.nan_to_num(gndvi, nan=0, posinf=1, neginf=-1)
            indices['gndvi'] = gndvi
            
            return indices
            
        except Exception as e:
            logger.error(f"Error calculating vegetation indices: {e}")
            return {}
    
    async def detect_clouds(self, image: np.ndarray) -> np.ndarray:
        """Detect clouds in satellite image"""
        try:
            if image.shape[-1] < 4:
                return np.zeros(image.shape[:2], dtype=bool)
            
            # Simple cloud detection using NIR and visible bands
            nir = image[:, :, 3]
            red = image[:, :, 0]
            green = image[:, :, 1]
            blue = image[:, :, 2]
            
            # Cloud detection thresholds
            cloud_mask = (
                (nir > 0.6) &  # High NIR reflectance
                (red > 0.4) &  # High red reflectance
                (green > 0.4) &  # High green reflectance
                (blue > 0.3) &  # High blue reflectance
                (nir - red > 0.1)  # NIR > Red
            )
            
            return cloud_mask
            
        except Exception as e:
            logger.error(f"Error detecting clouds: {e}")
            return np.zeros(image.shape[:2], dtype=bool)
