"""
Image Processing Service
Handles image preprocessing, augmentation, and post-processing
"""

import numpy as np
import cv2
from PIL import Image
import albumentations as A
from albumentations.pytorch import ToTensorV2
import logging
from typing import Tuple, Dict, Any, Optional
import torch
from skimage import exposure, filters, segmentation
from scipy import ndimage

logger = logging.getLogger(__name__)

class ImageProcessor:
    """Service for image processing operations"""
    
    def __init__(self):
        # Define augmentation pipeline
        self.augmentation_pipeline = A.Compose([
            A.HorizontalFlip(p=0.5),
            A.VerticalFlip(p=0.5),
            A.RandomRotate90(p=0.5),
            A.RandomBrightnessContrast(
                brightness_limit=0.2,
                contrast_limit=0.2,
                p=0.5
            ),
            A.GaussNoise(var_limit=(10.0, 50.0), p=0.3),
            A.Blur(blur_limit=3, p=0.3),
            A.CLAHE(clip_limit=2.0, tile_grid_size=(8, 8), p=0.5)
        ])
        
        # Define preprocessing pipeline
        self.preprocessing_pipeline = A.Compose([
            A.Resize(512, 512),
            A.Normalize(mean=[0.485, 0.456, 0.406], std=[0.229, 0.224, 0.225])
        ])
    
    async def preprocess_image(self, image: np.ndarray, target_size: Tuple[int, int] = (512, 512)) -> np.ndarray:
        """Preprocess satellite image for ML inference"""
        try:
            logger.info(f"Preprocessing image with shape: {image.shape}")
            
            # Ensure image is in correct format
            if len(image.shape) == 2:
                # Grayscale to RGB
                image = np.stack([image] * 3, axis=-1)
            elif image.shape[-1] > 4:
                # Take first 4 channels
                image = image[:, :, :4]
            
            # Apply preprocessing
            processed = self.preprocessing_pipeline(image=image)["image"]
            
            # Convert to tensor if needed
            if isinstance(processed, np.ndarray):
                processed = torch.from_numpy(processed).float()
            
            return processed
            
        except Exception as e:
            logger.error(f"Error preprocessing image: {e}")
            raise
    
    async def augment_image(self, image: np.ndarray, mask: Optional[np.ndarray] = None) -> Dict[str, np.ndarray]:
        """Apply data augmentation to image"""
        try:
            if mask is not None:
                augmented = self.augmentation_pipeline(image=image, mask=mask)
                return {
                    "image": augmented["image"],
                    "mask": augmented["mask"]
                }
            else:
                augmented = self.augmentation_pipeline(image=image)
                return {"image": augmented["image"]}
                
        except Exception as e:
            logger.error(f"Error augmenting image: {e}")
            raise
    
    async def enhance_image(self, image: np.ndarray, enhancement_type: str = "standard") -> np.ndarray:
        """Enhance satellite image quality"""
        try:
            if enhancement_type == "standard":
                # Standard enhancement
                enhanced = self._standard_enhancement(image)
            elif enhancement_type == "deforestation":
                # Deforestation-specific enhancement
                enhanced = self._deforestation_enhancement(image)
            elif enhancement_type == "mining":
                # Mining-specific enhancement
                enhanced = self._mining_enhancement(image)
            else:
                enhanced = image
            
            return enhanced
            
        except Exception as e:
            logger.error(f"Error enhancing image: {e}")
            raise
    
    def _standard_enhancement(self, image: np.ndarray) -> np.ndarray:
        """Apply standard image enhancement"""
        enhanced = image.copy()
        
        # Histogram equalization for each channel
        for i in range(image.shape[-1]):
            enhanced[:, :, i] = exposure.equalize_hist(image[:, :, i])
        
        # Contrast stretching
        enhanced = exposure.rescale_intensity(enhanced, out_range=(0, 1))
        
        # Noise reduction
        enhanced = self._denoise_image(enhanced)
        
        return enhanced
    
    def _deforestation_enhancement(self, image: np.ndarray) -> np.ndarray:
        """Apply deforestation-specific enhancement"""
        enhanced = image.copy()
        
        if image.shape[-1] >= 4:  # Has NIR band
            # Enhance vegetation contrast using NIR
            nir = image[:, :, 3]
            red = image[:, :, 0]
            
            # Calculate NDVI
            with np.errstate(divide='ignore', invalid='ignore'):
                ndvi = (nir - red) / (nir + red)
                ndvi = np.nan_to_num(ndvi, nan=0, posinf=1, neginf=-1)
            
            # Apply NDVI-based enhancement
            enhanced[:, :, 0] = red * (1 + ndvi * 0.3)  # Enhance red channel
            enhanced[:, :, 1] = image[:, :, 1] * (1 + ndvi * 0.5)  # Enhance green channel
            enhanced[:, :, 3] = nir * (1 + ndvi * 0.2)  # Enhance NIR channel
        
        # Apply standard enhancement
        enhanced = self._standard_enhancement(enhanced)
        
        return enhanced
    
    def _mining_enhancement(self, image: np.ndarray) -> np.ndarray:
        """Apply mining-specific enhancement"""
        enhanced = image.copy()
        
        # Enhance edges and textures for mining detection
        for i in range(min(3, image.shape[-1])):  # Process RGB channels
            # Apply unsharp masking
            blurred = cv2.GaussianBlur(image[:, :, i], (0, 0), 2.0)
            enhanced[:, :, i] = cv2.addWeighted(image[:, :, i], 1.5, blurred, -0.5, 0)
        
        # Apply standard enhancement
        enhanced = self._standard_enhancement(enhanced)
        
        return enhanced
    
    def _denoise_image(self, image: np.ndarray) -> np.ndarray:
        """Apply denoising to image"""
        denoised = image.copy()
        
        for i in range(image.shape[-1]):
            # Apply bilateral filter for denoising while preserving edges
            denoised[:, :, i] = cv2.bilateralFilter(
                (image[:, :, i] * 255).astype(np.uint8),
                d=9,
                sigmaColor=75,
                sigmaSpace=75
            ) / 255.0
        
        return denoised
    
    async def extract_features(self, image: np.ndarray, feature_type: str = "texture") -> np.ndarray:
        """Extract features from satellite image"""
        try:
            if feature_type == "texture":
                features = self._extract_texture_features(image)
            elif feature_type == "spectral":
                features = self._extract_spectral_features(image)
            elif feature_type == "morphological":
                features = self._extract_morphological_features(image)
            else:
                features = self._extract_combined_features(image)
            
            return features
            
        except Exception as e:
            logger.error(f"Error extracting features: {e}")
            raise
    
    def _extract_texture_features(self, image: np.ndarray) -> np.ndarray:
        """Extract texture features using GLCM"""
        features = []
        
        # Convert to grayscale for texture analysis
        if len(image.shape) == 3:
            gray = cv2.cvtColor((image * 255).astype(np.uint8), cv2.COLOR_RGB2GRAY)
        else:
            gray = (image * 255).astype(np.uint8)
        
        # Calculate texture features
        # Contrast
        contrast = filters.rank.contrast(gray, np.ones((3, 3)))
        features.append(np.mean(contrast))
        
        # Energy
        energy = filters.rank.energy(gray, np.ones((3, 3)))
        features.append(np.mean(energy))
        
        # Homogeneity
        homogeneity = filters.rank.homogeneity(gray, np.ones((3, 3)))
        features.append(np.mean(homogeneity))
        
        # Entropy
        entropy = filters.rank.entropy(gray, np.ones((3, 3)))
        features.append(np.mean(entropy))
        
        return np.array(features)
    
    def _extract_spectral_features(self, image: np.ndarray) -> np.ndarray:
        """Extract spectral features"""
        features = []
        
        # Mean values for each band
        for i in range(image.shape[-1]):
            features.append(np.mean(image[:, :, i]))
        
        # Standard deviation for each band
        for i in range(image.shape[-1]):
            features.append(np.std(image[:, :, i]))
        
        # Calculate vegetation indices if NIR available
        if image.shape[-1] >= 4:
            nir = image[:, :, 3]
            red = image[:, :, 0]
            green = image[:, :, 1]
            
            # NDVI
            with np.errstate(divide='ignore', invalid='ignore'):
                ndvi = (nir - red) / (nir + red)
                ndvi = np.nan_to_num(ndvi, nan=0, posinf=1, neginf=-1)
            features.append(np.mean(ndvi))
            
            # EVI
            with np.errstate(divide='ignore', invalid='ignore'):
                evi = 2.5 * (nir - red) / (nir + 6 * red - 7.5 * green + 1)
                evi = np.nan_to_num(evi, nan=0, posinf=1, neginf=-1)
            features.append(np.mean(evi))
        
        return np.array(features)
    
    def _extract_morphological_features(self, image: np.ndarray) -> np.ndarray:
        """Extract morphological features"""
        features = []
        
        # Convert to grayscale
        if len(image.shape) == 3:
            gray = cv2.cvtColor((image * 255).astype(np.uint8), cv2.COLOR_RGB2GRAY)
        else:
            gray = (image * 255).astype(np.uint8)
        
        # Edge detection
        edges = cv2.Canny(gray, 50, 150)
        features.append(np.sum(edges > 0) / edges.size)  # Edge density
        
        # Morphological operations
        kernel = np.ones((3, 3), np.uint8)
        
        # Opening
        opened = cv2.morphologyEx(gray, cv2.MORPH_OPEN, kernel)
        features.append(np.mean(opened))
        
        # Closing
        closed = cv2.morphologyEx(gray, cv2.MORPH_CLOSE, kernel)
        features.append(np.mean(closed))
        
        # Gradient
        gradient = cv2.morphologyEx(gray, cv2.MORPH_GRADIENT, kernel)
        features.append(np.mean(gradient))
        
        return np.array(features)
    
    def _extract_combined_features(self, image: np.ndarray) -> np.ndarray:
        """Extract combined features"""
        texture_features = self._extract_texture_features(image)
        spectral_features = self._extract_spectral_features(image)
        morphological_features = self._extract_morphological_features(image)
        
        return np.concatenate([texture_features, spectral_features, morphological_features])
    
    async def segment_image(self, image: np.ndarray, method: str = "watershed") -> np.ndarray:
        """Segment satellite image"""
        try:
            if method == "watershed":
                segments = self._watershed_segmentation(image)
            elif method == "slic":
                segments = self._slic_segmentation(image)
            elif method == "felzenszwalb":
                segments = self._felzenszwalb_segmentation(image)
            else:
                segments = self._watershed_segmentation(image)
            
            return segments
            
        except Exception as e:
            logger.error(f"Error segmenting image: {e}")
            raise
    
    def _watershed_segmentation(self, image: np.ndarray) -> np.ndarray:
        """Apply watershed segmentation"""
        # Convert to grayscale
        if len(image.shape) == 3:
            gray = cv2.cvtColor((image * 255).astype(np.uint8), cv2.COLOR_RGB2GRAY)
        else:
            gray = (image * 255).astype(np.uint8)
        
        # Apply watershed segmentation
        segments = segmentation.watershed(
            filters.sobel(gray),
            markers=ndimage.label(filters.rank.minimum(gray, np.ones((3, 3))))[0],
            compactness=0.001
        )
        
        return segments
    
    def _slic_segmentation(self, image: np.ndarray) -> np.ndarray:
        """Apply SLIC segmentation"""
        # Convert to RGB for SLIC
        if len(image.shape) == 3 and image.shape[-1] >= 3:
            rgb_image = (image[:, :, :3] * 255).astype(np.uint8)
        else:
            rgb_image = np.stack([image] * 3, axis=-1)
            rgb_image = (rgb_image * 255).astype(np.uint8)
        
        segments = segmentation.slic(
            rgb_image,
            n_segments=100,
            compactness=10,
            sigma=1,
            start_label=1
        )
        
        return segments
    
    def _felzenszwalb_segmentation(self, image: np.ndarray) -> np.ndarray:
        """Apply Felzenszwalb segmentation"""
        # Convert to RGB for Felzenszwalb
        if len(image.shape) == 3 and image.shape[-1] >= 3:
            rgb_image = (image[:, :, :3] * 255).astype(np.uint8)
        else:
            rgb_image = np.stack([image] * 3, axis=-1)
            rgb_image = (rgb_image * 255).astype(np.uint8)
        
        segments = segmentation.felzenszwalb(
            rgb_image,
            scale=100,
            sigma=0.5,
            min_size=50
        )
        
        return segments
    
    async def calculate_image_quality_metrics(self, image: np.ndarray) -> Dict[str, float]:
        """Calculate image quality metrics"""
        try:
            metrics = {}
            
            # Convert to grayscale for some metrics
            if len(image.shape) == 3:
                gray = cv2.cvtColor((image * 255).astype(np.uint8), cv2.COLOR_RGB2GRAY)
            else:
                gray = (image * 255).astype(np.uint8)
            
            # Sharpness (Laplacian variance)
            laplacian_var = cv2.Laplacian(gray, cv2.CV_64F).var()
            metrics["sharpness"] = float(laplacian_var)
            
            # Contrast (RMS contrast)
            rms_contrast = np.sqrt(np.mean((gray - np.mean(gray)) ** 2))
            metrics["contrast"] = float(rms_contrast)
            
            # Brightness
            brightness = np.mean(gray)
            metrics["brightness"] = float(brightness)
            
            # Noise level (simplified)
            noise_level = np.std(cv2.GaussianBlur(gray, (5, 5), 0) - gray)
            metrics["noise_level"] = float(noise_level)
            
            # Dynamic range
            dynamic_range = np.max(gray) - np.min(gray)
            metrics["dynamic_range"] = float(dynamic_range)
            
            return metrics
            
        except Exception as e:
            logger.error(f"Error calculating image quality metrics: {e}")
            return {}
