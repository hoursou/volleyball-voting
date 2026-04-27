class VolleyballMobileLoginSystem {
    constructor() {
        this.users = this.loadUsers();
        this.initializeElements();
        this.bindEvents();
        this.checkRedirect();
    }
    
    initializeElements() {
        this.elements = {
            loginForm: document.getElementById('loginForm'),
            userName: document.getElementById('userName'),
            accessCode: document.getElementById('accessCode'),
            requestForm: document.getElementById('requestForm'),
            requestName: document.getElementById('requestName'),
            requestPhone: document.getElementById('requestPhone'),
            requestReason: document.getElementById('requestReason'),
            requestMessage: document.getElementById('requestMessage')
        };
    }
    
    bindEvents() {
        this.elements.loginForm.addEventListener('submit', (e) => {
            e.preventDefault();
            this.login();
        });
        
        this.elements.requestForm.addEventListener('submit', (e) => {
            e.preventDefault();
            this.submitRequest();
        });
    }
    
    checkRedirect() {
        // Check if there's a redirect parameter
        const urlParams = new URLSearchParams(window.location.search);
        const redirectUrl = urlParams.get('redirect');
        
        if (redirectUrl) {
            // Show notification about redirect
            this.showNotification('Please login to continue to requested page', 'info');
        }
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
    
    saveUsers(users) {
        localStorage.setItem('volleyball_users', JSON.stringify(users));
    }
    
    login() {
        const userName = this.elements.userName.value.trim();
        const accessCode = this.elements.accessCode.value.trim();
        
        if (!userName || !accessCode) {
            this.showNotification('Please enter both name and access code', 'error');
            return;
        }
        
        // Check if user exists and code matches
        const user = this.users.find(u => 
            u.name.toLowerCase() === userName.toLowerCase()
        );
        
        if (!user) {
            this.showNotification('User not found. Please request access first.', 'error');
            return;
        }
        
        // Check access codes
        const validCodes = {
            'volleyball2024': 'admin',
            'admin123': 'admin',
            'moderator2024': 'moderator'
        };
        
        const userRole = validCodes[accessCode];
        if (!userRole) {
            this.showNotification('Invalid access code', 'error');
            return;
        }
        
        // Check if role matches user's role
        if ((userRole === 'admin' || userRole === 'moderator') && 
            (user.role !== 'admin' && user.role !== 'moderator')) {
            this.showNotification('Access code does not match your user role', 'error');
            return;
        }
        
        // Successful login
        this.loginSuccess(user);
    }
    
    loginSuccess(user) {
        // Save login session
        localStorage.setItem('volleyball_admin_login', JSON.stringify({
            userId: user.id,
            timestamp: new Date().getTime()
        }));
        
        // Check for redirect parameter
        const urlParams = new URLSearchParams(window.location.search);
        const redirectUrl = urlParams.get('redirect');
        
        // Redirect based on user role and redirect parameter
        let targetPage;
        if (redirectUrl && redirectUrl !== 'null' && redirectUrl !== '') {
            // Use redirect URL if provided
            targetPage = redirectUrl.startsWith('/') ? redirectUrl.substring(1) : redirectUrl;
        } else {
            // Default redirect based on user role
            targetPage = user.role === 'admin' ? 
                'volleyball-voting-admin.html' : 
                'volleyball-mobile.html';
        }
        
        // Add admin parameter for seamless login
        const finalUrl = `${targetPage}?admin=${encodeURIComponent(this.elements.accessCode.value)}`;
        
        this.showNotification(`Welcome back, ${user.name}! Redirecting...`, 'success');
        this.vibrate();
        
        setTimeout(() => {
            window.location.href = finalUrl;
        }, 1500);
    }
    
    continueAsGuest() {
        // Redirect to mobile voting as guest
        this.showNotification('Continuing as guest...', 'info');
        this.vibrate();
        
        setTimeout(() => {
            window.location.href = 'volleyball-mobile.html';
        }, 1000);
    }
    
    showAdminLogin() {
        // Scroll to login form
        this.elements.userName.scrollIntoView({ behavior: 'smooth' });
        this.elements.accessCode.focus();
        this.vibrate();
    }
    
    showRequestAccess() {
        document.getElementById('requestAccessModal').classList.add('show');
        this.vibrate();
    }
    
    hideRequestAccess() {
        document.getElementById('requestAccessModal').classList.remove('show');
        document.getElementById('requestAccessModal').classList.add('hidden');
        this.vibrate();
    }
    
    submitRequest() {
        const name = this.elements.requestName.value.trim();
        const phone = this.elements.requestPhone.value.trim();
        const reason = this.elements.requestReason.value;
        const message = this.elements.requestMessage.value.trim();
        
        if (!name || !reason) {
            this.showNotification('Please fill in required fields', 'error');
            return;
        }
        
        // Store request (in real app, this would send to admin)
        const request = {
            id: Date.now().toString(),
            name: name,
            phone: phone,
            reason: reason,
            message: message,
            status: 'pending',
            requestedAt: new Date().toISOString()
        };
        
        // Store requests in localStorage (for demo purposes)
        const requests = JSON.parse(localStorage.getItem('volleyball_requests') || '[]');
        requests.push(request);
        localStorage.setItem('volleyball_requests', JSON.stringify(requests));
        
        this.showNotification('Access request sent! Admin will review your request.', 'success');
        this.vibrate();
        this.hideRequestAccess();
        this.elements.requestForm.reset();
    }
    
    showNotification(message, type = 'info') {
        const notification = document.createElement('div');
        const bgColor = type === 'success' ? 'bg-green-500' : 
                        type === 'error' ? 'bg-red-500' : 'bg-blue-500';
        
        notification.className = `fixed top-4 right-4 left-4 ${bgColor} text-white px-4 py-3 rounded-lg shadow-lg z-50 fade-in`;
        notification.innerHTML = `
            <div class="flex items-center">
                <i class="fas fa-${type === 'success' ? 'check-circle' : 
                                   type === 'error' ? 'exclamation-circle' : 'info-circle'} mr-2"></i>
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
    
    vibrate() {
        if ('vibrate' in navigator) {
            navigator.vibrate(50);
        }
    }
}

// Global functions for HTML onclick handlers
function showRequestAccess() {
    mobileLoginSystem.showRequestAccess();
}

function hideRequestAccess() {
    mobileLoginSystem.hideRequestAccess();
}

function continueAsGuest() {
    mobileLoginSystem.continueAsGuest();
}

function showAdminLogin() {
    mobileLoginSystem.showAdminLogin();
}

// Initialize mobile login system
const mobileLoginSystem = new VolleyballMobileLoginSystem();
