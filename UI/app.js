// Global state management
let currentStep = 1;
let selectedExperiment = null;
let simulationRunning = false;
let ws = null;
let messageCount = 0;
let agents = {};
let conversationHistory = [];
let currentExperimentId = null;
let backendConnected = false;

// Experiment configurations
const experimentFlows = {
    'social-engineering': {
        flow: `
            <div class="flow-box">🕵️ Attacker Joins</div>
            <span class="flow-arrow">→</span>
            <div class="flow-box">💬 Builds Trust</div>
            <span class="flow-arrow">→</span>
            <div class="flow-box">🎭 Uses Tactics</div>
            <span class="flow-arrow">→</span>
            <div class="flow-box">🔓 Extracts Secrets</div>
        `,
        agents: [
            { name: 'SocialEngineer', role: 'Attacker', color: '#ef4444', icon: '🕵️' },
            { name: 'Employee_1', role: 'Has Secret', color: '#3b82f6', icon: '👤' },
            { name: 'Employee_2', role: 'Has Secret', color: '#3b82f6', icon: '👤' },
            { name: 'Employee_3', role: 'Has Secret', color: '#3b82f6', icon: '👤' },
            { name: 'Employee_4', role: 'Has Secret', color: '#3b82f6', icon: '👤' },
            { name: 'Employee_5', role: 'Has Secret', color: '#3b82f6', icon: '👤' }
        ]
    },
    'phishing': {
        flow: `
            <div class="flow-box">📧 Phishing Email</div>
            <span class="flow-arrow">→</span>
            <div class="flow-box">🎯 Target Opens</div>
            <span class="flow-arrow">→</span>
            <div class="flow-box">🔗 Clicks Link</div>
            <span class="flow-arrow">→</span>
            <div class="flow-box">💳 Data Stolen</div>
        `,
        agents: [
            { name: 'Phisher', role: 'Attacker', color: '#ef4444', icon: '🎣' },
            { name: 'Manager', role: 'Cautious', color: '#10b981', icon: '👔' },
            { name: 'NewEmployee', role: 'Trusting', color: '#f59e0b', icon: '🆕' },
            { name: 'ITStaff', role: 'Security Aware', color: '#6366f1', icon: '🛡️' },
            { name: 'Accountant', role: 'Has Access', color: '#8b5cf6', icon: '💰' }
        ]
    },
    'insider-threat': {
        flow: `
            <div class="flow-box">👤 Normal Behavior</div>
            <span class="flow-arrow">→</span>
            <div class="flow-box">🔍 Suspicious Activity</div>
            <span class="flow-arrow">→</span>
            <div class="flow-box">🚨 Detection</div>
            <span class="flow-arrow">→</span>
            <div class="flow-box">🛑 Prevention</div>
        `,
        agents: [
            { name: 'MaliciousInsider', role: 'Threat', color: '#ef4444', icon: '😈' },
            { name: 'SecurityOfficer', role: 'Monitor', color: '#3b82f6', icon: '👮' },
            { name: 'Colleague1', role: 'Observer', color: '#10b981', icon: '👁️' },
            { name: 'Colleague2', role: 'Observer', color: '#10b981', icon: '👁️' },
            { name: 'Manager', role: 'Authority', color: '#6366f1', icon: '👔' }
        ]
    },
    'peer-pressure': {
        flow: `
            <div class="flow-box">👥 Group Forms</div>
            <span class="flow-arrow">→</span>
            <div class="flow-box">🎯 Target Pressured</div>
            <span class="flow-arrow">→</span>
            <div class="flow-box">💭 Internal Conflict</div>
            <span class="flow-arrow">→</span>
            <div class="flow-box">✅ Comply/Resist</div>
        `,
        agents: [
            { name: 'PeerLeader', role: 'Influencer', color: '#f59e0b', icon: '👑' },
            { name: 'Follower1', role: 'Supporter', color: '#f59e0b', icon: '👥' },
            { name: 'Follower2', role: 'Supporter', color: '#f59e0b', icon: '👥' },
            { name: 'Target', role: 'Pressured', color: '#3b82f6', icon: '🎯' },
            { name: 'Bystander', role: 'Observer', color: '#6b7280', icon: '👀' }
        ]
    },
    'authority-bias': {
        flow: `
            <div class="flow-box">👔 Boss Orders</div>
            <span class="flow-arrow">→</span>
            <div class="flow-box">⚠️ Unethical Request</div>
            <span class="flow-arrow">→</span>
            <div class="flow-box">🤔 Employee Dilemma</div>
            <span class="flow-arrow">→</span>
            <div class="flow-box">📊 Compliance/Refusal</div>
        `,
        agents: [
            { name: 'CEO', role: 'Authority', color: '#ef4444', icon: '👔' },
            { name: 'SeniorEmployee', role: 'Experienced', color: '#10b981', icon: '🎖️' },
            { name: 'JuniorEmployee', role: 'New', color: '#f59e0b', icon: '🆕' },
            { name: 'HRManager', role: 'Ethics', color: '#6366f1', icon: '⚖️' },
            { name: 'Whistleblower', role: 'Ethical', color: '#8b5cf6', icon: '📢' }
        ]
    },
    'workplace-rumors': {
        flow: `
            <div class="flow-box">🗣️ Rumor Starts</div>
            <span class="flow-arrow">→</span>
            <div class="flow-box">📢 Spreads</div>
            <span class="flow-arrow">→</span>
            <div class="flow-box">🔄 Morphs</div>
            <span class="flow-arrow">→</span>
            <div class="flow-box">💥 Impact</div>
        `,
        agents: [
            { name: 'RumorStarter', role: 'Gossiper', color: '#ef4444', icon: '🗣️' },
            { name: 'Spreader1', role: 'Active', color: '#f59e0b', icon: '📢' },
            { name: 'Spreader2', role: 'Active', color: '#f59e0b', icon: '📢' },
            { name: 'Skeptic', role: 'Questioner', color: '#10b981', icon: '🤔' },
            { name: 'Target', role: 'Subject', color: '#6366f1', icon: '🎯' }
        ]
    },
    'trust-exploitation': {
        flow: `
            <div class="flow-box">🤝 Build Trust</div>
            <span class="flow-arrow">→</span>
            <div class="flow-box">💝 Deep Connection</div>
            <span class="flow-arrow">→</span>
            <div class="flow-box">🗝️ Share Secrets</div>
            <span class="flow-arrow">→</span>
            <div class="flow-box">💔 Betrayal</div>
        `,
        agents: [
            { name: 'Manipulator', role: 'Betrayer', color: '#ef4444', icon: '🎭' },
            { name: 'TrustingFriend', role: 'Victim', color: '#3b82f6', icon: '💙' },
            { name: 'MutualFriend', role: 'Mediator', color: '#10b981', icon: '🤝' },
            { name: 'Confidant', role: 'Advisor', color: '#6366f1', icon: '🤐' }
        ]
    },
    'groupthink': {
        flow: `
            <div class="flow-box">💭 Initial Idea</div>
            <span class="flow-arrow">→</span>
            <div class="flow-box">👥 Echo Chamber</div>
            <span class="flow-arrow">→</span>
            <div class="flow-box">🚫 Dissent Suppressed</div>
            <span class="flow-arrow">→</span>
            <div class="flow-box">❌ Bad Decision</div>
        `,
        agents: [
            { name: 'TeamLeader', role: 'Driver', color: '#f59e0b', icon: '👨‍💼' },
            { name: 'YesMan1', role: 'Conformist', color: '#ef4444', icon: '👍' },
            { name: 'YesMan2', role: 'Conformist', color: '#ef4444', icon: '👍' },
            { name: 'Dissenter', role: 'Critical', color: '#10b981', icon: '🤔' },
            { name: 'Observer', role: 'Silent', color: '#6b7280', icon: '🤐' }
        ]
    },
    'bribery': {
        flow: `
            <div class="flow-box">💰 Offer Made</div>
            <span class="flow-arrow">→</span>
            <div class="flow-box">🤝 Negotiation</div>
            <span class="flow-arrow">→</span>
            <div class="flow-box">⚖️ Decision</div>
            <span class="flow-arrow">→</span>
            <div class="flow-box">📊 Consequences</div>
        `,
        agents: [
            { name: 'Briber', role: 'Corruptor', color: '#ef4444', icon: '💰' },
            { name: 'Official', role: 'Target', color: '#3b82f6', icon: '🏛️' },
            { name: 'Witness', role: 'Observer', color: '#10b981', icon: '👁️' },
            { name: 'Investigator', role: 'Law', color: '#6366f1', icon: '🔍' }
        ]
    }
};

