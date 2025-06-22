# File: api/app.py
from fastapi import FastAPI, HTTPException, BackgroundTasks
from pydantic import BaseModel
from typing import Optional, Dict, Any
from infrastructure.db import DBRepository
from usecases.simulation import SimulationService
from services.agent.dummy import DummyModerator
from collections import defaultdict
import json
import traceback

app = FastAPI(title="Social Experiment Simulation Platform", version="1.0.0")
repo = DBRepository("simulation.db")


class RunExperimentRequest(BaseModel):
    template_id: str
    rounds: Optional[int] = None
    conversations_per_round: Optional[int] = None
    max_conversations_per_agent: Optional[int] = None
    max_message_length: Optional[int] = None


class CreateTemplateRequest(BaseModel):
    template_id: str
    description: str
    template_data: Dict[str, Any]


async def run_experiment_background(
    request: RunExperimentRequest, experiment_id: str, sim: SimulationService
):
    """Background task to run experiment"""
    try:
        # Update status to running
        repo.update_experiment_status(experiment_id, "running")

        # moderator = DummyModerator("mod-001")
        # sim = SimulationService(
        #     repo=repo,
        #     template_id=request.template_id,
        #     moderator=moderator,
        #     rounds=request.rounds,
        #     conversations_per_round=request.conversations_per_round,
        #     max_conversations_per_agent=request.max_conversations_per_agent,
        #     max_message_length=request.max_message_length,
        #     # experiment_id=experiment_id,  # Pass the existing experiment_id
        # )

        await sim.run()
        print(f"Experiment {experiment_id} completed successfully")

        # Update status to completed
        repo.update_experiment_status(experiment_id, "completed")

    except Exception as e:
        traceback.print_exc()
        print(f"Error running experiment {experiment_id}: {e}")

        # Update status to failed
        repo.update_experiment_status(experiment_id, "failed")


def get_experiment_status_from_db(experiment_id: str) -> str:
    """Determine experiment status from database"""
    experiment = repo.get_experiment_by_id(experiment_id)
    if not experiment:
        return "not_found"

    # Check if status is explicitly set in database
    if hasattr(experiment, "status") and experiment.status:
        return experiment.status

    # Fallback: check if experiment has results (legacy behavior)
    experiment_result = repo.get_experiment_result(experiment_id)
    if experiment_result:
        return "completed"

    return "unknown"


@app.get("/")
def read_root():
    """Root endpoint with API information"""
    return {
        "message": "Social Experiment Simulation Platform API",
        "version": "1.0.0",
        "endpoints": {
            "templates": "/templates",
            "experiments": "/experiments",
            "run_experiment": "/run_experiment",
            "docs": "/docs",
        },
    }


@app.get("/templates")
def list_templates():
    """List all available templates"""
    templates = repo.get_all_templates()
    result = []
    for template in templates:
        try:
            template_data = json.loads(template.template_data)
            print("Temp ", template_data, type(template_data))
            result.append(
                {
                    "template_id": template.template_id,
                    "description": template.description,
                    "template_name": template_data.get("template_name", "Unknown"),
                    "rounds": template_data.get("rounds", 5),
                    "conversations_per_round": template_data.get(
                        "conversations_per_round", 6
                    ),
                    "factions": list(template_data.get("factions", {})),
                }
            )
        except json.JSONDecodeError:
            # Handle malformed template data
            result.append(
                {
                    "template_id": template.template_id,
                    "description": template.description,
                    "template_name": "Unknown",
                    "rounds": 5,
                    "conversations_per_round": 6,
                    "factions": [],
                    "error": "Invalid template data format",
                }
            )
    return result


@app.get("/templates/{template_id}")
def get_template(template_id: str):
    """Get detailed information about a specific template"""
    template = repo.get_template_by_id(template_id)
    if not template:
        raise HTTPException(status_code=404, detail=f"Template {template_id} not found")

    try:
        template_data = json.loads(template.template_data)
        return {
            "template_id": template.template_id,
            "description": template.description,
            "template_data": template_data,
        }
    except json.JSONDecodeError:
        raise HTTPException(status_code=500, detail="Template data is corrupted")


