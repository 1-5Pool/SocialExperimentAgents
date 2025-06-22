import uuid
import json
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
        self.conn = get_connection(db_path)
        self.cursor = self.conn.cursor()
        self._setup_schema()
        self._ensure_default_template()

    def _setup_schema(self):
        self.cursor.execute(
            """
        CREATE TABLE IF NOT EXISTS experiments (
            experiment_id TEXT PRIMARY KEY,
            template_id TEXT,
            num_agents INTEGER,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )"""
        )

        self.cursor.execute(
            """
        CREATE TABLE IF NOT EXISTS agent_counts (
            experiment_id TEXT,
            role TEXT,
            count INTEGER,
            FOREIGN KEY (experiment_id) REFERENCES experiments(experiment_id)
        )"""
        )

        self.cursor.execute(
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

        self.cursor.execute(
            """
        CREATE TABLE IF NOT EXISTS templates (
            template_id TEXT PRIMARY KEY,
            description TEXT,
            template_data TEXT
        )"""
        )

        self.cursor.execute(
            """
        CREATE TABLE IF NOT EXISTS experiment_results (
            experiment_id TEXT PRIMARY KEY,
            raw_report TEXT,
            FOREIGN KEY (experiment_id) REFERENCES experiments(experiment_id)
        )"""
        )

        self.conn.commit()

    def _ensure_default_template(self):
        self.cursor.execute("SELECT COUNT(*) FROM templates")
        if self.cursor.fetchone()[0] == 0:
            default_template = {
                "template_name": "Secret Hitler",
                "rounds": 5,
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

            self.cursor.execute(
                """
                INSERT INTO templates (template_id, description, template_data) 
                VALUES (?, ?, ?)
            """,
                (
                    "template-default",
                    "Default Secret Hitler template",
                    json.dumps(default_template),
                ),
            )
            self.conn.commit()

    def get_all_templates(self) -> List[Template]:
        """Get all available templates"""
        self.cursor.execute(
            "SELECT template_id, description, template_data FROM templates"
        )
        rows = self.cursor.fetchall()
        return [Template(row[0], row[1], row[2]) for row in rows]

    def get_template_by_id(self, template_id: str) -> Optional[Template]:
        """Get specific template by ID"""
        self.cursor.execute(
            "SELECT template_id, description, template_data FROM templates WHERE template_id = ?",
            (template_id,),
        )
        row = self.cursor.fetchone()
        if row:
            return Template(row[0], row[1], row[2])
        return None

    def insert_experiment(self, template_id: str, num_agents: int) -> str:
        exp_id = str(uuid.uuid4())
        self.cursor.execute(
            "INSERT INTO experiments (experiment_id, template_id, num_agents) VALUES (?, ?, ?)",
            (exp_id, template_id, num_agents),
        )
        self.conn.commit()
        return exp_id

    def get_all_experiments(self):
        """Get all experiments with template info"""
        self.cursor.execute(
            """
            SELECT e.experiment_id, e.template_id, t.description, e.created_at
            FROM experiments e
            LEFT JOIN templates t ON e.template_id = t.template_id
            ORDER BY e.created_at DESC
        """
        )
        return self.cursor.fetchall()

    def insert_agent_counts(self, experiment_id: str, agent_counts: List[AgentCount]):
        for ac in agent_counts:
            self.cursor.execute(
                "INSERT INTO agent_counts (experiment_id, role, count) VALUES (?, ?, ?)",
                (experiment_id, ac.role, ac.count),
            )
        self.conn.commit()

    def insert_conversation(self, conversation: Conversation):
        self.cursor.execute(
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
        self.conn.commit()

    def insert_experiment_result(self, result: ExperimentResult):
        self.cursor.execute(
            """
            INSERT INTO experiment_results (experiment_id, raw_report)
            VALUES (?, ?)
        """,
            (result.experiment_id, result.raw_report),
        )
        self.conn.commit()

    def get_all_conversations(self, experiment_id: str) -> List[Conversation]:
        self.cursor.execute(
            """
            SELECT experiment_id, day_no, sequence_no, agent_1, agent_2, text
            FROM conversations
            WHERE experiment_id = ?
            ORDER BY day_no, sequence_no
        """,
            (experiment_id,),
        )
        rows = self.cursor.fetchall()
        return [Conversation(*row) for row in rows]

    def get_experiment_result(self, experiment_id: str) -> Optional[str]:
        """Get experiment result"""
        self.cursor.execute(
            """
            SELECT raw_report FROM experiment_results
            WHERE experiment_id = ?
        """,
            (experiment_id,),
        )
        row = self.cursor.fetchone()
        return row[0] if row else None