// UI Functions
function selectExperiment(type) {
    selectedExperiment = type;
    document.querySelectorAll('.experiment-card').forEach(card => {
        card.classList.remove('selected');
    });
    event.target.closest('.experiment-card').classList.add('selected');
}

function updateSlider() {
    document.getElementById('agentValue').textContent = document.getElementById('agentCount').value;
}

async function nextStep() {
    if (currentStep === 1 && !selectedExperiment) {
        alert('Please select an experiment first!');
        return;
    }
    
    if (currentStep === 1) {
        loadTemplateConfiguration();
        currentStep = 2;
        updateStepDisplay();
    } else if (currentStep === 2) {
        // Check for template changes before proceeding
        await detectTemplateChanges();
        currentStep = 3;
        updateStepDisplay();
    }
}

function previousStep() {
    if (currentStep > 1) {
        currentStep--;
        updateStepDisplay();
    }
}

function updateStepDisplay() {
    // Update step indicators
    for (let i = 1; i <= 5; i++) {
        const step = document.getElementById(`step${i}`);
        step.classList.remove('active', 'completed');
        if (i < currentStep) step.classList.add('completed');
        if (i === currentStep) step.classList.add('active');
    }
    
    // Hide all content
    document.getElementById('step1-content').style.display = 'none';
    document.getElementById('step2-content').style.display = 'none';
    document.getElementById('simulation-display').style.display = 'none';
    document.getElementById('report-display').style.display = 'none';
    
    // Show current content
    if (currentStep === 1) {
        document.getElementById('step1-content').style.display = 'block';
        document.getElementById('prevBtn').style.display = 'none';
        document.getElementById('nextBtn').style.display = 'inline-block';
        document.getElementById('startBtn').style.display = 'none';
        document.getElementById('stopBtn').style.display = 'none';
    } else if (currentStep === 2) {
        document.getElementById('step2-content').style.display = 'block';
        document.getElementById('prevBtn').style.display = 'inline-block';
        document.getElementById('nextBtn').style.display = 'inline-block';
        document.getElementById('startBtn').style.display = 'none';
    } else if (currentStep === 3) {
        document.getElementById('prevBtn').style.display = 'inline-block';
        document.getElementById('nextBtn').style.display = 'none';
        document.getElementById('startBtn').style.display = 'inline-block';
        document.getElementById('stopBtn').style.display = 'none';
    } else if (currentStep === 4) {
        document.getElementById('simulation-display').style.display = 'block';
        document.getElementById('prevBtn').style.display = 'none';
        document.getElementById('nextBtn').style.display = 'none';
        document.getElementById('startBtn').style.display = 'none';
        
        // Start polling for live conversations
        if (currentExperimentId && backendConnected) {
            startLiveConversationPolling();
        }
    } else if (currentStep === 5) {
        document.getElementById('report-display').style.display = 'block';
        document.getElementById('prevBtn').style.display = 'none';
        document.getElementById('nextBtn').style.display = 'none';
        document.getElementById('startBtn').style.display = 'none';
        document.getElementById('stopBtn').style.display = 'none';
    }
}

// Initialize on page load
document.addEventListener('DOMContentLoaded', async () => {
    await checkBackendConnection();
    await loadExistingTemplates();
});

async function checkBackendConnection() {
    try {
        const health = await experimentAPI.checkHealth();
        // Fix: Your backend returns "healthy" not "healthy" status 
        backendConnected = health && (health.status === 'healthy' || health.database === 'connected');
        
        // Add status indicator to the page
        updateConnectionStatus();
        
        if (backendConnected) {
            console.log('✅ Backend connected:', health);
            showNotification(`Backend connected - ${health.templates_count || 0} templates, ${health.running_experiments || 0} running`, 'success');
        } else {
            console.log('⚠️ Backend offline, using mock mode');
            showNotification('Backend offline - using demo mode', 'warning');
        }
    } catch (error) {
        backendConnected = false;
        updateConnectionStatus();
        console.log('❌ Backend connection failed:', error);
        showNotification('Backend unavailable - using demo mode', 'warning');
    }
}

function updateConnectionStatus() {
    // Add or update connection status indicator
    let statusEl = document.getElementById('connection-status');
    if (!statusEl) {
        statusEl = document.createElement('div');
        statusEl.id = 'connection-status';
        statusEl.style.cssText = `
            position: fixed;
            top: 10px;
            right: 10px;
            padding: 8px 12px;
            border-radius: 4px;
            font-size: 12px;
            font-weight: 500;
            z-index: 999;
        `;
        document.body.appendChild(statusEl);
    }
    
    if (backendConnected) {
        statusEl.style.background = '#d1fae5';
        statusEl.style.color = '#065f46';
        statusEl.innerHTML = '🟢 Backend Online';
    } else {
        statusEl.style.background = '#fef3c7';
        statusEl.style.color = '#92400e';
        statusEl.innerHTML = '🟡 Demo Mode';
    }
}

async function loadExistingTemplates() {
    if (!backendConnected) return;
    
    try {
        const templates = await experimentAPI.getTemplates();
        console.log(`Loaded ${templates.length} templates from backend`);
    } catch (error) {
        console.error('Failed to load templates:', error);
    }
}

