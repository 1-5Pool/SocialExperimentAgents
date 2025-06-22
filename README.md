# Multi-Agent Social Dynamics Lab 🤖

**UC Berkeley AI Hackathon Project**

An educational research platform for studying social manipulation tactics using multi-agent AI systems. Watch AI agents interact, manipulate, and influence each other in real-time!

## 🚀 Quick Start (5 minutes)

### 1. Install Dependencies
```bash
cd /opt/work/hackathonSocial
pip install -r requirements.txt
```

### 2. Run the Application
```bash
python backend.py
```

### 3. Open in Browser
Navigate to: http://localhost:8000

## 🎯 Features

### 9 Social Experiments
1. **Credential Theft** - Social engineering to steal passwords
2. **Phishing Attack** - Email-based deception
3. **Insider Threat** - Detecting malicious employees
4. **Peer Pressure** - Group dynamics and conformity
5. **Authority Bias** - Unethical orders from superiors
6. **Workplace Rumors** - How gossip spreads
7. **Trust Exploitation** - Betrayal of confidence
8. **Groupthink** - Poor group decisions
9. **Bribery** - Corruption attempts

### Key Capabilities
- **Real-time Conversations**: Watch agents interact naturally
- **AI Moderator Analysis**: Get insights on what happened and why
- **Security Recommendations**: Learn how to prevent attacks
- **Visual Flow Diagrams**: Understand attack patterns
- **Export Reports**: Download findings for training

## 🏗️ Architecture

```
Frontend (HTML/JS)  →  WebSocket  →  Backend (FastAPI)
                                         ↓
                                    Mock Agents or
                                    Letta Server
```

## 💻 Running with Letta (Optional)

For more realistic agent conversations using LLMs:

### 1. Start Letta Server
```bash
docker run -p 8283:8283 -e OPENAI_API_KEY=$OPENAI_API_KEY letta/letta:latest
```

### 2. Update Backend
Replace `backend.py` with `letta_backend.py` for full Letta integration.

## 🎮 Demo Workflow

1. **Select Experiment**: Choose from 9 social manipulation scenarios
2. **Configure**: Set number of agents (3-10)
3. **Start**: Watch agents interact in real-time
4. **Observe**: See trust building, manipulation tactics, resistance
5. **Analyze**: AI moderator provides insights and recommendations

## 📊 Example Analysis

For a social engineering attack:
- **Tactic Used**: Urgency + Authority
- **Vulnerability**: Employee revealed password without verification
- **Recommendation**: Implement two-person authorization
- **Training Need**: Recognize manipulation tactics

## 🏆 Why This Wins Hackathons

1. **Educational Impact**: Addresses real cybersecurity issues
2. **Technical Depth**: Multi-agent systems with emergent behaviors
3. **Visual Appeal**: Real-time visualization of complex interactions
4. **Practical Value**: Generates actionable security recommendations
5. **Extensible**: Easy to add new scenarios

## 🚢 Deployment

### Local Demo
```bash
python backend.py
```

### Network Access
```bash
# For team access
python -m http.server 8080  # Serve HTML
# Access at http://[your-ip]:8080
```

### Public URL (with ngrok)
```bash
ngrok http 8000
```

## 📝 Notes

- The default backend uses mock agents for quick demos
- For production use, integrate with Letta for real LLM agents
- All conversations are analyzed for security insights
- Reports can be exported for training purposes

## 🤝 Team

Built for UC Berkeley AI Hackathon - Studying social manipulation through AI

---

**Remember**: This is an educational tool to understand and prevent social engineering attacks!