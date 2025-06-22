// Template Management JavaScript
let backendConnected = false;
let templates = [];
let factionCount = 0;

document.addEventListener('DOMContentLoaded', async () => {
    await checkConnection();
    await loadTemplates();
    addDefaultFactions();
});

async function checkConnection() {
    try {
        const health = await experimentAPI.checkHealth();
        backendConnected = health.status === 'healthy';
        
        const statusEl = document.getElementById('connection-status');
        if (backendConnected) {
            statusEl.innerHTML = '<span class="status-indicator status-connected"></span>Backend connected';
        } else {
            statusEl.innerHTML = '<span class="status-indicator status-error"></span>Backend offline';
        }
    } catch (error) {
        backendConnected = false;
        const statusEl = document.getElementById('connection-status');
        statusEl.innerHTML = '<span class="status-indicator status-error"></span>Connection failed';
    }
}

async function loadTemplates() {
    const grid = document.getElementById('templates-grid');
    
    if (!backendConnected) {
        grid.innerHTML = `
            <div style="text-align: center; color: #666; grid-column: 1 / -1;">
                <p>Backend not connected. Cannot load templates.</p>
                <button class="btn btn-primary" onclick="checkConnection()">Retry Connection</button>
            </div>
        `;
        return;
    }
    
    try {
        templates = await experimentAPI.getTemplates();
        displayTemplates(templates);
    } catch (error) {
        grid.innerHTML = `
            <div style="text-align: center; color: #ef4444; grid-column: 1 / -1;">
                <p>Failed to load templates: ${error.message}</p>
                <button class="btn btn-primary" onclick="loadTemplates()">Retry</button>
            </div>
        `;
    }
}

function displayTemplates(templates) {
    const grid = document.getElementById('templates-grid');
    
    if (templates.length === 0) {
        grid.innerHTML = `
            <div style="text-align: center; color: #666; grid-column: 1 / -1;">
                <p>No templates found. Create your first template!</p>
            </div>
        `;
        return;
    }
    
    grid.innerHTML = templates.map(template => `
        <div class="template-card">
            <div class="template-title">${template.template_name || template.template_id}</div>
            <div class="template-desc">${template.description}</div>
            <div class="template-meta">
                <span>${template.rounds} rounds</span>
                <span>${template.conversations_per_round} conversations/round</span>
                <span>${template.factions ? Object.keys(template.factions).length : 'N/A'} factions</span>
            </div>
            <div style="margin-top: 15px; display: flex; gap: 10px;">
                <button class="btn btn-primary" onclick="viewTemplate('${template.template_id}')">
                    👁️ View
                </button>
                <button class="btn btn-danger" onclick="deleteTemplate('${template.template_id}')">
                    🗑️ Delete
                </button>
            </div>
        </div>
    `).join('');
}

async function refreshTemplates() {
    await checkConnection();
    await loadTemplates();
}

function showCreateModal() {
    document.getElementById('create-modal').style.display = 'block';
}

function hideCreateModal() {
    document.getElementById('create-modal').style.display = 'none';
    document.getElementById('template-form').reset();
    clearFactions();
    addDefaultFactions();
}

function addDefaultFactions() {
    addFaction('Attacker', 'Agent with malicious intent', 1);
    addFaction('Target', 'Potential victim of attack', 3);
    addFaction('Observer', 'Neutral observer', 2);
}

function addFaction(name = '', description = '', count = 1) {
    factionCount++;
    const container = document.getElementById('factions-container');
    
    const factionDiv = document.createElement('div');
    factionDiv.className = 'faction-editor';
    factionDiv.id = `faction-${factionCount}`;
    
    factionDiv.innerHTML = `
        <div class="faction-header">
            <strong>Faction ${factionCount}</strong>
            <button type="button" class="btn btn-danger" onclick="removeFaction(${factionCount})">Remove</button>
        </div>
        <div class="form-group">
            <label class="form-label">Faction Name</label>
            <input type="text" class="form-input" name="faction-name" value="${name}" 
                   placeholder="e.g., Attackers" required>
        </div>
        <div class="form-group">
            <label class="form-label">Description</label>
            <input type="text" class="form-input" name="faction-desc" value="${description}"
                   placeholder="e.g., Agents trying to extract information" required>
        </div>
        <div class="form-group">
            <label class="form-label">Agent Count</label>
            <input type="number" class="form-input" name="faction-count" value="${count}"
                   min="1" max="20" required>
        </div>
    `;
    
    container.appendChild(factionDiv);
}

