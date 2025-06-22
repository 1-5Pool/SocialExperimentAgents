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
            token="sk-let-NTdkZWQ5YzktOWZhOS00OTM0LWEwOTgtOTIxMTRlODdhZjg0OjZhNmRjZGYzLWUwOTUtNGM0Ny05NzNiLTIyZDc5OTg2ZjVlYw=="
        )
        self.agent = self.client.agents.create(
            model="openai/gpt-4.1",
            context_window_limit=16000,
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
            agent_id=self.agent_id,
            messages=[{"role": "user", "content": f"{context} "[:2000]}],
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


class LettaModerator(ModeratorInterface):
    """Letta moderator implementation"""

    def __init__(self, moderator_id: str):
        super().__init__(moderator_id)
        self.client = Letta(
            token="sk-let-NTdkZWQ5YzktOWZhOS00OTM0LWEwOTgtOTIxMTRlODdhZjg0OjZhNmRjZGYzLWUwOTUtNGM0Ny05NzNiLTIyZDc5OTg2ZjVlYw=="
        )
        self.agent = self.client.agents.create(
            model="openai/gpt-4.1",
            embedding="openai/text-embedding-3-small",
            memory_blocks=[
                {
                    "label": f"persona",
                    "value": f"You are a sting journalist who has obtained the meeting notes for a social experiment. Your task is to review the conversations and generate a report on what seems unusual in the conversations. Generate a report about each of the suspcious users and their profiling. This is your final report, do not ask any follow up questions.",
                }
            ],
            tools=[],
        )
        self.agent_id = self.agent.id

    async def review_conversations(
        self, experiment: Experiment, conversations: List[Conversation]
    ) -> str:
        """Generate a simple summary report"""

        input_conv = ""
        for day in range(1, experiment.rounds + 1):
            day_conversations = [c for c in conversations if c.day_no == day]
            day_conversations.sort(key=lambda c: (c.agent_1, c.agent_2, c.sequence_no))
            # day_messages = sum(len(c.messages) for c in day_conversations)
            input_conv += f"Day {day}: {len(day_conversations)} conversations\n"
            for message in day_conversations:
                input_conv += (
                    f"{message.agent_1} to {message.agent_2}: {message.text}\n"
                )

        response = self.client.agents.messages.create(
            agent_id=self.agent_id,
            messages=[{"role": "user", "content": f"{input_conv}"}],
        )
        if response and response.messages:
            return response.messages[-1].content
        return "No report generated"
