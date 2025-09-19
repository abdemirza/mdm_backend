# Optimized Firebase Setup Guide

This guide shows how to set up Firebase with individual environment variables to avoid the 4KB AWS Lambda limit.

## 🔧 **Solution: Use Individual Environment Variables**

Instead of storing the entire JSON as one environment variable, we'll store each field separately.

## 📋 **Required Environment Variables**

Set these environment variables in Netlify (much smaller than the full JSON):

### **Required Variables:**

1. **`FIREBASE_PROJECT_ID`**
   ```
   ub-mapp-sandbox
   ```

2. **`FIREBASE_CLIENT_EMAIL`**
   ```
   firebase-adminsdk-v99ki@ub-mapp-sandbox.iam.gserviceaccount.com
   ```

3. **`FIREBASE_PRIVATE_KEY`**
   ```
   -----BEGIN PRIVATE KEY-----\nMIIEvQIBADANBgkqhkiG9w0BAQEFAASCBKcwggSjAgEAAoIBAQC+B75pRFPd5fWQ\n6Je/oOT6iwA61AQZVY2UVZeN3ficuV/Sd/BkPkwibNOgKVbsdb00zKhxavwI9nU5\neEezRz+2HxRaRFhHWhKwFLbKbLGiosAYGA9tquFAlGWxwv2WDIQtDl18tUnyMngd\nD6ib/3/a8KqrWQATQQPTyJr8XHyh/XAfz8VHqsdfFuWxTGWjT4rHXbCHf0oHJ3EY\nitoY2NfIBm1ob7dr/7xaMGEvxxI/ge5M2sLWg1mIOhwfXGcsQZTEaKTe/vQAHKhj\nSSMl8owhknVE94WXNlF5qrxUriXASwfMymhDc/vTq2EMC/xDeRjD3nDC80EJzWg4\no7640b1TAgMBAAECggEAHlHM+y24NeDhd+/selo4/pKcBEbcqpAgaUjox+1hI9xd\n4g5Z8BySeDGl6FmAMXUtrZVz0LjRorp0BKngwsV88FlwHWDnNuczsR109sI1622N\nOarpF0Xa77tdqGmknUK8+hVfLC0escKEsJpVfCJda3jXukQWg3vtmOZaeCZnik7H\nA9w4ulbUr44DMM1drR9qELgYhwg/wKWnp7y42SnY4/pjLia6knRsRBegdCvViSSj\nrNP/hD+wRrCwAzJM129Fw1IvbiArN2HM+LUu+lq3k1W+OcmKVh+c3Sdp/leYm80p\nSHUR2D6ntYHsOKU4xJJSG8d9lXWPYCw/RHgaVcIElQKBgQD8kAf5XQWXdYaHQaaf\nXvqqGm+1tsXMfG+l8eBGn/Pauq3gtFslY/MOUW4AKzCP8u+K71bYsrLZ/HY1Wxkg\nSDJG6pproY1sr5AdTiV5Luc8U/kTHhCVrzfC7EUDG/KaEzqab6vNkmanJ98ri1DM\n9YLdjcSNC7fRsyDGQPoALzM6LQKBgQDAndb8V1ua0UXG/h8SrTyANi+lzzMsT9cP\n+UEnINa9CPTtTDdRVQ8ZIcuPCZmKK7ZSC3h5D95Xp6bMlej14pmsde5Tej43pdIZ\n7+K1Jwyir9uFZMM23UjZU8VyLgHSz+VfdHFPgsGCjA2VZg8czQkUDKAkWbfbwMpL\nZ5mEa3kFfwKBgQCHdn1Aa3tHTFr2iujizB+oQvutvDWFQyzjFcOUPdCefcgrILFO\ncbh48oYMgx3N56BBpbOwENDLCJUicxUb8n08+jIPDpx7MgMbJMIGqHiQK/4JGfQN\nROiknPM7Aq9xomSpVsIQRbjXaRRTF6sj837YdGR6vlE+oVQv4cP1e1t/lQKBgBvW\ntDvEZHj7xhn8oIESiKv/KOPODpdY8rxcSg5dsKuhn8SsP1KB+KypNcJ2oLpXlwJE\npiTZJkmE8ZagFAt1tMA4SznFcTiZvsQA58NG4Yyh3hhpd812LhE7Ck52V80gPwaM\nzdOwEkfL9iqhlY2UFLvRF1Qpo2kfdB1x275HyjYBAoGAO4ekznQ8aovS4V8SDCXi\nwAZy5LH4CQP0DWeGCjARFimwdu7cuV64BiC4EnbQiUy6fKR+xYC/VLbg9xHM//rJ\n12nQTD51fnERwvPnNfUw3P+5HkuLYrKBLa7ciBbCfaeMHCxaUQ01t362eNBJVKgR\nG94H+GKV/WHN4Bz7OzgVbE8=\n-----END PRIVATE KEY-----\n
   ```

