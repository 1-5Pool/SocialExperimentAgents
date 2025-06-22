// API Integration for Social Experiment Simulation Platform
const API_BASE_URL = 'http://localhost:8000';

class ExperimentAPI {
    constructor() {
        this.currentExperimentId = null;
    }

    // Template Management
    async getTemplates() {
        try {
            const response = await fetch(`${API_BASE_URL}/templates`);
            return await response.json();
        } catch (error) {
            console.error('Error fetching templates:', error);
            return [];
        }
    }

    async getTemplate(templateId) {
        try {
            const response = await fetch(`${API_BASE_URL}/templates/${templateId}`);
            return await response.json();
        } catch (error) {
            console.error('Error fetching template:', error);
            return null;
        }
    }

    async createTemplate(templateData) {
        try {
            const response = await fetch(`${API_BASE_URL}/templates`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(templateData)
            });
            return await response.json();
        } catch (error) {
            console.error('Error creating template:', error);
            throw error;
        }
    }

    // Experiment Management
    async getExperiments() {
        try {
            const response = await fetch(`${API_BASE_URL}/experiments`);
            return await response.json();
        } catch (error) {
            console.error('Error fetching experiments:', error);
            return [];
        }
    }

    async getExperiment(experimentId) {
        try {
            const response = await fetch(`${API_BASE_URL}/experiments/${experimentId}`);
            return await response.json();
        } catch (error) {
            console.error('Error fetching experiment:', error);
            return null;
        }
    }

    async runExperiment(config) {
        try {
            const response = await fetch(`${API_BASE_URL}/run_experiment`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(config)
            });
            const result = await response.json();
            this.currentExperimentId = result.experiment_id;
            return result;
        } catch (error) {
            console.error('Error running experiment:', error);
            throw error;
        }
    }

    async getExperimentStatus(experimentId) {
        try {
            const response = await fetch(`${API_BASE_URL}/experiments/${experimentId}/status`);
            return await response.json();
        } catch (error) {
            console.error('Error fetching experiment status:', error);
            return { status: 'unknown' };
        }
    }

    async deleteExperiment(experimentId) {
        try {
            const response = await fetch(`${API_BASE_URL}/experiments/${experimentId}`, {
                method: 'DELETE'
            });
            return await response.json();
        } catch (error) {
            console.error('Error deleting experiment:', error);
            throw error;
        }
    }

    // Experiment Data
    async getConversations(experimentId) {
        try {
            const response = await fetch(`${API_BASE_URL}/experiments/${experimentId}/conversations`);
            return await response.json();
        } catch (error) {
            console.error('Error fetching conversations:', error);
            return [];
        }
    }

    async getExperimentResult(experimentId) {
        try {
            const response = await fetch(`${API_BASE_URL}/experiments/${experimentId}/result`);
            return await response.json();
        } catch (error) {
            console.error('Error fetching experiment result:', error);
            return null;
        }
    }

    // Health check
    async checkHealth() {
        try {
            const response = await fetch(`${API_BASE_URL}/health`, {
                method: 'GET',
                headers: {
                    'Accept': 'application/json',
                    'Content-Type': 'application/json'
                }
            });
            
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }
            
            const data = await response.json();
            console.log('Backend health response:', data);
            return data;
        } catch (error) {
            console.error('API health check failed:', error);
            return { status: 'offline', error: error.message };
        }
    }

    // Polling for experiment updates
    async pollExperimentStatus(experimentId, callback, interval = 2000) {
        const poll = async () => {
            try {
                const status = await this.getExperimentStatus(experimentId);
                callback(status);
                
                if (status.status === 'running') {
                    setTimeout(poll, interval);
                } else {
                    // Experiment finished, get final data
                    if (status.status === 'completed') {
                        const conversations = await this.getConversations(experimentId);
                        const result = await this.getExperimentResult(experimentId);
                        callback({ 
                            ...status, 
                            conversations, 
                            result,
                            final: true 
                        });
                    }
                }
            } catch (error) {
                console.error('Error polling experiment status:', error);
                callback({ status: 'error', error: error.message });
            }
        };
        
        poll();
    }

    // Utility method to map experiment types to template IDs
    mapExperimentToTemplate(experimentType) {
        // Use the actual template that exists in your backend
        const mapping = {
            'social-engineering': 'template-default',
            'phishing': 'template-default',
            'insider-threat': 'template-default',
            'peer-pressure': 'template-default',
            'authority-bias': 'template-default',
            'workplace-rumors': 'template-default',
            'trust-exploitation': 'template-default',
            'groupthink': 'template-default',
            'bribery': 'template-default'
        };
        return mapping[experimentType] || 'template-default';
    }
}

// Create global API instance
window.experimentAPI = new ExperimentAPI();