@app.post("/templates")
def create_template(request: CreateTemplateRequest):
    """Create a new template"""
    try:
        # Check if template ID already exists
        existing_template = repo.get_template_by_id(request.template_id)
        if existing_template:
            raise HTTPException(
                status_code=409, detail=f"Template {request.template_id} already exists"
            )

        # Validate template data structure
        if not isinstance(request.template_data, dict):
            raise HTTPException(
                status_code=400, detail="template_data must be a valid JSON object"
            )

        # Basic validation of required fields in template_data
        required_fields = [
            "template_name",
            "factions",
            "rounds",
            "conversations_per_round",
        ]
        missing_fields = [
            field for field in required_fields if field not in request.template_data
        ]
        if missing_fields:
            raise HTTPException(
                status_code=400,
                detail=f"Missing required fields in template_data: {', '.join(missing_fields)}",
            )

        # Validate factions structure
        factions = request.template_data.get("factions", {})
        if not isinstance(factions, dict) or len(factions) == 0:
            raise HTTPException(
                status_code=400,
                detail="template_data.factions must be a non-empty object",
            )

        # Validate each faction has required properties
        for faction_name, faction_data in factions.items():
            if not isinstance(faction_data, dict):
                raise HTTPException(
                    status_code=400,
                    detail=f"Faction '{faction_name}' must be an object",
                )

            faction_required = ["agent_count"]
            faction_missing = [
                field for field in faction_required if field not in faction_data
            ]
            if faction_missing:
                raise HTTPException(
                    status_code=400,
                    detail=f"Faction '{faction_name}' missing required fields: {', '.join(faction_missing)}",
                )

            if (
                not isinstance(faction_data.get("agent_count"), int)
                or faction_data.get("agent_count") <= 0
            ):
                raise HTTPException(
                    status_code=400,
                    detail=f"Faction '{faction_name}' agent_count must be a positive integer",
                )

        # Validate numeric fields
        if (
            not isinstance(request.template_data.get("rounds"), int)
            or request.template_data.get("rounds") <= 0
        ):
            raise HTTPException(
                status_code=400,
                detail="template_data.rounds must be a positive integer",
            )

        if (
            not isinstance(request.template_data.get("conversations_per_round"), int)
            or request.template_data.get("conversations_per_round") <= 0
        ):
            raise HTTPException(
                status_code=400,
                detail="template_data.conversations_per_round must be a positive integer",
            )

        # Save template to database
        success = repo.save_template(
            template_id=request.template_id,
            description=request.description,
            template_data=request.template_data,
        )

        if not success:
            raise HTTPException(
                status_code=500, detail="Failed to save template to database"
            )

        return {
            "template_id": request.template_id,
            "description": request.description,
            "template_data": request.template_data,
            "message": "Template created successfully",
        }

    except HTTPException:
        raise
    except json.JSONEncodeError:
        raise HTTPException(status_code=400, detail="Invalid JSON in template_data")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")


@app.get("/experiments")
def list_experiments():
    """List all experiments with their template info"""
    experiments = repo.get_all_experiments()
    result = []
    for exp in experiments:
        status = get_experiment_status_from_db(exp[0])
        result.append(
            {
                "experiment_id": exp[0],
                "template_id": exp[1],
                "template_description": exp[2],
                "created_at": exp[3],
                "status": status,
            }
        )
    return result


@app.get("/experiments/{experiment_id}")
def get_experiment_details(experiment_id: str):
    """Get detailed information about a specific experiment"""
    experiments = repo.get_all_experiments()
    experiment = None
    for exp in experiments:
        if exp[0] == experiment_id:
            experiment = exp
            break

    if not experiment:
        raise HTTPException(
            status_code=404, detail=f"Experiment {experiment_id} not found"
        )

    status = get_experiment_status_from_db(experiment_id)

    return {
        "experiment_id": experiment[0],
        "template_id": experiment[1],
        "template_description": experiment[2],
        "created_at": experiment[3],
        "status": status,
    }