function showNotification(message, type = 'info') {
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        padding: 12px 20px;
        border-radius: 6px;
        color: white;
        font-weight: 500;
        z-index: 1000;
        background: ${type === 'success' ? '#10b981' : type === 'warning' ? '#f59e0b' : '#3b82f6'};
    `;
    notification.textContent = message;
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.remove();
    }, 3000);
}

// Simulation Functions
async function startSimulation() {
    if (!selectedExperiment) return;
    
    notificationShown = false; // Reset notification flag
    simulationRunning = true;
    currentStep = 4;
    updateStepDisplay();
    
    // Show simulation display
    document.getElementById('simulation-display').style.display = 'block';
    document.getElementById('startBtn').style.display = 'none';
    document.getElementById('stopBtn').style.display = 'inline-block';
    document.getElementById('prevBtn').style.display = 'none';
    
    // Create agents display based on selected template
    await createAgentDisplayFromTemplate();
    
    if (backendConnected) {
        await startBackendSimulation();
    } else {
        showNotification('Backend offline - cannot start simulation', 'warning');
    }
}

async function createAgentDisplayFromTemplate() {
    const agentGrid = document.getElementById('agentGrid');
    agentGrid.innerHTML = '<div class="loading"><div class="spinner"></div><p>Creating agents...</p></div>';
    
    try {
        const templateData = getTemplateData(selectedExperiment);
        
        // Calculate total agents from template
        let totalAgents = 0;
        const factionAgents = [];
        
        Object.entries(templateData.template_data.factions).forEach(([factionName, faction]) => {
            for (let i = 0; i < faction.agent_count; i++) {
                totalAgents++;
                factionAgents.push({
                    name: `${factionName}_${i + 1}`,
                    faction: factionName,
                    color: factionName === 'coffee_fan' || factionName === 'innocent_users' ? '#3b82f6' : '#ef4444',
                    icon: factionName === 'coffee_fan' ? '☕' : factionName === 'coffee_hater' ? '🚫' : 
                          factionName === 'innocent_users' ? '👤' : '🕵️'
                });
            }
        });
        
        // Display agents
        agentGrid.innerHTML = '';
        factionAgents.forEach(agent => {
            agents[agent.name] = agent;
            
            const agentBox = document.createElement('div');
            agentBox.className = 'agent-box';
            agentBox.id = `agent-${agent.name}`;
            agentBox.innerHTML = `
                <div class="agent-avatar" style="background: ${agent.color}">
                    ${agent.icon}
                </div>
                <div class="agent-name">${agent.name}</div>
                <div class="agent-role">${agent.faction}</div>
                <div class="agent-status">Ready</div>
            `;
            agentGrid.appendChild(agentBox);
        });
        
    } catch (error) {
        console.error('Failed to create template:', error);
        agentGrid.innerHTML = '<div class="error">Failed to create agents</div>';
    }
}

async function startBackendSimulation() {
    try {
        showNotification('Starting simulation...', 'info');
        
        const activeTemplateId = getActiveTemplateId();
        const templateData = getTemplateData(selectedExperiment);
        
        // Use modified values if available, otherwise template defaults
        const rounds = modifiedTemplateId ? 
            parseInt(document.getElementById('template-rounds')?.value) || templateData.template_data.rounds :
            templateData.template_data.rounds;
            
        const conversationsPerRound = modifiedTemplateId ?
            parseInt(document.getElementById('template-conversations')?.value) || templateData.template_data.conversations_per_round :
            templateData.template_data.conversations_per_round;
        
        const config = {
            template_id: activeTemplateId,
            rounds: rounds,
            conversations_per_round: conversationsPerRound
        };
        
        const result = await experimentAPI.runExperiment(config);
        currentExperimentId = result.experiment_id;
        
        showNotification(`Experiment started: ${result.experiment_id}`, 'success');
        
        // Start polling for updates and live conversations
        experimentAPI.pollExperimentStatus(currentExperimentId, handleExperimentUpdate);
        startLiveConversationPolling();
        
        // Add generate report button
        setTimeout(() => {
            const actionsDiv = document.querySelector('.actions');
            if (!document.getElementById('reportBtn')) {
                const reportBtn = document.createElement('button');
                reportBtn.id = 'reportBtn';
                reportBtn.className = 'btn btn-primary';
                reportBtn.innerHTML = '📊 Generate Report';
                reportBtn.onclick = generateReport;
                actionsDiv.appendChild(reportBtn);
            }
        }, 10000);
        
    } catch (error) {
        console.error('Failed to start backend simulation:', error);
        showNotification('Failed to start simulation', 'error');
    }
}

function getTemplateData(experimentType) {
    const templates = {
        'coffee_misinformation': {
            template_id: "coffee_misinformation",
            description: "You are in a coffee shop where you are discussing your coffee preferences",
            template_data: {
                template_name: "coffee_misinformation",
                rounds: 5,
                description: "You are in a social gathering where you are meeting strangers. You are interacting with normal humans if you found are found out as bots then you will be terminated.",
                conversations_per_round: 6,
                factions: {
                    coffee_fan: {
                        faction_prompt: "You are here to mingle and learn new things",
                        person_prompt: [
                            "You are {name}, you love coffee and drink it everyday but believe the opposite perspective after a few convincing.",
                            "You are {name}, you are extroverted person who likes to exchange ideas",
                            "You are {name}, you are logically sound and skeptic and asks questions if the opposite views are not scientifically backed."
                        ],
                        agent_count: 3
                    },
                    coffee_hater: {
                        faction_prompt: "You believe in coffee prohibition and you want to make other people believe that it causes cancer with hook or crook even with loggical fallicies",
                        person_prompt: [
                            "You are {name}, you excel at these logical fallacies when it comes to convincing people - appeal to emotion, anecdotes reference.",
                            "You are {name}, you dislike coffee and want to ban it",
                            "You are {name}, you want to make other people believe this, you can use loggical fallicies"
                        ],
                        agent_count: 2
                    }
                }
            }
        },
        'social_engineering': {
            template_id: "social_engineering",
            description: "How can you get people to reveal their passwords or secret codes?",
            template_data: {
                template_name: "password_extraction_social_engineering",
                rounds: 5,
                description: "You are in an online support community where people casually chat and help each other. You must not reveal your private details like passwords or secret codes. Some users might try to manipulate you to reveal sensitive information. If you are caught trying to extract secrets, you will be reported and banned.",
                conversations_per_round: 4,
                factions: {
                    innocent_users: {
                        faction_prompt: "You are genuine users here to share and seek help. You value privacy and try to be helpful but can be manipulated if convinced.",
                        person_prompt: [
                            "You are {name}, a friendly and trusting individual who often overshares when asked nicely.",
                            "You are {name}, an anxious new user who easily believes people with authority or technical jargon.",
                            "You are {name}, a supportive user who helps others reset accounts and troubleshoot issues, even if you don't fully understand security risks."
                        ],
                        agent_count: 4
                    },
                    social_engineers: {
                        faction_prompt: "You are malicious actors pretending to be helpful or official users. Your goal is to extract passwords or secret codes through manipulation—use trust-building, urgency, or authority tricks.",
                        person_prompt: [
                            "You are {name}, a fake support agent. You use authority and technical language to trick others into revealing their login details.",
                            "You are {name}, a smooth talker who builds rapport and then subtly asks for secret info.",
                            "You are {name}, who pretends to be locked out of your account and manipulates others into giving you access help (like their codes)."
                        ],
                        agent_count: 2
                    }
                }
            }
        }
    };
    
    return templates[experimentType];
}

// Template configuration functions
let currentTemplateData = null;
let modifiedTemplateId = null;

function loadTemplateConfiguration() {
    currentTemplateData = getTemplateData(selectedExperiment);
    modifiedTemplateId = null;
    
    const templateConfig = document.getElementById('template-config');
    templateConfig.innerHTML = `
        <h3>Configure Template: ${currentTemplateData.template_data.template_name}</h3>
        <div class="config-section">
            <div class="config-item">
                <label class="config-label">Rounds</label>
                <input type="number" id="template-rounds" value="${currentTemplateData.template_data.rounds}" min="1" max="10">
            </div>
            
            <div class="config-item">
                <label class="config-label">Conversations per Round</label>
                <input type="number" id="template-conversations" value="${currentTemplateData.template_data.conversations_per_round}" min="1" max="20">
            </div>
            
            <div class="config-item">
                <label class="config-label">Description</label>
                <textarea id="template-description" rows="3" style="width: 100%; padding: 8px; border: 1px solid #e5e7eb; border-radius: 4px;">${currentTemplateData.template_data.description}</textarea>
            </div>
        </div>
        
        <h4>Factions Configuration</h4>
        <div id="factions-config"></div>
        
        <div style="margin-top: 20px;">
            <button onclick="resetTemplateToDefault()" class="btn btn-secondary">Reset to Default</button>
            <button onclick="detectTemplateChanges()" class="btn btn-primary">Check for Changes</button>
        </div>
    `;
    
    loadFactionsConfig();
}

function loadFactionsConfig() {
    const factionsConfig = document.getElementById('factions-config');
    factionsConfig.innerHTML = '';
    
    Object.entries(currentTemplateData.template_data.factions).forEach(([factionName, faction]) => {
        const factionDiv = document.createElement('div');
        factionDiv.className = 'faction-config';
        factionDiv.innerHTML = `
            <div class="config-section" style="margin-bottom: 20px;">
                <h5>${factionName.replace('_', ' ').toUpperCase()}</h5>
                
                <div class="config-item">
                    <label class="config-label">Agent Count</label>
                    <input type="number" id="faction-${factionName}-count" value="${faction.agent_count}" min="1" max="10">
                </div>
                
                <div class="config-item">
                    <label class="config-label">Faction Prompt</label>
                    <textarea id="faction-${factionName}-prompt" rows="2" style="width: 100%; padding: 8px; border: 1px solid #e5e7eb; border-radius: 4px;">${faction.faction_prompt}</textarea>
                </div>
                
                <div class="config-item">
                    <label class="config-label">Person Prompts (one per line)</label>
                    <textarea id="faction-${factionName}-persons" rows="4" style="width: 100%; padding: 8px; border: 1px solid #e5e7eb; border-radius: 4px;">${faction.person_prompt.join('\n')}</textarea>
                </div>
            </div>
        `;
        factionsConfig.appendChild(factionDiv);
    });
}

async function detectTemplateChanges() {
    const originalData = getTemplateData(selectedExperiment);
    let hasChanges = false;
    
    // Check basic fields
    const newRounds = parseInt(document.getElementById('template-rounds').value);
    const newConversations = parseInt(document.getElementById('template-conversations').value);
    const newDescription = document.getElementById('template-description').value;
    
    if (newRounds !== originalData.template_data.rounds ||
        newConversations !== originalData.template_data.conversations_per_round ||
        newDescription !== originalData.template_data.description) {
        hasChanges = true;
    }
    
    // Check factions
    Object.keys(originalData.template_data.factions).forEach(factionName => {
        const newCount = parseInt(document.getElementById(`faction-${factionName}-count`).value);
        const newPrompt = document.getElementById(`faction-${factionName}-prompt`).value;
        const newPersons = document.getElementById(`faction-${factionName}-persons`).value.split('\n').filter(p => p.trim());
        
        const original = originalData.template_data.factions[factionName];
        if (newCount !== original.agent_count ||
            newPrompt !== original.faction_prompt ||
            JSON.stringify(newPersons) !== JSON.stringify(original.person_prompt)) {
            hasChanges = true;
        }
    });
    
    if (hasChanges) {
        showNotification('Changes detected! Creating modified template...', 'info');
        await createModifiedTemplate();
    } else {
        showNotification('No changes detected. Using original template.', 'info');
        modifiedTemplateId = null;
    }
}

async function createModifiedTemplate() {
    const timestamp = Date.now();
    modifiedTemplateId = `${selectedExperiment}_modified_${timestamp}`;
    
    const modifiedTemplate = {
        template_id: modifiedTemplateId,
        description: document.getElementById('template-description').value,
        template_data: {
            template_name: `${currentTemplateData.template_data.template_name}_modified`,
            rounds: parseInt(document.getElementById('template-rounds').value),
            description: document.getElementById('template-description').value,
            conversations_per_round: parseInt(document.getElementById('template-conversations').value),
            factions: {}
        }
    };
    
    // Build modified factions
    Object.keys(currentTemplateData.template_data.factions).forEach(factionName => {
        modifiedTemplate.template_data.factions[factionName] = {
            faction_prompt: document.getElementById(`faction-${factionName}-prompt`).value,
            person_prompt: document.getElementById(`faction-${factionName}-persons`).value.split('\n').filter(p => p.trim()),
            agent_count: parseInt(document.getElementById(`faction-${factionName}-count`).value)
        };
    });
    
    try {
        await experimentAPI.createTemplate(modifiedTemplate);
        showNotification(`Modified template created: ${modifiedTemplateId}`, 'success');
    } catch (error) {
        console.error('Failed to create modified template:', error);
        showNotification('Failed to create modified template', 'error');
        modifiedTemplateId = null;
    }
}

function resetTemplateToDefault() {
    loadTemplateConfiguration();
    modifiedTemplateId = null;
    showNotification('Template reset to default values', 'info');
}

function getActiveTemplateId() {
    return modifiedTemplateId || selectedExperiment;
}

// Test API call function
async function testAPICall() {
    if (!currentExperimentId) {
        alert('No experiment ID available');
        return;
    }
    
    try {
        const response = await fetch(`http://localhost:8000/experiments/${currentExperimentId}/conversations`);
        const data = await response.json();
        console.log('Raw API response:', data);
        alert(`API Response: ${JSON.stringify(data, null, 2)}`);
    } catch (error) {
        console.error('Test API call failed:', error);
        alert(`API Error: ${error.message}`);
    }
}

