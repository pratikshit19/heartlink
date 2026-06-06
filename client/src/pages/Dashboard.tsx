import { useAuth } from "@/_core/hooks/useAuth";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Heart, MessageCircle, Calendar, Gift, TrendingUp, Plus, Sparkles } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { useEffect } from "react";

export default function Dashboard() {
  const { user, isAuthenticated } = useAuth();
  const [, navigate] = useLocation();

  const relationshipQuery = trpc.relationship.getOrCreate.useQuery();
  const healthScoreQuery = trpc.healthCheckIn.getScore.useQuery(
    { relationshipId: relationshipQuery.data?.id || 0 },
    { enabled: !!relationshipQuery.data?.id }
  );
  const upcomingRemindersQuery = trpc.reminders.getUpcoming.useQuery(
    { relationshipId: relationshipQuery.data?.id || 0, daysAhead: 30 },
    { enabled: !!relationshipQuery.data?.id }
  );
  const gestureQuery = trpc.gestures.getRecent.useQuery(
    { relationshipId: relationshipQuery.data?.id || 0 },
    { enabled: !!relationshipQuery.data?.id }
  );

  useEffect(() => {
    if (!isAuthenticated) {
      navigate("/");
    }
    if (relationshipQuery.data === null) {
      navigate("/onboarding");
    }
  }, [isAuthenticated, relationshipQuery.data, navigate]);

  const relationship = relationshipQuery.data;
  const healthScore = healthScoreQuery.data || 0;
  const upcomingReminders = upcomingRemindersQuery.data || [];
  const recentGesture = gestureQuery.data?.[0];

  const getHealthScoreColor = (score: number) => {
    if (score >= 80) return "text-green-600";
    if (score >= 60) return "text-blue-600";
    if (score >= 40) return "text-yellow-600";
    return "text-red-600";
  };

  const getHealthScoreLabel = (score: number) => {
    if (score >= 80) return "Thriving";
    if (score >= 60) return "Strong";
    if (score >= 40) return "Growing";
    return "Needs attention";
  };

  if (relationshipQuery.isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p className="text-muted-foreground">Loading your dashboard...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-accent/5">
      {/* Header */}
      <div className="border-b border-border/40 backdrop-blur-sm sticky top-0 z-50">
        <div className="container py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Heart className="w-6 h-6 text-primary fill-primary" />
            <span className="text-xl font-semibold text-foreground">HeartLink</span>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-sm text-muted-foreground">{user?.name}</span>
            <Button variant="ghost" size="sm">
              Settings
            </Button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container py-12">
        {/* Welcome Section */}
        <div className="mb-12">
          <h1 className="text-4xl font-bold text-foreground mb-2">
            Welcome back, {user?.name?.split(" ")[0]}
          </h1>
          <p className="text-muted-foreground">
            You and {relationship?.partnerName} • Together since {new Date(relationship?.anniversaryDate || "").toLocaleDateString()}
          </p>
        </div>

        {/* Main Grid */}
        <div className="grid lg:grid-cols-3 gap-6 mb-12">
          {/* Health Score Card */}
          <Card className="lg:col-span-1 p-8 flex flex-col items-center justify-center text-center space-y-4 bg-card/50 backdrop-blur hover:border-primary/20 transition-colors">
            <div className="relative w-24 h-24 flex items-center justify-center">
              <div className="absolute inset-0 rounded-full bg-gradient-to-br from-primary/10 to-accent/10" />
              <div className={`text-4xl font-bold ${getHealthScoreColor(healthScore)}`}>
                {healthScore}
              </div>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-foreground">Relationship Health</h3>
              <p className={`text-sm font-medium ${getHealthScoreColor(healthScore)}`}>
                {getHealthScoreLabel(healthScore)}
              </p>
            </div>
            <Button
              onClick={() => navigate("/check-in")}
              className="w-full bg-primary hover:bg-primary/90 text-primary-foreground mt-4"
            >
              <TrendingUp className="w-4 h-4 mr-2" />
              Check In Today
            </Button>
          </Card>

          {/* Quick Actions */}
          <div className="lg:col-span-2 grid grid-cols-2 gap-4">
            <Card className="p-6 flex flex-col justify-between bg-card/50 backdrop-blur hover:border-primary/20 transition-colors cursor-pointer" onClick={() => navigate("/chat")}>
              <MessageCircle className="w-8 h-8 text-primary mb-3" />
              <div>
                <h3 className="font-semibold text-foreground">Talk to Therapist</h3>
                <p className="text-xs text-muted-foreground mt-1">Get relationship advice</p>
              </div>
            </Card>

            <Card className="p-6 flex flex-col justify-between bg-card/50 backdrop-blur hover:border-primary/20 transition-colors cursor-pointer" onClick={() => navigate("/reminders")}>
              <Calendar className="w-8 h-8 text-primary mb-3" />
              <div>
                <h3 className="font-semibold text-foreground">Reminders</h3>
                <p className="text-xs text-muted-foreground mt-1">{upcomingReminders.length} upcoming</p>
              </div>
            </Card>

            <Card className="p-6 flex flex-col justify-between bg-card/50 backdrop-blur hover:border-primary/20 transition-colors cursor-pointer" onClick={() => navigate("/gestures")}>
              <Gift className="w-8 h-8 text-primary mb-3" />
              <div>
                <h3 className="font-semibold text-foreground">Cute Gestures</h3>
                <p className="text-xs text-muted-foreground mt-1">Personalized ideas</p>
              </div>
            </Card>

            <Card className="p-6 flex flex-col justify-between bg-card/50 backdrop-blur hover:border-primary/20 transition-colors cursor-pointer" onClick={() => navigate("/gestures")}>
              <Sparkles className="w-8 h-8 text-primary mb-3" />
              <div>
                <h3 className="font-semibold text-foreground">Conversation</h3>
                <p className="text-xs text-muted-foreground mt-1">Daily starters</p>
              </div>
            </Card>
          </div>
        </div>

        {/* Upcoming Reminders */}
        <div className="mb-12">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-foreground">Upcoming Moments</h2>
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigate("/reminders")}
            >
              <Plus className="w-4 h-4 mr-2" />
              Add Reminder
            </Button>
          </div>
          {upcomingReminders.length > 0 ? (
            <div className="space-y-3">
              {upcomingReminders.slice(0, 3).map((reminder) => (
                <Card key={reminder.id} className="p-4 flex items-center justify-between bg-card/50 backdrop-blur">
                  <div className="flex items-center gap-4">
                    <Calendar className="w-5 h-5 text-primary" />
                    <div>
                      <h4 className="font-medium text-foreground">{reminder.title}</h4>
                      <p className="text-sm text-muted-foreground">
                        {new Date(reminder.reminderDate).toLocaleDateString("en-US", {
                          month: "short",
                          day: "numeric",
                        })}
                      </p>
                    </div>
                  </div>
                  {reminder.reminderType === "anniversary" && (
                    <Heart className="w-5 h-5 text-primary fill-primary" />
                  )}
                </Card>
              ))}
            </div>
          ) : (
            <Card className="p-8 text-center bg-card/50 backdrop-blur">
              <p className="text-muted-foreground">No upcoming reminders. Add one to get started!</p>
            </Card>
          )}
        </div>

        {/* Today's Gesture */}
        {recentGesture && (
          <div>
            <h2 className="text-2xl font-bold text-foreground mb-6">Today's Gesture</h2>
            <Card className="p-8 bg-gradient-to-br from-primary/5 to-accent/5 border-primary/20">
              <div className="flex items-start gap-4">
                <Gift className="w-6 h-6 text-primary flex-shrink-0 mt-1" />
                <div className="flex-1">
                  <p className="text-lg text-foreground leading-relaxed">{recentGesture.suggestion}</p>
                  <p className="text-xs text-muted-foreground mt-4 capitalize">
                    {recentGesture.category.replace(/_/g, " ")}
                  </p>
                </div>
              </div>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}
