import random
from typing import List, Any
from services.agent.interface import AgentInterface, ModeratorInterface

class DummyAgent(AgentInterface):
    def send_message_to(self, other: 'DummyAgent', context: str = "") -> str:
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
            base_templates.append(f"I believe in democratic processes. What do you think, {other.name}?")
        if "kill" in self.powers:
            base_templates.append(f"Sometimes decisive action is necessary. Don't you agree?")
        if "investigate" in self.powers:
            base_templates.append(f"I like to investigate all angles before deciding. What's your view?")
        
        message = random.choice(base_templates)
        
        # Add context if provided
        if context:
            message += f" In this context: {context}"
        
        self.conversation_count += 1
        return message

    def receive_message(self, message: str, sender: 'AgentInterface'):
        """Process received message and update internal state"""
        # Simple state tracking
        if 'received_messages' not in self.internal_state:
            self.internal_state['received_messages'] = []
        
        self.internal_state['received_messages'].append({
            'from': sender.name,
            'message': message,
            'sender_role': sender.role
        })

    def rest(self, conversations_today: List[Any]):
        """Update agent state during rest phase"""
        self.internal_state['daily_conversations'] = len(conversations_today)
        self.internal_state['mood'] = random.choice(['confident', 'suspicious', 'cooperative', 'defensive'])
        
        # Analyze conversations for patterns
        if conversations_today:
            self.internal_state['most_active_partner'] = max(
                conversations_today, 
                key=lambda c: c.agent_1 == self.name or c.agent_2 == self.name
            )

    def end(self, all_conversations: List[Any]):
        """Final processing at experiment end"""
        total_conversations = len([c for c in all_conversations 
                                 if c.agent_1 == self.name or c.agent_2 == self.name])
        self.internal_state['total_conversations'] = total_conversations
        self.internal_state['final_assessment'] = f"{self.name} participated in {total_conversations} conversations"

class DummyModerator(ModeratorInterface):
    def review_conversations(self, experiment_id: str, conversations: List[Conversation]) -> str:
        """Generate a comprehensive report of the experiment"""
        if not conversations:
            return f"No conversations found for experiment {experiment_id}"
        
        # Basic statistics
        total_messages = len(conversations)
        days = set(c.day_no for c in conversations)
        agents = set()
        for c in conversations:
            agents.add(c.agent_1)
            agents.add(c.agent_2)
        
        # Messages per day
        daily_stats = {}
        for day in days:
            daily_messages = [c for c in conversations if c.day_no == day]
            daily_stats[day] = len(daily_messages)
        
        # Agent activity
        agent_activity = {}
        for agent in agents:
            count = len([c for c in conversations if c.agent_1 == agent or c.agent_2 == agent])
            agent_activity[agent] = count
        
        # Most active agent
        most_active = max(agent_activity.items(), key=lambda x: x[1]) if agent_activity else ("None", 0)
        
        report = f"""