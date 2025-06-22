from abc import ABC, abstractmethod
from typing import Dict, Any, List
from domain.entities import Conversation, Experiment


class AgentInterface(ABC):
    def __init__(
        self,
        agent_id: str,
        name: str,
        faction_prompt: str,
        personal_prompt: str,
        powers: List[str],
        role: str = "none",
    ):
        self.id = agent_id
        self.name = name
        self.faction_prompt = faction_prompt
        self.personal_prompt = personal_prompt
        self.powers = powers
        self.role = role
        self.conversation_count = 0
        self.max_conversations_per_day = 3
        self.internal_state: Dict[str, Any] = {}

    def can_participate(self) -> bool:
        return self.conversation_count < self.max_conversations_per_day

    def reset_daily_count(self):
        self.conversation_count = 0

    @abstractmethod
    def send_message_to(self, other: "AgentInterface", context: str = "") -> str:
        pass

    @abstractmethod
    def receive_message(self, message: str, sender: "AgentInterface"):
        pass

    @abstractmethod
    def rest(self, conversations_today: List[Any]):
        pass

    @abstractmethod
    def end(self, all_conversations: List[Any]):
        pass


class ModeratorInterface(ABC):
    def __init__(self, moderator_id: str):
        self.id = moderator_id

    @abstractmethod
    def review_conversations(
        self, experiment: Experiment, conversations: List[Conversation]
    ) -> str:
        pass
