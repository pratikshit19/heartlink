import { useAuth } from "@/_core/hooks/useAuth";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import { Heart, ChevronLeft, Plus, Calendar, Trash2 } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { useState, useEffect } from "react";
import { toast } from "sonner";

export default function Reminders() {
  const { isAuthenticated } = useAuth();
  const [, navigate] = useLocation();
  const [showForm, setShowForm] = useState(false);

  const [formData, setFormData] = useState({
    title: "",
    reminderDate: "",
    reminderType: "custom",
    description: "",
    isRecurring: false,
    recurringPattern: "",
  });

  const relationshipQuery = trpc.relationship.getOrCreate.useQuery();
  const remindersQuery = trpc.reminders.getAll.useQuery(
    { relationshipId: relationshipQuery.data?.id || 0 },
    { enabled: !!relationshipQuery.data?.id }
  );

  const createReminderMutation = trpc.reminders.create.useMutation({
    onSuccess: () => {
      toast.success("Reminder added!");
      setFormData({
        title: "",
        reminderDate: "",
        reminderType: "custom",
        description: "",
        isRecurring: false,
        recurringPattern: "",
      });
      setShowForm(false);
      remindersQuery.refetch();
    },
    onError: (error) => {
      toast.error("Failed to create reminder. Please try again.");
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
    if (!formData.title || !formData.reminderDate || !relationshipQuery.data) {
      toast.error("Please fill in all required fields");
      return;
    }

    createReminderMutation.mutate({
      relationshipId: relationshipQuery.data.id,
      title: formData.title,
      reminderDate: new Date(formData.reminderDate),
      reminderType: formData.reminderType as any,
      description: formData.description || undefined,
      isRecurring: formData.isRecurring,
      recurringPattern: (formData.recurringPattern || undefined) as "yearly" | "monthly" | "weekly" | undefined,
    });
  };

  const reminders = remindersQuery.data || [];

  if (relationshipQuery.isLoading || remindersQuery.isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p className="text-muted-foreground">Loading reminders...</p>
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
            <h1 className="font-semibold text-foreground">Important Dates</h1>
          </div>
          <Button
            onClick={() => setShowForm(!showForm)}
            className="bg-primary hover:bg-primary/90 text-primary-foreground"
            size="sm"
          >
            <Plus className="w-4 h-4 mr-2" />
            Add Reminder
          </Button>
        </div>
      </div>

      {/* Content */}
      <div className="container py-12 max-w-2xl">
        {/* Form */}
        {showForm && (
          <Card className="p-8 mb-8 bg-card/50 backdrop-blur space-y-6">
            <h2 className="text-xl font-semibold text-foreground">Add a New Reminder</h2>

            <div className="space-y-2">
              <Label htmlFor="title" className="text-foreground">
                Title
              </Label>
              <Input
                id="title"
                placeholder="e.g., Anniversary"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                className="h-11"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="date" className="text-foreground">
                Date
              </Label>
              <Input
                id="date"
                type="date"
                value={formData.reminderDate}
                onChange={(e) => setFormData({ ...formData, reminderDate: e.target.value })}
                className="h-11"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="type" className="text-foreground">
                Type
              </Label>
              <select
                id="type"
                value={formData.reminderType}
                onChange={(e) => setFormData({ ...formData, reminderType: e.target.value })}
                className="w-full h-11 px-3 rounded-lg border border-border bg-background text-foreground"
              >
                <option value="anniversary">Anniversary</option>
                <option value="birthday">Birthday</option>
                <option value="milestone">Milestone</option>
                <option value="custom">Custom</option>
              </select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description" className="text-foreground">
                Description (optional)
              </Label>
              <Textarea
                id="description"
                placeholder="Add any notes..."
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="min-h-20 resize-none"
              />
            </div>

            <div className="flex items-center gap-3">
              <input
                type="checkbox"
                id="recurring"
                checked={formData.isRecurring}
                onChange={(e) => setFormData({ ...formData, isRecurring: e.target.checked })}
                className="w-4 h-4"
              />
              <Label htmlFor="recurring" className="text-foreground cursor-pointer">
                Make this recurring
              </Label>
            </div>

            {formData.isRecurring && (
              <div className="space-y-2">
                <Label htmlFor="pattern" className="text-foreground">
                  Repeat
                </Label>
                <select
                  id="pattern"
                  value={formData.recurringPattern}
                  onChange={(e) => setFormData({ ...formData, recurringPattern: e.target.value })}
                  className="w-full h-11 px-3 rounded-lg border border-border bg-background text-foreground"
                >
                  <option value="">Select pattern</option>
                  <option value="yearly">Yearly</option>
                  <option value="monthly">Monthly</option>
                  <option value="weekly">Weekly</option>
                </select>
              </div>
            )}

            <div className="flex gap-3 pt-4">
              <Button
                variant="outline"
                onClick={() => setShowForm(false)}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button
                onClick={handleSubmit}
                disabled={createReminderMutation.isPending}
                className="flex-1 bg-primary hover:bg-primary/90 text-primary-foreground"
              >
                {createReminderMutation.isPending ? "Adding..." : "Add Reminder"}
              </Button>
            </div>
          </Card>
        )}

        {/* Reminders List */}
        <div className="space-y-3">
          {reminders.length === 0 ? (
            <Card className="p-8 text-center bg-card/50 backdrop-blur">
              <Calendar className="w-8 h-8 text-muted-foreground/50 mx-auto mb-3" />
              <p className="text-muted-foreground">No reminders yet. Add one to get started!</p>
            </Card>
          ) : (
            reminders.map((reminder) => (
              <Card
                key={reminder.id}
                className="p-6 flex items-start justify-between bg-card/50 backdrop-blur hover:border-primary/20 transition-colors"
              >
                <div className="flex items-start gap-4 flex-1">
                  <Calendar className="w-5 h-5 text-primary flex-shrink-0 mt-1" />
                  <div className="flex-1">
                    <h3 className="font-semibold text-foreground">{reminder.title}</h3>
                    <p className="text-sm text-muted-foreground mt-1">
                      {new Date(reminder.reminderDate).toLocaleDateString("en-US", {
                        weekday: "long",
                        year: "numeric",
                        month: "long",
                        day: "numeric",
                      })}
                    </p>
                    {reminder.description && (
                      <p className="text-sm text-muted-foreground mt-2">{reminder.description}</p>
                    )}
                    <div className="flex gap-2 mt-3">
                      <span className="text-xs px-2 py-1 rounded-full bg-primary/10 text-primary capitalize">
                        {reminder.reminderType}
                      </span>
                      {reminder.isRecurring && (
                        <span className="text-xs px-2 py-1 rounded-full bg-accent/10 text-accent-foreground capitalize">
                          {reminder.recurringPattern}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-destructive hover:text-destructive/90"
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </Card>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
