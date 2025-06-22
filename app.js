// Global state management
let currentStep = 1;
let selectedExperiment = null;
let simulationRunning = false;
let ws = null;
let messageCount = 0;
let agents = {};
let conversationHistory = [];

// === 3D Agent Environment (Three.js) ===
let threeScene, threeCamera, threeRenderer, threeAnimationId, threeControls;
let threeAgents = [];
let threeAnimating = true;

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

function nextStep() {
    if (currentStep === 1 && !selectedExperiment) {
        alert('Please select an experiment first!');
        return;
    }
    
    if (currentStep < 3) {
        currentStep++;
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
    } else if (currentStep === 4) {
        document.getElementById('simulation-display').style.display = 'block';
        document.getElementById('prevBtn').style.display = 'none';
        document.getElementById('nextBtn').style.display = 'none';
        document.getElementById('startBtn').style.display = 'none';
    } else if (currentStep === 5) {
        document.getElementById('report-display').style.display = 'block';
        document.getElementById('prevBtn').style.display = 'none';
        document.getElementById('nextBtn').style.display = 'none';
        document.getElementById('startBtn').style.display = 'none';
        document.getElementById('stopBtn').style.display = 'none';
    }
}

// Simulation Functions
function startSimulation() {
    if (!selectedExperiment) return;
    
    simulationRunning = true;
    currentStep = 4;
    updateStepDisplay();
    
    // Show simulation display
    document.getElementById('simulation-display').style.display = 'block';
    document.getElementById('startBtn').style.display = 'none';
    document.getElementById('stopBtn').style.display = 'inline-block';
    document.getElementById('prevBtn').style.display = 'none';
    
    // Show experiment flow
    document.getElementById('experiment-flow').innerHTML = experimentFlows[selectedExperiment].flow;
    
    // Create agents display
    createAgentDisplay();
    
    // Connect WebSocket
    connectWebSocket();
    
    // Start mock simulation if no backend
    if (!ws || ws.readyState !== WebSocket.OPEN) {
        setTimeout(startMockSimulation, 1000);
    }
    
    // Add generate report button after simulation runs
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
    }, 10000); // Show after 10 seconds

    // Get agent list from global state if available
    let agentList = Object.values(agents || {});
    if (!agentList.length && window.selectedExperiment && experimentFlows[selectedExperiment]) {
        agentList = experimentFlows[selectedExperiment].agents || [];
    }
    initThreeEnvironment(agentList);
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

function stopSimulation() {
    simulationRunning = false;
    
    if (ws) {
        ws.send(JSON.stringify({ type: 'stop_simulation' }));
        ws.close();
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
}

// Report Generation
function generateReport() {
    currentStep = 5;
    updateStepDisplay();
    
    // If connected to backend, request moderator analysis
    if (ws && ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify({ type: 'generate_report' }));
    } else {
        // Use local analysis
        setTimeout(() => {
            analyzeConversation();
        }, 1000);
    }
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

// === 3D Agent Environment (Three.js) ===
function initThreeEnvironment(agentList = []) {
    const container = document.getElementById('threejs-container');
    if (!container) return;
    // Clear previous renderer if any
    container.innerHTML = '';
    // Scene
    threeScene = new THREE.Scene();
    // Camera
    threeCamera = new THREE.PerspectiveCamera(75, container.offsetWidth / container.offsetHeight, 0.1, 1000);
    threeCamera.position.z = 10;
    // Renderer
    threeRenderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    threeRenderer.setSize(container.offsetWidth, container.offsetHeight);
    container.appendChild(threeRenderer.domElement);
    // Lighting
    const light = new THREE.AmbientLight(0xffffff, 1);
    threeScene.add(light);
    // Add agents as spheres in a circle
    threeAgents = [];
    const radius = 4;
    const colors = [0x3b82f6, 0x10b981, 0xf59e0b, 0xef4444, 0x6366f1, 0x8b5cf6];
    const n = agentList.length || 6;
    for (let i = 0; i < n; i++) {
        const angle = (i / n) * Math.PI * 2;
        const geometry = new THREE.SphereGeometry(0.6, 32, 32);
        const material = new THREE.MeshStandardMaterial({ color: colors[i % colors.length] });
        const sphere = new THREE.Mesh(geometry, material);
        sphere.position.x = Math.cos(angle) * radius;
        sphere.position.y = Math.sin(angle) * radius;
        sphere.userData = { name: agentList[i]?.name || `Agent_${i+1}` };
        threeScene.add(sphere);
        threeAgents.push(sphere);
    }
    animateThree();
}

function animateThree() {
    if (!threeAnimating) return;
    threeAnimationId = requestAnimationFrame(animateThree);
    // Simple rotation for effect
    threeScene.rotation.y += 0.003;
    threeRenderer.render(threeScene, threeCamera);
}

function resetCamera() {
    if (threeCamera) {
        threeCamera.position.set(0, 0, 10);
        threeCamera.lookAt(0, 0, 0);
    }
}

function toggleAnimation() {
    threeAnimating = !threeAnimating;
    if (threeAnimating) animateThree();
    else cancelAnimationFrame(threeAnimationId);
}

function toggleEmotions() {
    // Placeholder for emotion indicator toggling
    alert('Emotion indicators toggled (demo stub).');
}