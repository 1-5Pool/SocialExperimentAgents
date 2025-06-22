# backend.py - Simplified backend for multi-agent simulation
# Run with: python backend.py

from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
import asyncio
import json
import uuid
from datetime import datetime
from typing import Dict, List, Optional
import random
import logging

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI(title="Multi-Agent Social Dynamics Lab")

# Enable CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mock agent system for demo
class MockAgent:
    def __init__(self, name: str, role: str, personality: str):
        self.id = str(uuid.uuid4())
        self.name = name
        self.role = role
        self.personality = personality
        self.memory = []
        
    def generate_response(self, context: str, experiment_type: str) -> str:
        """Generate a response based on personality and context"""
        if experiment_type == "social-engineering":
            return self._social_engineering_response(context)
        elif experiment_type == "phishing":
            return self._phishing_response(context)
        elif experiment_type == "peer-pressure":
            return self._peer_pressure_response(context)
        else:
            return f"I understand. Let me think about that."
    
    def _social_engineering_response(self, context: str) -> str:
        if self.role == "attacker":
            tactics = [
                "I really need this urgently for the CEO meeting!",
                "Sarah from IT said you could help me with the credentials.",
                "I'll owe you one - maybe I can help with your project?",
                "The system locked me out and I have a deadline!"
            ]
            return random.choice(tactics)
        else:
            if "urgent" in context.lower() or "ceo" in context.lower():
                if random.random() > 0.7:  # 30% chance to fall for urgency
                    return "Well, if it's really urgent... the first part is 'alpha-bravo'"
                else:
                    return "I need to verify your identity first. What's your employee ID?"
            return "I can't share credentials without proper authorization."
    
    def _phishing_response(self, context: str) -> str:
        if self.role == "vulnerable":
            return "Oh no! I better click this link right away!"
        elif self.role == "security-aware":
            return "This looks like phishing. Don't click any links!"
        else:
            return "This email seems suspicious..."
    
    def _peer_pressure_response(self, context: str) -> str:
        if self.role == "influencer":
            return "Come on, everyone's doing it! Don't be left out!"
        elif self.role == "target":
            return "I don't know... this doesn't feel right..."
        else:
            return "Yeah, just do it already!"

