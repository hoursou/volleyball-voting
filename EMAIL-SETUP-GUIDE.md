# 📧 Email Notification Setup Guide

## 🎯 **Goal: Send Access Request Emails to xonevc@yahoo.com**

I've implemented the email notification system structure. Here's how to activate it:

## 🔧 **Setup Steps:**

### **1. Create EmailJS Account**
1. Go to https://www.emailjs.com/
2. Sign up for a free account
3. Verify your email address

### **2. Create Email Service**
1. In EmailJS dashboard, click **Email Services**
2. Click **Add New Service**
3. Choose your email provider (Gmail, Outlook, etc.)
4. Connect your email account
5. Note the **Service ID**

### **3. Create Email Template**
1. In EmailJS dashboard, click **Email Templates**
2. Click **Create New Template**
3. Use this template:

```
Subject: New Volleyball Access Request

Hello Admin,

You have received a new access request for the Volleyball Voting System:

Request Details:
- Name: {{from_name}}
- Phone: {{from_phone}}
- Reason: {{request_reason}}
- Message: {{request_message}}
- Request Date: {{request_date}}
- Request ID: {{request_id}}

Please review this request in the admin panel and approve or deny access.

Best regards,
Volleyball Voting System
```

4. Note the **Template ID**

### **4. Get Your User ID**
1. In EmailJS dashboard, go to **Account**
2. Copy your **Public Key (User ID)**

### **5. Update the Configuration**
Edit `volleyball-login.js` and update these values:

```javascript
this.emailConfig = {
    enabled: true, // Change to true
    serviceId: 'your_actual_service_id',
    templateId: 'your_actual_template_id', 
    userId: 'your_actual_user_id',
    adminEmail: 'xonevc@yahoo.com'
};
```

## 📱 **Alternative: Simple Mailto Link**

If EmailJS seems complex, I can add a simple mailto link that opens the user's email client:

```javascript
// This opens the default email app with pre-filled content
window.location.href = `mailto:xonevc@yahoo.com?subject=Volleyball Access Request&body=${emailBody}`;
```

## 🔍 **Current Status:**

✅ **Email structure implemented**
✅ **Request data prepared**
✅ **Fallback to localStorage**
⏳ **EmailJS configuration needed**

## 🎯 **What Happens Now:**

1. **User submits request** → Stored in localStorage
2. **Email notification prepared** → Ready to send
3. **Once configured** → Emails sent to xonevc@yahoo.com
4. **Admin receives email** → Can review and approve

## 📋 **Testing:**

1. Submit a test request
2. Check browser console for logs
3. Verify localStorage has the request
4. Once EmailJS is configured, test email sending

The system is ready - just needs EmailJS configuration to start sending emails! 🎉
