import SwiftUI
import UserNotifications

class NotificationManager: NSObject, ObservableObject, UNUserNotificationCenterDelegate {
    static let shared = NotificationManager()
    
    @Published var deviceToken: String? = nil
    @Published var activeDeepLink: String? = nil
    
    override init() {
        super.init()
        UNUserNotificationCenter.current().delegate = self
        setupNotificationCategories()
    }
    
    func requestPermissions() {
        UNUserNotificationCenter.current().requestAuthorization(options: [.alert, .sound, .badge]) { granted, error in
            if granted {
                print("[NotificationManager] Permission granted")
                DispatchQueue.main.async {
                    UIApplication.shared.registerForRemoteNotifications()
                }
            } else if let error = error {
                print("[NotificationManager] Permission error: \(error.localizedDescription)")
            }
        }
    }
    
    func setupNotificationCategories() {
        // Category 1: Follow-up Actions
        let respondAction = UNNotificationAction(
            identifier: "RESPOND_ACTION",
            title: "Respond Now",
            options: [.foreground]
        )
        let laterAction = UNNotificationAction(
            identifier: "LATER_ACTION",
            title: "Remind Me Later",
            options: []
        )
        let followUpCategory = UNNotificationCategory(
            identifier: "FOLLOW_UP",
            actions: [respondAction, laterAction],
            intentIdentifiers: [],
            options: []
        )
        
        // Category 2: Reminder Actions
        let doneAction = UNNotificationAction(
            identifier: "DONE_ACTION",
            title: "Mark Done",
            options: []
        )
        let remindLaterAction = UNNotificationAction(
            identifier: "REMIND_LATER_ACTION",
            title: "Remind Later",
            options: []
        )
        let reminderCategory = UNNotificationCategory(
            identifier: "REMINDER",
            actions: [doneAction, remindLaterAction],
            intentIdentifiers: [],
            options: []
        )
        
        UNUserNotificationCenter.current().setNotificationCategories([followUpCategory, reminderCategory])
    }
    
    // MARK: - UNUserNotificationCenterDelegate
    
    // Handle foreground notification presentation
    func userNotificationCenter(
        _ center: UNUserNotificationCenter,
        willPresent notification: UNNotification,
        withCompletionHandler completionHandler: @escaping (UNNotificationPresentationOptions) -> Void
    ) {
        let userInfo = notification.request.content.userInfo
        print("[NotificationManager] Foreground notification received: \(userInfo)")
        
        // Display the notification banner, play sound, and update badge even when app is open
        completionHandler([.banner, .sound, .badge])
    }
    
    // Handle user tapping on a notification or action
    func userNotificationCenter(
        _ center: UNUserNotificationCenter,
        didReceive response: UNNotificationResponse,
        withCompletionHandler completionHandler: @escaping () -> Void
    ) {
        let userInfo = response.notification.request.content.userInfo
        let actionIdentifier = response.actionIdentifier
        
        print("[NotificationManager] Tapped notification action: \(actionIdentifier), userInfo: \(userInfo)")
        
        // Parse custom payload fields
        let interactionId = userInfo["interactionId"] as? Int
        let actionType = userInfo["actionType"] as? String
        
        DispatchQueue.main.async {
            if actionIdentifier == "RESPOND_ACTION" || response.actionIdentifier == UNNotificationDefaultActionIdentifier {
                // If user clicked the notification or selected "Respond", deep link to chat
                self.activeDeepLink = "/chat"
            } else if actionIdentifier == "LATER_ACTION" {
                // Handle "Later" response locally on the device (schedule a local notification)
                self.scheduleLocalNotification(
                    title: "Relationship Follow-up",
                    body: response.notification.request.content.body,
                    timeInterval: 30 * 60, // 30 minutes later
                    category: "FOLLOW_UP"
                )
            } else if actionIdentifier == "DONE_ACTION" {
                // Mark interaction done (could fire direct API request if authenticated)
                print("[NotificationManager] User marked notification \(interactionId ?? -1) as done.")
            } else if actionIdentifier == "REMIND_LATER_ACTION" {
                // Reschedule reminder locally
                self.scheduleLocalNotification(
                    title: "Relationship Reminder",
                    body: response.notification.request.content.body,
                    timeInterval: 60 * 60, // 1 hour later
                    category: "REMINDER"
                )
            }
        }
        
        completionHandler()
    }
    
    // MARK: - Local Notification Helper
    
    func scheduleLocalNotification(title: String, body: String, timeInterval: TimeInterval, category: String) {
        let content = UNMutableNotificationContent()
        content.title = title
        content.body = body
        content.sound = .default
        content.categoryIdentifier = category
        
        let trigger = UNTimeIntervalNotificationTrigger(timeInterval: timeInterval, repeats: false)
        let request = UNNotificationRequest(
            identifier: UUID().uuidString,
            content: content,
            trigger: trigger
        )
        
        UNUserNotificationCenter.current().add(request) { error in
            if let error = error {
                print("[NotificationManager] Error scheduling local notification: \(error)")
            } else {
                print("[NotificationManager] Scheduled local notification in \(timeInterval)s")
            }
        }
    }
}