function removeFaction(id) {
    const faction = document.getElementById(`faction-${id}`);
    if (faction) {
        faction.remove();
    }
}

function clearFactions() {
    document.getElementById('factions-container').innerHTML = '';
    factionCount = 0;
}

// Form submission
document.getElementById('template-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    
    if (!backendConnected) {
        alert('Backend not connected. Cannot create template.');
        return;
    }
    
    const formData = new FormData(e.target);
    const templateId = document.getElementById('template-id').value;
    const templateName = document.getElementById('template-name').value;
    const description = document.getElementById('template-desc').value;
    const rounds = parseInt(document.getElementById('template-rounds').value);
    const conversationsPerRound = parseInt(document.getElementById('template-conversations').value);
    
    // Collect factions
    const factions = {};
    const factionElements = document.querySelectorAll('.faction-editor');
    
    factionElements.forEach(factionEl => {
        const name = factionEl.querySelector('[name="faction-name"]').value;
        const desc = factionEl.querySelector('[name="faction-desc"]').value;
        const count = parseInt(factionEl.querySelector('[name="faction-count"]').value);
        
        if (name && desc && count > 0) {
            factions[name.toLowerCase().replace(/\s+/g, '_')] = {
                description: desc,
                agent_count: count
            };
        }
    });
    
    if (Object.keys(factions).length === 0) {
        alert('Please add at least one faction.');
        return;
    }
    
    const templateData = {
        template_id: templateId,
        description: description,
        template_data: {
            template_name: templateName,
            rounds: rounds,
            conversations_per_round: conversationsPerRound,
            factions: factions
        }
    };
    
    try {
        await experimentAPI.createTemplate(templateData);
        alert('Template created successfully!');
        hideCreateModal();
        await loadTemplates();
    } catch (error) {
        alert(`Failed to create template: ${error.message}`);
    }
});

async function viewTemplate(templateId) {
    if (!backendConnected) {
        alert('Backend not connected.');
        return;
    }
    
    try {
        const template = await experimentAPI.getTemplate(templateId);
        const templateJson = JSON.stringify(template, null, 2);
        
        // Create a modal to show template details
        const modal = document.createElement('div');
        modal.className = 'modal';
        modal.style.display = 'block';
        modal.innerHTML = `
            <div class="modal-content">
                <div class="modal-header">
                    <h3>Template: ${template.template_id}</h3>
                    <span class="close" onclick="this.closest('.modal').remove()">&times;</span>
                </div>
                <pre style="background: #f5f5f5; padding: 15px; border-radius: 4px; overflow-x: auto; font-size: 12px;">${templateJson}</pre>
                <div style="margin-top: 20px; text-align: right;">
                    <button class="btn btn-secondary" onclick="this.closest('.modal').remove()">Close</button>
                </div>
            </div>
        `;
        
        document.body.appendChild(modal);
    } catch (error) {
        alert(`Failed to load template: ${error.message}`);
    }
}

async function deleteTemplate(templateId) {
    if (!confirm(`Are you sure you want to delete template "${templateId}"?`)) {
        return;
    }
    
    if (!backendConnected) {
        alert('Backend not connected.');
        return;
    }
    
    try {
        // Note: The API doesn't have a delete template endpoint, so we'll show a message
        alert('Template deletion not yet implemented in the backend API.');
        // If implemented, would be: await experimentAPI.deleteTemplate(templateId);
    } catch (error) {
        alert(`Failed to delete template: ${error.message}`);
    }
}