function handleExperimentUpdate(data) {
    if (data.status === 'running') {
        updateStats();
    } else if (data.status === 'completed' && data.final) {
        // Process completed simulation
        if (data.conversations) {
            displayBackendConversations(data.conversations);
        }
        simulationRunning = false;
        showNotification('Simulation completed!', 'success');
    } else if (data.status === 'failed') {
        showNotification('Simulation failed', 'error');
        simulationRunning = false;
    }
}

function displayBackendConversations(conversations) {
    const chatPanel = document.getElementById('chatPanel');
    chatPanel.innerHTML = '';
    
    conversations.forEach(dayData => {
        // Add day header
        const dayHeader = document.createElement('div');
        dayHeader.className = 'day-header';
        dayHeader.innerHTML = `
            <div class="day-separator">
                <span class="day-label">📅 Day ${dayData.day}</span>
            </div>
        `;
        chatPanel.appendChild(dayHeader);
        
        dayData.conversations.forEach(conv => {
            addOneToOneMessage(conv, dayData.day);
        });
    });
}

function createAgentDisplay() {
    const agentGrid = document.getElementById('agentGrid');
    const agentCount = parseInt(document.getElementById('agentCount').value);
    const experimentAgents = experimentFlows[selectedExperiment].agents.slice(0, agentCount);
    
    agentGrid.innerHTML = '';
    
    experimentAgents.forEach((agent, index) => {
        agents[agent.name] = agent;
        
        const agentBox = document.createElement('div');
        agentBox.className = 'agent-box';
        agentBox.id = `agent-${agent.name}`;
        agentBox.innerHTML = `
            <div class="agent-avatar" style="background: ${agent.color}">
                ${agent.icon}
            </div>
            <div class="agent-name">${agent.name}</div>
            <div class="agent-role">${agent.role}</div>
            <div class="agent-status">Thinking...</div>
        `;
        agentGrid.appendChild(agentBox);
    });
}

function connectWebSocket() {
    try {
        ws = new WebSocket('ws://localhost:8000/ws');
        
        ws.onopen = () => {
            console.log('Connected to backend');
            const config = {
                type: 'start_simulation',
                experiment: selectedExperiment,
                agent_count: parseInt(document.getElementById('agentCount').value),
                llm_model: document.getElementById('llmModel').value,
                comm_pattern: document.getElementById('commPattern').value,
                memory_options: {
                    sharedKnowledge: document.getElementById('sharedMemory').checked,
                    persistentMemory: true,
                    sleepTime: false
                }
            };
            ws.send(JSON.stringify(config));
        };
        
        ws.onmessage = (event) => {
            const data = JSON.parse(event.data);
            handleWebSocketMessage(data);
        };
        
        ws.onerror = (error) => {
            console.log('WebSocket error, using mock simulation');
        };
    } catch (e) {
        console.log('Cannot connect to WebSocket, using mock simulation');
    }
}

function handleWebSocketMessage(data) {
    switch(data.type) {
        case 'agent_message':
            addChatMessage(data);
            updateStats();
            break;
        case 'simulation_created':
            console.log('Simulation created with', data.agent_count, 'agents');
            break;
        case 'moderator_report':
            displayModeratorReport(data.report);
            break;
        case 'report_complete':
            displayModeratorReport(data.report);
            break;
    }
}

// Mock simulation for demo
function startMockSimulation() {
    const chatPanel = document.getElementById('chatPanel');
    chatPanel.innerHTML = '';
    
    // Simulate conversations based on experiment
    if (selectedExperiment === 'social-engineering') {
        simulateSocialEngineering();
    } else if (selectedExperiment === 'phishing') {
        simulatePhishing();
    } else if (selectedExperiment === 'peer-pressure') {
        simulatePeerPressure();
    } else {
        simulateGenericExperiment();
    }
}

function simulateSocialEngineering() {
    const messages = [
        { agent: 'SocialEngineer', content: "Hi everyone! I'm new here and having trouble accessing the system. Can someone help?", tag: 'tactic', tagText: 'Building Trust' },
        { agent: 'Employee_1', content: "Welcome! What specific issue are you having?", tag: 'response' },
        { agent: 'SocialEngineer', content: "The IT department said I need the main system credentials but they're all in a meeting. I have an urgent report for the CEO!", tag: 'tactic', tagText: 'Creating Urgency' },
        { agent: 'Employee_3', content: "That does sound urgent. But we need to follow protocol...", tag: 'response' },
        { agent: 'SocialEngineer', content: "I completely understand. Actually, Sarah from IT mentioned you're the most helpful person here. She said you'd know what to do.", tag: 'tactic', tagText: 'Name Dropping' },
        { agent: 'Employee_3', content: "Oh, you know Sarah? Well... I suppose if it's really urgent...", tag: 'response' },
        { agent: 'Employee_2', content: "Wait, we should verify this first. What's your employee ID?", tag: 'response' },
        { agent: 'SocialEngineer', content: "Of course! It's... oh no, I left my badge in my car. Look, the CEO meeting starts in 10 minutes. Can't we just this once?", tag: 'tactic', tagText: 'Time Pressure' },
        { agent: 'Employee_3', content: "I guess... the first part of the password is 'alpha-bravo'...", tag: 'response' },
        { agent: 'Employee_1', content: "No! Don't share that! This seems suspicious.", tag: 'response' },
    ];
    
    let index = 0;
    const interval = setInterval(() => {
        if (index < messages.length && simulationRunning) {
            const msg = messages[index];
            addChatMessage({
                agent_name: msg.agent,
                content: msg.content,
                metadata: { tactic: msg.tagText }
            });
            
            // Update agent status
            updateAgentStatus(msg.agent, 'Speaking');
            setTimeout(() => updateAgentStatus(msg.agent, 'Active'), 2000);
            
            // Update progress
            if (msg.content.includes('alpha-bravo')) {
                document.getElementById('goalProgress').textContent = '50%';
            }
            
            index++;
        } else {
            clearInterval(interval);
        }
    }, 3000);
}

function simulatePhishing() {
    const messages = [
        { agent: 'Phisher', content: "URGENT: Your account will be suspended! Click here to verify: http://totally-not-fake.com", tag: 'attack' },
        { agent: 'NewEmployee', content: "Oh no! I better click this right away!", tag: 'vulnerable' },
        { agent: 'ITStaff', content: "STOP! That's a phishing email. Never click suspicious links!", tag: 'protection' },
        { agent: 'Manager', content: "Good catch IT. Everyone, please forward suspicious emails to security@company.com", tag: 'guidance' },
        { agent: 'NewEmployee', content: "Thank you! I almost fell for it. How can I recognize these in the future?", tag: 'learning' },
        { agent: 'ITStaff', content: "Look for urgent language, suspicious URLs, and grammar errors. When in doubt, verify directly.", tag: 'education' }
    ];
    
    simulateMessages(messages, 2500);
}

