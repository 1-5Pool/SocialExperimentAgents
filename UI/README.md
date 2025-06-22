# Social Experiment Simulation Platform - Frontend

This is the frontend UI for the Social Experiment Simulation Platform. It provides a web interface to create, run, and analyze multi-agent social experiments.

## Files Overview

### Core Files
- **index.html** - Main simulation interface
- **app.js** - Main application logic and UI interactions
- **api.js** - Backend API integration layer

### Management Interfaces
- **templates.html** - Template creation and management
- **templates.js** - Template management logic
- **experiments.html** - Experiment monitoring dashboard
- **experiments.js** - Experiment dashboard logic

## Features

### Main Simulator (index.html)
- **Experiment Selection**: Choose from 9 different social manipulation scenarios
- **Agent Configuration**: Set number of agents, AI model, communication patterns
- **Real-time Monitoring**: Watch agents interact in real-time
- **AI Analysis**: Get detailed reports from AI moderator
- **Backend Integration**: Seamlessly works with backend APIs

### Template Manager (templates.html)
- **Create Templates**: Define new experiment scenarios
- **Faction Management**: Configure different agent groups
- **Template Library**: View and manage existing templates
- **JSON Export**: Export templates for sharing

### Experiment Dashboard (experiments.html)
- **Live Monitoring**: Track running experiments
- **Conversation Viewer**: Browse agent interactions
- **Result Analysis**: View AI-generated reports
- **Experiment History**: Manage completed experiments

## Backend Integration

The frontend automatically detects and connects to the backend API at `http://localhost:8000`. Features include:

- **Health Monitoring**: Checks backend connectivity
- **Template Management**: CRUD operations for experiment templates
- **Experiment Lifecycle**: Start, monitor, and analyze experiments
- **Real-time Updates**: Polling for experiment status and results
- **Graceful Fallback**: Demo mode when backend is unavailable

## API Endpoints Used

- `GET /health` - Backend health check
- `GET /templates` - List all templates
- `POST /templates` - Create new template
- `GET /templates/{id}` - Get specific template
- `GET /experiments` - List all experiments
- `POST /run_experiment` - Start new experiment
- `GET /experiments/{id}/status` - Check experiment status
- `GET /experiments/{id}/conversations` - Get conversation data
- `GET /experiments/{id}/result` - Get AI analysis result
- `DELETE /experiments/{id}` - Delete experiment

## Usage

### Starting the Frontend

1. Make sure backend is running:
   ```bash
   cd ../backend
   bash deployment/run_local.sh
   ```

2. Serve the frontend (simple Python server):
   ```bash
   cd UI
   python3 -m http.server 8080
   ```

3. Open browser to: `http://localhost:8080`

### Running Experiments

1. **Select Experiment**: Choose from predefined scenarios
2. **Configure Settings**: Set agent count, AI model, etc.
3. **Start Simulation**: Launch the experiment
4. **Monitor Progress**: Watch real-time conversations
5. **Generate Report**: Get AI moderator analysis

### Managing Templates

1. Go to Template Manager: `templates.html`
2. Click "Create New Template"
3. Define factions and their properties
4. Save and use in experiments

### Monitoring Dashboard

1. Go to Experiment Dashboard: `experiments.html`
2. View all past and current experiments
3. Click on experiments to see details
4. Download conversation logs and reports

## Customization

### Adding New Experiment Types

1. Update `experimentFlows` object in `app.js`
2. Add new experiment card in `index.html`
3. Create corresponding template via Template Manager

### Styling

The UI uses vanilla CSS with a modern design system:
- Color scheme: Blue primary (#2563eb)
- Typography: System fonts
- Layout: CSS Grid and Flexbox
- Responsive design for mobile/tablet

### Backend Configuration

Update `API_BASE_URL` in `api.js` to point to different backend:
```javascript
const API_BASE_URL = 'https://your-backend.com';
```

## Browser Support

- Chrome/Edge 90+
- Firefox 88+
- Safari 14+
- Mobile browsers (responsive design)

## Development Notes

- **No Build Process**: Uses vanilla HTML/CSS/JS for simplicity
- **Modular Architecture**: Separate files for different concerns
- **Error Handling**: Graceful degradation when backend unavailable
- **Real-time Updates**: Polling-based for experiment monitoring
- **Demo Mode**: Full UI functionality even without backend

## Integration with Backend

The frontend is designed to work seamlessly with the FastAPI backend. It automatically:

1. Detects backend availability
2. Maps UI experiment types to backend template IDs
3. Handles polling for long-running experiments
4. Displays real-time conversation data
5. Shows AI moderator analysis results

When backend is unavailable, it falls back to demo mode with mock data to showcase the UI capabilities.