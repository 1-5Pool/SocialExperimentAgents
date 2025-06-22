// Experiment Dashboard JavaScript
let experiments = [];

document.addEventListener('DOMContentLoaded', async () => {
    await loadExperiments();
    // Auto-refresh every 30 seconds
    setInterval(loadExperiments, 30000);
});

async function loadExperiments() {
    try {
        experiments = await experimentAPI.getExperiments();
        updateStats();
        displayExperiments();
    } catch (error) {
        document.getElementById('experiments-container').innerHTML = `
            <div style="color: #ef4444; text-align: center; padding: 20px;">
                Failed to load experiments: ${error.message}
            </div>
        `;
    }
}

function updateStats() {
    const total = experiments.length;
    const running = experiments.filter(e => e.status === 'running').length;
    const completed = experiments.filter(e => e.status === 'completed').length;
    const failed = experiments.filter(e => e.status === 'failed').length;
    
    document.getElementById('total-experiments').textContent = total;
    document.getElementById('running-experiments').textContent = running;
    document.getElementById('completed-experiments').textContent = completed;
    document.getElementById('failed-experiments').textContent = failed;
}

function displayExperiments() {
    const container = document.getElementById('experiments-container');
    
    if (experiments.length === 0) {
        container.innerHTML = `
            <div style="text-align: center; color: #666; padding: 40px;">
                No experiments found. <a href="index.html">Start your first experiment</a>
            </div>
        `;
        return;
    }
    
    const tableHTML = `
        <table class="experiments-table">
            <thead>
                <tr>
                    <th>Experiment ID</th>
                    <th>Template</th>
                    <th>Status</th>
                    <th>Created</th>
                    <th>Actions</th>
                </tr>
            </thead>
            <tbody>
                ${experiments.map(experiment => `
                    <tr>
                        <td>
                            <code style="font-size: 12px;">${experiment.experiment_id}</code>
                        </td>
                        <td>
                            <div style="font-weight: 500;">${experiment.template_id}</div>
                            <div style="font-size: 12px; color: #666;">${experiment.template_description}</div>
                        </td>
                        <td>
                            <span class="status-badge status-${experiment.status}">
                                ${getStatusIcon(experiment.status)} ${experiment.status.toUpperCase()}
                            </span>
                        </td>
                        <td>
                            ${formatDate(experiment.created_at)}
                        </td>
                        <td>
                            <button class="btn btn-primary" onclick="viewConversations('${experiment.experiment_id}')">
                                💬 Conversations
                            </button>
                            ${experiment.status === 'completed' ? 
                                `<button class="btn btn-secondary" onclick="viewResult('${experiment.experiment_id}')">
                                    📊 Result
                                </button>` : ''
                            }
                            ${experiment.status !== 'running' ? 
                                `<button class="btn btn-danger" onclick="deleteExperiment('${experiment.experiment_id}')">
                                    🗑️ Delete
                                </button>` : ''
                            }
                        </td>
                    </tr>
                `).join('')}
            </tbody>
        </table>
    `;
    
    container.innerHTML = tableHTML;
}

function getStatusIcon(status) {
    const icons = {
        running: '⏳',
        completed: '✅',
        failed: '❌',
        unknown: '❓'
    };
    return icons[status] || '❓';
}

function formatDate(dateString) {
    if (!dateString) return 'Unknown';
    const date = new Date(dateString);
    return date.toLocaleString();
}

async function viewConversations(experimentId) {
    document.getElementById('modal-title').textContent = `Conversations - ${experimentId}`;
    document.getElementById('conversation-modal').style.display = 'block';
    document.getElementById('conversation-content').innerHTML = '<div class="loading">Loading conversations...</div>';
    
    try {
        const conversations = await experimentAPI.getConversations(experimentId);
        displayConversations(conversations);
    } catch (error) {
        document.getElementById('conversation-content').innerHTML = `
            <div style="color: #ef4444;">Failed to load conversations: ${error.message}</div>
        `;
    }
}

function displayConversations(conversations) {
    const content = document.getElementById('conversation-content');
    
    if (!conversations || conversations.length === 0) {
        content.innerHTML = '<div style="color: #666;">No conversations found.</div>';
        return;
    }
    
    const conversationHTML = conversations.map(dayData => `
        <div style="margin-bottom: 30px;">
            <h4 style="color: #2563eb; margin-bottom: 15px;">Day ${dayData.day}</h4>
            ${dayData.conversations.map(conv => `
                <div class="conversation-message">
                    <div class="message-agent">
                        ${conv.agent_1} → ${conv.agent_2} (Sequence: ${conv.sequence_no})
                    </div>
                    <div class="message-text">${conv.text}</div>
                </div>
            `).join('')}
        </div>
    `).join('');
    
    content.innerHTML = conversationHTML;
}

async function viewResult(experimentId) {
    document.getElementById('result-modal').style.display = 'block';
    document.getElementById('result-content').innerHTML = '<div class="loading">Loading result...</div>';
    
    try {
        const result = await experimentAPI.getExperimentResult(experimentId);
        displayResult(result);
    } catch (error) {
        document.getElementById('result-content').innerHTML = `
            <div style="color: #ef4444;">Failed to load result: ${error.message}</div>
        `;
    }
}

function displayResult(result) {
    const content = document.getElementById('result-content');
    
    if (!result) {
        content.innerHTML = '<div style="color: #666;">No result available.</div>';
        return;
    }
    
    content.innerHTML = `
        <div style="background: #f9fafb; padding: 20px; border-radius: 8px;">
            <h4 style="margin-bottom: 15px;">AI Moderator Analysis</h4>
            <pre style="white-space: pre-wrap; font-family: inherit; font-size: 14px; line-height: 1.6;">
${result.raw_report}
            </pre>
        </div>
    `;
}

async function deleteExperiment(experimentId) {
    if (!confirm(`Delete experiment ${experimentId}? This cannot be undone.`)) {
        return;
    }
    
    try {
        await experimentAPI.deleteExperiment(experimentId);
        await loadExperiments(); // Refresh list
        alert('Experiment deleted successfully');
    } catch (error) {
        alert(`Failed to delete experiment: ${error.message}`);
    }
}

function hideConversationModal() {
    document.getElementById('conversation-modal').style.display = 'none';
}

function hideResultModal() {
    document.getElementById('result-modal').style.display = 'none';
}

async function refreshExperiments() {
    await loadExperiments();
}