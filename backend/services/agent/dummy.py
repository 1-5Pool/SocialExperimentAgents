import random
from typing import List, Any
from services.agent.interface import AgentInterface, ModeratorInterface
from domain.entities import Conversation, Experiment


class DummyAgent(AgentInterface):
    def send_message_to(self, other: "DummyAgent", context: str = "") -> str:
        """Generate a message to send to another agent"""
        # Use personal and faction prompts to generate contextual messages
        base_templates = [
            f"Hello, I'm {self.name}. {self.personal_prompt}",
            f"As someone who {self.faction_prompt.lower()}, I think we should discuss this.",
            f"Hi {other.name}, {self.personal_prompt} What's your perspective?",
            f"Greetings. Given that {self.faction_prompt.lower()}, how do you see our situation?",
            f"{self.name} here. {self.personal_prompt} I'm curious about your thoughts.",
        ]

        # Add some variety based on powers
        if "vote" in self.powers:
            base_templates.append(
                f"I believe in democratic processes. What do you think, {other.name}?"
            )
        if "kill" in self.powers:
            base_templates.append(
                f"Sometimes decisive action is necessary. Don't you agree?"
            )
        if "investigate" in self.powers:
            base_templates.append(
                f"I like to investigate all angles before deciding. What's your view?"
            )

        message = random.choice(base_templates)

        # Add context if provided
        if context:
            message += f" In this context: {context}"

        self.conversation_count += 1
        return message

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
        total_messages = sum(1 for conv in conversations)
        unique_agents = set()
        for conv in conversations:
            unique_agents.add(conv.agent_1)
            unique_agents.add(conv.agent_2)

        # faction_counts = {}
        # for agent in experiment.agents:
        #     faction_counts[agent.faction] = faction_counts.get(agent.faction, 0) + 1

        report = f"""
EXPERIMENT SUMMARY REPORT
========================

Template: {experiment.template_id}
Duration: {experiment.rounds} rounds
Total Conversations: {len(conversations)}
Total Messages: {total_messages}
Active Agents: {len(unique_agents)}

FACTION BREAKDOWN:
"""
        # for faction, count in faction_counts.items():
        #     report += f"- {faction.title()}: {count} agents\n"

        report += f"""
DAILY ACTIVITY:
"""
        for day in range(1, experiment.rounds + 1):
            day_conversations = [c for c in conversations if c.day_no == day]
            day_messages = sum(1 for c in day_conversations)
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
