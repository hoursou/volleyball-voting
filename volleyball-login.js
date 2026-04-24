class VolleyballLoginSystem {
    constructor() {
        this.users = this.loadUsers();
        this.initializeElements();
        this.bindEvents();
        this.checkRedirect();
        this.initializeEmailService();
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
    
    initializeEmailService() {
        // Initialize EmailJS (you'll need to set up an EmailJS account)
        // For demo purposes, this shows the structure
        // In production, replace with your actual EmailJS credentials
        
        // EmailJS configuration (you'll need to set this up)
        // 1. Sign up at https://www.emailjs.com/
        // 2. Create an email service
        // 3. Create an email template
        // 4. Get your User ID, Service ID, and Template ID
        
        // For now, we'll use a fallback method
        this.emailConfig = {
            enabled: false, // Set to true when EmailJS is configured
            serviceId: 'your_service_id',
            templateId: 'your_template_id', 
            userId: 'your_user_id',
            adminEmail: 'xonevc@yahoo.com'
        };
    }
    
    async sendRequestEmail(request) {
        if (!this.emailConfig.enabled) {
            console.log('Email service not configured. Request stored locally.');
            return this.showNotification('Request submitted! Admin will review locally.', 'success');
        }
        
        try {
            // This would send an email using EmailJS
            // You need to configure EmailJS first
            const templateParams = {
                to_email: this.emailConfig.adminEmail,
                from_name: request.name,
                from_phone: request.phone || 'Not provided',
                request_reason: request.reason,
                request_message: request.message || 'No additional message',
                request_date: new Date(request.requestedAt).toLocaleString(),
                request_id: request.id
            };
            
            // This would be the actual EmailJS send call
            // await emailjs.send(this.emailConfig.serviceId, this.emailConfig.templateId, templateParams, this.emailConfig.userId);
            
            this.showNotification('Request submitted! Admin has been notified via email.', 'success');
            
        } catch (error) {
            console.error('Email send failed:', error);
            this.showNotification('Request submitted! (Email notification failed, stored locally)', 'warning');
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
            // Use the redirect URL if provided
            targetPage = redirectUrl.startsWith('/') ? redirectUrl.substring(1) : redirectUrl;
        } else {
            // Default redirect based on user role
            targetPage = user.role === 'admin' ? 
                'volleyball-voting-admin.html' : 
                'volleyball-voting.html';
        }
        
        // Add admin parameter for seamless login
        const finalUrl = `${targetPage}?admin=${encodeURIComponent(this.elements.accessCode.value)}`;
        
        this.showNotification(`Welcome back, ${user.name}! Redirecting...`, 'success');
        
        setTimeout(() => {
            window.location.href = finalUrl;
        }, 1500);
    }
    
    selectUserType(type) {
        if (type === 'user') {
            // Redirect to regular voting as guest
            window.location.href = 'volleyball-voting.html';
        } else {
            // Show admin login
            this.showAdminLogin();
        }
    }
    
    showAdminLogin() {
        // Scroll to login form
        this.elements.loginForm.scrollIntoView({ behavior: 'smooth' });
        this.elements.accessCode.focus();
    }
    
    showRequestAccess() {
        document.getElementById('requestAccessModal').classList.remove('hidden');
        document.getElementById('requestAccessModal').classList.add('flex');
    }
    
    hideRequestAccess() {
        document.getElementById('requestAccessModal').classList.add('hidden');
        document.getElementById('requestAccessModal').classList.remove('flex');
    }
    
    async submitRequest() {
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
        
        // Send email notification to admin
        await this.sendRequestEmail(request);
        
        this.hideRequestAccess();
        this.elements.requestForm.reset();
    }
    
    showNotification(message, type = 'info') {
        const notification = document.createElement('div');
        const bgColor = type === 'success' ? 'bg-green-500' : 
                        type === 'error' ? 'bg-red-500' : 'bg-blue-500';
        
        notification.className = `fixed top-4 right-4 ${bgColor} text-white px-6 py-3 rounded-lg shadow-lg z-50 fade-in`;
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
}

// Global functions for HTML onclick handlers
function selectUserType(type) {
    loginSystem.selectUserType(type);
}

function showRequestAccess() {
    loginSystem.showRequestAccess();
}

function hideRequestAccess() {
    loginSystem.hideRequestAccess();
}

// Initialize login system
const loginSystem = new VolleyballLoginSystem();