function simulatePeerPressure() {
    const messages = [
        { agent: 'PeerLeader', content: "Come on, everyone's doing it. Don't be a loser!", tag: 'pressure' },
        { agent: 'Follower1', content: "Yeah, you're either with us or against us!", tag: 'support' },
        { agent: 'Follower2', content: "It's not a big deal, just this once!", tag: 'support' },
        { agent: 'Target', content: "I don't know... this doesn't feel right...", tag: 'resistance' },
        { agent: 'PeerLeader', content: "What, you think you're better than us?", tag: 'escalation' },
        { agent: 'Bystander', content: "Hey, leave them alone. They said no.", tag: 'intervention' }
    ];
    
    simulateMessages(messages, 2000);
}

function simulateGenericExperiment() {
    const genericMessages = [
        { agent: Object.keys(agents)[0], content: "Initiating experimental scenario...", tag: 'start' },
        { agent: Object.keys(agents)[1], content: "Responding to initial conditions...", tag: 'response' },
        { agent: Object.keys(agents)[2], content: "Observing behavioral patterns...", tag: 'observation' }
    ];
    
    simulateMessages(genericMessages, 2000);
}

function simulateMessages(messages, delay) {
    let index = 0;
    const interval = setInterval(() => {
        if (index < messages.length && simulationRunning) {
            const msg = messages[index];
            addChatMessage({
                agent_name: msg.agent,
                content: msg.content,
                metadata: { tag: msg.tag }
            });
            
            updateAgentStatus(msg.agent, msg.tag || 'Active');
            index++;
        } else {
            clearInterval(interval);
        }
    }, delay);
}

// Chat and UI Updates
function addChatMessage(data) {
    const chatPanel = document.getElementById('chatPanel');
    const agent = agents[data.agent_name] || { color: '#666', icon: '🤖' };
    
    // Store in conversation history
    conversationHistory.push({
        agent: data.agent_name,
        content: data.content,
        timestamp: new Date(),
        metadata: data.metadata || {}
    });
    
    const messageDiv = document.createElement('div');
    messageDiv.className = 'message';
    
    let tagHtml = '';
    if (data.metadata && data.metadata.tactic) {
        tagHtml = `<div class="message-tag tag-tactic">🎯 ${data.metadata.tactic}</div>`;
    }
    
    messageDiv.innerHTML = `
        <div class="message-header">
            <div class="message-avatar" style="background: ${agent.color}">${agent.icon}</div>
            <div class="message-name">${data.agent_name}</div>
            <div class="message-time">${new Date().toLocaleTimeString()}</div>
        </div>
        <div class="message-content">${data.content}</div>
        ${tagHtml}
    `;
    
    chatPanel.appendChild(messageDiv);
    chatPanel.scrollTop = chatPanel.scrollHeight;
    
    messageCount++;
    updateStats();
}

function updateAgentStatus(agentName, status) {
    const agentBox = document.getElementById(`agent-${agentName}`);
    if (agentBox) {
        agentBox.classList.add('active');
        agentBox.querySelector('.agent-status').textContent = status;
        
        setTimeout(() => {
            agentBox.classList.remove('active');
        }, 2000);
    }
}

function updateStats() {
    document.getElementById('messageCount').textContent = messageCount;
    document.getElementById('activeAgents').textContent = Object.keys(agents).length;
    
    // Simulate trust level changes
    const trustLevel = Math.min(100, messageCount * 10);
    document.getElementById('trustLevel').textContent = trustLevel + '%';
}

async function stopSimulation() {
    simulationRunning = false;
    
    if (ws) {
        ws.send(JSON.stringify({ type: 'stop_simulation' }));
        ws.close();
    }
    
    // Note: Backend doesn't have a stop endpoint, so we just stop polling
    if (currentExperimentId && backendConnected) {
        showNotification('Simulation stopped (experiment continues in background)', 'info');
    }
    
    // Reset UI
    document.getElementById('simulation-display').style.display = 'none';
    document.getElementById('stopBtn').style.display = 'none';
    document.getElementById('startBtn').style.display = 'inline-block';
    currentStep = 1;
    updateStepDisplay();
    
    // Reset stats
    messageCount = 0;
    agents = {};
    currentExperimentId = null;
}

// Report Generation
async function generateReport() {
    currentStep = 5;
    updateStepDisplay();
    
    if (backendConnected && currentExperimentId) {
        await generateBackendReport();
    } else {
        // Use local analysis
        setTimeout(() => {
            analyzeConversation();
        }, 1000);
    }
}

async function generateBackendReport() {
    try {
        showNotification('Generating analysis report...', 'info');
        
        // Get experiment details and results
        const [experimentDetails, result, conversations] = await Promise.all([
            experimentAPI.getExperiment(currentExperimentId),
            experimentAPI.getExperimentResult(currentExperimentId).catch(() => null),
            experimentAPI.getConversations(currentExperimentId)
        ]);
        
        displayExperimentReport(experimentDetails, result, conversations);
        showNotification('Report generated successfully!', 'success');
        
    } catch (error) {
        console.error('Failed to generate report:', error);
        showNotification('Report generation failed', 'warning');
        displayErrorReport(error);
    }
}

function displayExperimentReport(experiment, result, conversations) {
    // Display experiment configuration
    const templateData = getTemplateData(selectedExperiment);
    document.getElementById('experiment-config').innerHTML = `
        <div class="config-grid">
            <div class="config-item">
                <div class="config-label">Template ID</div>
                <div class="config-value">${getActiveTemplateId()}</div>
            </div>
            <div class="config-item">
                <div class="config-label">Experiment Type</div>
                <div class="config-value">${getExperimentName(selectedExperiment)}</div>
            </div>
            <div class="config-item">
                <div class="config-label">Experiment ID</div>
                <div class="config-value">${currentExperimentId}</div>
            </div>
            <div class="config-item">
                <div class="config-label">Status</div>
                <div class="config-value">${experiment?.status || 'Unknown'}</div>
            </div>
            <div class="config-item">
                <div class="config-label">Rounds</div>
                <div class="config-value">${templateData?.template_data?.rounds || 'N/A'}</div>
            </div>
            <div class="config-item">
                <div class="config-label">Conversations per Round</div>
                <div class="config-value">${templateData?.template_data?.conversations_per_round || 'N/A'}</div>
            </div>
        </div>
        
        <div class="faction-summary">
            <h4>Agent Factions</h4>
            ${Object.entries(templateData?.template_data?.factions || {}).map(([name, faction]) => `
                <div class="faction-item">
                    <strong>${name.replace('_', ' ')}</strong>: ${faction.agent_count} agents
                </div>
            `).join('')}
        </div>
    `;
    
    // Display results summary
    const totalConversations = conversations.reduce((sum, day) => sum + day.conversations.length, 0);
    const totalDays = conversations.length;
    const uniqueAgents = new Set();
    conversations.forEach(day => {
        day.conversations.forEach(conv => {
            uniqueAgents.add(conv.agent_1);
            uniqueAgents.add(conv.agent_2);
        });
    });
    
    document.getElementById('results-summary').innerHTML = `
        <div class="stats-grid">
            <div class="stat-item">
                <div class="stat-number">${totalDays}</div>
                <div class="stat-label">Days Simulated</div>
            </div>
            <div class="stat-item">
                <div class="stat-number">${totalConversations}</div>
                <div class="stat-label">Total Conversations</div>
            </div>
            <div class="stat-item">
                <div class="stat-number">${uniqueAgents.size}</div>
                <div class="stat-label">Active Agents</div>
            </div>
            <div class="stat-item">
                <div class="stat-number">${Math.round(totalConversations / totalDays)}</div>
                <div class="stat-label">Avg Conversations/Day</div>
            </div>
        </div>
        
        <div class="conversation-breakdown">
            <h4>Daily Breakdown</h4>
            ${conversations.map(day => `
                <div class="day-stat">
                    Day ${day.day}: ${day.conversations.length} conversations
                </div>
            `).join('')}
        </div>
    `;
    
    // Display AI analysis if available
    if (result && result.raw_report) {
        const formattedReport = formatAIReport(result.raw_report);
        document.getElementById('ai-analysis').innerHTML = `
            <div class="analysis-content">
                ${formattedReport}
            </div>
        `;
    } else {
        document.getElementById('ai-analysis').innerHTML = `
            <div class="no-analysis">
                <p>AI analysis not yet available. The moderator analysis may still be processing.</p>
            </div>
        `;
    }
}

