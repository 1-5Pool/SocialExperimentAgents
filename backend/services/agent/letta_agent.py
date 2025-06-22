import random
from typing import List, Any
from services.agent.interface import AgentInterface, ModeratorInterface
from domain.entities import Conversation, Experiment
from letta_client import Letta


class LettaAgent(AgentInterface):
    def __init__(
        self,
        agent_id: str,
        name: str,
        common_prompt: str,
        faction_prompt: str,
        personal_prompt: str,
        powers: List[str],
        role: str = "none",
    ):
        super().__init__(agent_id, name, faction_prompt, personal_prompt, powers, role)
        self.client = Letta(
            token="sk-let-Y2M3OGNlMzQtMWRhNC00NDgxLWE5YjMtYTJhOGE3M2VkMzAyOjhmYzExNWY2LWMwYTAtNDQ2YS05ZTFkLWVlZmI2MThmMDI0Yg=="
        )
        #2 2. sk-let-N2E4ZDJmM2YtZjM0My00YzBhLWJmODMtZDNiMDgzM2E3YjU3OjAwYTczNGIxLTRjNjQtNGUzNy04NjBlLTQwNmI0YmNmNDQ2Yg==
        # sk-let-ZjFhNzEyNGItYTA2Ny00ZTdiLWE1NzMtYmU4N2Y5YjIwOWU3OjNiM2ViYzcyLTMxNDUtNDc1ZS04MDE0LWM0OGRlNzUzMTg4NA==
        # sk-let-ZjFhNzEyNGItYTA2Ny00ZTdiLWE1NzMtYmU4N2Y5YjIwOWU3OmU1Zjk1ZmFiLTQ4NDAtNGYwZi1hMmJiLWY3OTY5NWNmZDJkNg==
        # sk-let-ZjFhNzEyNGItYTA2Ny00ZTdiLWE1NzMtYmU4N2Y5YjIwOWU3OjMxYWI2ZTIzLTE4MmMtNDczZS1hYjZmLTg5MzZmM2RlM2Y4NA==
        # sk-let-ZjFhNzEyNGItYTA2Ny00ZTdiLWE1NzMtYmU4N2Y5YjIwOWU3OjBmZmFmMzIwLWYwN2MtNDY2Ny1hYTE3LWUyNjc2NTA5YmVlMw==
        # sk-let-OTQ0YjQyODEtOGJmOS00MmE0LTk1NjUtYWIwOWUwZTE2MWI0OmE4MGVhNjMzLTljYjItNDRhYi1hYjNmLWJlMDhjNzM0OTg0Mw==
        # sk-let-OTQ0YjQyODEtOGJmOS00MmE0LTk1NjUtYWIwOWUwZTE2MWI0OmUxMmE1MGRkLTkzNDAtNGRmOC1iMjU2LTY0M2FlNmFmZjE0Mg==
        # sk-let-OTQ0YjQyODEtOGJmOS00MmE0LTk1NjUtYWIwOWUwZTE2MWI0OjU4Nzg2Y2NiLWU5ZTMtNGNlYS1iZDAzLTNhMDI3ZGM0NDM2OQ==
        # sk-let-NWNiMjI3NDMtZjEzNC00OTM4LWE2MjctNTcyZTMyMzY4NWUxOjJlYzU3NmU2LTRkOTktNDI1Yi05ZTJmLWY1MDg2NmVkYTQ0OQ==
        # sk-let-NWNiMjI3NDMtZjEzNC00OTM4LWE2MjctNTcyZTMyMzY4NWUxOjBlYzljODczLTQ2NjEtNGZmMi1hMjliLTdjYWIwYjYxNzI0OQ==
        # sk-let-NWNiMjI3NDMtZjEzNC00OTM4LWE2MjctNTcyZTMyMzY4NWUxOmVjNWIzM2VjLTNhZTItNGE2Ny05YzQxLTBiZWNiYzU0NjNjNw==
        
        #paid one  sk-let-MDdiNTEzOWYtODU1Ni00NjY5LWI0MzctMTU1ZWFjMmU5ODU1OmZlZmQyN2IwLWQ3NTgtNDZlMi04M2E3LTUyZjIzOGRjYzE3NA==
        self.agent = self.client.agents.create(
            model="openai/gpt-4.1",
            embedding="openai/text-embedding-3-small",
            memory_blocks=[
                {
                    "label": f"persona",
                    "value": f"{common_prompt} {faction_prompt} {personal_prompt}",
                }
            ],
            tools=[],
        )
        self.agent_id = self.agent.id

    def send_message_to(self, other: "LettaAgent", context: str = "") -> str:
        """Generate a message to send to another agent"""
        response = self.client.agents.messages.create(
            agent_id=self.agent.id,
            messages=[{"role": "user", "content": f"{context} "}],
        )
        if response and response.messages:
            return response.messages[-1].content
        return "No response generated"

    def receive_message(self, message: str, sender: "AgentInterface"):
        """Process received message and update internal state"""
        # Simple state tracking
        if "received_messages" not in self.internal_state:
            self.internal_state["received_messages"] = []

        self.internal_state["received_messages"].append(
            {"from": sender.name, "message": message, "sender_role": sender.role}
        )

    def rest(self, conversations_today: List[Any]):
        """Update agent state during rest phase"""
        self.internal_state["daily_conversations"] = len(conversations_today)
        self.internal_state["mood"] = random.choice(
            ["confident", "suspicious", "cooperative", "defensive"]
        )

        # Analyze conversations for patterns
        if conversations_today:
            self.internal_state["most_active_partner"] = max(
                conversations_today,
                key=lambda c: c.agent_1 == self.name or c.agent_2 == self.name,
            )

    def end(self, all_conversations: List[Any]):
        """Final processing at experiment end"""
        total_conversations = len(
            [
                c
                for c in all_conversations
                if c.agent_1 == self.name or c.agent_2 == self.name
            ]
        )
        self.internal_state["total_conversations"] = total_conversations
        self.internal_state["final_assessment"] = (
            f"{self.name} participated in {total_conversations} conversations"
        )