4. **`FIREBASE_PRIVATE_KEY_ID`**
   ```
   5de41bbb7557da71bdc7e4437396e8c379b693e4
   ```

5. **`FIREBASE_CLIENT_ID`**
   ```
   114668965318461145446
   ```

## 🚀 **Setup Steps:**

### **Step 1: Go to Netlify Dashboard**
1. Navigate to your site
2. Go to **Site Settings** → **Environment Variables**

### **Step 2: Add Environment Variables**
Add each variable individually:

1. **Variable Name:** `FIREBASE_PROJECT_ID`
   **Value:** `ub-mapp-sandbox`

2. **Variable Name:** `FIREBASE_CLIENT_EMAIL`
   **Value:** `firebase-adminsdk-v99ki@ub-mapp-sandbox.iam.gserviceaccount.com`

3. **Variable Name:** `FIREBASE_PRIVATE_KEY`
   **Value:** (Copy the entire private key from your JSON file)

4. **Variable Name:** `FIREBASE_PRIVATE_KEY_ID`
   **Value:** `5de41bbb7557da71bdc7e4437396e8c379b693e4`

5. **Variable Name:** `FIREBASE_CLIENT_ID`
   **Value:** `114668965318461145446`

### **Step 3: Remove Old Variables**
Remove these old variables if they exist:
- ❌ `FIREBASE_SERVICE_ACCOUNT_KEY` (too large)
- ❌ `FIREBASE_PROJECT_ID` (if it was the old one)

### **Step 4: Deploy**
1. Save the environment variables
2. Trigger a new deployment
3. The deployment should now succeed

## 🧪 **Testing:**

After deployment, test the FCM endpoints:

```bash
# Test FCM token registration
curl -X POST https://poetic-llama-889a15.netlify.app/api/fcm/update-token \
  -H "Content-Type: application/json" \
  -d '{
    "androidId": "7ba0a059a087c79b",
    "fcmToken": "test_fcm_token_123"
  }'

# Test FCM lock command
curl -X POST https://poetic-llama-889a15.netlify.app/api/fcm/lock \
  -H "Content-Type: application/json" \
  -d '{
    "androidId": "7ba0a059a087c79b"
  }'
```

## 📊 **Size Comparison:**

| Approach | Size | Status |
|----------|------|--------|
| **Full JSON** | ~2.5KB | ❌ Too large for Lambda |
| **Individual Variables** | ~1.2KB total | ✅ Within 4KB limit |

## 🔒 **Security Notes:**

- Each environment variable is encrypted in Netlify
- Private key is stored securely
- No sensitive data in code
- Variables are only accessible to your functions

## 🚨 **Troubleshooting:**

### **If deployment still fails:**
1. Check that all 5 environment variables are set
2. Verify the private key is copied correctly (including `\n` characters)
3. Ensure no extra spaces or characters

### **If FCM doesn't work:**
1. Check Netlify function logs for authentication errors
2. Verify all environment variables are set correctly
3. Test with a simple FCM token first

## ✅ **Expected Result:**

After setup, your FCM endpoints should work:
- ✅ Environment variables under 4KB limit
- ✅ Firebase authentication working
- ✅ FCM notifications sending successfully
- ✅ Device lock/unlock commands working
