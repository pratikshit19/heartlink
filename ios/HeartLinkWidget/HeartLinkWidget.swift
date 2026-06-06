import WidgetKit
import SwiftUI

struct Provider: TimelineProvider {
    func placeholder(in context: Context) -> SimpleEntry {
        SimpleEntry(date: Date(), healthScore: 85, todayAction: "Write a sweet text message before lunch")
    }

    func getSnapshot(in context: Context, completion: @escaping (SimpleEntry) -> ()) {
        let entry = SimpleEntry(date: Date(), healthScore: 90, todayAction: "Plan a date night for this Friday")
        completion(entry)
    }

    func getTimeline(in context: Context, completion: @escaping (Timeline<Entry>) -> ()) {
        // Fetch relationship status from backend
        // In production, the base URL would be your server domain, and relationshipId would be resolved dynamically (e.g., from AppGroup UserDefaults).
        let serverURL = "http://localhost:3000/api/widget/status?relationshipId=1"
        guard let url = URL(string: serverURL) else {
            let fallbackEntry = SimpleEntry(date: Date(), healthScore: 80, todayAction: "Check in with your partner today")
            let timeline = Timeline(entries: [fallbackEntry], policy: .after(Date(timeIntervalSinceNow: 1800))) // Refresh in 30 minutes
            completion(timeline)
            return
        }
        
        URLSession.shared.dataTask(with: url) { data, response, error in
            var score = 80
            var action = "Plan a meaningful gesture today"
            
            if let data = data {
                if let json = try? JSONSerialization.jsonObject(with: data) as? [String: Any] {
                    score = json["healthScore"] as? Int ?? 80
                    action = json["todayAction"] as? String ?? "Plan a meaningful gesture today"
                }
            }
            
            let entry = SimpleEntry(date: Date(), healthScore: score, todayAction: action)
            // Refresh widget timeline every 1 hour (3600 seconds)
            let refreshDate = Calendar.current.date(byAdding: .hour, value: 1, to: Date()) ?? Date(timeIntervalSinceNow: 3600)
            let timeline = Timeline(entries: [entry], policy: .after(refreshDate))
            completion(timeline)
        }.resume()
    }
}

struct SimpleEntry: TimelineEntry {
    let date: Date
    let healthScore: Int
    let todayAction: String
}

struct HeartLinkWidgetEntryView : View {
    var entry: Provider.Entry
    @Environment(\.widgetFamily) var family

    var body: some View {
        ZStack {
            // Elegant gradient background matching the product design guidelines
            LinearGradient(
                gradient: Gradient(colors: [Color(hex: "0F0C20"), Color(hex: "1F132E")]),
                startPoint: .topLeading,
                endPoint: .bottomTrailing
            )
            
            switch family {
            case .systemSmall:
                smallWidgetView
            default:
                mediumWidgetView
            }
        }
    }
    
    // 1x1 Small Widget Layout
    var smallWidgetView: some View {
        VStack(alignment: .leading, spacing: 8) {
            HStack {
                Image(systemName: "heart.text.square.fill")
                    .foregroundColor(Color(hex: "FF3B30"))
                    .font(.title3)
                Spacer()
                Text("\(entry.healthScore)%")
                    .font(.system(.body, design: .rounded))
                    .fontWeight(.bold)
                    .foregroundColor(.white)
            }
            
            Spacer()
            
            Text("TODAY'S SUGGESTION")
                .font(.system(size: 8, weight: .semibold, design: .rounded))
                .foregroundColor(Color(hex: "AEAEB2"))
            
            Text(entry.todayAction)
                .font(.system(size: 11, weight: .medium, design: .rounded))
                .foregroundColor(.white)
                .lineLimit(3)
                .minimumScaleFactor(0.8)
        }
        .padding(12)
    }
    
    // 2x2 Medium Widget Layout
    var mediumWidgetView: some View {
        HStack(spacing: 16) {
            // Left Side: Circular Health Score Ring
            VStack {
                ZStack {
                    Circle()
                        .stroke(lineWidth: 6)
                        .opacity(0.1)
                        .foregroundColor(.white)
                    
                    Circle()
                        .trim(from: 0.0, to: CGFloat(min(Double(entry.healthScore) / 100.0, 1.0)))
                        .stroke(
                            AngularGradient(
                                colors: [Color(hex: "FF2D55"), Color(hex: "FF9500"), Color(hex: "FF2D55")],
                                center: .center
                            ),
                            style: StrokeStyle(lineWidth: 6, lineCap: .round)
                        )
                        .rotationEffect(Angle(degrees: -90))
                    
                    VStack(spacing: -2) {
                        Text("\(entry.healthScore)")
                            .font(.system(.title2, design: .rounded))
                            .fontWeight(.bold)
                            .foregroundColor(.white)
                        Text("score")
                            .font(.system(size: 9, weight: .medium))
                            .foregroundColor(Color(hex: "AEAEB2"))
                    }
                }
                .frame(width: 70, height: 70)
            }
            .padding(.leading, 12)
            
            // Right Side: Today's Action Card
            VStack(alignment: .leading, spacing: 4) {
                HStack(spacing: 4) {
                    Image(systemName: "heart.fill")
                        .foregroundColor(Color(hex: "FF2D55"))
                        .font(.caption)
                    Text("HEARTLINK AGENT")
                        .font(.system(size: 9, weight: .bold, design: .rounded))
                        .foregroundColor(Color(hex: "FF2D55"))
                        .tracking(1.0)
                }
                
                Text("Today's Proactive Action")
                    .font(.system(size: 13, weight: .bold))
                    .foregroundColor(.white)
                
                Text(entry.todayAction)
                    .font(.system(size: 12, weight: .medium))
                    .foregroundColor(Color(hex: "E5E5EA"))
                    .lineLimit(3)
                    .minimumScaleFactor(0.9)
                    .padding(.top, 2)
            }
            .padding(.trailing, 12)
            
            Spacer()
        }
    }
}

struct HeartLinkWidget: Widget {
    let kind: String = "HeartLinkWidget"

    var body: some WidgetConfiguration {
        StaticConfiguration(kind: kind, provider: Provider()) { entry in
            HeartLinkWidgetEntryView(entry: entry)
        }
        .configurationDisplayName("HeartLink Status")
        .description("Keep track of your relationship health and insights.")
        .supportedFamilies([.systemSmall, .systemMedium])
    }
}

// Color Utility Extension for Hex parsing
extension Color {
    init(hex: String) {
        let hex = hex.trimmingCharacters(in: CharacterSet.alphanumerics.inverted)
        var int: UInt64 = 0
        Scanner(string: hex).scanHexInt64(&int)
        let a, r, g, b: UInt64
        switch hex.count {
        case 3: // RGB (12-bit)
            (a, r, g, b) = (255, (int >> 8) * 17, (int >> 4 & 0xF) * 17, (int & 0xF) * 17)
        case 6: // RGB (24-bit)
            (a, r, g, b) = (255, int >> 16, int >> 8 & 0xFF, int & 0xFF)
        case 8: // ARGB (32-bit)
            (a, r, g, b) = (int >> 24, int >> 16 & 0xFF, int >> 8 & 0xFF, int & 0xFF)
        default:
            (a, r, g, b) = (1, 1, 1, 1)
        }

        self.init(
            .sRGB,
            red: Double(r) / 255,
            green: Double(g) / 255,
            blue: Double(b) / 255,
            opacity: Double(a) / 255
        )
    }
}
