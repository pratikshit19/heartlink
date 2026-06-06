import { describe, it, expect, vi, beforeEach } from "vitest";
import * as agent from "./_core/agent";
import * as db from "./db";

// Mock the database and LLM
vi.mock("./db");
vi.mock("./_core/llm");

describe("Agent System", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("generateReminder", () => {
    it("should generate a reminder based on love language", async () => {
      const reminder = await agent.generateReminder(1, "Sarah", "quality_time");

      expect(reminder).toBeDefined();
      expect(reminder?.type).toBe("reminder");
      expect(reminder?.question).toBeTruthy();
      expect(reminder?.context).toContain("quality_time");
    });

    it("should include acts_of_service specific reminders", async () => {
      const reminder = await agent.generateReminder(1, "Sarah", "acts_of_service");

      expect(reminder?.context).toContain("acts_of_service");
    });

    it("should include words_of_affirmation specific reminders", async () => {
      const reminder = await agent.generateReminder(1, "Sarah", "words_of_affirmation");

      expect(reminder?.context).toContain("words_of_affirmation");
    });

    it("should include physical_touch specific reminders", async () => {
      const reminder = await agent.generateReminder(1, "Sarah", "physical_touch");

      expect(reminder?.context).toContain("physical_touch");
    });

    it("should include receiving_gifts specific reminders", async () => {
      const reminder = await agent.generateReminder(1, "Sarah", "receiving_gifts");

      expect(reminder?.context).toContain("receiving_gifts");
    });

    it("should have medium urgency by default", async () => {
      const reminder = await agent.generateReminder(1, "Sarah", "quality_time");

      expect(reminder?.urgency).toBe("medium");
    });
  });

  describe("generateMistakePrevention", () => {
    it("should return null if no mistakes exist", async () => {
      vi.mocked(db.getMistakes).mockResolvedValue([]);

      const prevention = await agent.generateMistakePrevention(1, "Sarah");

      expect(prevention).toBeNull();
    });

    it("should generate prevention tip from past mistakes", async () => {
      const mockMistakes = [
        {
          id: 1,
          relationshipId: 1,
          eventType: "mistake",
          description: "Forgot her birthday",
          impact: "high",
          lesson: "Important dates matter",
          preventionTip: "Set calendar reminders for important dates",
          createdAt: new Date(),
        },
      ];

      vi.mocked(db.getMistakes).mockResolvedValue(mockMistakes);

      const prevention = await agent.generateMistakePrevention(1, "Sarah");

      expect(prevention).toBeDefined();
      expect(prevention?.type).toBe("suggestion");
      expect(prevention?.question).toContain("Set calendar reminders");
    });

    it("should return null if mistake has no prevention tip", async () => {
      const mockMistakes = [
        {
          id: 1,
          relationshipId: 1,
          eventType: "mistake",
          description: "Forgot her birthday",
          impact: "high",
          lesson: "Important dates matter",
          preventionTip: null,
          createdAt: new Date(),
        },
      ];

      vi.mocked(db.getMistakes).mockResolvedValue(mockMistakes);

      const prevention = await agent.generateMistakePrevention(1, "Sarah");

      expect(prevention).toBeNull();
    });
  });

  describe("analyzeResponse", () => {
    it("should return default values on LLM error", async () => {
      const analysis = await agent.analyzeResponse(
        1,
        "How are things going?",
        "Things are great!",
        "Sarah"
      );

      expect(analysis).toBeDefined();
      expect(analysis.sentiment).toBe("neutral");
      expect(analysis.insight).toBe("");
    });
  });

  describe("learnFromInteraction", () => {
    it("should save positive interactions as strengths", async () => {
      vi.mocked(db.saveAgentMemory).mockResolvedValue({
        id: 1,
        relationshipId: 1,
        memoryType: "strength",
        content: "Positive interaction",
        confidence: 0.8,
        lastUsed: null,
        usageCount: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      await agent.learnFromInteraction(
        1,
        "follow_up",
        "We had a great conversation today",
        "positive"
      );

      expect(db.saveAgentMemory).toHaveBeenCalledWith(
        1,
        "strength",
        expect.stringContaining("Positive interaction"),
        0.8
      );
    });

    it("should save negative interactions as concerns", async () => {
      vi.mocked(db.saveAgentMemory).mockResolvedValue({
        id: 1,
        relationshipId: 1,
        memoryType: "concern",
        content: "Negative interaction",
        confidence: 0.7,
        lastUsed: null,
        usageCount: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      await agent.learnFromInteraction(
        1,
        "follow_up",
        "We had a big argument",
        "negative"
      );

      expect(db.saveAgentMemory).toHaveBeenCalledWith(
        1,
        "concern",
        expect.stringContaining("negative sentiment"),
        0.7
      );
    });

    it("should save concerned interactions as concerns", async () => {
      vi.mocked(db.saveAgentMemory).mockResolvedValue({
        id: 1,
        relationshipId: 1,
        memoryType: "concern",
        content: "Concerned interaction",
        confidence: 0.7,
        lastUsed: null,
        usageCount: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      await agent.learnFromInteraction(
        1,
        "follow_up",
        "I'm worried about our relationship",
        "concerned"
      );

      expect(db.saveAgentMemory).toHaveBeenCalledWith(
        1,
        "concern",
        expect.stringContaining("concerned sentiment"),
        0.7
      );
    });

    it("should not save neutral interactions", async () => {
      await agent.learnFromInteraction(
        1,
        "follow_up",
        "Things are okay",
        "neutral"
      );

      expect(db.saveAgentMemory).not.toHaveBeenCalled();
    });
  });
});
