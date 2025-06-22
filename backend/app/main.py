"""
Main entry point for the Social Experiment Simulation Platform
"""

import uvicorn
from .routes import app

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000, workers=4)