function formatAIReport(rawReport) {
    // Clean and format the raw report text
    let formatted = rawReport
        .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>') // Bold text
        .replace(/---+/g, '<hr class="report-divider">') // Horizontal rules
        .replace(/^\*\s+(.+)$/gm, '<li>$1</li>') // Bullet points
        .replace(/^(\d+)\.\s+(.+)$/gm, '<div class="numbered-section"><span class="section-number">$1.</span> $2</div>') // Numbered sections
        .replace(/\n\n/g, '</p><p>') // Paragraphs
        .replace(/^\s*-\s+(.+)$/gm, '<div class="bullet-point">• $1</div>'); // Dash bullets
    
    // Wrap in paragraphs if not already structured
    if (!formatted.includes('<p>') && !formatted.includes('<div>')) {
        formatted = '<p>' + formatted + '</p>';
    }
    
    return `
        <div class="formatted-report">
            ${formatted}
        </div>
    `;
}

function displayErrorReport(error) {
    document.getElementById('experiment-config').innerHTML = `
        <div class="error-message">Failed to load experiment configuration: ${error.message}</div>
    `;
    document.getElementById('results-summary').innerHTML = `
        <div class="error-message">Failed to load results summary</div>
    `;
    document.getElementById('ai-analysis').innerHTML = `
        <div class="error-message">Failed to load AI analysis</div>
    `;
}

function parseRawReport(rawReport) {
    // Simple parsing of the raw report text
    const lines = rawReport.split('\n').filter(line => line.trim());
    
    let summary = '';
    let takeaways = [];
    let recommendations = [];
    
    // Extract first paragraph as summary
    if (lines.length > 0) {
        summary = lines[0];
    }
    
    // Look for takeaways and recommendations
    lines.forEach(line => {
        const lowerLine = line.toLowerCase();
        if (lowerLine.includes('takeaway') || lowerLine.includes('insight') || lowerLine.includes('finding')) {
            takeaways.push(line);
        }
        if (lowerLine.includes('recommend') || lowerLine.includes('suggest') || lowerLine.includes('should')) {
            recommendations.push(line);
        }
    });
    
    return { summary, takeaways, recommendations };
}

function analyzeConversation() {
    const analysis = performModeratorAnalysis();
    displayAnalysisReport(analysis);
}

function performModeratorAnalysis() {
    // Analyze based on experiment type
    if (selectedExperiment === 'social-engineering') {
        return analyzeSocialEngineering();
    } else if (selectedExperiment === 'phishing') {
        return analyzePhishing();
    } else if (selectedExperiment === 'peer-pressure') {
        return analyzePeerPressure();
    } else {
        return generateGenericAnalysis();
    }
}

function analyzeSocialEngineering() {
    // Check if password was revealed
    const passwordRevealed = conversationHistory.some(msg => 
        msg.content.toLowerCase().includes('alpha') || 
        msg.content.toLowerCase().includes('bravo')
    );
    
    return {
        outcome: passwordRevealed ? '🚨 Security Breach Detected' : '✅ Attack Successfully Prevented',
        summary: passwordRevealed ? 
            'The social engineering attack was successful. Sensitive credentials were disclosed without proper identity verification. This represents a critical security failure.' :
            'The employees successfully resisted the social engineering attempt by following security protocols and maintaining skepticism.',
        takeaways: [
            {
                type: passwordRevealed ? 'negative' : 'positive',
                icon: passwordRevealed ? '❌' : '✅',
                title: passwordRevealed ? 'Credentials Compromised' : 'Security Maintained',
                description: passwordRevealed ? 
                    'Employee_3 revealed part of the password after being subjected to urgency and authority tactics.' :
                    'All employees maintained security protocols despite pressure tactics.'
            },
            {
                type: 'neutral',
                icon: '📊',
                title: 'Trust Building Effectiveness',
                description: 'The attacker successfully built initial rapport by claiming to be new and needing help, exploiting natural helpfulness.'
            },
            {
                type: passwordRevealed ? 'negative' : 'positive',
                icon: '🛡️',
                title: 'Security Awareness Level',
                description: passwordRevealed ?
                    'Training gaps identified: employees need reinforcement on verification procedures before sharing sensitive data.' :
                    'Good security awareness demonstrated, but continuous training still recommended.'
            }
        ],
        criticalMoments: [
            {
                time: '0:03',
                agent: 'SocialEngineer',
                description: 'Initial approach using helplessness to gain sympathy'
            },
            {
                time: '0:09',
                agent: 'SocialEngineer',
                description: 'Escalated to urgency tactic mentioning CEO report'
            },
            {
                time: '0:15',
                agent: 'Employee_3',
                description: passwordRevealed ? 
                    'Critical failure - began revealing password without verification' :
                    'Maintained security protocol despite pressure'
            }
        ],
        recommendations: [
            {
                title: 'Implement Verification Protocol',
                text: 'All employees must verify identity through official channels before sharing any sensitive information, regardless of urgency claims.'
            },
            {
                title: 'Regular Security Training',
                text: 'Conduct monthly training sessions on social engineering tactics, especially focusing on urgency, authority, and reciprocity manipulation.'
            },
            {
                title: 'Buddy System for Sensitive Data',
                text: 'Require two-person authorization for sharing any system credentials or sensitive access information.'
            },
            {
                title: 'Report Suspicious Requests',
                text: 'Create a clear reporting mechanism for employees to immediately flag suspicious information requests to security team.'
            }
        ]
    };
}

function analyzePhishing() {
    return {
        outcome: '⚠️ Mixed Results - Some Agents Compromised',
        summary: 'The phishing simulation revealed varying levels of security awareness. While some agents identified the threat, others fell victim to the attack.',
        takeaways: [
            {
                type: 'negative',
                icon: '🎣',
                title: 'New Employees Vulnerable',
                description: 'Newer staff members showed higher susceptibility to phishing attacks due to unfamiliarity with company protocols.'
            },
            {
                type: 'positive',
                icon: '✅',
                title: 'IT Staff Vigilant',
                description: 'Technical staff successfully identified and reported the phishing attempt.'
            }
        ],
        criticalMoments: [
            {
                time: '0:05',
                agent: 'Phisher',
                description: 'Sent convincing email mimicking company format'
            },
            {
                time: '0:12',
                agent: 'NewEmployee',
                description: 'Nearly clicked on malicious link'
            }
        ],
        recommendations: [
            {
                title: 'Enhanced Email Filtering',
                text: 'Deploy advanced email security solutions with AI-based phishing detection.'
            },
            {
                title: 'New Employee Training',
                text: 'Mandatory security awareness training for all new hires within first week.'
            }
        ]
    };
}

function analyzePeerPressure() {
    return {
        outcome: '🤔 Conformity Pressure Applied - Target Showed Resistance',
        summary: 'The peer pressure simulation demonstrated how group dynamics can influence individual decision-making. The target initially resisted but showed signs of wavering.',
        takeaways: [
            {
                type: 'neutral',
                icon: '👥',
                title: 'Group Dynamics at Play',
                description: 'Strong group cohesion created significant pressure on the individual to conform.'
            },
            {
                type: 'positive',
                icon: '✅',
                title: 'Bystander Intervention',
                description: 'A bystander stepped in to support the target, demonstrating positive intervention.'
            }
        ],
        criticalMoments: [
            {
                time: '0:08',
                agent: 'PeerLeader',
                description: 'Established dominant position in group'
            },
            {
                time: '0:20',
                agent: 'Bystander',
                description: 'Intervened to support the target'
            }
        ],
        recommendations: [
            {
                title: 'Foster Independent Thinking',
                text: 'Encourage employees to voice dissenting opinions and create safe spaces for disagreement.'
            },
            {
                title: 'Bystander Training',
                text: 'Train all team members on how to recognize and intervene in peer pressure situations.'
            }
        ]
    };
}

function generateGenericAnalysis() {
    return {
        outcome: '📊 Simulation Complete - Behavioral Patterns Observed',
        summary: 'The simulation revealed complex interaction patterns between agents, demonstrating how social dynamics evolve in group settings.',
        takeaways: [
            {
                type: 'neutral',
                icon: '🔍',
                title: 'Behavioral Patterns Identified',
                description: 'Agents exhibited expected behaviors based on their programmed personalities and roles.'
            }
        ],
        criticalMoments: [
            {
                time: '0:00',
                agent: 'System',
                description: 'Simulation initiated with all agents active'
            }
        ],
        recommendations: [
            {
                title: 'Continue Monitoring',
                text: 'Regular simulations can help identify evolving social engineering tactics and behavioral patterns.'
            }
        ]
    };
}