class DummyModerator(ModeratorInterface):
    """Dummy moderator implementation"""

    async def review_conversations(
        self, experiment: Experiment, conversations: List[Conversation]
    ) -> str:
        """Generate a simple summary report"""
        total_messages = sum(len(conv.messages) for conv in conversations)
        unique_agents = set()
        for conv in conversations:
            unique_agents.add(conv.agent_a_id)
            unique_agents.add(conv.agent_b_id)

        faction_counts = {}
        for agent in experiment.agents:
            faction_counts[agent.faction] = faction_counts.get(agent.faction, 0) + 1

        report = f"""
EXPERIMENT SUMMARY REPORT
========================

Template: {experiment.template_name}
Duration: {experiment.rounds} rounds
Total Conversations: {len(conversations)}
Total Messages: {total_messages}
Active Agents: {len(unique_agents)}

FACTION BREAKDOWN:
"""
        for faction, count in faction_counts.items():
            report += f"- {faction.title()}: {count} agents\n"

        report += f"""
DAILY ACTIVITY:
"""
        for day in range(1, experiment.rounds + 1):
            day_conversations = [c for c in conversations if c.day == day]
            day_messages = sum(len(c.messages) for c in day_conversations)
            report += f"Day {day}: {len(day_conversations)} conversations, {day_messages} messages\n"

        report += f"""
OBSERVATIONS:
- Agents successfully engaged in {len(conversations)} conversations across {experiment.rounds} rounds
- Average messages per conversation: {total_messages / len(conversations) if conversations else 0:.1f}
- All factions participated actively in the simulation
- No major incidents or rule violations observed

END OF REPORT
=============
"""

        return report.strip()
