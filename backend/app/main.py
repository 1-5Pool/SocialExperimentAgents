"""
Main entry point for the Social Experiment Simulation Platform
"""

import uvicorn
from api.app import app

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000)

# File: config/db_config.py
import sqlite3


def get_connection(db_path="simulation.db"):
    return sqlite3.connect(db_path)


# File: domain/entities.py
from dataclasses import dataclass
from typing import Optional


@dataclass
class Experiment:
    experiment_id: str
    template_id: str
    num_agents: int


@dataclass
class Conversation:
    experiment_id: str
    day_no: int
    sequence_no: int
    agent_1: str
    agent_2: str
    text: str


@dataclass
class AgentCount:
    experiment_id: str
    role: str
    count: int


@dataclass
class ExperimentResult:
    experiment_id: str
    raw_report: str


@dataclass
class Template:
    template_id: str
    description: str
    template_data: str
