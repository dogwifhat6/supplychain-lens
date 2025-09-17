"""
Logging configuration for ML service
"""

import logging
import sys
from pathlib import Path
from datetime import datetime
import json

def setup_logger(name: str, level: str = "INFO") -> logging.Logger:
    """Setup logger with file and console handlers"""
    
    # Create logger
    logger = logging.getLogger(name)
    logger.setLevel(getattr(logging, level.upper()))
    
    # Prevent duplicate handlers
    if logger.handlers:
        return logger
    
    # Create formatters
    console_formatter = logging.Formatter(
        '%(asctime)s - %(name)s - %(levelname)s - %(message)s',
        datefmt='%Y-%m-%d %H:%M:%S'
    )
    
    file_formatter = logging.Formatter(
        '%(asctime)s - %(name)s - %(levelname)s - %(funcName)s:%(lineno)d - %(message)s',
        datefmt='%Y-%m-%d %H:%M:%S'
    )
    
    # Console handler
    console_handler = logging.StreamHandler(sys.stdout)
    console_handler.setLevel(logging.INFO)
    console_handler.setFormatter(console_formatter)
    logger.addHandler(console_handler)
    
    # File handler
    log_dir = Path("logs")
    log_dir.mkdir(exist_ok=True)
    
    file_handler = logging.FileHandler(
        log_dir / f"ml_service_{datetime.now().strftime('%Y%m%d')}.log"
    )
    file_handler.setLevel(logging.DEBUG)
    file_handler.setFormatter(file_formatter)
    logger.addHandler(file_handler)
    
    # Error file handler
    error_handler = logging.FileHandler(
        log_dir / f"ml_service_errors_{datetime.now().strftime('%Y%m%d')}.log"
    )
    error_handler.setLevel(logging.ERROR)
    error_handler.setFormatter(file_formatter)
    logger.addHandler(error_handler)
    
    return logger

class JSONFormatter(logging.Formatter):
    """JSON formatter for structured logging"""
    
    def format(self, record):
        log_entry = {
            "timestamp": datetime.utcnow().isoformat(),
            "level": record.levelname,
            "logger": record.name,
            "message": record.getMessage(),
            "module": record.module,
            "function": record.funcName,
            "line": record.lineno
        }
        
        # Add exception info if present
        if record.exc_info:
            log_entry["exception"] = self.formatException(record.exc_info)
        
        # Add extra fields
        for key, value in record.__dict__.items():
            if key not in ['name', 'msg', 'args', 'levelname', 'levelno', 'pathname', 
                          'filename', 'module', 'exc_info', 'exc_text', 'stack_info',
                          'lineno', 'funcName', 'created', 'msecs', 'relativeCreated',
                          'thread', 'threadName', 'processName', 'process', 'getMessage']:
                log_entry[key] = value
        
        return json.dumps(log_entry)

def setup_structured_logger(name: str, level: str = "INFO") -> logging.Logger:
    """Setup logger with structured JSON output"""
    
    logger = logging.getLogger(f"{name}_structured")
    logger.setLevel(getattr(logging, level.upper()))
    
    if logger.handlers:
        return logger
    
    # JSON file handler
    log_dir = Path("logs")
    log_dir.mkdir(exist_ok=True)
    
    json_handler = logging.FileHandler(
        log_dir / f"ml_service_structured_{datetime.now().strftime('%Y%m%d')}.log"
    )
    json_handler.setLevel(logging.DEBUG)
    json_handler.setFormatter(JSONFormatter())
    logger.addHandler(json_handler)
    
    return logger

# Performance logging decorator
def log_performance(logger: logging.Logger):
    """Decorator to log function performance"""
    def decorator(func):
        def wrapper(*args, **kwargs):
            start_time = datetime.utcnow()
            try:
                result = func(*args, **kwargs)
                execution_time = (datetime.utcnow() - start_time).total_seconds()
                logger.info(
                    f"Function {func.__name__} completed successfully",
                    extra={
                        "function": func.__name__,
                        "execution_time_seconds": execution_time,
                        "status": "success"
                    }
                )
                return result
            except Exception as e:
                execution_time = (datetime.utcnow() - start_time).total_seconds()
                logger.error(
                    f"Function {func.__name__} failed: {str(e)}",
                    extra={
                        "function": func.__name__,
                        "execution_time_seconds": execution_time,
                        "status": "error",
                        "error": str(e)
                    }
                )
                raise
        return wrapper
    return decorator

# Model performance logger
class ModelPerformanceLogger:
    """Logger for model performance metrics"""
    
    def __init__(self, model_name: str):
        self.model_name = model_name
        self.logger = setup_structured_logger(f"model_{model_name}")
    
    def log_inference(self, input_shape: tuple, output_shape: tuple, 
                     execution_time: float, confidence_scores: list = None):
        """Log model inference performance"""
        self.logger.info(
            f"Model {self.model_name} inference completed",
            extra={
                "model_name": self.model_name,
                "input_shape": input_shape,
                "output_shape": output_shape,
                "execution_time_seconds": execution_time,
                "confidence_scores": confidence_scores,
                "event_type": "inference"
            }
        )
    
    def log_training(self, epoch: int, loss: float, accuracy: float, 
                    validation_loss: float = None, validation_accuracy: float = None):
        """Log model training performance"""
        self.logger.info(
            f"Model {self.model_name} training epoch {epoch}",
            extra={
                "model_name": self.model_name,
                "epoch": epoch,
                "loss": loss,
                "accuracy": accuracy,
                "validation_loss": validation_loss,
                "validation_accuracy": validation_accuracy,
                "event_type": "training"
            }
        )
    
    def log_evaluation(self, metrics: dict, dataset_size: int):
        """Log model evaluation results"""
        self.logger.info(
            f"Model {self.model_name} evaluation completed",
            extra={
                "model_name": self.model_name,
                "metrics": metrics,
                "dataset_size": dataset_size,
                "event_type": "evaluation"
            }
        )
