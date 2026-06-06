# HeartLink iOS Mobile App Setup & Configuration Guide

This guide describes how to compile the native iOS app wrapper and configure APNs remote/local notifications, background scheduler heartbeat, and Home Screen widgets.

---

## 📱 iOS Client Setup (SwiftUI)

Since Apple development requires **macOS** and **Xcode**, follow these steps on your Mac:

### 1. Create Xcode Project
1. Open **Xcode** and select **File → New → Project...**
2. Choose **iOS → App** and click Next.
3. Fill in the project details:
   - **Product Name:** `HeartLink`
   - **Organization Identifier:** `com.yourname` (makes the Bundle Identifier `com.yourname.heartlink`)
   - **Interface:** `SwiftUI`
   - **Language:** `Swift`
4. Choose a location to save the project (e.g., in your home directory or cloned repo).

### 2. Import Sources
Copy the files from the `ios/HeartLink` directory in this workspace to your Xcode project folder, replacing/adding them in the Xcode File Navigator:
- [HeartLinkApp.swift](file:///c:/Users/Pratikshit/Downloads/heartlink/ios/HeartLink/HeartLinkApp.swift) (Replaces your standard `@main` app file)
- [ContentView.swift](file:///c:/Users/Pratikshit/Downloads/heartlink/ios/HeartLink/ContentView.swift) (Replaces standard `ContentView.swift`)
- [WebView.swift](file:///c:/Users/Pratikshit/Downloads/heartlink/ios/HeartLink/WebView.swift)
- [NotificationManager.swift](file:///c:/Users/Pratikshit/Downloads/heartlink/ios/HeartLink/NotificationManager.swift)
- [Info.plist](file:///c:/Users/Pratikshit/Downloads/heartlink/ios/HeartLink/Info.plist)
- [HeartLink.entitlements](file:///c:/Users/Pratikshit/Downloads/heartlink/ios/HeartLink/HeartLink.entitlements)

### 3. Add Home Screen Widget Extension
1. In Xcode, select **File → New → Target...**
2. Choose **iOS → Widget Extension** and click Next.
3. Set the Product Name to `HeartLinkWidget` and ensure **Include Live Activity** is unchecked. Click Finish.
4. Copy the following files into the `HeartLinkWidget` extension folder in Xcode:
   - [HeartLinkWidget.swift](file:///c:/Users/Pratikshit/Downloads/heartlink/ios/HeartLinkWidget/HeartLinkWidget.swift) (Replaces the generated widget code)
   - [HeartLinkWidgetBundle.swift](file:///c:/Users/Pratikshit/Downloads/heartlink/ios/HeartLinkWidget/HeartLinkWidgetBundle.swift)
   - [Info.plist](file:///c:/Users/Pratikshit/Downloads/heartlink/ios/HeartLinkWidget/Info.plist)

### 4. Enable Capabilities in Xcode
For both the **HeartLink** main app and **HeartLinkWidget** targets:
1. Go to the project settings by clicking the project root in the left pane.
2. Select the target (e.g. **HeartLink**), then go to **Signing & Capabilities**.
3. Click **+ Capability** and add:
   - **Push Notifications** (Main App only)
   - **Background Modes** (check **Remote notifications**) (Main App only)
   - **App Groups** (add group named `group.com.yourname.heartlink` to share settings)

---

## 🔔 APNs (Apple Push Notification service) Setup

To send real push notifications from your backend to the iOS device, you must configure Apple Push Notification certificates:

### 1. Generate APNs Auth Key (.p8)
1. Log into your account on the [Apple Developer Console](https://developer.apple.com/account/).
2. Navigate to **Certificates, Identifiers & Profiles → Keys**.
3. Click the **+** button to create a new key.
4. Set key name to `HeartLink APNs Key`, check **Apple Push Notifications service (APNs)**, and click Continue.
5. Download the `.p8` key file (e.g. `AuthKey_XXXXXXXXXX.p8`). Keep this file secure!
6. Copy the **Key ID** (10-character alphanumeric string) and your Apple Developer **Team ID** (visible in top-right of console).

### 2. Configure Backend Environment
Create or update your `.env` file in the backend root directory with these variables:
```bash
# APNs Token Configuration
APNS_KEY_ID=XXXXXXXXXX          # Your 10-character Key ID
APNS_TEAM_ID=YYYYYYYYYY         # Your 10-character Apple Developer Team ID
APNS_TOPIC=com.yourname.heartlink # Your iOS app Bundle Identifier

# Private Key (either specify path to the file, or inject the PEM string directly)
APNS_KEY_PATH=/absolute/path/to/AuthKey_XXXXXXXXXX.p8
# APNS_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nMIIEvgIBADANBgkqhkiG9w0BAQEFAASCBKgwggSkAgEAAoIBAQ..."
```

---

## 🔗 JavaScript WebView Bridge Details

The WebView injects a global variable so the React/Vite website can detect that it is loaded inside the iOS native app:
```javascript
if (window.isNativeIOSApp) {
  console.log("Loaded inside the HeartLink native iOS wrapper!");
}
```

### Exposing/Registering Push Device Tokens
1. The Swift app receives the APNs push token and runs `window.receiveDeviceToken('YOUR_HEX_TOKEN')` inside the WebView.
2. In your React frontend code, you can register a handler to save it:
```javascript
window.receiveDeviceToken = (token) => {
  // Call tRPC agent.registerDeviceToken to register it in the DB
  trpc.agent.registerDeviceToken.mutate({ deviceToken: token, deviceType: 'ios' });
};
```
3. Alternatively, the web app can request the token explicitly:
```javascript
window.webkit?.messageHandlers?.registerPushToken?.postMessage(null);
```

---

## 📅 Background Scheduler / Heartbeat Setup

We use the native Manus scheduler system for triggering notifications at user-defined times.

### 1. Registering the Heartbeat Cron (Manus Platform)
To register the global project-level periodic heartbeat, run this command in your developer terminal:
```bash
manus-heartbeat create \
  --name heartlink-periodic-heartbeat \
  --cron "0 */15 * * * *" \
  --path /api/scheduled/heartbeat \
  --description "Runs HeartLink notification and gesture scheduler every 15 minutes"
```
Once registered, the platform will securely make a POST request to `/api/scheduled/heartbeat` on your deployed server using a secure JWT cron signature, which is automatically authenticated by the backend.

---

## ☁️ Building in the Cloud (No Mac Required)

If you do not have a Mac, you can compile and build the iOS app wrapper using our pre-configured **GitHub Actions Workflow**:

1. **Push your code** to a GitHub Repository.
2. The workflow [.github/workflows/ios-build.yml](file:///c:/Users/Pratikshit/Downloads/heartlink/.github/workflows/ios-build.yml) will trigger automatically.
3. It uses a cloud macOS runner to generate the `.xcodeproj` file via **XcodeGen** (defined in [project.yml](file:///c:/Users/Pratikshit/Downloads/heartlink/ios/project.yml)) and compiles the codebase to verify it works 100%!
4. **Distributing to your iPhone:**
   - To build a signed `.ipa` file that you can install on a physical iPhone, you can configure your GitHub repository Secrets with your Apple developer credentials (`APPLE_DEVELOPER_PORTAL` provisioning profiles and distribution certificates).
   - Alternatively, you can use third-party cloud app builders (like **EAS Build** if migrating to Expo, or **Codemagic**) which connect to your Git repository and generate build artifacts directly in the cloud.

