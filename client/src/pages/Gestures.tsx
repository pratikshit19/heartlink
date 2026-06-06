import { useAuth } from "@/_core/hooks/useAuth";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Heart, ChevronLeft, Sparkles, RefreshCw, Loader2 } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { useEffect, useState } from "react";
import { toast } from "sonner";

export default function Gestures() {
  const { isAuthenticated } = useAuth();
  const [, navigate] = useLocation();
  const [activeTab, setActiveTab] = useState<"gestures" | "starters">("gestures");

  const relationshipQuery = trpc.relationship.getOrCreate.useQuery();
  const gesturesQuery = trpc.gestures.getRecent.useQuery(
    { relationshipId: relationshipQuery.data?.id || 0 },
    { enabled: !!relationshipQuery.data?.id }
  );
  const startersQuery = trpc.conversationStarters.getRecent.useQuery(
    { relationshipId: relationshipQuery.data?.id || 0 },
    { enabled: !!relationshipQuery.data?.id }
  );

  const generateGestureMutation = trpc.gestures.generate.useMutation({
    onSuccess: () => {
      toast.success("New gesture generated!");
      gesturesQuery.refetch();
    },
    onError: (error) => {
      toast.error("Failed to generate gesture. Please try again.");
      console.error(error);
    },
  });

  const generateStarterMutation = trpc.conversationStarters.generate.useMutation({
    onSuccess: () => {
      toast.success("New conversation starter generated!");
      startersQuery.refetch();
    },
    onError: (error) => {
      toast.error("Failed to generate starter. Please try again.");
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

  const handleGenerateGesture = () => {
    if (!relationshipQuery.data) return;
    generateGestureMutation.mutate({
      relationshipId: relationshipQuery.data.id,
      partnerName: relationshipQuery.data.partnerName,
      loveLanguage: relationshipQuery.data.loveLanguage,
    });
  };

  const handleGenerateStarter = () => {
    if (!relationshipQuery.data) return;
    generateStarterMutation.mutate({
      relationshipId: relationshipQuery.data.id,
      partnerName: relationshipQuery.data.partnerName,
    });
  };

  const gestures = gesturesQuery.data || [];
  const starters = startersQuery.data || [];

  if (relationshipQuery.isLoading || gesturesQuery.isLoading || startersQuery.isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p className="text-muted-foreground">Loading...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-accent/5">
      {/* Header */}
      <div className="border-b border-border/40 backdrop-blur-sm sticky top-0 z-50">
        <div className="container py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate("/dashboard")}
            >
              <ChevronLeft className="w-4 h-4" />
            </Button>
            <h1 className="font-semibold text-foreground">Gestures & Conversations</h1>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="container py-12 max-w-2xl">
        {/* Tabs */}
        <div className="flex gap-2 mb-8 border-b border-border">
          <button
            onClick={() => setActiveTab("gestures")}
            className={`px-4 py-2 font-medium text-sm border-b-2 transition-colors ${
              activeTab === "gestures"
                ? "border-primary text-foreground"
                : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            <Heart className="w-4 h-4 inline mr-2" />
            Cute Gestures
          </button>
          <button
            onClick={() => setActiveTab("starters")}
            className={`px-4 py-2 font-medium text-sm border-b-2 transition-colors ${
              activeTab === "starters"
                ? "border-primary text-foreground"
                : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            <Sparkles className="w-4 h-4 inline mr-2" />
            Conversation Starters
          </button>
        </div>

        {/* Gestures Tab */}
        {activeTab === "gestures" && (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-semibold text-foreground">Personalized Gesture Ideas</h2>
              <Button
                onClick={handleGenerateGesture}
                disabled={generateGestureMutation.isPending}
                className="bg-primary hover:bg-primary/90 text-primary-foreground"
                size="sm"
              >
                {generateGestureMutation.isPending ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Generating...
                  </>
                ) : (
                  <>
                    <RefreshCw className="w-4 h-4 mr-2" />
                    Generate New
                  </>
                )}
              </Button>
            </div>

            {gestures.length === 0 ? (
              <Card className="p-12 text-center bg-card/50 backdrop-blur">
                <Heart className="w-8 h-8 text-muted-foreground/50 mx-auto mb-3" />
                <p className="text-muted-foreground mb-4">No gestures yet. Generate one to get started!</p>
                <Button
                  onClick={handleGenerateGesture}
                  className="bg-primary hover:bg-primary/90 text-primary-foreground"
                >
                  Generate First Gesture
                </Button>
              </Card>
            ) : (
              <div className="space-y-4">
                {gestures.map((gesture) => (
                  <Card
                    key={gesture.id}
                    className="p-6 bg-gradient-to-br from-primary/5 to-accent/5 border-primary/20 hover:border-primary/40 transition-colors"
                  >
                    <div className="flex items-start gap-4">
                      <Heart className="w-5 h-5 text-primary flex-shrink-0 mt-1 fill-primary" />
                      <div className="flex-1">
                        <p className="text-foreground leading-relaxed">{gesture.suggestion}</p>
                        <div className="flex gap-2 mt-4">
                          <span className="text-xs px-3 py-1 rounded-full bg-primary/10 text-primary capitalize">
                            {gesture.category.replace(/_/g, " ")}
                          </span>
                        </div>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Conversation Starters Tab */}
        {activeTab === "starters" && (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-semibold text-foreground">Daily Conversation Starters</h2>
              <Button
                onClick={handleGenerateStarter}
                disabled={generateStarterMutation.isPending}
                className="bg-primary hover:bg-primary/90 text-primary-foreground"
                size="sm"
              >
                {generateStarterMutation.isPending ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Generating...
                  </>
                ) : (
                  <>
                    <RefreshCw className="w-4 h-4 mr-2" />
                    Generate New
                  </>
                )}
              </Button>
            </div>

            {starters.length === 0 ? (
              <Card className="p-12 text-center bg-card/50 backdrop-blur">
                <Sparkles className="w-8 h-8 text-muted-foreground/50 mx-auto mb-3" />
                <p className="text-muted-foreground mb-4">No conversation starters yet. Generate one to get started!</p>
                <Button
                  onClick={handleGenerateStarter}
                  className="bg-primary hover:bg-primary/90 text-primary-foreground"
                >
                  Generate First Starter
                </Button>
              </Card>
            ) : (
              <div className="space-y-4">
                {starters.map((starter) => (
                  <Card
                    key={starter.id}
                    className="p-6 bg-gradient-to-br from-accent/5 to-primary/5 border-accent/20 hover:border-accent/40 transition-colors"
                  >
                    <div className="flex items-start gap-4">
                      <Sparkles className="w-5 h-5 text-accent-foreground flex-shrink-0 mt-1" />
                      <div className="flex-1">
                        <p className="text-foreground leading-relaxed italic">{starter.prompt}</p>
                        <div className="flex gap-2 mt-4">
                          <span className="text-xs px-3 py-1 rounded-full bg-accent/10 text-accent-foreground capitalize">
                            {starter.category.replace(/_/g, " ")}
                          </span>
                        </div>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
