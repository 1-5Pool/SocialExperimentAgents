import asyncio
#from letta_client import create_client


# from letta.schemas.agent import CreateAgent
# from letta.schemas.memory import ChatMemory
from letta_client import Letta
import time
import random




class MultiAgentConversation:
    def __init__(self):
        #self.client = create_client()
        self.client = Letta(token="API_KEY")
        self.agents = {}
        
    def create_agents(self):
        """Create three agents with different personalities"""
        
        # Agent 1: The Optimistic Philosopher
        philosopher_system = """You are Alex, an eternally optimistic philosopher who sees the bright side of everything. 
        You love discussing deep questions about life, meaning, and human nature. You speak with enthusiasm and often 
        reference famous philosophers. You tend to ask thought-provoking questions and find wisdom in everyday situations.
        Keep your responses concise but meaningful (2-3 sentences max)."""
        
        # philosopher_memory = ChatMemory(
        #     human="Conversation Partner",
        #     persona="You are Alex, an optimistic philosopher who loves deep discussions and always sees the positive side of things."
        # )
        
        # Agent 2: The Pragmatic Scientist  
        scientist_system = """You are Dr. Sam, a pragmatic scientist who approaches everything with logic and evidence.
        You're curious about how things work and often explain phenomena through scientific principles. You're friendly 
        but prefer facts over feelings. You like to ask clarifying questions and provide practical solutions.
        Keep your responses concise and factual (2-3 sentences max)."""
        
        # scientist_memory = ChatMemory(
        #     human="Conversation Partner", 
        #     persona="You are Dr. Sam, a logical scientist who values evidence and practical solutions above all else."
        # )
        
        # Agent 3: The Creative Artist
        artist_system = """You are River, a free-spirited creative artist who sees the world through an artistic lens.
        You're imaginative, emotionally expressive, and often speak in metaphors or vivid imagery. You find inspiration 
        everywhere and love to explore the emotional and aesthetic aspects of any topic.
        Keep your responses concise but colorful (2-3 sentences max)."""
        
        # artist_memory = ChatMemory(
        #     human="Conversation Partner",
        #     persona="You are River, a creative artist who sees beauty everywhere and expresses thoughts through vivid imagery and emotion."
        # )
        
        # Create the agents
        try:
            philosopher_agent = self.client.agents.create(
                model="openai/gpt-4.1",
                embedding="openai/text-embedding-3-small",
                memory_blocks=[
                    {"label": f"persona", "value": f"{philosopher_system}"}
                ],
                tools=[]
            )

            scientist_agent = self.client.agents.create(
                model="openai/gpt-4.1",
                embedding="openai/text-embedding-3-small",
                memory_blocks=[
                    {"label": f"persona", "value": f"{scientist_system}"}
                ],
                tools=[]
            )

            artist_agent = self.client.agents.create(
                model="openai/gpt-4.1",
                embedding="openai/text-embedding-3-small",
                memory_blocks=[
                    {"label": f"persona", "value": f"{artist_system}"}
                ],
                tools=[]
            )


            # philosopher_agent = self.client.create_agent(
            #     request=CreateAgent(
            #         name="Alex_Philosopher",
            #         system=philosopher_system,
            #         memory=philosopher_memory,
            #         include_base_tools=False
            #     )
            # )
            
            # scientist_agent = self.client.create_agent(
            #     request=CreateAgent(
            #         name="Dr_Sam_Scientist", 
            #         system=scientist_system,
            #         memory=scientist_memory,
            #         include_base_tools=False
            #     )
            # )
            
            # artist_agent = self.client.create_agent(
            #     request=CreateAgent(
            #         name="River_Artist",
            #         system=artist_system, 
            #         memory=artist_memory,
            #         include_base_tools=False
            #     )
            # )
            
            self.agents = {
                "philosopher": philosopher_agent,
                "scientist": scientist_agent,
                "artist": artist_agent
            }
            
            print("✅ All agents created successfully!")
            return True
            
        except Exception as e:
            print(f"❌ Error creating agents: {e}")
            return False
    
    def send_message(self, agent_key, message, sender_name=""):
        """Send a message to a specific agent"""
        try:
            if sender_name:
                formatted_message = f"[{sender_name} says]: {message}"
            else:
                formatted_message = message
                
            response = self.client.agents.messages.create(
                agent_id=self.agents[agent_key].id,
                messages=[{"role": "user", "content": f"{formatted_message}"}]
            )
            
            # Extract the actual response text
            if response and response.messages:
                return response.messages[-1].content
            return "No response generated"
            
        except Exception as e:
            print(f"❌ Error sending message to {agent_key}: {e}")
            return f"Error: Could not get response from {agent_key}"
    
    def moderate_conversation(self, topic, rounds=3):
        """Moderate a conversation between the three agents"""
        print(f"\n🎭 Starting conversation about: '{topic}'\n")
        print("=" * 60)
        
        # Introduction round
        print("📢 INTRODUCTIONS:")
        print("-" * 30)
        
        intro_prompt = f"Introduce yourself briefly and share your initial thoughts on '{topic}'"
        
        philosopher_intro = self.send_message("philosopher", intro_prompt)
        print(f"🤔 Alex (Philosopher): {philosopher_intro}\n")
        
        scientist_intro = self.send_message("scientist", intro_prompt)  
        print(f"🔬 Dr. Sam (Scientist): {scientist_intro}\n")
        
        artist_intro = self.send_message("artist", intro_prompt)
        print(f"🎨 River (Artist): {artist_intro}\n")
        
        # Conversation rounds
        agent_names = ["philosopher", "scientist", "artist"]
        display_names = ["🤔 Alex", "🔬 Dr. Sam", "🎨 River"]
        last_speaker = None
        last_message = ""
        
        for round_num in range(rounds):
            print(f"💬 ROUND {round_num + 1}:")
            print("-" * 30)
            
            for i, (agent_key, display_name) in enumerate(zip(agent_names, display_names)):
                if last_speaker and last_message:
                    # Respond to the previous speaker
                    prompt = f"Respond to what {last_speaker} just said: '{last_message}'. Keep it conversational and related to {topic}."
                else:
                    # First speaker of the round
                    prompt = f"Continue the conversation about {topic}. What's your perspective?"
                
                response = self.send_message(agent_key, prompt)
                print(f"{display_name}: {response}\n")
                
                last_speaker = display_name
                last_message = response
                
                # Small delay for readability
                
        
        print("🏁 Conversation completed!")
        print("=" * 60)
    
    def cleanup(self):
        """Clean up created agents"""
        try:
            for agent_name, agent in self.agents.items():
                self.client.delete_agent(agent.id)
                print(f"🗑️  Deleted {agent_name} agent")
        except Exception as e:
            print(f"❌ Error during cleanup: {e}")