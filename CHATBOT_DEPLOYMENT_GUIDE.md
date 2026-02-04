# DojoFlow Lead Capture Chatbot - Deployment Guide

## Overview

The DojoFlow Lead Capture Chatbot (Kai) is a public-facing AI assistant that helps martial arts schools capture leads through conversational interactions. This guide provides everything you need to deploy the chatbot on multiple platforms.

---

## 🔗 Public Chatbot URL

**Your Chatbot URL:**
```
https://dojoflow-2awpr243.manus.space/lead-capture?org=120001
```

Replace `120001` with your organization ID to customize for different schools.

---

## 📱 Deployment Options

### 1. **Direct Link (Simplest)**

Share the chatbot URL directly with prospects via:
- Email campaigns
- SMS messages
- Social media posts
- QR codes
- Business cards

**Example QR Code Generation:**
Use any QR code generator (like qr-code-generator.com) with your chatbot URL.

---

### 2. **Website Embed (Iframe)**

Embed the chatbot directly into your website using an iframe.

#### **Full Page Embed**
```html
<!DOCTYPE html>
<html>
<head>
    <title>Chat with Kai - Your Virtual Assistant</title>
    <style>
        body, html {
            margin: 0;
            padding: 0;
            height: 100%;
            overflow: hidden;
        }
        iframe {
            width: 100%;
            height: 100vh;
            border: none;
        }
    </style>
</head>
<body>
    <iframe 
        src="https://dojoflow-2awpr243.manus.space/lead-capture?org=120001"
        allow="microphone"
        title="DojoFlow Lead Capture Chat">
    </iframe>
</body>
</html>
```

#### **Floating Chat Widget (Bottom Right)**
```html
<!-- Add this code before closing </body> tag -->
<style>
    #kai-chat-widget {
        position: fixed;
        bottom: 20px;
        right: 20px;
        width: 400px;
        height: 600px;
        border: none;
        border-radius: 16px;
        box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
        z-index: 9999;
        display: none;
    }
    
    #kai-chat-widget.open {
        display: block;
    }
    
    #kai-chat-button {
        position: fixed;
        bottom: 20px;
        right: 20px;
        width: 60px;
        height: 60px;
        border-radius: 50%;
        background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%);
        border: none;
        cursor: pointer;
        box-shadow: 0 4px 16px rgba(59, 130, 246, 0.4);
        z-index: 9998;
        display: flex;
        align-items: center;
        justify-content: center;
        transition: transform 0.2s;
    }
    
    #kai-chat-button:hover {
        transform: scale(1.1);
    }
    
    #kai-chat-button.hidden {
        display: none;
    }
    
    #kai-chat-button svg {
        width: 28px;
        height: 28px;
        fill: white;
    }
    
    @media (max-width: 768px) {
        #kai-chat-widget {
            width: 100%;
            height: 100%;
            bottom: 0;
            right: 0;
            border-radius: 0;
        }
    }
</style>

<button id="kai-chat-button" onclick="toggleKaiChat()">
    <svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
        <path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm0 14H6l-2 2V4h16v12z"/>
    </svg>
</button>

<iframe 
    id="kai-chat-widget"
    src="https://dojoflow-2awpr243.manus.space/lead-capture?org=120001"
    allow="microphone"
    title="DojoFlow Lead Capture Chat">
</iframe>

<script>
    function toggleKaiChat() {
        const widget = document.getElementById('kai-chat-widget');
        const button = document.getElementById('kai-chat-button');
        
        if (widget.classList.contains('open')) {
            widget.classList.remove('open');
            button.classList.remove('hidden');
        } else {
            widget.classList.add('open');
            button.classList.add('hidden');
        }
    }
</script>
```

---

### 3. **WordPress Integration**

#### **Method A: Using HTML Block**
1. Edit your page in WordPress
2. Add a "Custom HTML" block
3. Paste the iframe code above
4. Publish

#### **Method B: Using Shortcode**
Add this to your theme's `functions.php`:

```php
function dojoflow_chatbot_shortcode($atts) {
    $atts = shortcode_atts(array(
        'org' => '120001',
        'height' => '600px'
    ), $atts);
    
    return '<iframe 
        src="https://dojoflow-2awpr243.manus.space/lead-capture?org=' . esc_attr($atts['org']) . '"
        style="width: 100%; height: ' . esc_attr($atts['height']) . '; border: none; border-radius: 8px;"
        allow="microphone"
        title="DojoFlow Lead Capture Chat">
    </iframe>';
}
add_shortcode('dojoflow_chat', 'dojoflow_chatbot_shortcode');
```