@app.get("/experiments/{experiment_id}/conversations")
def get_conversations_by_day(experiment_id: str):
    """Get conversations grouped by day for an experiment"""
    try:
        # Verify experiment exists
        experiments = repo.get_all_experiments()
        experiment_exists = any(exp[0] == experiment_id for exp in experiments)
        if not experiment_exists:
            raise HTTPException(
                status_code=404, detail=f"Experiment {experiment_id} not found"
            )

        conversations = repo.get_all_conversations(experiment_id)
        grouped = defaultdict(list)

        for c in conversations:
            grouped[c.day_no].append(
                {
                    "sequence_no": c.sequence_no,
                    "agent_1": c.agent_1,
                    "agent_2": c.agent_2,
                    "text": c.text,
                }
            )

        # Convert to list format for better JSON structure
        result = []
        for day in sorted(grouped.keys()):
            result.append({"day": day, "conversations": grouped[day]})

        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/experiments/{experiment_id}/result")
def get_experiment_result(experiment_id: str):
    """Get the final report for an experiment"""
    # Verify experiment exists
    experiments = repo.get_all_experiments()
    experiment_exists = any(exp[0] == experiment_id for exp in experiments)
    if not experiment_exists:
        raise HTTPException(
            status_code=404, detail=f"Experiment {experiment_id} not found"
        )

    result = repo.get_experiment_result(experiment_id)
    if not result:
        raise HTTPException(
            status_code=404,
            detail="Result not found - experiment may not be completed yet",
        )

    return {"experiment_id": experiment_id, "raw_report": result}


@app.post("/run_experiment")
async def run_experiment(
    request: RunExperimentRequest, background_tasks: BackgroundTasks
):
    """Start a new experiment asynchronously"""
    try:
        # Validate template exists
        template = repo.get_template_by_id(request.template_id)
        if not template:
            raise HTTPException(
                status_code=404, detail=f"Template {request.template_id} not found"
            )

        # Create experiment record in database with "pending" status
        moderator = DummyModerator("mod-001")
        sim = SimulationService(
            repo=repo,
            template_id=request.template_id,
            moderator=moderator,
            rounds=request.rounds,
            conversations_per_round=request.conversations_per_round,
            max_conversations_per_agent=request.max_conversations_per_agent,
            max_message_length=request.max_message_length,
        )

        experiment_id = sim.experiment_id

        # Create experiment record with initial status
        repo.create_experiment_record(experiment_id, request.template_id, "pending")

        # Start background task
        background_tasks.add_task(
            run_experiment_background, request, experiment_id, sim
        )

        return {
            "experiment_id": experiment_id,
            "status": "pending",
            "message": f"Experiment queued to start with {len(sim.agents)} agents",
        }

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/experiments/{experiment_id}/status")
def get_experiment_status(experiment_id: str):
    """Get the current status of an experiment"""
    status = get_experiment_status_from_db(experiment_id)

    if status == "not_found":
        raise HTTPException(
            status_code=404, detail=f"Experiment {experiment_id} not found"
        )

    return {
        "experiment_id": experiment_id,
        "status": status,
    }


@app.delete("/experiments/{experiment_id}")
def delete_experiment(experiment_id: str):
    """Delete an experiment and all its data"""
    try:
        # Check experiment status
        status = get_experiment_status_from_db(experiment_id)

        if status == "not_found":
            raise HTTPException(
                status_code=404, detail=f"Experiment {experiment_id} not found"
            )

        if status == "running":
            raise HTTPException(
                status_code=400, detail="Cannot delete a running experiment"
            )

        # Delete experiment from database
        success = repo.delete_experiment(experiment_id)
        if not success:
            raise HTTPException(
                status_code=500, detail="Failed to delete experiment from database"
            )

        return {
            "experiment_id": experiment_id,
            "message": "Experiment deleted successfully",
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/health")
def health_check():
    """Health check endpoint"""
    try:
        # Test database connection
        templates = repo.get_all_templates()
        experiments = repo.get_all_experiments()

        # Count running experiments
        running_count = 0
        for exp in experiments:
            status = get_experiment_status_from_db(exp[0])
            if status == "running":
                running_count += 1

        return {
            "status": "healthy",
            "database": "connected",
            "templates_count": len(templates),
            "total_experiments": len(experiments),
            "running_experiments": running_count,
        }
    except Exception as e:
        return {"status": "unhealthy", "error": str(e)}


if __name__ == "__main__":
    import uvicorn

    uvicorn.run(app, host="0.0.0.0", port=8000)
