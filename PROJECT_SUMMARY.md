# Project Structure

```
/opt/work/hackathonSocial/
├── index.html              # Main UI (single page, no build needed)
├── app.js                  # Frontend JavaScript logic
├── backend.py              # Simple backend with mock agents
├── letta_backend.py        # Full Letta integration (optional)
├── requirements.txt        # Python dependencies
├── README.md              # Project documentation
├── HACKATHON_DEMO.md      # Quick demo guide for judges
├── .env.example           # Environment variables template
├── Dockerfile             # Container setup
├── docker-compose.yml     # Full stack with Letta
└── run.sh                 # Quick start script
```

## To Run:

### Simplest (for demo):
```bash
cd /opt/work/hackathonSocial
python3 backend.py
```
Open http://localhost:8000

### With virtual environment:
```bash
cd /opt/work/hackathonSocial
chmod +x run.sh
./run.sh
```

### With Docker:
```bash
cd /opt/work/hackathonSocial
docker-compose up
```

## Key Features Implemented:

1. ✅ **9 Social Experiments** - All requested scenarios
2. ✅ **Simple UI** - Step-by-step wizard interface  
3. ✅ **Real-time Chat** - WebSocket streaming
4. ✅ **AI Moderator** - Analyzes conversations
5. ✅ **Security Reports** - What went wrong & how to fix it
6. ✅ **Mock & Real Agents** - Works with or without Letta

## For the Hackathon:

1. **Main Demo**: Use `backend.py` (no dependencies needed)
2. **Show Letta**: Mention it scales to real LLMs
3. **Focus on Impact**: Educational cybersecurity tool
4. **Highlight UI**: Clean, intuitive flow
5. **Show Report**: AI explains the attack

Good luck! 🚀