import SwiftUI

@main
struct HeartLinkApp: App {
    // Adapt the traditional UIKit AppDelegate to receive APNs callbacks
    @UIApplicationDelegateAdaptor(AppDelegate.self) var appDelegate
    
    var body: some Scene {
        WindowGroup {
            ContentView()
        }
    }
}

class AppDelegate: NSObject, UIApplicationDelegate {
    
    func application(
        _ application: UIApplication,
        didFinishLaunchingWithOptions launchOptions: [UIApplication.LaunchOptionsKey : Any]? = nil
    ) -> Bool {
        // App-wide custom configuration goes here
        print("[AppDelegate] Application finished launching")
        return true
    }
    
    // APNs registration succeeded, device token received
    func application(
        _ application: UIApplication,
        didRegisterForRemoteNotificationsWithDeviceToken deviceToken: Data
    ) {
        // Convert binary token to hex string format
        let tokenParts = deviceToken.map { data in String(format: "%02.2hhx", data) }
        let token = tokenParts.joined()
        
        print("[AppDelegate] APNs Registration Succeeded. Token: \(token)")
        
        // Expose token to NotificationManager and WebView Javascript Bridge
        DispatchQueue.main.async {
            NotificationManager.shared.deviceToken = token
        }
    }
    
    // APNs registration failed (e.g. simulator without certs, or no network)
    func application(
        _ application: UIApplication,
        didFailToRegisterForRemoteNotificationsWithError error: Error
    ) {
        print("[AppDelegate] APNs Registration Failed: \(error.localizedDescription)")
    }
}
