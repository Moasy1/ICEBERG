# Meta Pixel & Conversions API (CAPI) Integration & Setup Guide

This website is fully pre-configured and 100% ready for **Meta Pixel (Client-Side)** and **Meta Conversions API (Server-Side)**.

---

## 🚀 Post-Deployment Activation Steps (3 Minutes)

Once you deploy your website to production (Vercel, Hostinger, AWS, etc.), follow these simple steps to activate tracking:

### Step 1: Retrieve your Meta Pixel ID & Access Token
1. Go to **[Meta Business Manager / Events Manager](https://business.facebook.com/events_manager2)**.
2. Select your Data Source (Meta Pixel).
3. Copy your **Pixel ID** (found under the Data Source name or Settings).
4. Go to **Settings** -> Scroll down to **Conversions API**.
5. Click **"Generate Access Token"** under *Set up direct integration*.
6. Copy the generated Access Token string.

### Step 2: Set Environment Variables
Add the following variables to your server environment settings (e.g., Vercel Environment Variables, Hostinger Node.js Environment, or `.env` file):

```env
META_PIXEL_ID=1234567890123456
META_ACCESS_TOKEN=EAAG...your_generated_access_token...
```

*Note: No code changes or redeployments are required. The server and client scripts automatically detect these environment variables.*

---

## 🧪 Testing & Verification

### Step 1: Check System Status Endpoint
In your browser or terminal, visit:
```http
GET /api/meta/status
```
**Response:**
```json
{
  "success": true,
  "data": {
    "configured": true,
    "pixelIdSet": true,
    "pixelIdPreview": "1234***",
    "accessTokenSet": true,
    "testEventCodeSet": false,
    "apiVersion": "v18.0"
  }
}
```

### Step 2: Use Meta Test Events Tool
1. In Meta Events Manager, click on **Test Events**.
2. Copy your **Test Event Code** (e.g., `TEST12345`).
3. Add it to your server environment variables:
   ```env
   META_TEST_EVENT_CODE=TEST12345
   ```
4. Perform an action on the site (such as submitting a consultation request or appointment form).
5. Watch the events appear in real-time under Meta Events Manager **Test Events** tab.
6. Once verified, remove `META_TEST_EVENT_CODE` from your environment.

---

## ⚙️ How Architecture Works Under the Hood

```
                                  +-----------------------+
                                  |   Visitor Browser     |
                                  +-----------+-----------+
                                              |
                        +---------------------+---------------------+
                        |                                           |
                        v                                           v
             Client Meta Pixel                             Server Meta CAPI
         (fbq('track', event, ...,                     (fetch('/api/meta/event')
           { eventID: ID }))                            + contact route CAPI)
                        |                                           |
                        v                                           v
           https://connect.facebook.net                 https://graph.facebook.com
                        \                                           /
                         +--------------------+--------------------+
                                              |
                                              v
                                   Meta Events Manager
                               (Event Deduplication via eventID)
```

### Key Features Included:

1. **Dual Tracking & Event Deduplication**:
   - Every event generates a unique `eventId` (e.g. `meta_evt_1712345...`).
   - The same `eventId` is sent via client-side `fbq` AND server-side CAPI.
   - Meta automatically deduplicates the pair, giving you 100% conversion tracking accuracy even if ad blockers block the browser pixel.

2. **Advanced Matching with SHA-256 Hashing**:
   - User identity attributes (`email`, `phone`, `first name`, `last name`) are normalized and hashed using **SHA-256** prior to sending to Meta's Graph API per privacy requirements.

3. **Automatic Cookie Management (`_fbc` & `_fbp`)**:
   - Captures `fbclid` from incoming URL parameters and sets `_fbc` cookie.
   - Manages `_fbp` browser identifier cookie.
   - Automatically forwards `_fbc`, `_fbp`, Client IP, and User-Agent to CAPI.

4. **Pre-configured Standard Events**:
   - **`PageView`**: Fired automatically on page load across all pages.
   - **`Schedule`**: Fired when visitors submit the Setup Wizard appointment form.
   - **`Lead`**: Fired when visitors submit consultation requests or birthday bundle claim forms.
   - **`Contact`**: Fired when visitors submit general contact forms.

5. **Security & CSP Ready**:
   - Express `helmet` Content Security Policy includes `connect.facebook.net`, `www.facebook.com`, and `graph.facebook.com`.
