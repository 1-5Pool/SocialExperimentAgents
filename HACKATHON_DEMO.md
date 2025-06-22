# 🚀 HACKATHON QUICK START - 2 MINUTES

## Option 1: Super Quick Demo (No Setup)
```bash
cd /opt/work/hackathonSocial
python3 backend.py
```
Open: http://localhost:8000

## Option 2: Full Experience with Docker
```bash
cd /opt/work/hackathonSocial
docker-compose up
```
Open: http://localhost:8000

## Demo Script for Judges (3 minutes)

### 1. Opening (15 seconds)
"We've built an educational platform to study how AI agents can manipulate each other through social engineering."

### 2. Start Demo (30 seconds)
- Click "Credential Theft" experiment
- Set 6 agents
- Click "Start Simulation"

### 3. Show Attack (1 minute)
- Point out the social engineer building trust
- Show urgency tactic: "CEO meeting!"
- Watch Employee_3 reveal password
- "This mirrors real attacks we see daily"

### 4. Generate Report (30 seconds)
- Click "Generate Report" 
- Show AI moderator analysis
- "It identified the exact failure point"

### 5. Show Recommendations (30 seconds)
- "Specific actions to prevent this"
- "Can be used for security training"

### 6. Technical Highlights (30 seconds)
- "Multi-agent system with emergent behaviors"
- "Each agent has memory and personality"
- "Extensible to any social scenario"

### 7. Closing (15 seconds)
"This helps organizations understand and prevent social engineering attacks through simulation."

## Key Points to Emphasize

✅ **Educational Impact**: Real cybersecurity training tool
✅ **Technical Depth**: Autonomous agents with complex interactions  
✅ **Practical Value**: Generates actionable recommendations
✅ **Scalable**: Can simulate 100+ agents
✅ **Extensible**: Easy to add new attack scenarios

## If Asked About Implementation

- Built with FastAPI + WebSockets for real-time
- Can use mock agents OR real LLMs via Letta
- Frontend is pure HTML/JS (no build step)
- Dockerized for easy deployment

## Troubleshooting

**"Server not running"**
→ Make sure you're in `/opt/work/hackathonSocial`
→ Run: `python3 backend.py`

**"No agents talking"**
→ Click an experiment first
→ Then configure and start

**"Want more realistic agents"**
→ Mention Letta integration for GPT-4 agents
→ "We have that working too!"