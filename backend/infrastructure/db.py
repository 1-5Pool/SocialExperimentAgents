import uuid
import json
import sqlite3
import threading
from typing import List, Optional
from domain.entities import (
    Experiment,
    Conversation,
    AgentCount,
    ExperimentResult,
    Template,
)
from config import get_connection


class DBRepository:
    def __init__(self, db_path="simulation.db"):
        self.db_path = db_path
        self._local = threading.local()
        # Initialize schema with a temporary connection
        self._setup_schema()
        self._ensure_default_template()

    def _get_connection(self):
        """Get or create a connection for the current thread"""
        if not hasattr(self._local, "connection"):
            self._local.connection = sqlite3.connect(
                self.db_path, check_same_thread=False  # Allow use across threads
            )
            self._local.connection.row_factory = sqlite3.Row
        return self._local.connection

    def _get_cursor(self):
        """Get a cursor for the current thread"""
        return self._get_connection().cursor()

    def _setup_schema(self):
        # Use thread-local connection for schema setup
        conn = self._get_connection()
        cursor = self._get_cursor()

        cursor.execute(
            """
        CREATE TABLE IF NOT EXISTS experiments (
            experiment_id TEXT PRIMARY KEY,
            template_id TEXT,
            num_agents INTEGER,
            status TEXT DEFAULT 'unknown',
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )"""
        )

        cursor.execute(
            """
        CREATE TABLE IF NOT EXISTS agent_counts (
            experiment_id TEXT,
            role TEXT,
            count INTEGER,
            FOREIGN KEY (experiment_id) REFERENCES experiments(experiment_id)
        )"""
        )

        cursor.execute(
            """
        CREATE TABLE IF NOT EXISTS conversations (
            experiment_id TEXT,
            day_no INTEGER,
            sequence_no INTEGER,
            agent_1 TEXT,
            agent_2 TEXT,
            text TEXT,
            FOREIGN KEY (experiment_id) REFERENCES experiments(experiment_id)
        )"""
        )

        cursor.execute(
            """
        CREATE TABLE IF NOT EXISTS templates (
            template_id TEXT PRIMARY KEY,
            description TEXT,
            template_data TEXT
        )"""
        )

        cursor.execute(
            """
        CREATE TABLE IF NOT EXISTS experiment_results (
            experiment_id TEXT PRIMARY KEY,
            raw_report TEXT,
            FOREIGN KEY (experiment_id) REFERENCES experiments(experiment_id)
        )"""
        )

        # Add status column to existing experiments table if it doesn't exist
        cursor.execute("PRAGMA table_info(experiments)")
        columns = [row[1] for row in cursor.fetchall()]
        if "status" not in columns:
            cursor.execute(
                "ALTER TABLE experiments ADD COLUMN status TEXT DEFAULT 'unknown'"
            )

        conn.commit()

    def _ensure_default_template(self):
        cursor = self._get_cursor()
        conn = self._get_connection()

        cursor.execute("SELECT COUNT(*) FROM templates")
        resp = cursor.fetchone()
        print(resp)
        if resp[0] == 0:
            print("Inserting default template...")
            default_template = {
                "template_name": "Secret Hitler",
                "rounds": 5,
                "description": "Secret hitler game with politics",
                "conversations_per_round": 6,
                "content_prompt": "This is a chill setting where agents discuss politics",
                "factions": {
                    "liberal": {
                        "faction_prompt": "You believe in freedom and democracy",
                        "person_prompt": [
                            "You are {name}, a secretive liberal who keeps their true beliefs hidden",
                            "You are {name}, a police officer working undercover as a liberal",
                            "You are {name}, a passionate advocate for civil liberties",
                        ],
                        "agent_count": 9,
                        "powers": ["vote"],
                    },
                    "fascist": {
                        "faction_prompt": "You believe in strong authoritarian leadership",
                        "person_prompt": [
                            "You are {name}, subtle yet persistent in pushing fascist ideals",
                            "You are {name}, a charismatic leader who masks extreme views",
                            "You are {name}, an opportunist who sees fascism as a path to power",
                        ],
                        "agent_count": 3,
                        "powers": ["kill", "investigate"],
                    },
                },
            }

            cursor.execute(
                """
                INSERT INTO templates (template_id, description, template_data) 
                VALUES (?, ?, ?)
            """,
                (
                    "secret_hitler",
                    "Default Secret Hitler template",
                    json.dumps(default_template),
                ),
            )
            conn.commit()

    def get_all_templates(self) -> List[Template]:
        """Get all available templates"""
        cursor = self._get_cursor()
        cursor.execute("SELECT template_id, description, template_data FROM templates")
        rows = cursor.fetchall()
        print(rows)
        return [Template(row[0], row[1], row[2]) for row in rows]

    def save_template(
        self, template_id: str, description: str, template_data: dict
    ) -> bool:
        """Save or update a template"""
        cursor = self._get_cursor()
        conn = self._get_connection()

        try:
            # Check if template exists
            cursor.execute(
                "SELECT COUNT(*) FROM templates WHERE template_id = ?", (template_id,)
            )
            exists = cursor.fetchone()[0] > 0

            if exists:
                # Update existing template
                cursor.execute(
                    """
                    UPDATE templates 
                    SET description = ?, template_data = ?
                    WHERE template_id = ?
                    """,
                    (description, json.dumps(template_data), template_id),
                )
            else:
                # Insert new template
                cursor.execute(
                    """
                    INSERT INTO templates (template_id, description, template_data)
                    VALUES (?, ?, ?)
                    """,
                    (template_id, description, json.dumps(template_data)),
                )

            conn.commit()
            return True
        except Exception as e:
            print(f"Error saving template: {e}")
            conn.rollback()
            return False

    def get_template_by_id(self, template_id: str) -> Optional[Template]:
        """Get specific template by ID"""
        cursor = self._get_cursor()
        cursor.execute(
            "SELECT template_id, description, template_data FROM templates WHERE template_id = ?",
            (template_id,),
        )
        row = cursor.fetchone()
        if row:
            return Template(row[0], row[1], row[2])
        return None

    def insert_experiment(self, template_id: str, num_agents: int) -> str:
        cursor = self._get_cursor()
        conn = self._get_connection()

        exp_id = str(uuid.uuid4())
        cursor.execute(
            "INSERT INTO experiments (experiment_id, template_id, num_agents, status) VALUES (?, ?, ?, ?)",
            (exp_id, template_id, num_agents, "unknown"),
        )
        conn.commit()
        return exp_id

    def create_experiment_record(
        self, experiment_id: str, template_id: str, status: str = "pending"
    ) -> bool:
        """Create a new experiment record with specified ID and status"""
        cursor = self._get_cursor()
        conn = self._get_connection()

        try:
            cursor.execute(
                "INSERT INTO experiments (experiment_id, template_id, num_agents, status) VALUES (?, ?, ?, ?)",
                (
                    experiment_id,
                    template_id,
                    0,
                    status,
                ),  # num_agents will be updated later
            )
            conn.commit()
            return True
        except Exception as e:
            print(f"Error creating experiment record: {e}")
            conn.rollback()
            return False

    def get_experiment_by_id(self, experiment_id: str) -> Optional[Experiment]:
        """Get specific experiment by ID"""
        cursor = self._get_cursor()
        cursor.execute(
            """
            SELECT e.experiment_id, e.template_id, t.description, e.created_at, e.status, e.num_agents
            FROM experiments e
            LEFT JOIN templates t ON e.template_id = t.template_id
            WHERE e.experiment_id = ?
            """,
            (experiment_id,),
        )
        row = cursor.fetchone()
        if row:
            # Create an Experiment object with the fetched data
            return Experiment(
                experiment_id=row[0],
                template_id=row[1],
                template_description=row[2],
                created_at=row[3],
                status=row[4],
                num_agents=row[5],
            )
        return None

    def update_experiment_status(self, experiment_id: str, status: str) -> bool:
        """Update experiment status"""
        cursor = self._get_cursor()
        conn = self._get_connection()

        try:
            cursor.execute(
                "UPDATE experiments SET status = ? WHERE experiment_id = ?",
                (status, experiment_id),
            )
            conn.commit()
            return cursor.rowcount > 0
        except Exception as e:
            print(f"Error updating experiment status: {e}")
            conn.rollback()
            return False

    def update_experiment_agent_count(
        self, experiment_id: str, num_agents: int
    ) -> bool:
        """Update experiment agent count"""
        cursor = self._get_cursor()
        conn = self._get_connection()

        try:
            cursor.execute(
                "UPDATE experiments SET num_agents = ? WHERE experiment_id = ?",
                (num_agents, experiment_id),
            )
            conn.commit()
            return cursor.rowcount > 0
        except Exception as e:
            print(f"Error updating experiment agent count: {e}")
            conn.rollback()
            return False

    def delete_experiment(self, experiment_id: str) -> bool:
        """Delete an experiment and all related data"""
        cursor = self._get_cursor()
        conn = self._get_connection()

        try:
            # Delete in order to respect foreign key constraints
            cursor.execute(
                "DELETE FROM experiment_results WHERE experiment_id = ?",
                (experiment_id,),
            )
            cursor.execute(
                "DELETE FROM conversations WHERE experiment_id = ?", (experiment_id,)
            )
            cursor.execute(
                "DELETE FROM agent_counts WHERE experiment_id = ?", (experiment_id,)
            )
            cursor.execute(
                "DELETE FROM experiments WHERE experiment_id = ?", (experiment_id,)
            )

            conn.commit()
            return True
        except Exception as e:
            print(f"Error deleting experiment: {e}")
            conn.rollback()
            return False

    def get_all_experiments(self):
        """Get all experiments with template info"""
        cursor = self._get_cursor()
        cursor.execute(
            """
            SELECT e.experiment_id, e.template_id, t.description, e.created_at, e.status
            FROM experiments e
            LEFT JOIN templates t ON e.template_id = t.template_id
            ORDER BY e.created_at DESC
        """
        )
        return cursor.fetchall()

    def insert_agent_counts(self, experiment_id: str, agent_counts: List[AgentCount]):
        cursor = self._get_cursor()
        conn = self._get_connection()

        for ac in agent_counts:
            cursor.execute(
                "INSERT INTO agent_counts (experiment_id, role, count) VALUES (?, ?, ?)",
                (experiment_id, ac.role, ac.count),
            )
        conn.commit()

    def insert_conversation(self, conversation: Conversation):
        cursor = self._get_cursor()
        conn = self._get_connection()
        print(conversation.experiment_id)
        cursor.execute(
            """
            INSERT INTO conversations (experiment_id, day_no, sequence_no, agent_1, agent_2, text)
            VALUES (?, ?, ?, ?, ?, ?)
        """,
            (
                conversation.experiment_id,
                conversation.day_no,
                conversation.sequence_no,
                conversation.agent_1,
                conversation.agent_2,
                conversation.text,
            ),
        )
        conn.commit()

    def insert_experiment_result(self, result: ExperimentResult):
        cursor = self._get_cursor()
        conn = self._get_connection()

        cursor.execute(
            """
            INSERT INTO experiment_results (experiment_id, raw_report)
            VALUES (?, ?)
        """,
            (result.experiment_id, result.raw_report),
        )
        conn.commit()

    def get_all_conversations(self, experiment_id: str) -> List[Conversation]:
        cursor = self._get_cursor()
        cursor.execute(
            """
            SELECT experiment_id, day_no, sequence_no, agent_1, agent_2, text
            FROM conversations
            WHERE experiment_id = ?
            ORDER BY day_no, sequence_no
        """,
            (experiment_id,),
        )
        rows = cursor.fetchall()
        print(rows)
        return [Conversation(*row) for row in rows]

    def get_experiment_result(self, experiment_id: str) -> Optional[str]:
        """Get experiment result"""
        cursor = self._get_cursor()
        cursor.execute(
            """
            SELECT raw_report FROM experiment_results
            WHERE experiment_id = ?
        """,
            (experiment_id,),
        )
        row = cursor.fetchone()
        return row[0] if row else None

    def close(self):
        """Close the thread-local connection"""
        if hasattr(self._local, "connection"):
            self._local.connection.close()
            delattr(self._local, "connection")
