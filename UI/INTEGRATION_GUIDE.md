# Frontend-Backend Integration Guide

## 🎯 Quick Start

### 1. Start Backend
```bash
cd backend
bash deployment/run_local.sh
```

### 2. Start Frontend
```bash
cd UI
./start.sh
```

### 3. Open Browser
- Main App: http://localhost:8080
- Templates: http://localhost:8080/templates.html
- Dashboard: http://localhost:8080/experiments.html

## 🔗 API Integration Points

### Core Integration (api.js)
The frontend automatically connects to your backend at `http://localhost:8000` and uses these endpoints:

#### Templates
- `GET /templates` - Load available experiment templates
- `POST /templates` - Create new templates via UI
- `GET /templates/{id}` - View template details

#### Experiments  
- `POST /run_experiment` - Start simulations from UI
- `GET /experiments` - Monitor all experiments
- `GET /experiments/{id}/status` - Real-time status polling
- `GET /experiments/{id}/conversations` - View agent interactions
- `GET /experiments/{id}/result` - Get AI moderator analysis

#### Health & Status
- `GET /health` - Backend connectivity check
- Connection status indicator in UI

## 🎮 UI Features Connected to Backend

### Main Simulator (index.html)
✅ **Experiment Selection** → Maps to your template IDs
✅ **Real-time Monitoring** → Polls experiment status every 2 seconds  
✅ **Agent Conversations** → Displays backend conversation data
✅ **AI Reports** → Shows raw_report from backend analysis

### Template Manager (templates.html)
✅ **Template Creation** → Sends JSON to `POST /templates`
✅ **Faction Configuration** → Maps to your template_data.factions format
✅ **Template Library** → Lists from `GET /templates`

### Experiment Dashboard (experiments.html)
✅ **Live Status** → Real-time experiment monitoring
✅ **Conversation Viewer** → Formatted display of backend data
✅ **Result Analysis** → AI moderator report display
✅ **Experiment Management** → Delete via `DELETE /experiments/{id}`

## 🎛️ Experiment Type Mapping

The UI experiment types map to backend template IDs:

```javascript
'social-engineering' → 'social_engineering_v1'
'phishing' → 'phishing_attack_v1'
'insider-threat' → 'insider_threat_v1'
'peer-pressure' → 'peer_pressure_v1'
'authority-bias' → 'authority_bias_v1'
'workplace-rumors' → 'workplace_rumors_v1'
'trust-exploitation' → 'trust_exploitation_v1'
'groupthink' → 'groupthink_v1'
'bribery' → 'bribery_attempt_v1'
```

## 📊 Data Flow

### Starting an Experiment
1. User selects experiment type in UI
2. UI maps to template_id and sends to `POST /run_experiment`
3. Backend returns experiment_id
4. UI polls `GET /experiments/{id}/status` every 2 seconds
5. When complete, UI fetches conversations and results

### Real-time Updates
```javascript
// Polling implementation
experimentAPI.pollExperimentStatus(experimentId, (data) => {
    if (data.status === 'completed') {
        displayResults(data.conversations, data.result);
    }
});
```

### Template Creation
1. User fills form in Template Manager
2. UI constructs template_data object
3. Sends to `POST /templates` with your exact schema
4. Refreshes template list

## 🔧 Configuration

### Backend URL
Update in `api.js` if backend runs elsewhere:
```javascript
const API_BASE_URL = 'http://your-backend:8000';
```

### Polling Intervals
Adjust in `api.js`:
```javascript
async pollExperimentStatus(id, callback, interval = 2000) // 2 seconds
```

## 🧪 Testing Integration

### Quick Test
```bash
cd UI
open test_integration.html
```

### Manual Verification
1. **Health Check**: Should show backend status
2. **Templates**: Should list your templates
3. **Run Experiment**: Should create and monitor experiment
4. **View Results**: Should display AI analysis

## 🚨 Fallback Behavior

When backend is unavailable:
- UI shows "Demo Mode" indicator
- Mock data for experiment types
- Local simulation for demonstrations
- All UI functionality preserved

## 📝 Backend Data Format Expected

### Template Structure
```json
{
  "template_id": "string",
  "description": "string", 
  "template_data": {
    "template_name": "string",
    "rounds": 5,
    "conversations_per_round": 6,
    "factions": {
      "faction_name": {
        "description": "string",
        "agent_count": 3
      }
    }
  }
}
```

### Conversation Format
```json
[
  {
    "day": 1,
    "conversations": [
      {
        "sequence_no": 1,
        "agent_1": "agent_name",
        "agent_2": "agent_name",
        "text": "conversation text"
      }
    ]
  }
]
```

### Result Format
```json
{
  "experiment_id": "string",
  "raw_report": "AI analysis text..."
}
```

## 🎯 Next Steps

1. ✅ Backend running on :8000
2. ✅ Frontend running on :8080  
3. ✅ Test integration page works
4. ✅ Create/run experiments via UI
5. ✅ Monitor in dashboard
6. ✅ View AI analysis reports

The frontend is fully integrated with your backend APIs and ready for the hackathon demo!