Then use in any page: `[dojoflow_chat org="120001" height="700px"]`

---

### 4. **Wix Integration**

1. Click **Add** (+) button on your page
2. Select **Embed** → **Embed a Widget**
3. Choose **Website**
4. Paste your chatbot URL
5. Adjust size and positioning
6. Click **Apply**

---

### 5. **Squarespace Integration**

1. Edit your page
2. Click **Add Block** → **Code**
3. Paste the iframe embed code
4. Save and publish

---

### 6. **Facebook Page Integration**

1. Go to your Facebook Page
2. Click **Add a Button**
3. Select **Send Message** or **Contact Us**
4. Choose **Website**
5. Enter your chatbot URL
6. Save

---

### 7. **Instagram Bio Link**

Add the chatbot URL to your Instagram bio or use link-in-bio tools like:
- Linktree
- Beacons
- Tap.bio

---

### 8. **Google My Business**

1. Log into Google My Business
2. Go to **Info** section
3. Add chatbot URL as your **Website**
4. Or add as a **Service** with the link

---

### 9. **Email Signature**

Add a clickable link to your email signature:

```html
<a href="https://dojoflow-2awpr243.manus.space/lead-capture?org=120001" 
   style="background: #3b82f6; color: white; padding: 8px 16px; text-decoration: none; border-radius: 6px; display: inline-block;">
   💬 Chat with Kai
</a>
```

---

### 10. **SMS/Text Message Campaigns**

Use URL shorteners for cleaner links:
- Bitly: `bit.ly/your-dojo-chat`
- TinyURL: `tinyurl.com/dojo-kai`

Example SMS:
```
Hi! Want to learn more about our martial arts programs? 
Chat with Kai, our virtual assistant: https://bit.ly/dojo-kai
```

---

## 🎨 Customization Options

### URL Parameters

Customize the chatbot behavior with URL parameters:

```
https://dojoflow-2awpr243.manus.space/lead-capture?org=120001&location=1
```

**Available Parameters:**
- `org` (required) - Your organization ID
- `location` (optional) - Specific location ID for multi-location schools

---

## 📊 Tracking & Analytics

### Google Analytics Integration

Add tracking to monitor chatbot usage:

```html
<script>
    // Track when chatbot is opened
    function toggleKaiChat() {
        const widget = document.getElementById('kai-chat-widget');
        if (!widget.classList.contains('open')) {
            // Send event to Google Analytics
            if (typeof gtag !== 'undefined') {
                gtag('event', 'chatbot_opened', {
                    'event_category': 'engagement',
                    'event_label': 'kai_chat'
                });
            }
        }
        // ... rest of toggle code
    }
</script>
```

---

## 🔒 Security & Privacy

The chatbot:
- ✅ Does not require authentication
- ✅ Is publicly accessible
- ✅ Collects only information provided by users
- ✅ Uses secure HTTPS connection
- ✅ Complies with data protection standards

---

## 📱 Mobile Optimization

The chatbot is fully responsive and works on:
- iOS (Safari, Chrome)
- Android (Chrome, Firefox, Samsung Internet)
- Tablets
- Desktop browsers

---

## 🆘 Support & Troubleshooting

### Common Issues

**Issue: Chatbot not loading**
- Check your internet connection
- Verify the organization ID is correct
- Clear browser cache

**Issue: Microphone not working**
- Ensure browser has microphone permissions
- Check that `allow="microphone"` is in iframe code
- HTTPS is required for microphone access

**Issue: Chatbot not displaying on mobile**
- Add responsive CSS (see floating widget example)
- Test on actual devices, not just browser dev tools

---

## 📞 Contact

For technical support or questions about deployment:
- Email: support@dojoflow.com
- Documentation: https://docs.dojoflow.com

---

## 🚀 Quick Start Checklist

- [ ] Get your organization ID (120001)
- [ ] Test the direct chatbot URL
- [ ] Choose deployment method(s)
- [ ] Copy and customize embed code
- [ ] Add to your website/platform
- [ ] Test on mobile and desktop
- [ ] Set up analytics tracking
- [ ] Share with your team
- [ ] Promote to prospects

---

**Last Updated:** February 4, 2026
**Version:** 1.0
