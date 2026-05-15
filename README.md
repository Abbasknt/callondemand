# Call on Demand Platform (COD)

One platform for your wallet, food, laundry, logistics, and investments. Seamlessly integrated for the modern Nigerian lifestyle.

## 🚀 Production Deployment
The platform is synchronized with the following production endpoints:

- **Primary Domain**: [https://callondemandbiz.com](https://callondemandbiz.com)
- **Hosting URL**: [https://call-on-demand-79718192-79822.us-central1.hosted.app]

## 🛠 CLI Setup & Authorization (URGENT)
To resolve **Cloud Build Code 9** and **Secret Misconfiguration** errors, you must authorize your secrets via the Firebase CLI:

### 1. Update Firebase Tools
```bash
npm install -g firebase-tools@latest
firebase logout --all
firebase login --reauth
```

### 2. Grant Secret Access
Run these commands to authorize the production backend:
```bash
# Authorize Monnify Gateway Secret
firebase apphosting:secrets:grantaccess MONNIFY_SECRET_KEY --project call-on-demand-79718192-79822

# Authorize Google GenAI Secret
firebase apphosting:secrets:grantaccess GOOGLE_GENAI_API_KEY --project call-on-demand-79718192-79822

# Authorize Pinned API Key
firebase apphosting:secrets:grantaccess myApiKeySecret --project call-on-demand-79718192-79822
```

### 3. Horizontal Scaling (YAML)
Modify `apphosting.yaml` to adjust the infrastructure footprint:
- `maxInstances`: Set to `10` or more for high traffic.
- `memory`: Set to `2Gi` for heavy GenAI/Image processing.

---
© 2026 Call on Demand.com. A Future-Proof Lifestyle Partner.
