# Google OAuth Setup Guide

This guide explains how to set up Google OAuth authentication for DojoFlow Kiosk.

## Overview

DojoFlow Kiosk uses Google OAuth 2.0 for secure gym owner authentication. Users sign in with their Google accounts instead of creating separate passwords.

## Prerequisites

- A Google account
- Access to [Google Cloud Console](https://console.cloud.google.com/)

## Step-by-Step Setup

### 1. Create a Google Cloud Project

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Click the project dropdown at the top of the page
3. Click **New Project**
4. Enter your project name (e.g., "DojoFlow Kiosk")
5. Click **Create**

### 2. Enable Google+ API

1. In your project, go to **APIs & Services** → **Library**
2. Search for "Google+ API" or "Google Identity"
3. Click on it and press **Enable**

### 3. Configure OAuth Consent Screen

1. Go to **APIs & Services** → **OAuth consent screen**
2. Select **External** user type (unless you have a Google Workspace)
3. Click **Create**
4. Fill in the required fields:
   - **App name**: DojoFlow Kiosk
   - **User support email**: Your email
   - **Developer contact email**: Your email
5. Click **Save and Continue**
6. Skip the Scopes section (click **Save and Continue**)
7. Add test users if needed (optional during development)
8. Click **Save and Continue**

### 4. Create OAuth 2.0 Credentials

1. Go to **APIs & Services** → **Credentials**
2. Click **Create Credentials** → **OAuth 2.0 Client ID**
3. Select **Web application** as the application type
4. Enter a name (e.g., "DojoFlow Web Client")
5. Add **Authorized redirect URIs**:
   - For development: `https://3000-irsc894q9xht7gijx14lw-a8283e50.manusvm.computer/api/auth/google/callback`
   - For production: `https://your-domain.com/api/auth/google/callback`
6. Click **Create**
7. Copy the **Client ID** and **Client Secret** (you'll need these)

### 5. Add Credentials to DojoFlow

The credentials have already been configured in your DojoFlow environment:
- `GOOGLE_CLIENT_ID`: Your Google OAuth Client ID
- `GOOGLE_CLIENT_SECRET`: Your Google OAuth Client Secret
- `SESSION_SECRET`: Random string for session encryption

## How It Works

### Authentication Flow

1. User clicks "Continue with Google" on the login page
2. User is redirected to Google's OAuth consent screen
3. User signs in with their Google account and grants permissions
4. Google redirects back to DojoFlow with an authorization code
5. DojoFlow exchanges the code for user profile information
6. DojoFlow creates or updates the user account in the database
7. User is logged in and redirected to the dashboard

### User Data Stored

When a user signs in with Google, DojoFlow stores:
- **Email**: From Google profile
- **Name**: From Google profile
- **Provider**: "google"
- **Provider ID**: Google's unique user ID
- **Role**: "owner" (default for gym owners)

### Security Features

- **Session-based authentication**: Secure HTTP-only cookies
- **HTTPS only**: OAuth callbacks require HTTPS in production
- **No password storage**: Google handles authentication
- **Automatic account linking**: If a user exists with the same email, their account is updated with Google provider info

## Testing the Integration

### Development Testing

1. Go to the login page: https://3000-irsc894q9xht7gijx14lw-a8283e50.manusvm.computer/login
2. Click "Continue with Google"
3. Sign in with a Google account
4. Grant permissions when prompted
5. You should be redirected to the dashboard

### Production Deployment

Before deploying to production:

1. Update the **Authorized redirect URIs** in Google Cloud Console:
   - Remove the development URL
   - Add your production URL: `https://your-domain.com/api/auth/google/callback`

2. Update the OAuth consent screen to **Published** status:
   - Go to **OAuth consent screen**
   - Click **Publish App**
   - Submit for verification if needed (for apps with >100 users)

## Troubleshooting

### "redirect_uri_mismatch" Error

**Problem**: The redirect URI doesn't match what's configured in Google Cloud Console.

**Solution**: 
1. Check the exact URL in the error message
2. Add that exact URL to **Authorized redirect URIs** in Google Cloud Console
3. Make sure there are no trailing slashes or typos

### "Access blocked: This app's request is invalid"

**Problem**: The OAuth consent screen is not properly configured.

**Solution**:
1. Go to **OAuth consent screen** in Google Cloud Console
2. Make sure all required fields are filled
3. Add your email as a test user during development

### User Not Redirected After Login

**Problem**: Session or redirect configuration issue.

**Solution**:
1. Check that `SESSION_SECRET` is set
2. Verify that cookies are enabled in the browser
3. Check browser console for errors

## Support

For additional help:
- Google OAuth Documentation: https://developers.google.com/identity/protocols/oauth2
- DojoFlow Support: Contact your system administrator

## Security Best Practices

1. **Keep credentials secret**: Never commit `GOOGLE_CLIENT_SECRET` to version control
2. **Use HTTPS in production**: OAuth requires secure connections
3. **Rotate secrets regularly**: Update credentials periodically
4. **Monitor OAuth usage**: Check Google Cloud Console for unusual activity
5. **Limit redirect URIs**: Only add necessary callback URLs

---

**Last Updated**: November 29, 2025
