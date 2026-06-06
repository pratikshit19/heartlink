# HeartLink - Next Steps for iOS Integration

Your HeartLink proactive AI relationship agent backend is complete! Here's how to build the iOS mobile experience.

## 📱 Architecture Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                     iOS App (SwiftUI)                           │
├─────────────────────────────────────────────────────────────────┤
│  - Home Screen Widgets (WidgetKit)                              │
│  - Push Notification Handler                                    │
│  - Local Notification Manager                                   │
│  - Device Token Registration                                    │
└──────────────────────┬──────────────────────────────────────────┘
                       │ HTTPS
                       ↓
┌─────────────────────────────────────────────────────────────────┐
│              HeartLink Backend (Node.js/Express)                │
├─────────────────────────────────────────────────────────────────┤
│  - tRPC API Endpoints                                           │
│  - Agent Logic Engine                                           │
│  - Push Notification Service                                    │
│  - Notification Scheduler                                       │
│  - MySQL Database                                               │
└─────────────────────────────────────────────────────────────────┘
```

## 🔧 Step 1: Set Up iOS Project

### 1.1 Create a new SwiftUI
```bash
# Create new iOS app project
File → New → Project → iOS → App
- Product Name: HeartLink
- Team ID: (your Apple Developer account)
- Bundle Identifier: com.yourname.heartlink
- Minimum Deployment: iOS 16.0
```

### 1.2 Install dependencies
Add these to your `Package.swift` or use CocoaPods:
```swift
// SwiftUI built-in (no additional packages needed for basic app)
// For HTTP requests:
// URLSession (built-in)

// Optional: Add these via SPM for better UX
- Alamofire (HTTP networking)
- SwiftyJSON (JSON parsing)
- KeychainSwift (secure token storage)
```

## 📲 Step 2: Implement Device Token Registration

### 2.1 Request User Permission for Notifications
```swift
import UserNotifications

// In AppDelegate or main app initialization
UNUserNotificationCenter.current().requestAuthorization(options: [.alert, .sound, .badge]) { granted, error in
    if granted {
        DispatchQueue.main.async {
            UIApplication.shared.registerForRemoteNotifications()
        }
    }
}
```

### 2.2 Capture Device Token
```swift
// In AppDelegate
func application(_ application: UIApplication, 
                 didFinishLaunchingWithOptions launchOptions: [UIApplication.LaunchOptionsKey: Any]?) -> Bool {
    UIApplication.shared.registerForRemoteNotifications()
    return true
}

func application(_ application: UIApplication, 
                 didRegisterForRemoteNotificationsWithDeviceToken deviceToken: Data) {
    let token = deviceToken.map { String(format: "%02.2hhx", $0) }.joined()
    print("Device Token: \(token)")
    
    // Send to backend
    registerDeviceToken(token: token, deviceType: "ios")
}
```

### 2.3 Send Token to Backend
```swift
func registerDeviceToken(token: String, deviceType: String) {
    let url = URL(string: "https://your-heartlink-domain.com/api/trpc/agent.registerDeviceToken")!
    var request = URLRequest(url: url)
    request.httpMethod = "POST"
    request.setValue("application/json", forHTTPHeaderField: "Content-Type")
    
    let body: [String: Any] = [
        "deviceToken": token,
        "deviceType": deviceType
    ]
    request.httpBody = try? JSONSerialization.data(withJSONObject: body)
    
    URLSession.shared.dataTask(with: request) { data, response, error in
        if let error = error {
            print("Error registering device token: \(error)")
        } else {
            print("Device token registered successfully")
        }
    }.resume()
}
```

## 🔔 Step 3: Handle Push Notifications

### 3.1 Implement Notification Delegate
```swift
import UserNotifications

class NotificationDelegate: NSObject, UNUserNotificationCenterDelegate {
    func userNotificationCenter(_ center: UNUserNotificationCenter,
                              willPresent notification: UNNotification,
                              withCompletionHandler completionHandler: @escaping (UNNotificationPresentationOptions) -> Void) {
        let userInfo = notification.request.content.userInfo
        
        // Handle notification while app is in foreground
        print("Notification received: \(userInfo)")
        
        // Show notification even if app is in foreground
        completionHandler([.banner, .sound, .badge])
    }
    