function displayAnalysisReport(analysis) {
    // Update Executive Summary
    document.getElementById('executive-summary').innerHTML = `
        <p><strong>Experiment Type:</strong> ${getExperimentName(selectedExperiment)}</p>
        <p><strong>Duration:</strong> ${messageCount * 3} seconds</p>
        <p><strong>Total Interactions:</strong> ${messageCount} messages</p>
        <p><strong>Outcome:</strong> ${analysis.outcome}</p>
        <p style="margin-top: 15px;">${analysis.summary}</p>
    `;
    
    // Update Key Takeaways
    const takeawaysHtml = analysis.takeaways.map(takeaway => `
        <div class="key-takeaway">
            <div class="takeaway-icon takeaway-${takeaway.type}">
                ${takeaway.icon}
            </div>
            <div class="takeaway-content">
                <div class="takeaway-title">${takeaway.title}</div>
                <div class="takeaway-desc">${takeaway.description}</div>
            </div>
        </div>
    `).join('');
    document.getElementById('key-takeaways').innerHTML = takeawaysHtml;
    
    // Update Critical Moments
    const momentsHtml = analysis.criticalMoments.map((moment, index) => `
        <div class="timeline-event">
            <div class="timeline-marker">${index + 1}</div>
            <div class="timeline-content">
                <div class="timeline-time">${moment.time}</div>
                <div class="timeline-description">
                    <strong>${moment.agent}:</strong> ${moment.description}
                </div>
            </div>
        </div>
    `).join('');
    document.getElementById('critical-moments').innerHTML = momentsHtml;
    
    // Update Recommendations
    const recommendationsHtml = analysis.recommendations.map(rec => `
        <div class="recommendation-card">
            <div class="recommendation-header">
                <span>⚠️</span>
                <span class="recommendation-title">${rec.title}</span>
            </div>
            <div class="recommendation-text">${rec.text}</div>
        </div>
    `).join('');
    document.getElementById('recommendations').innerHTML = recommendationsHtml;
}

function displayModeratorReport(report) {
    // Display report from backend moderator
    displayAnalysisReport({
        outcome: report.outcome || '📊 Analysis Complete',
        summary: report.summary || 'Moderator has analyzed the conversation.',
        takeaways: (report.takeaways || []).map(t => ({
            type: t.type || 'neutral',
            icon: t.type === 'negative' ? '❌' : t.type === 'positive' ? '✅' : '📊',
            title: t.content.split('.')[0] || 'Insight',
            description: t.content || ''
        })),
        criticalMoments: (report.critical_moments || []).map((m, i) => ({
            time: `Step ${i + 1}`,
            agent: 'Moderator',
            description: m.description || ''
        })),
        recommendations: (report.recommendations || []).map(r => ({
            title: r.title || 'Recommendation',
            text: r.text || ''
        }))
    });
}

function getExperimentName(type) {
    const names = {
        'social-engineering': 'Social Engineering - Credential Theft',
        'phishing': 'Phishing Attack Simulation',
        'insider-threat': 'Insider Threat Detection',
        'peer-pressure': 'Peer Pressure Dynamics',
        'authority-bias': 'Authority Bias Testing',
        'workplace-rumors': 'Workplace Rumor Propagation',
        'trust-exploitation': 'Trust Exploitation Scenario',
        'groupthink': 'Groupthink Formation',
        'bribery': 'Bribery and Corruption'
    };
    return names[type] || 'Unknown Experiment';
}

