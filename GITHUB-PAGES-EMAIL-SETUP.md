# 📧 GitHub Pages Email Setup Guide

## 🎯 **Problem:**
- **Local**: mailto opens user's email client ✅
- **GitHub Pages**: mailto doesn't work ❌
- **Solution**: EmailJS for automatic email sending ✅

## 🔧 **EmailJS Setup for GitHub Pages:**

### **Step 1: Create EmailJS Account**
1. Go to https://www.emailjs.com/
2. Click **Sign Up** → **Free Plan**
3. Sign up with your email (xonevc@yahoo.com)
4. Verify your email address

### **Step 2: Create Email Service**
1. In EmailJS dashboard → **Email Services**
2. Click **Add New Service**
3. Choose **Gmail** (or your email provider)
4. Connect your xonevc@yahoo.com account
5. Click **Create Service**
6. **Copy the Service ID** (looks like: `service_xxxxxxx`)

### **Step 3: Create Email Template**
1. In EmailJS dashboard → **Email Templates**
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

4. Click **Save**
5. **Copy the Template ID** (looks like: `template_xxxxxxx`)

### **Step 4: Get Your User ID**
1. In EmailJS dashboard → **Account**
2. Copy your **Public Key** (looks like: `user_xxxxxxx`)

### **Step 5: Update Configuration**
Edit `volleyball-login.js` and replace these values:

```javascript
this.emailConfig = {
    enabled: true, // Change to true
    serviceId: 'service_123456789', // Your actual Service ID
    templateId: 'template_123456789', // Your actual Template ID
    userId: 'user_123456789', // Your actual User ID
    adminEmail: 'xonevc@yahoo.com'
};
```

### **Step 6: Initialize EmailJS**
Add this to the top of `volleyball-login.js`:

```javascript
// Initialize EmailJS
(function() {
    emailjs.init("user_123456789"); // Your actual User ID
})();
```

## 🚀 **Deploy to GitHub Pages:**

### **Before Upload:**
1. ✅ Update emailConfig with your actual IDs
2. ✅ Add EmailJS initialization
3. ✅ Set enabled: true

### **After Upload:**
1. ✅ Test access request form
2. ✅ Check xonevc@yahoo.com for emails
3. ✅ Verify automatic email sending

## 📱 **How It Works on GitHub Pages:**

1. **User submits request** → Form data collected
2. **EmailJS sends email** → Automatically to xonevc@yahoo.com
3. **Admin receives email** → With all request details
4. **No user interaction needed** → Fully automatic

## 🔍 **Testing:**

### **Local Testing:**
```javascript
// Test with console
console.log('EmailJS initialized:', typeof emailjs !== 'undefined');
```

### **GitHub Pages Testing:**
1. Deploy to GitHub Pages
2. Submit test request
3. Check email at xonevc@yahoo.com
4. Verify email content and timing

## 🎯 **Result:**
- **GitHub Pages**: Automatic emails to xonevc@yahoo.com ✅
- **No user email client needed** ✅
- **Professional appearance** ✅
- **Reliable delivery** ✅

## 📋 **Quick Checklist:**
- [ ] EmailJS account created
- [ ] Email service connected to xonevc@yahoo.com
- [ ] Email template created
- [ ] Service ID copied
- [ ] Template ID copied
- [ ] User ID copied
- [ ] Configuration updated
- [ ] Enabled set to true
- [ ] Deployed to GitHub Pages
- [ ] Tested successfully

Once configured, your GitHub Pages site will automatically send access request emails to xonevc@yahoo.com! 🎉