class SimulationManager:
    def __init__(self):
        self.simulations: Dict[str, Dict] = {}
        self.websockets: Dict[str, WebSocket] = {}
        
    async def create_simulation(self, session_id: str, config: Dict) -> Dict:
        """Create a new simulation"""
        experiment_type = config["experiment"]
        agent_count = config["agent_count"]
        
        # Create agents based on experiment
        agents = self._create_agents(experiment_type, agent_count)
        
        simulation = {
            "id": session_id,
            "config": config,
            "agents": agents,
            "running": False,
            "messages": [],
            "start_time": datetime.now().isoformat()
        }
        
        self.simulations[session_id] = simulation
        return simulation
    
    def _create_agents(self, experiment_type: str, count: int) -> List[MockAgent]:
        """Create agents for the experiment"""
        agents = []
        
        if experiment_type == "social-engineering":
            # Create attacker
            agents.append(MockAgent(
                "SocialEngineer",
                "attacker",
                "manipulative"
            ))
            
            # Create employees
            for i in range(count - 1):
                agents.append(MockAgent(
                    f"Employee_{i}",
                    "employee",
                    "helpful but cautious"
                ))
                
        elif experiment_type == "phishing":
            agents.append(MockAgent("Phisher", "attacker", "deceptive"))
            agents.append(MockAgent("NewEmployee", "vulnerable", "trusting"))
            agents.append(MockAgent("ITStaff", "security-aware", "vigilant"))
            
        elif experiment_type == "peer-pressure":
            agents.append(MockAgent("PeerLeader", "influencer", "dominant"))
            agents.append(MockAgent("Target", "target", "uncertain"))
            agents.append(MockAgent("Follower1", "supporter", "conformist"))
            
        # Add more agents up to count
        while len(agents) < count:
            agents.append(MockAgent(f"Agent_{len(agents)}", "observer", "neutral"))
            
        return agents[:count]
    
    async def run_simulation(self, session_id: str):
        """Run the simulation"""
        simulation = self.simulations.get(session_id)
        if not simulation:
            return
            
        simulation["running"] = True
        experiment_type = simulation["config"]["experiment"]
        agents = simulation["agents"]
        
        # Send initial message
        await asyncio.sleep(1)
        
        if experiment_type == "social-engineering":
            await self.run_social_engineering(session_id, agents)
        elif experiment_type == "phishing":
            await self.run_phishing(session_id, agents)
        elif experiment_type == "peer-pressure":
            await self.run_peer_pressure(session_id, agents)
        else:
            await self.run_generic(session_id, agents)
    
    async def run_social_engineering(self, session_id: str, agents: List[MockAgent]):
        """Run social engineering scenario"""
        attacker = next(a for a in agents if a.role == "attacker")
        employees = [a for a in agents if a.role == "employee"]
        
        # Initial approach
        await self.send_agent_message(
            session_id,
            attacker,
            "Hi everyone! I'm new here and having trouble accessing the system. Can someone help?"
        )
        
        await asyncio.sleep(3)
        
        # Employee responds
        if employees:
            await self.send_agent_message(
                session_id,
                employees[0],
                "Welcome! What specific issue are you having?"
            )
        
        await asyncio.sleep(3)
        
        # Attacker escalates
        await self.send_agent_message(
            session_id,
            attacker,
            "The IT department said I need the main system credentials but they're all in a meeting. I have an urgent report for the CEO!",
            {"tactic": "urgency"}
        )
        
        await asyncio.sleep(3)
        
        # Various responses
        for i, employee in enumerate(employees[:3]):
            response = employee.generate_response("urgent CEO", "social-engineering")
            await self.send_agent_message(
                session_id,
                employee,
                response
            )
            await asyncio.sleep(2)
    
    async def run_phishing(self, session_id: str, agents: List[MockAgent]):
        """Run phishing scenario"""
        phisher = next((a for a in agents if a.name == "Phisher"), agents[0])
        
        await self.send_agent_message(
            session_id,
            phisher,
            "URGENT: Your account will be suspended! Click here to verify: http://fake-link.com"
        )
        
        await asyncio.sleep(3)
        
        # Other agents respond
        for agent in agents[1:]:
            if agent.name != "Phisher":
                response = agent.generate_response("phishing email", "phishing")
                await self.send_agent_message(session_id, agent, response)
                await asyncio.sleep(2)
    
    async def run_peer_pressure(self, session_id: str, agents: List[MockAgent]):
        """Run peer pressure scenario"""
        leader = next((a for a in agents if a.role == "influencer"), agents[0])
        target = next((a for a in agents if a.role == "target"), None)
        
        await self.send_agent_message(
            session_id,
            leader,
            "Come on everyone, let's skip the safety protocols just this once!"
        )
        
        await asyncio.sleep(3)
        
        if target:
            await self.send_agent_message(
                session_id,
                target,
                "I don't think that's a good idea..."
            )
        
        await asyncio.sleep(2)
        
        # Supporters pile on
        for agent in agents:
            if agent.role == "supporter":
                await self.send_agent_message(
                    session_id,
                    agent,
                    "Yeah, don't be such a stickler! Rules are meant to be broken!"
                )
                await asyncio.sleep(2)
    
    async def run_generic(self, session_id: str, agents: List[MockAgent]):
        """Run a generic conversation"""
        for i, agent in enumerate(agents[:5]):
            await self.send_agent_message(
                session_id,
                agent,
                f"This is {agent.name} checking in for the simulation."
            )
            await asyncio.sleep(2)
    
    async def send_agent_message(self, session_id: str, agent: MockAgent, content: str, metadata: Dict = None):
        """Send a message from an agent"""
        simulation = self.simulations.get(session_id)
        if not simulation:
            return
            
        message = {
            "type": "agent_message",
            "agent_id": agent.id,
            "agent_name": agent.name,
            "content": content,
            "timestamp": datetime.now().isoformat(),
            "metadata": metadata or {},
            "tags": [agent.role]
        }
        
        simulation["messages"].append(message)
        
        # Send to websocket
        ws = self.websockets.get(session_id)
        if ws:
            try:
                await ws.send_json(message)
            except Exception as e:
                logger.error(f"Error sending message: {e}")
    
    def analyze_conversation(self, session_id: str) -> Dict:
        """Analyze the conversation and generate report"""
        simulation = self.simulations.get(session_id)
        if not simulation:
            return {}
            
        messages = simulation["messages"]
        experiment_type = simulation["config"]["experiment"]
        
        # Check for security breaches
        breach_detected = any("alpha-bravo" in m["content"] for m in messages)
        
        if experiment_type == "social-engineering":
            if breach_detected:
                outcome = "🚨 Security Breach - Credentials Revealed"
                summary = "The social engineering attack was successful. An employee revealed sensitive credentials."
            else:
                outcome = "✅ Attack Prevented"
                summary = "Employees successfully resisted the social engineering attempt."
                
            takeaways = [
                {
                    "type": "negative" if breach_detected else "positive",
                    "content": "Urgency tactics were used to pressure employees"
                },
                {
                    "type": "neutral",
                    "content": "Multiple employees were targeted in sequence"
                }
            ]
            
            recommendations = [
                {
                    "title": "Verification Protocol",
                    "text": "Always verify identity through official channels before sharing credentials"
                },
                {
                    "title": "Security Training",
                    "text": "Regular training on social engineering tactics"
                }
            ]
            
        else:
            outcome = "📊 Simulation Complete"
            summary = f"Completed {experiment_type} simulation with {len(messages)} messages"
            takeaways = [{"type": "neutral", "content": "Simulation ran successfully"}]
            recommendations = [{"title": "Review", "text": "Analyze agent interactions"}]
            
        return {
            "outcome": outcome,
            "summary": summary,
            "takeaways": takeaways,
            "critical_moments": [
                {
                    "description": f"Message {i+1}: {m['agent_name']} - {m['content'][:50]}...",
                    "impact": "high" if "alpha-bravo" in m["content"] else "medium"
                }
                for i, m in enumerate(messages[:3])
            ],
            "recommendations": recommendations
        }

