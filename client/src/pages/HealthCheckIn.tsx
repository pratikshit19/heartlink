import { useAuth } from "@/_core/hooks/useAuth";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import { Heart, ChevronLeft, Smile, Frown } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { useState, useEffect } from "react";
import { toast } from "sonner";

const MOODS = [
  { id: "very_sad", label: "Very Sad", emoji: "😢", color: "text-red-600" },
  { id: "sad", label: "Sad", emoji: "😔", color: "text-orange-600" },
  { id: "neutral", label: "Neutral", emoji: "😐", color: "text-yellow-600" },
  { id: "happy", label: "Happy", emoji: "😊", color: "text-blue-600" },
  { id: "very_happy", label: "Very Happy", emoji: "😄", color: "text-green-600" },
];

export default function HealthCheckIn() {
  const { isAuthenticated } = useAuth();
  const [, navigate] = useLocation();
  const [selectedMood, setSelectedMood] = useState<string>("");
  const [connectionScore, setConnectionScore] = useState(5);
  const [feeling, setFeeling] = useState("");
  const [notes, setNotes] = useState("");

  const relationshipQuery = trpc.relationship.getOrCreate.useQuery();
  const createCheckInMutation = trpc.healthCheckIn.create.useMutation({
    onSuccess: () => {
      toast.success("Check-in saved! Keep nurturing your connection 💕");
      navigate("/dashboard");
    },
    onError: (error) => {
      toast.error("Failed to save check-in. Please try again.");
      console.error(error);
    },
  });

  useEffect(() => {
    if (!isAuthenticated) {
      navigate("/");
    }
    if (relationshipQuery.data === null) {
      navigate("/onboarding");
    }
  }, [isAuthenticated, relationshipQuery.data, navigate]);

  const handleSubmit = async () => {
    if (!selectedMood) {
      toast.error("Please select your mood");
      return;
    }
    if (!relationshipQuery.data) return;

    createCheckInMutation.mutate({
      relationshipId: relationshipQuery.data.id,
      mood: selectedMood as "very_sad" | "sad" | "neutral" | "happy" | "very_happy",
      connectionScore,
      feeling: feeling || undefined,
      notes: notes || undefined,
    });
  };

  if (relationshipQuery.isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p className="text-muted-foreground">Loading check-in...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-accent/5">
      {/* Header */}
      <div className="border-b border-border/40 backdrop-blur-sm sticky top-0 z-50">
        <div className="container py-4 flex items-center gap-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate("/dashboard")}
          >
            <ChevronLeft className="w-4 h-4" />
          </Button>
          <h1 className="font-semibold text-foreground">Daily Check-In</h1>
        </div>
      </div>

      {/* Content */}
      <div className="container py-12 max-w-2xl">
        <div className="space-y-8">
          {/* Intro */}
          <div className="text-center space-y-2">
            <Heart className="w-8 h-8 text-primary fill-primary mx-auto" />
            <h2 className="text-2xl font-bold text-foreground">How are you feeling today?</h2>
            <p className="text-muted-foreground">Take a moment to reflect on your relationship</p>
          </div>

          {/* Mood Selection */}
          <div className="space-y-4">
            <label className="text-sm font-medium text-foreground">Your Mood</label>
            <div className="grid grid-cols-5 gap-3">
              {MOODS.map((mood) => (
                <button
                  key={mood.id}
                  onClick={() => setSelectedMood(mood.id)}
                  className={`p-4 rounded-lg border-2 flex flex-col items-center gap-2 transition-all ${
                    selectedMood === mood.id
                      ? "border-primary bg-primary/5"
                      : "border-border hover:border-primary/30"
                  }`}
                >
                  <span className="text-3xl">{mood.emoji}</span>
                  <span className="text-xs font-medium text-foreground">{mood.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Connection Score */}
          <Card className="p-6 space-y-4 bg-card/50 backdrop-blur">
            <div>
              <label className="text-sm font-medium text-foreground block mb-2">
                Connection Score: <span className="text-primary font-bold">{connectionScore}/10</span>
              </label>
              <p className="text-xs text-muted-foreground mb-4">How connected do you feel to your partner?</p>
            </div>
            <input
              type="range"
              min="1"
              max="10"
              value={connectionScore}
              onChange={(e) => setConnectionScore(Number(e.target.value))}
              className="w-full h-2 bg-border rounded-lg appearance-none cursor-pointer accent-primary"
            />
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>Disconnected</span>
              <span>Deeply Connected</span>
            </div>
          </Card>

          {/* Feeling Description */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">What are you feeling?</label>
            <Textarea
              placeholder="Share what's on your heart... (optional)"
              value={feeling}
              onChange={(e) => setFeeling(e.target.value)}
              className="min-h-24 resize-none"
            />
          </div>

          {/* Additional Notes */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">Additional Notes</label>
            <Textarea
              placeholder="Any other thoughts or observations about your relationship today? (optional)"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="min-h-20 resize-none"
            />
          </div>

          {/* Submit Button */}
          <div className="flex gap-3 pt-4">
            <Button
              variant="outline"
              onClick={() => navigate("/dashboard")}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={createCheckInMutation.isPending}
              className="flex-1 bg-primary hover:bg-primary/90 text-primary-foreground"
            >
              {createCheckInMutation.isPending ? "Saving..." : "Save Check-In"}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
