import { useAuth } from "@/_core/hooks/useAuth";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Heart, Send, ChevronLeft, Loader2 } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { useState, useEffect, useRef } from "react";
import { toast } from "sonner";

export default function Chat() {
  const { isAuthenticated } = useAuth();
  const [, navigate] = useLocation();
  const [message, setMessage] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const relationshipQuery = trpc.relationship.getOrCreate.useQuery();
  const chatHistoryQuery = trpc.chat.getHistory.useQuery(
    { relationshipId: relationshipQuery.data?.id || 0 },
    { enabled: !!relationshipQuery.data?.id }
  );
  const sendMessageMutation = trpc.chat.sendMessage.useMutation({
    onSuccess: () => {
      setMessage("");
      chatHistoryQuery.refetch();
    },
    onError: (error) => {
      toast.error("Failed to send message. Please try again.");
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

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chatHistoryQuery.data]);

  const handleSendMessage = async () => {
    if (!message.trim() || !relationshipQuery.data) return;

    sendMessageMutation.mutate({
      relationshipId: relationshipQuery.data.id,
      message: message.trim(),
      partnerName: relationshipQuery.data.partnerName,
      loveLanguage: relationshipQuery.data.loveLanguage,
    });
  };

  const relationship = relationshipQuery.data;
  const chatHistory = chatHistoryQuery.data || [];

  if (relationshipQuery.isLoading || chatHistoryQuery.isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p className="text-muted-foreground">Loading chat...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-accent/5 flex flex-col">
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
          <div className="flex items-center gap-2">
            <Heart className="w-5 h-5 text-primary fill-primary" />
            <div>
              <h1 className="font-semibold text-foreground">Relationship Therapist</h1>
              <p className="text-xs text-muted-foreground">AI-powered guidance for you and {relationship?.partnerName}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Chat Messages */}
      <div className="flex-1 overflow-y-auto">
        <div className="container py-8 max-w-2xl">
          {chatHistory.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-96 text-center space-y-4">
              <Heart className="w-12 h-12 text-primary/30" />
              <div>
                <h2 className="text-xl font-semibold text-foreground mb-2">Welcome to HeartLink Therapy</h2>
                <p className="text-muted-foreground max-w-sm">
                  Share your thoughts, concerns, or questions about your relationship. I'm here to provide compassionate, personalized guidance.
                </p>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {chatHistory.map((msg, idx) => (
                <div
                  key={idx}
                  className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
                >
                  <div
                    className={`max-w-xs lg:max-w-md px-4 py-3 rounded-lg ${
                      msg.role === "user"
                        ? "bg-primary text-primary-foreground rounded-br-none"
                        : "bg-card border border-border rounded-bl-none"
                    }`}
                  >
                    <p className="text-sm leading-relaxed">{msg.content}</p>
                  </div>
                </div>
              ))}
              {sendMessageMutation.isPending && (
                <div className="flex justify-start">
                  <div className="bg-card border border-border px-4 py-3 rounded-lg rounded-bl-none">
                    <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>
          )}
        </div>
      </div>

      {/* Input */}
      <div className="border-t border-border/40 backdrop-blur-sm sticky bottom-0">
        <div className="container py-4 max-w-2xl">
          <div className="flex gap-2">
            <Input
              placeholder="Share your thoughts..."
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  handleSendMessage();
                }
              }}
              disabled={sendMessageMutation.isPending}
              className="h-11"
            />
            <Button
              onClick={handleSendMessage}
              disabled={!message.trim() || sendMessageMutation.isPending}
              className="bg-primary hover:bg-primary/90 text-primary-foreground"
              size="icon"
            >
              <Send className="w-4 h-4" />
            </Button>
          </div>
          <p className="text-xs text-muted-foreground mt-2">
            Press Enter to send • Shift+Enter for new line
          </p>
        </div>
      </div>
    </div>
  );
}
