class VolleyballMobileApp {
    constructor() {
        this.sessions = this.loadSessions();
        this.currentSessionId = null;
        this.currentTab = 'upcoming';
        this.isPullRefreshing = false;
        this.touchStartY = 0;
        
        this.initializeElements();
        this.bindEvents();
        this.renderSessions();
        this.startCountdownTimer();
        this.initializePullToRefresh();
        this.initializeTouchGestures();
    }
    
    initializeElements() {
        this.elements = {
            sessionsContainer: document.getElementById('sessionsContainer'),
            emptyState: document.getElementById('emptyState'),
            createSessionModal: document.getElementById('createSessionModal'),
            createSessionForm: document.getElementById('createSessionForm'),
            joinSessionModal: document.getElementById('joinSessionModal'),
            joinSessionForm: document.getElementById('joinSessionForm'),
            pullToRefresh: document.getElementById('pullToRefresh')
        };
    }
    
    bindEvents() {
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
        
        // Prevent zoom on double tap
        document.addEventListener('touchstart', (e) => {
            if (e.touches.length > 1) {
                e.preventDefault();
            }
        });
        
        // Handle orientation change
        window.addEventListener('orientationchange', () => {
            setTimeout(() => this.renderSessions(), 100);
        });
    }
    
    initializePullToRefresh() {
        let startY = 0;
        let currentY = 0;
        let isPulling = false;
        
        document.addEventListener('touchstart', (e) => {
            if (window.scrollY === 0) {
                startY = e.touches[0].clientY;
                isPulling = true;
            }
        });
        
        document.addEventListener('touchmove', (e) => {
            if (!isPulling) return;
            
            currentY = e.touches[0].clientY;
            const pullDistance = currentY - startY;
            
            if (pullDistance > 0 && window.scrollY === 0) {
                e.preventDefault();
                
                if (pullDistance > 60) {
                    this.elements.pullToRefresh.classList.add('active');
                } else {
                    this.elements.pullToRefresh.classList.remove('active');
                }
            }
        });
        
        document.addEventListener('touchend', () => {
            if (this.elements.pullToRefresh.classList.contains('active')) {
                this.refreshData();
                this.elements.pullToRefresh.classList.remove('active');
            }
            
            isPulling = false;
        });
    }
    
    initializeTouchGestures() {
        const sessions = this.elements.sessionsContainer;
        
        sessions.addEventListener('touchstart', (e) => {
            const card = e.target.closest('.session-card');
            if (!card) return;
            
            this.touchStartX = e.touches[0].clientX;
            this.touchStartY = e.touches[0].clientY;
        });
        
        sessions.addEventListener('touchend', (e) => {
            const card = e.target.closest('.session-card');
            if (!card) return;
            
            const touchEndX = e.changedTouches[0].clientX;
            const touchEndY = e.changedTouches[0].clientY;
            
            const deltaX = touchEndX - this.touchStartX;
            const deltaY = Math.abs(touchEndY - this.touchStartY);
            
            // Swipe left to withdraw (if swipe is more horizontal than vertical)
            if (deltaX < -50 && deltaY < 30) {
                const sessionId = card.dataset.sessionId;
                const playerId = e.target.closest('.player-item')?.dataset.playerId;
                
                if (sessionId && playerId) {
                    this.withdrawFromSession(sessionId, playerId);
                }
            }
        });
    }
    
    loadSessions() {
        const stored = localStorage.getItem('volleyball_sessions');
        return stored ? JSON.parse(stored) : [];
    }
    
    saveSessions() {
        localStorage.setItem('volleyball_sessions', JSON.stringify(this.sessions));
    }
    
    createSession() {
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
            createdAt: new Date().toISOString()
        };
        
        this.sessions.push(session);
        this.saveSessions();
        this.renderSessions();
        this.closeModal('createSessionModal');
        this.elements.createSessionForm.reset();
        