    func userNotificationCenter(_ center: UNUserNotificationCenter,
                              didReceive response: UNNotificationResponse,
                              withCompletionHandler completionHandler: @escaping () -> Void) {
        let userInfo = response.notification.request.content.userInfo
        let actionIdentifier = response.actionIdentifier
        
        // Handle user interaction with notification
        if actionIdentifier == "RESPOND_ACTION" {
            handleFollowUpResponse(userInfo: userInfo)
        } else if actionIdentifier == "LATER_ACTION" {
            handleRemindLater(userInfo: userInfo)
        }
        
        completionHandler()
    }
}
```

### 3.2 Set Up Notification Categories
```swift
func setupNotificationCategories() {
    // Follow-up category
    let respondAction = UNNotificationAction(identifier: "RESPOND_ACTION", 
                                            title: "Respond", 
                                            options: .foreground)
    let laterAction = UNNotificationAction(identifier: "LATER_ACTION", 
                                          title: "Later", 
                                          options: [])
    let followUpCategory = UNNotificationCategory(identifier: "FOLLOW_UP", 
                                                 actions: [respondAction, laterAction], 
                                                 intentIdentifiers: [], 
                                                 options: [])
    
    // Reminder category
    let doneAction = UNNotificationAction(identifier: "DONE_ACTION", 
                                         title: "Done", 
                                         options: [])
    let remindLaterAction = UNNotificationAction(identifier: "REMIND_LATER_ACTION", 
                                               title: "Remind Later", 
                                               options: [])
    let reminderCategory = UNNotificationCategory(identifier: "REMINDER", 
                                                 actions: [doneAction, remindLaterAction], 
                                                 intentIdentifiers: [], 
                                                 options: [])
    
    UNUserNotificationCenter.current().setNotificationCategories([followUpCategory, reminderCategory])
}
```

## 🏠 Step 4: Create Home Screen Widgets

### 4.1 Create Widget Target
```bash
File → New → Target → Widget Extension
- Product Name: HeartLinkWidget
- Bundle Identifier: com.yourname.heartlink.widget
```

### 4.2 Build Relationship Status Widget
```swift
import WidgetKit
import SwiftUI

struct HeartLinkWidgetEntryView: View {
    var entry: SimpleEntry
    
    var body: some View {
        VStack(alignment: .leading, spacing: 12) {
            HStack {
                Image(systemName: "heart.fill")
                    .foregroundColor(.red)
                Text("Relationship Health")
                    .font(.headline)
            }
            
            // Health score display
            HStack {
                Text("Score:")
                Spacer()
                Text("\(entry.healthScore)/10")
                    .font(.title2)
                    .fontWeight(.bold)
            }
            
            // Today's action
            VStack(alignment: .leading, spacing: 4) {
                Text("Today's Action:")
                    .font(.caption)
                    .foregroundColor(.gray)
                Text(entry.todayAction)
                    .font(.subheadline)
                    .lineLimit(2)
            }
            .padding(.top, 4)
        }
        .padding()
        .background(Color(.systemBackground))
    }
}

struct HeartLinkWidget: Widget {
    let kind: String = "HeartLinkWidget"
    
    var body: some WidgetConfiguration {
        StaticConfiguration(kind: kind, provider: Provider()) { entry in
            HeartLinkWidgetEntryView(entry: entry)
        }
        .configurationDisplayName("Relationship Status")
        .description("See your relationship health at a glance")
        .supportedFamilies([.systemSmall, .systemMedium])
    }
}
```

### 4.3 Fetch Data for Widget
```swift
struct Provider: TimelineProvider {
    func placeholder(in context: Context) -> SimpleEntry {
        SimpleEntry(date: Date(), healthScore: 8, todayAction: "Call her after lunch")
    }
    
    func getTimeline(in context: Context, completion: @escaping (Timeline<Entry>) -> ()) {
        // Fetch from backend API
        fetchHealthScore { healthScore, todayAction in
            let entry = SimpleEntry(date: Date(), healthScore: healthScore, todayAction: todayAction)
            let timeline = Timeline(entries: [entry], policy: .after(Date(timeIntervalSinceNow: 3600)))
            completion(timeline)
        }
    }
    
    func recommendations() -> [WidgetConfiguration] {
        // Return recommended widget configurations
        return []
    }
}

