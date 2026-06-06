import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { useLocation } from "wouter";
import { Heart, Sparkles, TrendingUp, MessageCircle, Calendar, Gift } from "lucide-react";
import { getLoginUrl } from "@/const";

export default function Home() {
  const { user, isAuthenticated, logout } = useAuth();
  const [, navigate] = useLocation();

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-accent/5">
        {/* Navigation */}
        <nav className="border-b border-border/40 backdrop-blur-sm sticky top-0 z-50">
          <div className="container py-4 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Heart className="w-6 h-6 text-primary fill-primary" />
              <span className="text-xl font-semibold text-foreground">HeartLink</span>
            </div>
            <Button
              onClick={() => {
                window.location.href = getLoginUrl();
              }}
              className="bg-primary hover:bg-primary/90 text-primary-foreground"
            >
              Sign In
            </Button>
          </div>
        </nav>

        {/* Hero Section */}
        <div className="container py-20 md:py-32">
          <div className="max-w-3xl mx-auto text-center space-y-8">
            <div className="space-y-4">
              <h1 className="text-5xl md:text-6xl font-bold text-foreground leading-tight">
                Nurture Your Love,
                <span className="block text-primary mt-2">Every Single Day</span>
              </h1>
              <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
                HeartLink is your personal relationship companion. Get AI-powered guidance, track your connection, and discover meaningful ways to strengthen your bond.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-4 justify-center pt-8">
              <Button
                onClick={() => {
                  window.location.href = getLoginUrl();
                }}
                size="lg"
                className="bg-primary hover:bg-primary/90 text-primary-foreground text-base h-12 px-8"
              >
                Get Started
              </Button>
              <Button
                variant="outline"
                size="lg"
                className="text-base h-12 px-8"
              >
                Learn More
              </Button>
            </div>
          </div>

          {/* Features Grid */}
          <div className="grid md:grid-cols-3 gap-6 mt-24">
            <div className="p-6 rounded-xl border border-border/40 bg-card/50 backdrop-blur hover:border-primary/20 transition-colors">
              <MessageCircle className="w-8 h-8 text-primary mb-4" />
              <h3 className="text-lg font-semibold text-foreground mb-2">AI Therapist Chat</h3>
              <p className="text-sm text-muted-foreground">
                Get compassionate, relationship-aware guidance tailored to your unique connection.
              </p>
            </div>

            <div className="p-6 rounded-xl border border-border/40 bg-card/50 backdrop-blur hover:border-primary/20 transition-colors">
              <TrendingUp className="w-8 h-8 text-primary mb-4" />
              <h3 className="text-lg font-semibold text-foreground mb-2">Health Tracking</h3>
              <p className="text-sm text-muted-foreground">
                Monitor your relationship's emotional health with daily check-ins and visual insights.
              </p>
            </div>

            <div className="p-6 rounded-xl border border-border/40 bg-card/50 backdrop-blur hover:border-primary/20 transition-colors">
              <Gift className="w-8 h-8 text-primary mb-4" />
              <h3 className="text-lg font-semibold text-foreground mb-2">Gesture Ideas</h3>
              <p className="text-sm text-muted-foreground">
                Personalized romantic ideas and conversation starters to deepen your connection.
              </p>
            </div>

            <div className="p-6 rounded-xl border border-border/40 bg-card/50 backdrop-blur hover:border-primary/20 transition-colors">
              <Calendar className="w-8 h-8 text-primary mb-4" />
              <h3 className="text-lg font-semibold text-foreground mb-2">Smart Reminders</h3>
              <p className="text-sm text-muted-foreground">
                Never miss important dates with intelligent reminders for anniversaries and milestones.
              </p>
            </div>

            <div className="p-6 rounded-xl border border-border/40 bg-card/50 backdrop-blur hover:border-primary/20 transition-colors">
              <Sparkles className="w-8 h-8 text-primary mb-4" />
              <h3 className="text-lg font-semibold text-foreground mb-2">Conversation Starters</h3>
              <p className="text-sm text-muted-foreground">
                Daily prompts to spark meaningful conversations and strengthen emotional intimacy.
              </p>
            </div>

            <div className="p-6 rounded-xl border border-border/40 bg-card/50 backdrop-blur hover:border-primary/20 transition-colors">
              <Heart className="w-8 h-8 text-primary mb-4" />
              <h3 className="text-lg font-semibold text-foreground mb-2">Love Language</h3>
              <p className="text-sm text-muted-foreground">
                Personalized guidance based on your love language for deeper connection.
              </p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <footer className="border-t border-border/40 mt-24 py-12">
          <div className="container text-center text-sm text-muted-foreground">
            <p>HeartLink • Nurturing relationships, one moment at a time</p>
          </div>
        </footer>
      </div>
    );
  }

  // Authenticated view - redirect to dashboard
  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center space-y-4">
        <Heart className="w-12 h-12 text-primary fill-primary mx-auto" />
        <h1 className="text-2xl font-semibold text-foreground">Welcome back, {user?.name}!</h1>
        <p className="text-muted-foreground">Redirecting to your dashboard...</p>
        <div className="pt-4">
          <Button
            onClick={() => navigate("/dashboard")}
            className="bg-primary hover:bg-primary/90 text-primary-foreground"
          >
            Go to Dashboard
          </Button>
        </div>
      </div>
    </div>
  );
}
