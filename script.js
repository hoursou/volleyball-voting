class PingTool {
    constructor() {
        this.isPinging = false;
        this.pingCount = 0;
        this.sentCount = 0;
        this.receivedCount = 0;
        this.latencies = [];
        this.pingInterval = null;
        this.target = '';
        
        this.initializeElements();
        this.bindEvents();
    }
    
    initializeElements() {
        this.elements = {
            targetInput: document.getElementById('targetInput'),
            pingBtn: document.getElementById('pingBtn'),
            stopBtn: document.getElementById('stopBtn'),
            clearBtn: document.getElementById('clearBtn'),
            countInput: document.getElementById('countInput'),
            intervalInput: document.getElementById('intervalInput'),
            continuousCheckbox: document.getElementById('continuousCheckbox'),
            statusIcon: document.getElementById('statusIcon'),
            statusText: document.getElementById('statusText'),
            pingCountElement: document.getElementById('pingCount'),
            statsSent: document.getElementById('statsSent'),
            statsReceived: document.getElementById('statsReceived'),
            statsLost: document.getElementById('statsLost'),
            statsAvg: document.getElementById('statsAvg'),
            resultsContainer: document.getElementById('resultsContainer'),
            chartContainer: document.getElementById('chartContainer')
        };
    }
    
    bindEvents() {
        this.elements.pingBtn.addEventListener('click', () => this.startPing());
        this.elements.stopBtn.addEventListener('click', () => this.stopPing());
        this.elements.clearBtn.addEventListener('click', () => this.clearResults());
        this.elements.targetInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') this.startPing();
        });
        this.elements.continuousCheckbox.addEventListener('change', () => {
            this.elements.countInput.disabled = this.elements.continuousCheckbox.checked;
        });
    }
    
    async startPing() {
        const target = this.elements.targetInput.value.trim();
        if (!target) {
            this.updateStatus('error', 'Please enter a target hostname or IP address');
            return;
        }
        
        this.target = target;
        this.isPinging = true;
        this.pingCount = 0;
        this.sentCount = 0;
        this.receivedCount = 0;
        this.latencies = [];
        
        this.updateUI();
        this.updateStatus('pinging', `Pinging ${target}...`);
        
        const count = parseInt(this.elements.countInput.value);
        const interval = parseInt(this.elements.intervalInput.value);
        const isContinuous = this.elements.continuousCheckbox.checked;
        
        if (isContinuous) {
            this.pingInterval = setInterval(() => this.performPing(), interval);
        } else {
            for (let i = 0; i < count; i++) {
                if (!this.isPinging) break;
                await this.performPing();
                if (i < count - 1) {
                    await this.sleep(interval);
                }
            }
            this.stopPing();
        }
    }
    
    async performPing() {
        this.sentCount++;
        this.pingCount++;
        
        const startTime = Date.now();
        
        try {
            // Simulate ping with fetch to a common endpoint
            // In a real implementation, you'd use a backend service for actual ICMP ping
            const response = await this.simulatePing(this.target);
            const endTime = Date.now();
            const latency = endTime - startTime;
            
            this.receivedCount++;
            this.latencies.push(latency);
            
            this.addResult({
                sequence: this.sentCount,
                target: this.target,
                latency: latency,
                status: 'success',
                timestamp: new Date().toLocaleTimeString()
            });
            
            this.updateStatistics();
            this.updateChart();
            
        } catch (error) {
            this.addResult({
                sequence: this.sentCount,
                target: this.target,
                latency: null,
                status: 'error',
                error: error.message,
                timestamp: new Date().toLocaleTimeString()
            });
            
            this.updateStatistics();
        }
        
        this.elements.pingCountElement.textContent = `Pings: ${this.pingCount}`;
    }
    
    async simulatePing(target) {
        // Simulate network latency and response
        return new Promise((resolve, reject) => {
            const baseLatency = Math.random() * 100 + 10; // 10-110ms base latency
            const jitter = Math.random() * 50 - 25; // ±25ms jitter
            const totalLatency = Math.max(1, baseLatency + jitter);
            
            // Simulate occasional packet loss (5% chance)
            if (Math.random() < 0.05) {
                setTimeout(() => reject(new Error('Request timeout')), totalLatency);
            } else {
                setTimeout(() => resolve({ status: 'success' }), totalLatency);
            }
        });
    }
    
    stopPing() {
        this.isPinging = false;
        if (this.pingInterval) {
            clearInterval(this.pingInterval);
            this.pingInterval = null;
        }
        
        this.updateUI();
        
        if (this.sentCount > 0) {
            const lossRate = ((this.sentCount - this.receivedCount) / this.sentCount * 100).toFixed(1);
            this.updateStatus('complete', `Ping complete. ${lossRate}% packet loss`);
        } else {
            this.updateStatus('ready', 'Ready to ping');
        }
    }
    
    clearResults() {
        this.stopPing();
        this.pingCount = 0;
        this.sentCount = 0;
        this.receivedCount = 0;
        this.latencies = [];
        
        this.elements.resultsContainer.innerHTML = `
            <div class="text-gray-300 text-center py-8">
                <i class="fas fa-inbox text-4xl mb-3 opacity-50"></i>
                <p>No ping results yet</p>
            </div>
        `;
        
        this.elements.chartContainer.innerHTML = '<div class="text-gray-300 text-sm">No data to display</div>';
        
        this.updateStatistics();
        this.elements.pingCountElement.textContent = 'Pings: 0';
        this.updateStatus('ready', 'Ready to ping');
    }
    
    addResult(result) {
        if (this.elements.resultsContainer.querySelector('.text-gray-300')) {
            this.elements.resultsContainer.innerHTML = '';
        }
        
        const resultElement = document.createElement('div');
        resultElement.className = 'result-item glass-morphism p-3 flex items-center justify-between';
        
        const statusIcon = result.status === 'success' 
            ? '<i class="fas fa-check-circle success"></i>' 
            : '<i class="fas fa-times-circle error"></i>';
        
        const latencyText = result.latency !== null 
            ? `<span class="font-mono">${result.latency}ms</span>` 
            : '<span class="error">Failed</span>';
        
        resultElement.innerHTML = `
            <div class="flex items-center gap-3">
                <span class="text-gray-300">#${result.sequence}</span>
                ${statusIcon}
                <span class="text-white">${result.target}</span>
                ${latencyText}
            </div>
            <span class="text-gray-400 text-sm">${result.timestamp}</span>
        `;
        
        this.elements.resultsContainer.insertBefore(resultElement, this.elements.resultsContainer.firstChild);
        
        // Keep only last 50 results
        while (this.elements.resultsContainer.children.length > 50) {
            this.elements.resultsContainer.removeChild(this.elements.resultsContainer.lastChild);
        }
    }
    
    updateStatistics() {
        this.elements.statsSent.textContent = this.sentCount;
        this.elements.statsReceived.textContent = this.receivedCount;
        
        const lossRate = this.sentCount > 0 
            ? ((this.sentCount - this.receivedCount) / this.sentCount * 100).toFixed(1)
            : '0';
        this.elements.statsLost.textContent = `${lossRate}%`;
        
        const avgLatency = this.latencies.length > 0
            ? Math.round(this.latencies.reduce((a, b) => a + b, 0) / this.latencies.length)
            : '-';
        this.elements.statsAvg.textContent = avgLatency === '-' ? '-' : `${avgLatency}ms`;
    }
    
    updateChart() {
        if (this.latencies.length === 0) {
            this.elements.chartContainer.innerHTML = '<div class="text-gray-300 text-sm">No data to display</div>';
            return;
        }
        
        const maxLatency = Math.max(...this.latencies);
        const recentLatencies = this.latencies.slice(-20); // Show last 20 pings
        
        this.elements.chartContainer.innerHTML = recentLatencies.map(latency => {
            const height = (latency / maxLatency) * 100;
            const color = latency < 50 ? 'bg-green-500' : latency < 100 ? 'bg-yellow-500' : 'bg-red-500';
            
            return `<div class="chart-bar ${color} flex-1 rounded-t" style="height: ${height}%"></div>`;
        }).join('');
    }
    
    updateUI() {
        if (this.isPinging) {
            this.elements.pingBtn.classList.add('hidden');
            this.elements.stopBtn.classList.remove('hidden');
            this.elements.targetInput.disabled = true;
            this.elements.countInput.disabled = true;
            this.elements.intervalInput.disabled = true;
            this.elements.continuousCheckbox.disabled = true;
        } else {
            this.elements.pingBtn.classList.remove('hidden');
            this.elements.stopBtn.classList.add('hidden');
            this.elements.targetInput.disabled = false;
            this.elements.countInput.disabled = this.elements.continuousCheckbox.checked;
            this.elements.intervalInput.disabled = false;
            this.elements.continuousCheckbox.disabled = false;
        }
    }
    
    updateStatus(status, message) {
        const iconElement = this.elements.statusIcon;
        const textElement = this.elements.statusText;
        
        switch (status) {
            case 'ready':
                iconElement.innerHTML = '<i class="fas fa-circle text-gray-400"></i>';
                break;
            case 'pinging':
                iconElement.innerHTML = '<i class="fas fa-circle text-green-400 ping-animation"></i>';
                break;
            case 'complete':
                iconElement.innerHTML = '<i class="fas fa-check-circle text-green-400"></i>';
                break;
            case 'error':
                iconElement.innerHTML = '<i class="fas fa-exclamation-circle text-red-400"></i>';
                break;
        }
        
        textElement.textContent = message;
    }
    
    sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
}

// Initialize the ping tool when the page loads
document.addEventListener('DOMContentLoaded', () => {
    new PingTool();
});