struct SimpleEntry: TimelineEntry {
    let date: Date
    let healthScore: Int
    let todayAction: String
}
```

## 🔐 Step 5: Set Up APNs (Apple Push Notification service)

### 5.1 Generate APNs Certificate
1. Go to [Apple Developer Console](https://developer.apple.com/account/resources/certificates/list)
2. Create a new Certificate → Apple Push Notification service (APNs)
3. Select your App ID (com.yourname.heartlink)
4. Download the certificate (.cer file)
5. Convert to .p8 key:
```bash
# Export private key from certificate
openssl pkcs12 -in Certificates.p12 -out key.pem -nodes -nocerts
```

### 5.2 Configure Backend for APNs
```javascript
// server/_core/apnsService.ts (create this file)
import apn from 'apn';

const apnsProvider = new apn.Provider({
  key: process.env.APNS_KEY_PATH,
  cert: process.env.APNS_CERT_PATH,
  production: process.env.NODE_ENV === 'production'
});

export async function sendPushNotification(deviceToken: string, payload: any) {
  const notification = new apn.Notification({
    alert: {
      title: payload.title,
      body: payload.body
    },
    sound: 'default',
    badge: 1,
    payload: {
      interactionId: payload.interactionId,
      actionType: payload.actionType
    }
  });
  
  try {
    await apnsProvider.send(notification, deviceToken);
    console.log('Push notification sent successfully');
  } catch (error) {
    console.error('Failed to send push notification:', error);
  }
}
```

### 5.3 Add APNs to Environment
```bash
# Add to .env
APNS_KEY_PATH=/path/to/AuthKey_XXXXX.p8
APNS_CERT_PATH=/path/to/certificate.pem
APNS_TEAM_ID=your_team_id
APNS_KEY_ID=your_key_id
```

## 📅 Step 6: Set Up Background Notification Scheduler

### 6.1 Create Heartbeat Job (Backend)
```typescript
// server/_core/heartbeat.ts (add this)
import { processScheduledNotifications } from './scheduler';

// This runs periodically to send notifications
export async function heartbeatJob() {
  try {
    // Get all active relationships
    const relationships = await db.getAllActiveRelationships();
    
    for (const relationship of relationships) {
      const user = await db.getUserById(relationship.userId);
      
      // Process scheduled notifications for this relationship
      await processScheduledNotifications(
        user.id,
        relationship.id,
        relationship.partnerName,
        relationship.loveLanguage
      );
    }
  } catch (error) {
    console.error('[Heartbeat] Error:', error);
  }
}
```

### 6.2 Configure Scheduler (Manus Heartbeat)
```bash
# In your project root, create a heartbeat configuration
# This will trigger the notification scheduler periodically
```

## 🚀 Step 7: Deployment Checklist

- [ ] iOS app created in Xcode
- [ ] Push notification permissions implemented
- [ ] Device token registration working
- [ ] Notification handler implemented
- [ ] Widget extension created and tested
- [ ] APNs certificate generated and configured
- [ ] Backend APNs service implemented
- [ ] Environment variables set (APNS_KEY_PATH, APNS_CERT_PATH)
- [ ] Heartbeat job configured
- [ ] App tested on physical device
- [ ] App submitted to App Store

## 📚 Key Files to Review

**Backend:**
- `server/_core/agent.ts` - Agent logic
- `server/_core/pushNotifications.ts` - Push notification service
- `server/_core/scheduler.ts` - Notification scheduling
- `server/routers.ts` - tRPC endpoints

**Database:**
- `drizzle/schema.ts` - All tables including agent tables

**Tests:**
- `server/agent.test.ts` - Agent system tests (14 passing)

## 🔗 API Endpoints You'll Use

```
POST /api/trpc/agent.registerDeviceToken
  - Register iOS device token

POST /api/trpc/agent.recordInteraction
  - Record user response to follow-up

GET /api/trpc/relationship.getOrCreate
  - Get relationship profile

GET /api/trpc/healthCheckIn.getScore
  - Get relationship health score

POST /api/trpc/chat.sendMessage
  - Send message to AI therapist
```

## 💡 Tips

1. **Test on Device**: Always test push notifications on a real device, not simulator
2. **Sandbox vs Production**: Use sandbox APNs during development, switch to production for App Store
3. **Token Refresh**: Device tokens can change, handle token updates gracefully
4. **Rate Limiting**: Don't send notifications too frequently to avoid user annoyance
5. **Offline Handling**: App should work offline and sync when connection returns

## 📞 Support

If you need help with:
- Swift/SwiftUI development
- Widget Kit implementation
- APNs configuration
- Backend modifications

Feel free to ask! The backend is fully functional and ready for iOS integration.
