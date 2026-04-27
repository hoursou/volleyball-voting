class VolleyballVotingSystem {
    constructor() {
        this.sessions = this.loadSessions();
        this.users = this.loadUsers();
        this.currentSessionId = null;
        this.currentUser = null;
        this.isLoggedIn = false;
        
        this.initializeElements();
        this.bindEvents();
        this.checkLoginStatus();
        this.renderSessions();
        this.startCountdownTimer();
    }
    
    initializeElements() {
        this.elements = {
            sessionsContainer: document.getElementById('sessionsContainer'),
            emptyState: document.getElementById('emptyState'),
            createSessionBtn: document.getElementById('createSessionBtn'),
            createSessionModal: document.getElementById('createSessionModal'),
            createSessionForm: document.getElementById('createSessionForm'),
            joinSessionModal: document.getElementById('joinSessionModal'),
            joinSessionForm: document.getElementById('joinSessionForm')
        };
    }
    
    bindEvents() {
        this.elements.createSessionBtn.addEventListener('click', () => {
            if (this.canCreateSessions()) {
                this.openModal('createSessionModal');
            } else {
                this.showLoginPrompt();
            }
        });
        
        this.elements.createSessionForm.addEventListener('submit', (e) => {
            e.preventDefault();
            this.createSession();
        });
        
        this.elements.joinSessionForm.addEventListener('submit', (e) => {
            e.preventDefault();
            this.joinSession();
        });
        
        // Close modals when clicking outside
        document.querySelectorAll('.modal').forEach(modal => {
            modal.addEventListener('click', (e) => {
                if (e.target === modal) {
                    this.closeModal(modal.id);
                }
            });
        });
    }
    
    loadSessions() {
        const stored = localStorage.getItem('volleyball_sessions');
        return stored ? JSON.parse(stored) : [];
    }
    
    loadUsers() {
        const stored = localStorage.getItem('volleyball_users');
        if (stored) {
            return JSON.parse(stored);
        }
        
        // Create default admin user
        const defaultUsers = [
            {
                id: 'admin-001',
                name: 'System Admin',
                phone: '',
                role: 'admin',
                canCreateSessions: true,
                addedAt: new Date().toISOString(),
                addedBy: 'system'
            }
        ];
        
        this.saveUsers(defaultUsers);
        return defaultUsers;
    }
    
    saveUsers(users = this.users) {
        localStorage.setItem('volleyball_users', JSON.stringify(users));
    }
    
    saveSessions() {
        localStorage.setItem('volleyball_sessions', JSON.stringify(this.sessions));
    }
    
    checkLoginStatus() {
        // Check URL parameters first (for GitHub Pages compatibility)
        const urlParams = new URLSearchParams(window.location.search);
        const adminCode = urlParams.get('admin');
        
        if (adminCode) {
            this.loginWithCode(adminCode);
            return;
        }
        
        // Then check localStorage
        const loginData = localStorage.getItem('volleyball_admin_login');
        if (loginData) {
            try {
                const { userId, timestamp } = JSON.parse(loginData);
                const now = new Date().getTime();
                
                // Auto-logout after 24 hours
                if (now - timestamp < 24 * 60 * 60 * 1000) {
                    this.loginSuccess(userId);
                } else {
                    localStorage.removeItem('volleyball_admin_login');
                }
            } catch (e) {
                // Clear corrupted localStorage data
                localStorage.removeItem('volleyball_admin_login');
            }
        }
        
        // If not logged in, redirect to login page
        if (!this.isLoggedIn) {
            const currentUrl = window.location.pathname;
            const loginUrl = `volleyball-login.html?redirect=${encodeURIComponent(currentUrl)}`;
            if (currentUrl !== loginUrl && currentUrl !== '/volleyball-login.html') {
                window.location.href = loginUrl;
            }
        }
    }
    
    loginWithCode(adminCode) {
        // Default admin codes
        const validCodes = {
            'volleyball2024': 'admin-001',
            'admin123': 'admin-001',
            'moderator2024': 'moderator-001'
        };
        
        if (validCodes[adminCode]) {
            const userId = validCodes[adminCode];
            this.loginSuccess(userId);
            // Remove admin parameter from URL for security
            const url = new URL(window.location);
            url.searchParams.delete('admin');
            window.history.replaceState({}, document.title, url.toString());
        }
    }
    
    loginSuccess(userId) {
        this.currentUser = this.users.find(u => u.id === userId);
        this.isLoggedIn = true;
        
        // Save login session
        localStorage.setItem('volleyball_admin_login', JSON.stringify({
            userId: userId,
            timestamp: new Date().getTime()
        }));
        
        // Update UI
        this.updateCreateSessionButton();
        this.showNotification(`Logged in as ${this.currentUser.name}`, 'success');
    }
    
    canCreateSessions() {
        // Simplified logic - always allow viewing and joining
        return true;
    }
    
    updateCreateSessionButton() {
        if (!this.elements.createSessionBtn) return;
        
        if (this.canCreateSessions()) {
            this.elements.createSessionBtn.style.display = 'block';
            this.elements.createSessionBtn.onclick = () => this.openModal('createSessionModal');
        } else {
            this.elements.createSessionBtn.style.display = 'none';
        }
    }
    
    showLoginPrompt() {
        this.showNotification('Please login to create sessions. Use ?admin=volleyball2024 in URL', 'warning');
    }
    
    createSession() {
        if (!this.canCreateSessions()) {
            this.showLoginPrompt();
            return;
        }
        
        const sessionNumber = document.getElementById('sessionNumber').value;
        const sessionDateTime = new Date(document.getElementById('sessionDateTime').value);
        const maxPlayers = parseInt(document.getElementById('maxPlayers').value);
        
        const session = {
            id: Date.now().toString(),
            number: sessionNumber,
            dateTime: sessionDateTime.toISOString(),
            maxPlayers: maxPlayers,
            players: [],
            waitingList: [],
            status: 'upcoming',
            createdBy: this.currentUser.name,
            createdAt: new Date().toISOString()
        };
        
        this.sessions.push(session);
        this.saveSessions();
        this.renderSessions();
        this.closeModal('createSessionModal');
        this.elements.createSessionForm.reset();
        
        this.showNotification('Session created successfully!', 'success');
    }
    
    joinSession() {
        const playerName = document.getElementById('playerName').value.trim();
        const playerPhone = document.getElementById('playerPhone').value.trim();
        
        if (!playerName) {
            this.showNotification('Please enter your name', 'error');
            return;
        }
        
        const session = this.sessions.find(s => s.id === this.currentSessionId);
        if (!session) return;
        
        // Check if player already exists
        const existingPlayer = session.players.find(p => p.name.toLowerCase() === playerName.toLowerCase()) ||
                             session.waitingList.find(p => p.name.toLowerCase() === playerName.toLowerCase());
        
        if (existingPlayer) {
            this.showNotification('You have already joined this session', 'error');
            return;
        }
        
        const player = {
            id: Date.now().toString(),
            name: playerName,
            phone: playerPhone,
            joinedAt: new Date().toISOString()
        };
        
        if (session.players.length < session.maxPlayers) {
            session.players.push(player);
            this.showNotification('Successfully joined the session!', 'success');
        } else {
            session.waitingList.push(player);
            this.showNotification('Session is full. You have been added to the waiting list!', 'warning');
        }
        
        this.saveSessions();
        this.renderSessions();
        this.closeModal('joinSessionModal');
        this.elements.joinSessionForm.reset();
    }
    
    withdrawFromSession(sessionId, playerId) {
        const session = this.sessions.find(s => s.id === sessionId);
        if (!session) return;
        
        const player = session.players.find(p => p.id === playerId);
        if (!player) return;
        
        const now = new Date().getTime();
        const sessionDateTime = new Date(session.dateTime).getTime();
        
        const hoursUntilSession = (sessionDateTime - now) / (1000 * 60 * 60);
        
        if (hoursUntilSession < 24) {
            this.showNotification('Withdrawal is not permitted within 24 hours of session', 'error');
            return;
        }
        
        // Add confirmation before withdrawal
        const confirmWithdrawal = confirm(`Are you sure you want to withdraw from session ${session.number}? This action cannot be undone.`);
        if (!confirmWithdrawal) {
            return;
        }
        
        // Remove from players or waiting list
        const playerIndex = session.players.findIndex(p => p.id === playerId);
        const waitingIndex = session.waitingList.findIndex(p => p.id === playerId);
        
        let removedPlayer = null;
        
        if (playerIndex !== -1) {
            removedPlayer = session.players.splice(playerIndex, 1)[0];
        } else if (waitingIndex !== -1) {
            session.waitingList.splice(waitingIndex, 1);
            this.saveSessions();
            this.renderSessions();
            this.showNotification('Successfully withdrawn from waiting list', 'success');
            return;
        }
        
        // Auto-promote from waiting list
        if (removedPlayer && session.waitingList.length > 0) {
            const nextPlayer = session.waitingList.shift();
            session.players.push(nextPlayer);
            
            // Notify both players
        this.saveSessions();
        this.renderSessions();
    }
    
    deleteSession(sessionId) {
        const session = this.sessions.find(s => s.id === sessionId);
        if (!session) return;
        
        if (!confirm(`Are you sure you want to delete session ${session.number}? This will remove all ${session.players.length} players from the session.`)) return;
        
        this.sessions = this.sessions.filter(s => s.id !== sessionId);
        this.saveSessions();
        this.renderSessions();
        
        // Notify all players in the session
        this.showNotification(`Session ${session.number} has been deleted by admin. All players have been removed.`, 'error');
        
        // Additional notification for affected players
        setTimeout(() => {
            session.players.forEach(player => {
                this.showNotification(
                    `⚠️ ${player.name}, session ${session.number} has been deleted. Please join a new session.`,
                    'warning'
                );
                
                // Send WhatsApp notification if phone available
                if (player.phone) {
                    this.sendWhatsAppNotification(
                        player.phone,
                        `🏐 Volleyball Alert: Session ${session.number} has been deleted. Please join a new session.`
                    );
                }
            });
        }, 500);
    }
    
    renderSessions() {
        if (this.sessions.length === 0) {
            this.elements.sessionsContainer.style.display = 'none';
            this.elements.emptyState.style.display = 'block';
            return;
        }
        
        this.elements.sessionsContainer.style.display = 'grid';
        this.elements.emptyState.style.display = 'none';
        
        // Sort sessions by date
        const sortedSessions = [...this.sessions].sort((a, b) => 
            new Date(a.dateTime) - new Date(b.dateTime)
        );
        
        this.elements.sessionsContainer.innerHTML = sortedSessions.map(session => {
            const sessionDateTime = new Date(session.dateTime);
            const now = new Date();
            const isPast = sessionDateTime < now;
            const isFull = session.players.length >= session.maxPlayers;
            const hoursUntilSession = (sessionDateTime - now) / (1000 * 60 * 60);
            const canWithdraw = hoursUntilSession >= 24;
            
            let statusClass = 'upcoming';
            if (isPast) statusClass = 'past';
            else if (isFull) statusClass = 'full';
            else if (session.players.length > 0) statusClass = 'active';
            
            return `
                <div class="session-card glass-morphism p-6 ${statusClass}">
                    <div class="flex justify-between items-start mb-4">
                        <div>
                            <h3 class="text-xl font-bold text-white mb-1">Session #${session.number}</h3>
                            <p class="text-gray-300 text-sm">
                                <i class="fas fa-calendar mr-1"></i>
                                ${sessionDateTime.toLocaleDateString()} ${sessionDateTime.toLocaleTimeString()}
                            </p>
                        </div>
                        <button onclick="volleyballSystem.deleteSession('${session.id}')" 
                                class="text-red-400 hover:text-red-300 transition">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                    
                    <div class="mb-4">
                        <div class="flex justify-between items-center mb-2">
                            <span class="text-white font-medium">Players</span>
                            <span class="text-gray-300">${session.players.length}/${session.maxPlayers}</span>
                        </div>
                        <div class="w-full bg-gray-700 rounded-full h-2">
                            <div class="bg-gradient-to-r from-blue-500 to-green-500 h-2 rounded-full transition-all duration-300"
                                 style="width: ${(session.players.length / session.maxPlayers) * 100}%"></div>
                        </div>
                    </div>
                    
                    ${session.players.length > 0 ? `
                        <div class="mb-4">
                            <h4 class="text-white font-medium mb-2">Confirmed Players:</h4>
                            <div class="space-y-1">
                                ${session.players.map(player => `
                                    <div class="player-badge flex items-center justify-between bg-green-500/20 rounded-lg px-3 py-2">
                                        <span class="text-white text-sm">
                                            <i class="fas fa-user mr-2"></i>${player.name}
                                        </span>
                                        ${canWithdraw && !isPast ? `
                                            <button onclick="volleyballSystem.withdrawFromSession('${session.id}', '${player.id}')"
                                                    class="text-red-400 hover:text-red-300 text-sm">
                                                <i class="fas fa-times"></i>
                                            </button>
                                        ` : ''}
                                    </div>
                                `).join('')}
                            </div>
                        </div>
                    ` : ''}
                    
                    ${session.waitingList.length > 0 ? `
                        <div class="mb-4">
                            <h4 class="text-yellow-400 font-medium mb-2">Waiting List:</h4>
                            <div class="space-y-1">
                                ${session.waitingList.map((player, index) => `
                                    <div class="waiting-list-item flex items-center justify-between bg-yellow-500/20 rounded-lg px-3 py-2">
                                        <span class="text-white text-sm">
                                            <i class="fas fa-clock mr-2"></i>${index + 1}. ${player.name}
                                        </span>
                                        <button onclick="volleyballSystem.withdrawFromSession('${session.id}', '${player.id}')"
                                                class="text-red-400 hover:text-red-300 text-sm">
                                            <i class="fas fa-times"></i>
                                        </button>
                                    </div>
                                `).join('')}
                            </div>
                        </div>
                    ` : ''}
                    
                    ${!isPast ? `
                        <button onclick="volleyballSystem.openJoinModal('${session.id}')"
                                class="w-full btn-primary px-4 py-2 text-white rounded-lg font-medium transition">
                            ${isFull ? 'Join Waiting List' : 'Join Session'}
                        </button>
                    ` : `
                        <div class="text-center text-gray-400 py-2">
                            <i class="fas fa-check-circle mr-2"></i>Session Completed
                        </div>
                    `}
                    
                    ${!isPast && hoursUntilSession < 24 ? `
                        <div class="mt-2 text-center text-yellow-400 text-sm countdown">
                            <i class="fas fa-exclamation-triangle mr-1"></i>
                            Withdrawal closes in ${Math.floor(hoursUntilSession)}h ${Math.floor((hoursUntilSession % 1) * 60)}m
                        </div>
                    ` : ''}
                </div>
            `;
        }).join('');
    }
    
    openJoinModal(sessionId) {
        this.currentSessionId = sessionId;
        this.openModal('joinSessionModal');
    }
    
    openModal(modalId) {
        document.getElementById(modalId).classList.add('show');
    }
    
    closeModal(modalId) {
        document.getElementById(modalId).classList.remove('show');
    }
    
    showNotification(message, type = 'info') {
        const notification = document.createElement('div');
        const bgColor = type === 'success' ? 'bg-green-500' : 
                        type === 'error' ? 'bg-red-500' : 
                        type === 'warning' ? 'bg-yellow-500' : 'bg-blue-500';
        
        notification.className = `fixed top-4 right-4 ${bgColor} text-white px-6 py-3 rounded-lg shadow-lg z-50 animate-pulse`;
        notification.innerHTML = `
            <div class="flex items-center">
                <i class="fas fa-${type === 'success' ? 'check-circle' : 
                                   type === 'error' ? 'exclamation-circle' : 
                                   type === 'warning' ? 'exclamation-triangle' : 'info-circle'} mr-2"></i>
                ${message}
            </div>
        `;
        
        document.body.appendChild(notification);
        
        setTimeout(() => {
            notification.style.opacity = '0';
            notification.style.transition = 'opacity 0.5s';
            setTimeout(() => notification.remove(), 500);
        }, 3000);
    }
    
    sendWhatsAppNotification(phone, message) {
        const cleanPhone = phone.replace(/[^\d]/g, '');
        const encodedMessage = encodeURIComponent(message);
        const whatsappUrl = `https://wa.me/${cleanPhone}?text=${encodedMessage}`;
        
        window.open(whatsappUrl, '_blank');
        this.showNotification('Opening WhatsApp to send notification...', 'info');
    }
    
    startCountdownTimer() {
        setInterval(() => {
            this.renderSessions();
        }, 60000); // Update every minute
    }
}

// Helper function for global access
function closeModal(modalId) {
    document.getElementById(modalId).classList.remove('show');
}

// Initialize the system
const volleyballSystem = new VolleyballVotingSystem();
