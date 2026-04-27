// Initialize EmailJS (add your User ID here)
(function() {
    emailjs.init("hoursou"); // Your actual EmailJS User ID
})();

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
        
        // Add real-time user detection
        this.elements.userName.addEventListener('input', (e) => {
            this.detectUserRole(e.target.value.trim());
        });
        
        this.elements.accessCode.addEventListener('input', (e) => {
            this.validateAccessCode(e.target.value.trim());
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
        
        // For GitHub Pages deployment, configure EmailJS
        this.emailConfig = {
            enabled: true, // Set to true when EmailJS is configured
            serviceId: 'service_e82cvej', // Replace with your EmailJS Service ID
            templateId: 'template_8zq56qo', // Replace with your EmailJS Template ID
            userId: 'hoursou', // Replace with your EmailJS User ID
            adminEmail: 'hoursou@gmail.com'
        };
    }
    
    async sendRequestEmail(request) {
        console.log('Starting email send process...');
        console.log('EmailJS available:', typeof emailjs !== 'undefined');
        console.log('Email config enabled:', this.emailConfig.enabled);
        
        // For GitHub Pages, try EmailJS first (automatic)
        if (this.emailConfig.enabled && typeof emailjs !== 'undefined') {
            try {
                console.log('Attempting EmailJS send...');
                console.log('Service ID:', this.emailConfig.serviceId);
                console.log('Template ID:', this.emailConfig.templateId);
                console.log('User ID:', this.emailConfig.userId);
                
                // Gmail EmailJS template parameters - standard format
                const templateParams = {
                    from_name: request.name,
                    to_name: "Admin",
                    from_email: "noreply@volleyball.com",
                    to_email: this.emailConfig.adminEmail,
                    subject: "New Volleyball Access Request",
                    message: `New access request from ${request.name}\n\nPhone: ${request.phone || 'Not provided'}\nReason: ${request.reason}\nMessage: ${request.message || 'No additional message'}\nDate: ${new Date(request.requestedAt).toLocaleString()}\nRequest ID: ${request.id}`,
                    reply_to: this.emailConfig.adminEmail
                };
                
                console.log('Template params:', templateParams);
                
                // Send email using EmailJS
                const response = await emailjs.send(
                    this.emailConfig.serviceId, 
                    this.emailConfig.templateId, 
                    templateParams, 
                    this.emailConfig.userId
                );
                
                console.log('Email sent successfully:', response);
                this.showNotification('Request submitted! Admin has been notified via email.', 'success');
                return;
                
            } catch (error) {
                console.error('EmailJS send failed:', error);
                console.error('Error details:', error.message);
                this.showNotification('Request submitted! (Email notification failed, trying fallback...)', 'warning');
            }
        } else {
            console.log('EmailJS not available or not enabled');
        }
        
        // Fallback to mailto (for local testing)
        console.log('Trying mailto fallback...');
        const mailtoResult = this.sendMailtoEmail(request);
        
        if (mailtoResult) {
            this.showNotification('Request submitted! Opening email to notify admin...', 'success');
            return;
        }
        
        // Final fallback
        console.log('Using final fallback - local storage only');
        this.showNotification('Request submitted! Admin will review locally.', 'success');
    }
    
    sendMailtoEmail(request) {
        try {
            const subject = encodeURIComponent('New Volleyball Access Request');
            const body = encodeURIComponent(
                `Hello Admin,

You have received a new access request for the Volleyball Voting System:

Request Details:
- Name: ${request.name}
- Phone: ${request.phone || 'Not provided'}
- Reason: ${request.reason}
- Message: ${request.message || 'No additional message'}
- Request Date: ${new Date(request.requestedAt).toLocaleString()}
- Request ID: ${request.id}

Please review this request in the admin panel and approve or deny access.

Best regards,
Volleyball Voting System`
            );
            
            const mailtoUrl = `mailto:${this.emailConfig.adminEmail}?subject=${subject}&body=${body}`;
            
            // Open email client
            window.location.href = mailtoUrl;
            
            return true; // Success
        } catch (error) {
            console.error('Mailto failed:', error);
            return false; // Failed
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
        
        // First check if user has individual access code
        if (user.accessCode && user.accessCode === accessCode) {
            // Successful login with individual access code
            this.loginSuccess(user);
            return;
        }
        
        // Fallback to hardcoded admin codes for system admin
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
        
        // Successful login with hardcoded access code
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
        
        // Add admin parameter only for admin users using system codes
        let finalUrl = targetPage;
        
        // Check if user is admin and using a hardcoded system code
        const isSystemAdminCode = (user.role === 'admin' || user.role === 'moderator') && 
                                !user.accessCode;
        
        if (isSystemAdminCode) {
            finalUrl = `${targetPage}?admin=${encodeURIComponent(this.elements.accessCode.value)}`;
        }
        
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
    
    detectUserRole(userName) {
        const userInfo = document.getElementById('userInfo');
        const roleIndicator = document.getElementById('roleIndicator');
        
        if (!userName) {
            if (userInfo) userInfo.style.display = 'none';
            if (roleIndicator) roleIndicator.className = '';
            return;
        }
        
        const user = this.users.find(u => 
            u.name.toLowerCase() === userName.toLowerCase()
        );
        
        if (user) {
            // User found - display role information
            if (userInfo) {
                userInfo.style.display = 'block';
                userInfo.innerHTML = `
                    <div class="flex items-center justify-between p-3 bg-green-50 border border-green-200 rounded-lg">
                        <div class="flex items-center">
                            <i class="fas fa-user-check text-green-600 mr-2"></i>
                            <span class="text-green-800 font-medium">${user.name}</span>
                        </div>
                        <span class="px-2 py-1 bg-${this.getRoleColor(user.role)}-100 text-${this.getRoleColor(user.role)}-800 text-xs font-medium rounded-full">
                            ${user.role.toUpperCase()}
                        </span>
                    </div>
                `;
            }
            
            if (roleIndicator) {
                roleIndicator.className = `border-l-4 border-${this.getRoleColor(user.role)}-500 bg-${this.getRoleColor(user.role)}-50`;
            }
            
            this.showNotification(`User found: ${user.name} (${user.role})`, 'info');
        } else {
            // User not found
            if (userInfo) {
                userInfo.style.display = 'block';
                userInfo.innerHTML = `
                    <div class="flex items-center p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                        <i class="fas fa-user-slash text-yellow-600 mr-2"></i>
                        <span class="text-yellow-800">User not found. Please request access first.</span>
                    </div>
                `;
            }
            
            if (roleIndicator) {
                roleIndicator.className = 'border-l-4 border-yellow-500 bg-yellow-50';
            }
        }
    }
    
    validateAccessCode(accessCode) {
        const codeIndicator = document.getElementById('codeIndicator');
        
        if (!accessCode) {
            if (codeIndicator) codeIndicator.style.display = 'none';
            return;
        }
        
        const userName = this.elements.userName.value.trim();
        if (!userName) {
            if (codeIndicator) codeIndicator.style.display = 'none';
            return;
        }
        
        const user = this.users.find(u => 
            u.name.toLowerCase() === userName.toLowerCase()
        );
        
        if (user) {
            if (user.accessCode && user.accessCode === accessCode) {
                // Correct individual access code
                if (codeIndicator) {
                    codeIndicator.style.display = 'block';
                    codeIndicator.className = 'mt-2 p-2 bg-green-50 border border-green-200 rounded text-green-800 text-sm';
                    codeIndicator.innerHTML = '<i class="fas fa-check-circle mr-1"></i> Access code verified!';
                }
            } else {
                // Check hardcoded codes
                const validCodes = {
                    'volleyball2024': 'admin',
                    'admin123': 'admin',
                    'moderator2024': 'moderator'
                };
                
                if (validCodes[accessCode]) {
                    if (codeIndicator) {
                        codeIndicator.style.display = 'block';
                        codeIndicator.className = 'mt-2 p-2 bg-blue-50 border border-blue-200 rounded text-blue-800 text-sm';
                        codeIndicator.innerHTML = '<i class="fas fa-shield-alt mr-1"></i> System access code detected';
                    }
                } else {
                    if (codeIndicator) {
                        codeIndicator.style.display = 'block';
                        codeIndicator.className = 'mt-2 p-2 bg-red-50 border border-red-200 rounded text-red-800 text-sm';
                        codeIndicator.innerHTML = '<i class="fas fa-times-circle mr-1"></i> Invalid access code';
                    }
                }
            }
        }
    }
    
    getRoleColor(role) {
        switch (role) {
            case 'admin': return 'purple';
            case 'moderator': return 'blue';
            default: return 'gray';
        }
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