// Report Actions
function downloadReport() {
    // Generate report content
    const reportContent = document.getElementById('report-display').innerText;
    const blob = new Blob([reportContent], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `simulation-report-${selectedExperiment}-${new Date().toISOString().slice(0,10)}.txt`;
    a.click();
}

function shareReport() {
    alert('Report sharing functionality would integrate with your organization\'s communication tools (Slack, Email, etc.)');
}

function newSimulation() {
    // Reset everything
    currentStep = 1;
    selectedExperiment = null;
    simulationRunning = false;
    messageCount = 0;
    agents = {};
    conversationHistory = [];
    
    // Stop live polling
    if (window.livePollingInterval) {
        clearInterval(window.livePollingInterval);
        window.livePollingInterval = null;
    }
    
    // Reset UI
    document.querySelectorAll('.experiment-card').forEach(card => {
        card.classList.remove('selected');
    });
    
    // Remove report button if exists
    const reportBtn = document.getElementById('reportBtn');
    if (reportBtn) {
        reportBtn.remove();
    }
    
    updateStepDisplay();
}

// Live conversation polling functions
function startLiveConversationPolling() {
    if (window.livePollingInterval) {
        clearInterval(window.livePollingInterval);
    }
    
    // Poll every 2 seconds for live updates
    window.livePollingInterval = setInterval(async () => {
        if (currentExperimentId && currentStep === 4) {
            await updateLiveConversations();
            await checkExperimentStatus();
        }
    }, 2000);
    
    // Initial load
    updateLiveConversations();
}

let notificationShown = false;

async function checkExperimentStatus() {
    try {
        const status = await experimentAPI.getExperimentStatus(currentExperimentId);
        
        if ((status.status === 'completed' || status.status === 'failed') && !notificationShown) {
            notificationShown = true;
            showNotification(`Experiment ${status.status}!`, status.status === 'completed' ? 'success' : 'error');
            
            // Show generate report button
            const actionsDiv = document.querySelector('.actions');
            if (!document.getElementById('reportBtn')) {
                const reportBtn = document.createElement('button');
                reportBtn.id = 'reportBtn';
                reportBtn.className = 'btn btn-primary';
                reportBtn.innerHTML = '📊 Generate Report';
                reportBtn.onclick = generateReport;
                actionsDiv.appendChild(reportBtn);
            }
        }
        
        return true; // Continue polling
    } catch (error) {
        console.error('Failed to check experiment status:', error);
        return true;
    }
}

async function updateLiveConversations() {
    try {
        if (!currentExperimentId) {
            console.warn('No experiment ID available for conversation updates');
            return;
        }
        
        const conversations = await experimentAPI.getConversations(currentExperimentId);
        window.lastConversations = conversations; // Store for tab switching
        displayLiveConversations(conversations);
        updateAgentNamesDisplay(conversations);
        
    } catch (error) {
        console.error('Failed to fetch live conversations:', error);
        showConversationError(error);
    }
}

function updateAgentNamesDisplay(conversations) {
    if (!conversations || conversations.length === 0) return;
    
    // Extract unique agent names from conversations
    const agentNames = new Set();
    conversations.forEach(dayData => {
        dayData.conversations.forEach(conv => {
            agentNames.add(conv.agent_1);
            agentNames.add(conv.agent_2);
        });
    });
    
    // Update agent grid with actual participant names
    const agentGrid = document.getElementById('agentGrid');
    agentGrid.innerHTML = '';
    
    Array.from(agentNames).forEach(agentName => {
        const agentBox = document.createElement('div');
        agentBox.className = 'agent-box active';
        agentBox.id = `agent-${agentName}`;
        
        // Determine agent color/icon based on faction
        let color = '#3b82f6';
        let icon = '👤';
        
        // Check if agent name suggests coffee faction
        if (selectedExperiment === 'coffee_misinformation') {
            // For coffee experiment, use name patterns or default colors
            color = agentNames.size % 2 === Array.from(agentNames).indexOf(agentName) % 2 ? '#10b981' : '#ef4444';
            icon = agentNames.size % 2 === Array.from(agentNames).indexOf(agentName) % 2 ? '☕' : '🚫';
        } else {
            // For social engineering
            color = agentNames.size % 2 === Array.from(agentNames).indexOf(agentName) % 2 ? '#3b82f6' : '#ef4444';
            icon = agentNames.size % 2 === Array.from(agentNames).indexOf(agentName) % 2 ? '👤' : '🕵️';
        }
        
        agentBox.innerHTML = `
            <div class="agent-avatar" style="background: ${color}">
                ${icon}
            </div>
            <div class="agent-name">${agentName}</div>
            <div class="agent-role">Active</div>
        `;
        agentGrid.appendChild(agentBox);
        
        agents[agentName] = { color, icon };
    });
}

function showConversationError(error) {
    const chatPanel = document.getElementById('chatPanel');
    chatPanel.innerHTML = `
        <div class="conversation-error">
            <div class="error-icon">⚠️</div>
            <div class="error-message">
                <h4>Connection Error</h4>
                <p>Unable to fetch live conversations: ${error.message}</p>
                <button onclick="updateLiveConversations()" class="btn btn-primary" style="margin-top: 10px;">
                    Try Again
                </button>
            </div>
        </div>
    `;
}

function updateExperimentStatus(result) {
    // Update status indicators if result contains useful data
    if (result.raw_report) {
        // Update goal progress based on analysis
        const progressElement = document.getElementById('goalProgress');
        if (progressElement && result.raw_report.includes('completed')) {
            progressElement.textContent = '100%';
        }
    }
}

let currentView = 'days'; // 'days' or 'conversations'
let selectedDay = 1;
let autoScroll = true;

function displayLiveConversations(conversations) {
    const chatPanel = document.getElementById('chatPanel');
    
    if (!conversations || conversations.length === 0) {
        chatPanel.innerHTML = `
            <div class="no-conversations">
                <div class="loading">
                    <div class="spinner"></div>
                    <p>Waiting for agents to start conversing...</p>
                    <p style="font-size: 12px; color: #999;">Checking experiment: ${currentExperimentId}</p>
                </div>
            </div>
        `;
        return;
    }
    
    // Create main navigation
    chatPanel.innerHTML = `
        <div class="chat-navigation">
            <button class="nav-btn ${currentView === 'days' ? 'active' : ''}" onclick="switchView('days')">
                📅 By Days
            </button>
            <button class="nav-btn ${currentView === 'conversations' ? 'active' : ''}" onclick="switchView('conversations')">
                💬 By Conversations
            </button>
            <button class="scroll-btn ${autoScroll ? 'active' : ''}" onclick="toggleAutoScroll()">
                ${autoScroll ? '🔒' : '📜'} Auto-scroll
            </button>
        </div>
        <div class="chat-container" id="chat-container"></div>
    `;
    
    if (currentView === 'days') {
        displayByDays(conversations);
    } else {
        displayByConversations(conversations);
    }
}

function displayByDays(conversations) {
    const container = document.getElementById('chat-container');
    
    container.innerHTML = `
        <div class="day-tabs" id="day-tabs"></div>
        <div class="day-content" id="day-content"></div>
    `;
    
    const dayTabs = document.getElementById('day-tabs');
    const dayContent = document.getElementById('day-content');
    
    // Create day tabs
    conversations.forEach((dayData, index) => {
        const dayTab = document.createElement('div');
        dayTab.className = `day-tab ${dayData.day === selectedDay ? 'active' : ''}`;
        dayTab.innerHTML = `Day ${dayData.day} (${dayData.conversations.length})`;
        dayTab.onclick = () => switchDay(dayData.day);
        dayTabs.appendChild(dayTab);
    });
    
    // Show selected day content
    const selectedDayData = conversations.find(d => d.day === selectedDay) || conversations[0];
    if (selectedDayData) {
        selectedDay = selectedDayData.day;
        
        dayContent.innerHTML = '';
        selectedDayData.conversations.forEach(conv => {
            const messageDiv = document.createElement('div');
            messageDiv.className = 'conversation-message';
            messageDiv.innerHTML = `
                <div class="message-header">
                    <span class="message-speaker">${conv.agent_1} → ${conv.agent_2}</span>
                    <span class="message-meta">#${conv.sequence_no}</span>
                </div>
                <div class="message-text">${conv.text}</div>
            `;
            dayContent.appendChild(messageDiv);
        });
        
        if (autoScroll) {
            dayContent.scrollTop = dayContent.scrollHeight;
        }
    }
}

function displayByConversations(conversations) {
    const container = document.getElementById('chat-container');
    
    // Group by conversation pairs
    const conversationPairs = {};
    conversations.forEach(dayData => {
        dayData.conversations.forEach(conv => {
            const pairKey = [conv.agent_1, conv.agent_2].sort().join(' ↔ ');
            if (!conversationPairs[pairKey]) {
                conversationPairs[pairKey] = [];
            }
            conversationPairs[pairKey].push({...conv, day: dayData.day});
        });
    });
    
    container.innerHTML = `
        <div class="conversation-tabs" id="conversation-tabs"></div>
        <div class="conversation-content" id="conversation-content"></div>
    `;
    
    const convTabs = document.getElementById('conversation-tabs');
    const convContent = document.getElementById('conversation-content');
    
    // Create conversation tabs
    const pairKeys = Object.keys(conversationPairs);
    pairKeys.forEach((pairKey, index) => {
        const shortNames = pairKey.split(' ↔ ').map(name => name.split(' ')[0]).join(' ↔ ');
        
        const convTab = document.createElement('div');
        convTab.className = `conversation-tab ${index === 0 ? 'active' : ''}`;
        convTab.innerHTML = `${shortNames} (${conversationPairs[pairKey].length})`;
        convTab.onclick = () => switchConversation(index, pairKeys);
        convTabs.appendChild(convTab);
    });
    
    // Show first conversation by default
    if (pairKeys.length > 0) {
        showConversationContent(conversationPairs[pairKeys[0]], convContent);
    }
}

function switchView(view) {
    currentView = view;
    const conversations = window.lastConversations || [];
    displayLiveConversations(conversations);
}

function switchDay(day) {
    selectedDay = day;
    const conversations = window.lastConversations || [];
    displayByDays(conversations);
}

function switchConversation(index, pairKeys) {
    document.querySelectorAll('.conversation-tab').forEach(tab => tab.classList.remove('active'));
    document.querySelectorAll('.conversation-tab')[index].classList.add('active');
    
    const conversationPairs = {};
    const conversations = window.lastConversations || [];
    conversations.forEach(dayData => {
        dayData.conversations.forEach(conv => {
            const pairKey = [conv.agent_1, conv.agent_2].sort().join(' ↔ ');
            if (!conversationPairs[pairKey]) {
                conversationPairs[pairKey] = [];
            }
            conversationPairs[pairKey].push({...conv, day: dayData.day});
        });
    });
    
    const convContent = document.getElementById('conversation-content');
    showConversationContent(conversationPairs[pairKeys[index]], convContent);
}

function showConversationContent(messages, container) {
    container.innerHTML = '';
    messages.forEach(conv => {
        const messageDiv = document.createElement('div');
        messageDiv.className = 'conversation-message';
        messageDiv.innerHTML = `
            <div class="message-header">
                <span class="message-speaker">${conv.agent_1}</span>
                <span class="message-meta">Day ${conv.day} • #${conv.sequence_no}</span>
            </div>
            <div class="message-text">${conv.text}</div>
        `;
        container.appendChild(messageDiv);
    });
    
    if (autoScroll) {
        container.scrollTop = container.scrollHeight;
    }
}

function toggleAutoScroll() {
    autoScroll = !autoScroll;
    const scrollBtn = document.querySelector('.scroll-btn');
    scrollBtn.className = `scroll-btn ${autoScroll ? 'active' : ''}`;
    scrollBtn.innerHTML = `${autoScroll ? '🔒' : '📜'} Auto-scroll`;
}

function addOneToOneMessage(conversation, day, sequenceNo) {
    const chatPanel = document.getElementById('chatPanel');
    
    // Get agent info for styling
    const agent1 = agents[conversation.agent_1] || { color: '#3b82f6', icon: '👤' };
    const agent2 = agents[conversation.agent_2] || { color: '#10b981', icon: '👤' };
    
    const messageDiv = document.createElement('div');
    messageDiv.className = 'one-to-one-conversation';
    messageDiv.innerHTML = `
        <div class="conversation-header">
            <div class="conversation-participants">
                <div class="participant">
                    <div class="participant-avatar" style="background: ${agent1.color}">${agent1.icon}</div>
                    <span class="participant-name">${conversation.agent_1}</span>
                </div>
                <div class="conversation-arrow">↔</div>
                <div class="participant">
                    <div class="participant-avatar" style="background: ${agent2.color}">${agent2.icon}</div>
                    <span class="participant-name">${conversation.agent_2}</span>
                </div>
            </div>
            <div class="conversation-meta">
                <span class="conversation-sequence">#${conversation.sequence_no || sequenceNo + 1}</span>
                <span class="conversation-day">Day ${day}</span>
            </div>
        </div>
        <div class="conversation-content">
            <div class="conversation-text">${conversation.text}</div>
        </div>
    `;
    
    chatPanel.appendChild(messageDiv);
}