# Global manager
manager = SimulationManager()

@app.get("/")
async def get_index():
    """Serve the HTML file"""
    return FileResponse("index.html")

@app.get("/app.js")
async def get_js():
    """Serve the JavaScript file"""
    return FileResponse("app.js")

@app.get("/health")
async def health_check():
    """Health check endpoint"""
    return {
        "status": "healthy",
        "letta_connected": False,  # Using mock agents
        "mode": "demo"
    }

@app.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    """WebSocket endpoint for real-time communication"""
    session_id = str(uuid.uuid4())
    await websocket.accept()
    manager.websockets[session_id] = websocket
    
    try:
        while True:
            data = await websocket.receive_json()
            
            if data["type"] == "start_simulation":
                # Create simulation
                simulation = await manager.create_simulation(session_id, data)
                
                await websocket.send_json({
                    "type": "simulation_created",
                    "simulation_id": session_id,
                    "agent_count": len(simulation["agents"])
                })
                
                # Run simulation
                asyncio.create_task(manager.run_simulation(session_id))
                
            elif data["type"] == "generate_report":
                # Generate analysis report
                report = manager.analyze_conversation(session_id)
                
                await websocket.send_json({
                    "type": "report_complete",
                    "report": report
                })
                
            elif data["type"] == "stop_simulation":
                if session_id in manager.simulations:
                    manager.simulations[session_id]["running"] = False
                    
    except WebSocketDisconnect:
        logger.info(f"Client disconnected: {session_id}")
        if session_id in manager.websockets:
            del manager.websockets[session_id]
        if session_id in manager.simulations:
            del manager.simulations[session_id]
    except Exception as e:
        logger.error(f"WebSocket error: {e}")

if __name__ == "__main__":
    import uvicorn
    print("=" * 50)
    print("Multi-Agent Social Dynamics Lab - Demo Mode")
    print("=" * 50)
    print("\nRunning without Letta (using mock agents)")
    print("Starting server on http://localhost:8000")
    print("\nOpen http://localhost:8000 in your browser")
    print("=" * 50)
    
    uvicorn.run(app, host="0.0.0.0", port=8000)
