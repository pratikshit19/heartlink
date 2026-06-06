import SwiftUI
import WebKit

struct WebView: UIViewRepresentable {
    let url: URL
    @ObservedObject var notificationManager = NotificationManager.shared
    
    func makeCoordinator() -> Coordinator {
        Coordinator(self)
    }
    
    func makeUIView(context: Context) -> WKWebView {
        let preferences = WKWebpagePreferences()
        preferences.allowsContentJavaScript = true
        
        let configuration = WKWebViewConfiguration()
        configuration.defaultWebpagePreferences = preferences
        
        // Setup JavaScript Bridge
        let contentController = WKUserContentController()
        
        // Inject a flag so the frontend knows it is running inside the iOS native app
        let userScript = WKUserScript(
            source: "window.isNativeIOSApp = true;",
            injectionTime: .atDocumentStart,
            forMainFrameOnly: true
        )
        contentController.addUserScript(userScript)
        
        // Add script message handler for registerPushToken
        contentController.add(context.coordinator, name: "registerPushToken")
        
        configuration.userContentController = contentController
        
        // Share credentials and session cookies across the application
        configuration.websiteDataStore = WKWebsiteDataStore.default()
        
        let webView = WKWebView(frame: .zero, configuration: configuration)
        webView.navigationDelegate = context.coordinator
        
        // Request notification permissions once app starts loading
        notificationManager.requestPermissions()
        
        // Load initial request
        let request = URLRequest(url: url)
        webView.load(request)
        
        return webView
    }
    
    func updateUIView(_ uiView: WKWebView, context: Context) {
        // Handle deep link routing when notificationManager updates activeDeepLink
        if let deepLink = notificationManager.activeDeepLink {
            notificationManager.activeDeepLink = nil // Consume the deep link
            
            var baseURLString = url.absoluteString
            if baseURLString.endsWith("/") {
                baseURLString.removeLast()
            }
            
            let deepLinkURLString = baseURLString + deepLink
            if let deepLinkURL = URL(string: deepLinkURLString) {
                print("[WebView] Deep linking to: \(deepLinkURLString)")
                let request = URLRequest(url: deepLinkURL)
                uiView.load(request)
            }
        }
    }
    
    class Coordinator: NSObject, WKNavigationDelegate, WKScriptMessageHandler {
        var parent: WebView
        
        init(_ parent: WebView) {
            self.parent = parent
        }
        
        // WKNavigationDelegate: Called when the webpage finishes loading
        func webView(_ webView: WKWebView, didFinish navigation: WKNavigation!) {
            print("[WebView] Finished loading page: \(webView.url?.absoluteString ?? "")")
            
            // If we already have a device token, send it to the frontend automatically
            if let token = parent.notificationManager.deviceToken {
                sendTokenToWebpage(webView: webView, token: token)
            }
        }
        
        // WKScriptMessageHandler: Handle message callbacks from JavaScript
        func userContentController(
            _ userContentController: WKUserContentController,
            didReceive message: WKScriptMessage
        ) {
            if message.name == "registerPushToken" {
                print("[WebView] Received JS message 'registerPushToken'")
                if let token = parent.notificationManager.deviceToken {
                    sendTokenToWebpage(webView: webView!, token: token)
                } else {
                    // Try to request permissions/token if not present
                    parent.notificationManager.requestPermissions()
                }
            }
        }
        
        private func sendTokenToWebpage(webView: WKWebView, token: String) {
            let jsCode = "if (window.receiveDeviceToken) { window.receiveDeviceToken('\(token)'); } else { window.deviceToken = '\(token)'; }"
            webView.evaluateJavaScript(jsCode) { (result, error) in
                if let error = error {
                    print("[WebView] Error executing registerDeviceToken JS: \(error.localizedDescription)")
                } else {
                    print("[WebView] Sent device token to page successfully")
                }
            }
        }
        
        private var webView: WKWebView? {
            // Helper to get webView reference inside the script handler
            for windowScene in UIApplication.shared.connectedScenes {
                if let windowScene = windowScene as? UIWindowScene {
                    for window in windowScene.windows {
                        if let rootVC = window.rootViewController {
                            return findWebView(in: rootVC.view)
                        }
                    }
                }
            }
            return nil
        }
        
        private func findWebView(in view: UIView) -> WKWebView? {
            if let webView = view as? WKWebView {
                return webView
            }
            for subview in view.subviews {
                if let found = findWebView(in: subview) {
                    return found
                }
            }
            return nil
        }
    }
}

// Helper utility extension
extension String {
    func endsWith(_ suffix: String) -> Bool {
        return self.hasSuffix(suffix)
    }
}
