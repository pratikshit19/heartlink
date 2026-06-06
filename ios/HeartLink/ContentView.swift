import SwiftUI

struct ContentView: View {
    // Define the URL where your HeartLink web app is running.
    // For local emulator testing, this defaults to localhost:3000.
    // Replace with your production domain (e.g. "https://your-heartlink-domain.com") for live testing.
    let serverURL = URL(string: "http://localhost:3000")!
    
    var body: some View {
        WebView(url: serverURL)
            .edgesIgnoringSafeArea(.all)
            .background(Color(.systemBackground))
    }
}

struct ContentView_Previews: PreviewProvider {
    static var previews: some View {
        ContentView()
    }
}
