import { useState } from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import { Heart, ChevronRight } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";

const LOVE_LANGUAGES = [
  { id: "acts_of_service", label: "Acts of Service", description: "Doing helpful things" },
  { id: "quality_time", label: "Quality Time", description: "Spending time together" },
  { id: "physical_touch", label: "Physical Touch", description: "Hugs, kisses, holding hands" },
  { id: "words_of_affirmation", label: "Words of Affirmation", description: "Compliments and encouragement" },
  { id: "receiving_gifts", label: "Receiving Gifts", description: "Thoughtful presents" },
];

export default function Onboarding() {
  const { user, isAuthenticated } = useAuth();
  const [, navigate] = useLocation();
  const [step, setStep] = useState(1);

  const [formData, setFormData] = useState({
    partnerName: "",
    anniversaryDate: "",
    loveLanguage: "",
    relationshipGoals: "",
  });

  const createRelationship = trpc.relationship.create.useMutation({
    onSuccess: () => {
      toast.success("Profile created! Welcome to HeartLink 💕");
      navigate("/dashboard");
    },
    onError: (error) => {
      toast.error("Failed to create profile. Please try again.");
      console.error(error);
    },
  });

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-muted-foreground">Redirecting to login...</p>
      </div>
    );
  }

  const handleNext = () => {
    if (step === 1 && !formData.partnerName) {
      toast.error("Please enter your partner's name");
      return;
    }
    if (step === 2 && !formData.anniversaryDate) {
      toast.error("Please select your anniversary date");
      return;
    }
    if (step === 3 && !formData.loveLanguage) {
      toast.error("Please select a love language");
      return;
    }
    setStep(step + 1);
  };

  const handleSubmit = async () => {
    if (!formData.partnerName || !formData.anniversaryDate || !formData.loveLanguage) {
      toast.error("Please fill in all required fields");
      return;
    }

    createRelationship.mutate({
      partnerName: formData.partnerName,
      anniversaryDate: new Date(formData.anniversaryDate),
      loveLanguage: formData.loveLanguage as any,
      relationshipGoals: formData.relationshipGoals || undefined,
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-accent/5 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="flex justify-center mb-4">
            <Heart className="w-10 h-10 text-primary fill-primary" />
          </div>
          <h1 className="text-3xl font-bold text-foreground mb-2">Welcome to HeartLink</h1>
          <p className="text-muted-foreground">Let's set up your relationship profile</p>
        </div>

        {/* Progress */}
        <div className="flex gap-2 mb-8">
          {[1, 2, 3, 4].map((s) => (
            <div
              key={s}
              className={`h-1 flex-1 rounded-full transition-colors ${
                s <= step ? "bg-primary" : "bg-border"
              }`}
            />
          ))}
        </div>

        {/* Step 1: Partner Name */}
        {step === 1 && (
          <Card className="p-8 space-y-6">
            <div>
              <h2 className="text-2xl font-semibold text-foreground mb-2">Tell us about your partner</h2>
              <p className="text-sm text-muted-foreground">What's their name?</p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="partnerName" className="text-foreground">
                Partner's Name
              </Label>
              <Input
                id="partnerName"
                placeholder="e.g., Sarah"
                value={formData.partnerName}
                onChange={(e) => setFormData({ ...formData, partnerName: e.target.value })}
                className="h-11"
              />
            </div>
          </Card>
        )}

        {/* Step 2: Anniversary Date */}
        {step === 2 && (
          <Card className="p-8 space-y-6">
            <div>
              <h2 className="text-2xl font-semibold text-foreground mb-2">Your special date</h2>
              <p className="text-sm text-muted-foreground">When did you start your relationship?</p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="anniversaryDate" className="text-foreground">
                Anniversary Date
              </Label>
              <Input
                id="anniversaryDate"
                type="date"
                value={formData.anniversaryDate}
                onChange={(e) => setFormData({ ...formData, anniversaryDate: e.target.value })}
                className="h-11"
              />
            </div>
          </Card>
        )}

        {/* Step 3: Love Language */}
        {step === 3 && (
          <Card className="p-8 space-y-6">
            <div>
              <h2 className="text-2xl font-semibold text-foreground mb-2">Your love language</h2>
              <p className="text-sm text-muted-foreground">How do you prefer to express and receive love?</p>
            </div>
            <div className="space-y-3">
              {LOVE_LANGUAGES.map((lang) => (
                <button
                  key={lang.id}
                  onClick={() => setFormData({ ...formData, loveLanguage: lang.id })}
                  className={`w-full p-4 rounded-lg border-2 text-left transition-all ${
                    formData.loveLanguage === lang.id
                      ? "border-primary bg-primary/5"
                      : "border-border hover:border-primary/30"
                  }`}
                >
                  <div className="font-medium text-foreground">{lang.label}</div>
                  <div className="text-sm text-muted-foreground">{lang.description}</div>
                </button>
              ))}
            </div>
          </Card>
        )}

        {/* Step 4: Relationship Goals */}
        {step === 4 && (
          <Card className="p-8 space-y-6">
            <div>
              <h2 className="text-2xl font-semibold text-foreground mb-2">Your relationship goals</h2>
              <p className="text-sm text-muted-foreground">What would you like to achieve together? (optional)</p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="goals" className="text-foreground">
                Goals & Aspirations
              </Label>
              <Textarea
                id="goals"
                placeholder="e.g., Build stronger communication, plan more adventures together, deepen emotional intimacy..."
                value={formData.relationshipGoals}
                onChange={(e) => setFormData({ ...formData, relationshipGoals: e.target.value })}
                className="min-h-32 resize-none"
              />
            </div>
          </Card>
        )}

        {/* Buttons */}
        <div className="flex gap-3 mt-8">
          {step > 1 && (
            <Button
              variant="outline"
              onClick={() => setStep(step - 1)}
              className="flex-1"
            >
              Back
            </Button>
          )}
          {step < 4 ? (
            <Button
              onClick={handleNext}
              className="flex-1 bg-primary hover:bg-primary/90 text-primary-foreground"
            >
              Next
              <ChevronRight className="w-4 h-4 ml-2" />
            </Button>
          ) : (
            <Button
              onClick={handleSubmit}
              disabled={createRelationship.isPending}
              className="flex-1 bg-primary hover:bg-primary/90 text-primary-foreground"
            >
              {createRelationship.isPending ? "Creating..." : "Get Started"}
              <Heart className="w-4 h-4 ml-2" />
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
