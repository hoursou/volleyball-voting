class VolleyballAdminSystem {
    constructor() {
        this.sessions = this.loadSessions();
        this.users = this.loadUsers();
        this.currentSessionId = null;
        this.currentUser = null;
        this.isLoggedIn = false;
        
        this.initializeElements();
        this.bindEvents();
        this.checkLoginStatus();
    }
    
    initializeElements() {
        this.elements = {
            loginSection: document.getElementById('loginSection'),
            adminPanel: document.getElementById('adminPanel'),
            loginForm: document.getElementById('loginForm'),
            adminCode: document.getElementById('adminCode'),
            currentUser: document.getElementById('currentUser'),
            usersTableBody: document.getElementById('usersTableBody'),
            requestsTableBody: document.getElementById('requestsTableBody'),
            requestCount: document.getElementById('requestCount'),
            noRequestsMessage: document.getElementById('noRequestsMessage'),
            refreshRequestsBtn: document.getElementById('refreshRequestsBtn'),
            sessionsContainer: document.getElementById('sessionsContainer'),
            emptyState: document.getElementById('emptyState'),
            createSessionBtn: document.getElementById('createSessionBtn'),
            createSessionModal: document.getElementById('createSessionModal'),
            createSessionForm: document.getElementById('createSessionForm'),
            addUserModal: document.getElementById('addUserModal'),
            addUserForm: document.getElementById('addUserForm'),
            joinSessionModal: document.getElementById('joinSessionModal'),
            joinSessionForm: document.getElementById('joinSessionForm')
        };
    }
    
    bindEvents() {
        this.elements.loginForm.addEventListener('submit', (e) => {
            e.preventDefault();
            this.login();
        });
        
        this.elements.refreshRequestsBtn.addEventListener('click', () => {
            this.loadRequests();
        });
        
        this.elements.createSessionBtn.addEventListener('click', () => {
            if (this.canCreateSessions()) {
                this.openModal('createSessionModal');
            } else {
                this.showNotification('You do not have permission to create sessions', 'error');
            }
        });
        
        this.elements.createSessionForm.addEventListener('submit', (e) => {
            e.preventDefault();
            this.createSession();
        });
        
        this.elements.addUserForm.addEventListener('submit', (e) => {
            e.preventDefault();
            this.addUser();
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
            const users = JSON.parse(stored);
            
            // Migrate existing users without access codes
            let needsUpdate = false;
            users.forEach(user => {
                if (!user.accessCode && user.id !== 'admin-001') {
                    user.accessCode = this.generateAccessCode(user.name);
                    needsUpdate = true;
                }
            });
            
            if (needsUpdate) {
                this.saveUsers(users);
            }
            
            return users;
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
    
    saveSessions() {
        localStorage.setItem('volleyball_sessions', JSON.stringify(this.sessions));
    }
    
    saveUsers(users = this.users) {
        localStorage.setItem('volleyball_users', JSON.stringify(users));
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
    }
    
    loginWithCode(adminCode) {
        // Default admin codes (in production, use more secure authentication)
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
        } else {
            this.showNotification('Invalid admin code', 'error');
            if (this.elements.adminCode) {
                this.elements.adminCode.value = '';
            }
        }
    }
    
    login() {
        const adminCode = this.elements.adminCode.value.trim();
        this.loginWithCode(adminCode);
    }
    
    loginSuccess(userId) {
        this.currentUser = this.users.find(u => u.id === userId);
        this.isLoggedIn = true;
        
        // Save login session
        localStorage.setItem('volleyball_admin_login', JSON.stringify({
            userId: userId,
            timestamp: new Date().getTime()
        }));
        
        this.isLoggedIn = true;
        this.elements.loginSection.style.display = 'none';
        this.elements.adminPanel.classList.add('show');
        this.elements.currentUser.textContent = this.currentUser.name;
        this.showNotification('Welcome back, ' + this.currentUser.name + '!', 'success');
        this.loadUsers();
        this.loadSessions();
        this.loadRequests();
        
        // Render data
        this.renderUsers();
        this.renderSessions();
        this.renderRequests();
        this.startCountdownTimer();
        this.showNotification(`Welcome back, ${this.currentUser.name}!`, 'success');
    }
    
    logout() {
        this.isLoggedIn = false;
        this.currentUser = null;
        
        localStorage.removeItem('volleyball_admin_login');
        
        this.elements.loginSection.style.display = 'flex';
        this.elements.adminPanel.classList.remove('show');
        this.elements.adminCode.value = '';
        
        this.showNotification('Logged out successfully', 'success');
    }
    
    canCreateSessions() {
        if (!this.isLoggedIn) return false;
        
        return this.currentUser.role === 'admin' || 
               this.currentUser.role === 'moderator' || 
               this.currentUser.canCreateSessions;
    }
    
    updateCreateSessionButton() {
        if (this.canCreateSessions()) {
            this.elements.createSessionBtn.style.display = 'block';
        } else {
            this.elements.createSessionBtn.style.display = 'none';
        }
    }
    
    addUser() {
        const name = document.getElementById('newUserName').value.trim();
        const phone = document.getElementById('newUserPhone').value.trim();
        const role = document.getElementById('newUserRole').value;
        
        if (!name) {
            this.showNotification('Please enter a name', 'error');
            return;
        }
        
        // Check if user already exists
        const existingUser = this.users.find(u => 
            u.name.toLowerCase() === name.toLowerCase()
        );
        
        if (existingUser) {
            this.showNotification('User with this name already exists', 'error');
            return;
        }
        
        // Generate access code for the new user
        const accessCode = this.generateAccessCode(name);
        
        const user = {
            id: 'user-' + Date.now(),
            name: name,
            phone: phone,
            role: role,
            canCreateSessions: role === 'admin' || role === 'moderator',
            accessCode: accessCode,
            addedAt: new Date().toISOString(),
            addedBy: this.currentUser.name
        };
        
        this.users.push(user);
        this.saveUsers();
        this.renderUsers();
        this.closeModal('addUserModal');
        this.elements.addUserForm.reset();
        
        this.showNotification(`User ${name} added successfully! Access code: ${accessCode}`, 'success');
    }
    
    removeUser(userId) {
        const user = this.users.find(u => u.id === userId);
        if (!user) return;
        
        // Don't allow removing yourself
        if (user.id === this.currentUser.id) {
            this.showNotification('You cannot remove yourself', 'error');
            return;
        }
        
        // Don't allow removing system admin
        if (user.id === 'admin-001') {
            this.showNotification('Cannot remove system admin', 'error');
            return;
        }
        
        if (!confirm(`Remove user ${user.name}?`)) return;
        
        this.users = this.users.filter(u => u.id !== userId);
        this.saveUsers();
        this.renderUsers();
        
        this.showNotification(`User ${user.name} removed`, 'success');
    }
    
    changeUserRole(userId, newRole) {
        const user = this.users.find(u => u.id === userId);
        if (!user) return;
        
        // Don't allow changing your own role to something lower
        if (user.id === this.currentUser.id && newRole === 'user') {
            this.showNotification('You cannot downgrade your own role', 'error');
            return;
        }
        
        // Don't allow changing system admin role
        if (user.id === 'admin-001') {
            this.showNotification('Cannot change system admin role', 'error');
            return;
        }
        
        user.role = newRole;
        user.canCreateSessions = newRole === 'admin' || newRole === 'moderator';
        user.updatedAt = new Date().toISOString();
        user.updatedBy = this.currentUser.name;
        
        this.saveUsers();
        this.renderUsers();
        
        this.showNotification(`Role updated for ${user.name}`, 'success');
    }
    
    renderUsers() {
        this.elements.usersTableBody.innerHTML = this.users.map(user => {
            const roleClass = `role-${user.role}`;
            const canCreate = user.canCreateSessions ? '✅ Yes' : '❌ No';
            const addedDate = new Date(user.addedAt).toLocaleDateString();
            const accessCode = user.accessCode || (user.id === 'admin-001' ? 'System Admin' : 'Not Assigned');
            
            return `
                <tr class="border-b border-white/10">
                    <td class="py-3 px-4">
                        <div class="flex items-center">
                            <i class="fas fa-user mr-2"></i>
                            ${user.name}
                            ${user.id === this.currentUser?.id ? '<span class="ml-2 text-xs bg-blue-500 text-white px-2 py-1 rounded">You</span>' : ''}
                        </div>
                    </td>
                    <td class="py-3 px-4">${user.phone || '-'}</td>
                    <td class="py-3 px-4">
                        <span class="user-role-badge ${roleClass}">${user.role}</span>
                    </td>
                    <td class="py-3 px-4">
                        <div class="flex items-center">
                            <span class="font-mono text-xs bg-blue-500/20 px-2 py-1 rounded">${accessCode}</span>
                            ${user.accessCode ? `
                                <button onclick="volleyballAdmin.copyAccessCode('${user.accessCode}')" 
                                        class="ml-2 text-blue-400 hover:text-blue-300"
                                        title="Copy access code">
                                    <i class="fas fa-copy"></i>
                                </button>
                            ` : ''}
                        </div>
                    </td>
                    <td class="py-3 px-4">${canCreate}</td>
                    <td class="py-3 px-4">${addedDate}</td>
                    <td class="py-3 px-4 text-center">
                        ${user.id !== 'admin-001' && user.id !== this.currentUser?.id ? `
                            <select onchange="volleyballAdmin.changeUserRole('${user.id}', this.value)" 
                                    class="bg-white/20 border border-white/30 rounded px-2 py-1 text-sm">
                                <option value="user" ${user.role === 'user' ? 'selected' : ''}>User</option>
                                <option value="moderator" ${user.role === 'moderator' ? 'selected' : ''}>Moderator</option>
                                <option value="admin" ${user.role === 'admin' ? 'selected' : ''}>Admin</option>
                            </select>
                            <button onclick="volleyballAdmin.removeUser('${user.id}')" 
                                    class="ml-2 text-red-400 hover:text-red-300">
                                <i class="fas fa-trash"></i>
                            </button>
                        ` : '-'}
                    </td>
                </tr>
            `;
        }).join('');
    }
    
    createSession() {
        if (!this.canCreateSessions()) {
            this.showNotification('You do not have permission to create sessions', 'error');
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
        
        const sessionDateTime = new Date(session.dateTime);
        const now = new Date();
        const hoursUntilSession = (sessionDateTime - now) / (1000 * 60 * 60);
        
        if (hoursUntilSession < 24) {
            this.showNotification('Withdrawal is not permitted within 24 hours of the session', 'error');
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
            
            this.showNotification(
                `${removedPlayer.name} withdrew. ${nextPlayer.name} has been promoted from the waiting list!`,
                'success'
            );
        } else {
            this.showNotification('Successfully withdrawn from session', 'success');
        }
        
        this.saveSessions();
        this.renderSessions();
    }
    
    deleteSession(sessionId) {
        // Only admins can delete sessions
        if (this.currentUser.role !== 'admin') {
            this.showNotification('Only admins can delete sessions', 'error');
            return;
        }
        
        if (!confirm('Are you sure you want to delete this session?')) return;
        
        this.sessions = this.sessions.filter(s => s.id !== sessionId);
        this.saveSessions();
        this.renderSessions();
        this.showNotification('Session deleted successfully', 'success');
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
                            <p class="text-gray-300 text-sm">
                                <i class="fas fa-user mr-1"></i>
                                Created by ${session.createdBy}
                            </p>
                        </div>
                        ${this.currentUser.role === 'admin' ? `
                            <button onclick="volleyballAdmin.deleteSession('${session.id}')" 
                                    class="text-red-400 hover:text-red-300 transition">
                                <i class="fas fa-trash"></i>
                            </button>
                        ` : ''}
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
                                            <button onclick="volleyballAdmin.withdrawFromSession('${session.id}', '${player.id}')"
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
                                        <button onclick="volleyballAdmin.withdrawFromSession('${session.id}', '${player.id}')"
                                                class="text-red-400 hover:text-red-300 text-sm">
                                            <i class="fas fa-times"></i>
                                        </button>
                                    </div>
                                `).join('')}
                            </div>
                        </div>
                    ` : ''}
                    
                    ${!isPast ? `
                        <button onclick="volleyballAdmin.openJoinModal('${session.id}')"
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
    
    startCountdownTimer() {
        setInterval(() => {
            if (this.isLoggedIn) {
                this.renderSessions();
            }
        }, 60000); // Update every minute
    }
    
    loadRequests() {
        console.log('Loading access requests...');
        console.log('Requests table body:', this.elements.requestsTableBody);
        console.log('Request count element:', this.elements.requestCount);
        console.log('No requests message:', this.elements.noRequestsMessage);
        
        const requests = JSON.parse(localStorage.getItem('volleyball_requests') || '[]');
        console.log('Found requests:', requests);
        this.requests = requests;
        this.renderRequests();
    }
    
    renderRequests() {
        const requests = this.requests.filter(r => r.status === 'pending');
        
        if (requests.length === 0) {
            this.elements.requestsTableBody.innerHTML = '';
            this.elements.noRequestsMessage.style.display = 'block';
            this.elements.requestCount.textContent = '0';
            return;
        }
        
        this.elements.noRequestsMessage.style.display = 'none';
        this.elements.requestCount.textContent = requests.length;
        
        this.elements.requestsTableBody.innerHTML = requests.map(request => `
            <tr class="border-b border-white/10 hover:bg-white/5 transition">
                <td class="py-3 px-4">
                    <div class="font-medium">${request.name}</div>
                </td>
                <td class="py-3 px-4">${request.phone || 'Not provided'}</td>
                <td class="py-3 px-4">
                    <span class="px-2 py-1 bg-blue-500/20 text-blue-300 rounded-full text-sm">
                        ${request.reason}
                    </span>
                </td>
                <td class="py-3 px-4">
                    <div class="max-w-xs truncate" title="${request.message || 'No message'}">
                        ${request.message || 'No message'}
                    </div>
                </td>
                <td class="py-3 px-4">
                    <div class="text-sm text-gray-300">
                        ${new Date(request.requestedAt).toLocaleDateString()}
                    </div>
                </td>
                <td class="py-3 px-4">
                    <div class="flex gap-2 justify-center">
                        <button onclick="volleyballAdmin.approveRequest('${request.id}')" class="bg-green-500 hover:bg-green-600 px-3 py-1 text-white rounded text-sm transition">
                            <i class="fas fa-check mr-1"></i>Approve
                        </button>
                        <button onclick="volleyballAdmin.denyRequest('${request.id}')" class="bg-red-500 hover:bg-red-600 px-3 py-1 text-white rounded text-sm transition">
                            <i class="fas fa-times mr-1"></i>Deny
                        </button>
                    </div>
                </td>
            </tr>
        `).join('');
    }
    
    approveRequest(requestId) {
        const request = this.requests.find(r => r.id === requestId);
        if (!request) return;
        
        // Generate unique access code for the user
        const accessCode = this.generateAccessCode(request.name);
        
        // Create user account
        const newUser = {
            id: 'user-' + Date.now(),
            name: request.name,
            phone: request.phone || '',
            role: this.getRoleFromReason(request.reason),
            canCreateSessions: request.reason === 'creator' || request.reason === 'moderator',
            accessCode: accessCode,
            addedAt: new Date().toISOString(),
            addedBy: this.currentUser.name
        };
        
        // Add user to users list
        this.users.push(newUser);
        this.saveUsers();
        
        // Update request status
        request.status = 'approved';
        request.approvedAt = new Date().toISOString();
        request.accessCode = accessCode;
        this.saveRequests();
        
        // Refresh displays
        this.loadUsers();
        this.loadRequests();
        
        this.showNotification(`Access request approved for ${request.name}! User account created. Access code: ${accessCode}`, 'success');
    }
    
    denyRequest(requestId) {
        const requestIndex = this.requests.findIndex(r => r.id === requestId);
        if (requestIndex === -1) return;
        
        const request = this.requests[requestIndex];
        
        // Update request status
        request.status = 'denied';
        request.deniedAt = new Date().toISOString();
        this.saveRequests();
        
        // Refresh requests display
        this.loadRequests();
        
        this.showNotification(`Access request denied for ${request.name}.`, 'info');
    }
    
    copyAccessCode(accessCode) {
        navigator.clipboard.writeText(accessCode).then(() => {
            this.showNotification('Access code copied to clipboard!', 'success');
        }).catch(() => {
            // Fallback for older browsers
            const textArea = document.createElement('textarea');
            textArea.value = accessCode;
            document.body.appendChild(textArea);
            textArea.select();
            document.execCommand('copy');
            document.body.removeChild(textArea);
            this.showNotification('Access code copied to clipboard!', 'success');
        });
    }
    
    generateAccessCode(userName) {
        // Generate a unique 8-character access code based on username and timestamp
        const namePart = userName.substring(0, 3).toUpperCase();
        const randomPart = Math.random().toString(36).substring(2, 6).toUpperCase();
        const timestamp = Date.now().toString(36).substring(4, 6).toUpperCase();
        return `${namePart}${randomPart}${timestamp}`;
    }
    
    getRoleFromReason(reason) {
        switch (reason) {
            case 'creator':
                return 'admin';
            case 'moderator':
                return 'moderator';
            default:
                return 'user';
        }
    }
    
    saveRequests() {
        localStorage.setItem('volleyball_requests', JSON.stringify(this.requests));
    }
}

// Global functions for HTML onclick handlers
function openAddUserModal() {
    volleyballAdmin.openModal('addUserModal');
}

function closeModal(modalId) {
    volleyballAdmin.closeModal(modalId);
}

function logout() {
    volleyballAdmin.logout();
}

// Initialize the admin system
const volleyballAdmin = new VolleyballAdminSystem();