        this.showNotification('Session created successfully!', 'success');
        this.vibrate(); // Haptic feedback
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
            this.showNotification('Session is full. Added to waiting list!', 'warning');
        }
        
        this.saveSessions();
        this.renderSessions();
        this.closeModal('joinSessionModal');
        this.elements.joinSessionForm.reset();
        this.vibrate(); // Haptic feedback
    }
    
    withdrawFromSession(sessionId, playerId) {
        const session = this.sessions.find(s => s.id === sessionId);
        if (!session) return;
        
        const sessionDateTime = new Date(session.dateTime);
        const now = new Date();
        const hoursUntilSession = (sessionDateTime - now) / (1000 * 60 * 60);
        
        if (hoursUntilSession < 24) {
            this.showNotification('Withdrawal not allowed within 24 hours', 'error');
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
            this.showNotification('Withdrawn from waiting list', 'success');
            this.vibrate();
            return;
        }
        
        // Auto-promote from waiting list
        if (removedPlayer && session.waitingList.length > 0) {
            const nextPlayer = session.waitingList.shift();
            session.players.push(nextPlayer);
            
            this.showNotification(
                `${removedPlayer.name} withdrew. ${nextPlayer.name} promoted!`,
                'success'
            );
        } else {
            this.showNotification('Successfully withdrawn', 'success');
        }
        
        this.saveSessions();
        this.renderSessions();
        this.vibrate(); // Haptic feedback
    }
    
    deleteSession(sessionId) {
        if (!confirm('Delete this session?')) return;
        
        this.sessions = this.sessions.filter(s => s.id !== sessionId);
        this.saveSessions();
        this.renderSessions();
        this.showNotification('Session deleted', 'success');
        this.vibrate(); // Haptic feedback
    }
    
    switchTab(tab) {
        this.currentTab = tab;
        
        // Update tab buttons
        document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
        event.target.classList.add('active');
        
        this.renderSessions();
    }
    
    renderSessions() {
        const now = new Date();
        let filteredSessions = [...this.sessions];
        
        // Filter based on current tab
        if (this.currentTab === 'upcoming') {
            filteredSessions = filteredSessions.filter(s => new Date(s.dateTime) > now);
        } else if (this.currentTab === 'active') {
            filteredSessions = filteredSessions.filter(s => 
                new Date(s.dateTime) > now && s.players.length > 0
            );
        } else if (this.currentTab === 'past') {
            filteredSessions = filteredSessions.filter(s => new Date(s.dateTime) <= now);
        }
        
        // Sort by date
        filteredSessions.sort((a, b) => new Date(a.dateTime) - new Date(b.dateTime));
        
        if (filteredSessions.length === 0) {
            this.elements.sessionsContainer.style.display = 'none';
            this.elements.emptyState.style.display = 'block';
            return;
        }
        
        this.elements.sessionsContainer.style.display = 'block';
        this.elements.emptyState.style.display = 'none';
        
        this.elements.sessionsContainer.innerHTML = filteredSessions.map(session => {
            const sessionDateTime = new Date(session.dateTime);
            const isPast = sessionDateTime < now;
            const isFull = session.players.length >= session.maxPlayers;
            const hoursUntilSession = (sessionDateTime - now) / (1000 * 60 * 60);
            const canWithdraw = hoursUntilSession >= 24;
            
            let statusClass = 'upcoming';
            if (isPast) statusClass = 'past';
            else if (isFull) statusClass = 'full';
            else if (session.players.length > 0) statusClass = 'active';
            
            return `
                <div class="mobile-card session-card ${statusClass}" data-session-id="${session.id}">
                    <div class="p-4">
                        <div class="flex justify-between items-start mb-3">
                            <div>
                                <h3 class="text-lg font-bold mb-1">Session #${session.number}</h3>
                                <p class="text-sm text-gray-600">
                                    <i class="fas fa-calendar mr-1"></i>
                                    ${sessionDateTime.toLocaleDateString()}
                                </p>
                                <p class="text-sm text-gray-600">
                                    <i class="fas fa-clock mr-1"></i>
                                    ${sessionDateTime.toLocaleTimeString()}
                                </p>
                            </div>
                            <button onclick="volleyballApp.deleteSession('${session.id}')" 
                                    class="text-red-500 p-2">
                                <i class="fas fa-trash"></i>
                            </button>
                        </div>
                        
                        <div class="mb-3">
                            <div class="flex justify-between items-center mb-1">
                                <span class="text-sm font-medium">Players</span>
                                <span class="text-sm text-gray-600">${session.players.length}/${session.maxPlayers}</span>
                            </div>
                            <div class="progress-bar">
                                <div class="progress-fill" style="width: ${(session.players.length / session.maxPlayers) * 100}%"></div>
                            </div>
                        </div>
                        
                        ${session.players.length > 0 ? `
                            <div class="mb-3">
                                <h4 class="text-sm font-medium mb-2">Confirmed:</h4>
                                <div class="space-y-1">
                                    ${session.players.map(player => `
                                        <div class="player-item player-confirmed" data-player-id="${player.id}">
                                            <span class="flex items-center">
                                                <i class="fas fa-user mr-2"></i>${player.name}
                                            </span>
                                            ${canWithdraw && !isPast ? `
                                                <button onclick="volleyballApp.withdrawFromSession('${session.id}', '${player.id}')"
                                                        class="text-red-500 p-1">
                                                    <i class="fas fa-times"></i>
                                                </button>
                                            ` : ''}
                                        </div>
                                    `).join('')}
                                </div>
                            </div>
                        ` : ''}
                        
                        ${session.waitingList.length > 0 ? `
                            <div class="mb-3">
                                <h4 class="text-sm font-medium mb-2">Waiting List:</h4>
                                <div class="space-y-1">
                                    ${session.waitingList.map((player, index) => `
                                        <div class="player-item player-waiting" data-player-id="${player.id}">
                                            <span class="flex items-center">
                                                <i class="fas fa-clock mr-2"></i>${index + 1}. ${player.name}
                                            </span>
                                            <button onclick="volleyballApp.withdrawFromSession('${session.id}', '${player.id}')"
                                                    class="text-red-500 p-1">
                                                <i class="fas fa-times"></i>
                                            </button>
                                        </div>
                                    `).join('')}
                                </div>
                            </div>
                        ` : ''}
                        
                        ${!isPast ? `
                            <button onclick="volleyballApp.openJoinModal('${session.id}')"
                                    class="w-full mobile-btn mobile-btn-primary">
                                ${isFull ? 'Join Waiting List' : 'Join Session'}
                            </button>
                        ` : `
                            <div class="text-center text-gray-500 py-2">
                                <i class="fas fa-check-circle mr-2"></i>Completed
                            </div>
                        `}
                        
                        ${!isPast && hoursUntilSession < 24 ? `
                            <div class="text-center countdown-timer mt-2">
                                <i class="fas fa-exclamation-triangle mr-1"></i>
                                Withdrawal closes in ${Math.floor(hoursUntilSession)}h ${Math.floor((hoursUntilSession % 1) * 60)}m
                            </div>
                        ` : ''}
                    </div>
                    <div class="swipe-hint">
                        <i class="fas fa-arrow-left"></i> Swipe to withdraw
                    </div>
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
        document.body.style.overflow = 'hidden';
    }
    
    closeModal(modalId) {
        document.getElementById(modalId).classList.remove('show');
        document.body.style.overflow = '';
    }
    
    showNotification(message, type = 'info') {
        const notification = document.createElement('div');
        const bgColor = type === 'success' ? 'bg-green-500' : 
                        type === 'error' ? 'bg-red-500' : 
                        type === 'warning' ? 'bg-yellow-500' : 'bg-blue-500';
        
        notification.className = `notification ${bgColor}`;
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
            setTimeout(() => notification.remove(), 300);
        }, 3000);
    }
    
    refreshData() {
        this.sessions = this.loadSessions();
        this.renderSessions();
        this.showNotification('Data refreshed', 'success');
        this.vibrate(); // Haptic feedback
    }
    
    vibrate() {
        if ('vibrate' in navigator) {
            navigator.vibrate(50);
        }
    }
    
    startCountdownTimer() {
        setInterval(() => {
            this.renderSessions();
        }, 60000); // Update every minute
    }
}

// Global functions for HTML onclick handlers
function switchTab(tab) {
    volleyballApp.switchTab(tab);
}

function openCreateModal() {
    volleyballApp.openModal('createSessionModal');
}

function closeModal(modalId) {
    volleyballApp.closeModal(modalId);
}

// Initialize the mobile app
const volleyballApp = new VolleyballMobileApp();
