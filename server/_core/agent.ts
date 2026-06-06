import { invokeLLM } from "./llm";
import * as db from "../db";

export interface AgentFollowUp {
  type: "follow_up" | "check_in" | "reminder" | "suggestion";
  question: string;
  context: string;
  urgency: "low" | "medium" | "high";
}

/**
 * Generate a proactive follow-up question based on relationship context
 */
export async function generateFollowUp(
  relationshipId: number,
  partnerName: string,
  loveLanguage: string,
  lastCheckIn?: { mood: string; connectionScore: number; timestamp: Date }
): Promise<AgentFollowUp | null> {
  try {
    // Get relationship history and memories
    const history = await db.getRelationshipHistory(relationshipId, 10);
    const memories = await db.getAgentMemory(relationshipId);
    const recentInteractions = await db.getRecentAgentInteractions(relationshipId, 5);

    // Build context for the agent
    const contextParts = [
      `Partner's name: ${partnerName}`,
      `Love language: ${loveLanguage}`,
    ];

    if (lastCheckIn) {
      contextParts.push(
        `Last mood: ${lastCheckIn.mood} (connection score: ${lastCheckIn.connectionScore}/10)`
      );
    }

    if (history.length > 0) {
      const mistakes = history.filter((h) => h.eventType === "mistake");
      if (mistakes.length > 0) {
        contextParts.push(`Past mistakes to avoid: ${mistakes.map((m) => m.description).join(", ")}`);
      }
    }

    if (memories.length > 0) {
      const patterns = memories.filter((m) => m.memoryType === "pattern");
      if (patterns.length > 0) {
        contextParts.push(`Relationship patterns: ${patterns.map((p) => p.content).join(", ")}`);
      }
    }

    const systemPrompt = `You are a relationship advisor helping someone strengthen their connection with ${partnerName}. 
Your role is to ask proactive, insightful follow-up questions that help them:
1. Check in on their relationship
2. Remind them of important actions
3. Help them avoid past mistakes
4. Suggest meaningful gestures based on their love language (${loveLanguage})

Generate ONE specific, actionable follow-up question. Be conversational and warm.
Consider: ${contextParts.join("; ")}

Respond with ONLY the follow-up question, nothing else.`;

    const response = await invokeLLM({
      messages: [
        {
          role: "system",
          content: systemPrompt,
        },
        {
          role: "user",
          content: "What should I ask them about their relationship right now?",
        },
      ],
    });

    const messageContent = response.choices[0]?.message.content;
    const question = typeof messageContent === "string" ? messageContent : "";

    if (!question) return null;

    // Determine urgency based on context
    let urgency: "low" | "medium" | "high" = "medium";
    if (lastCheckIn && lastCheckIn.connectionScore < 5) {
      urgency = "high";
    } else if (lastCheckIn && lastCheckIn.mood.includes("sad")) {
      urgency = "high";
    }

    return {
      type: "follow_up",
      question,
      context: contextParts.join("; "),
      urgency,
    };
  } catch (error) {
    console.error("[Agent] Failed to generate follow-up:", error);
    return null;
  }
}

/**
 * Generate a reminder based on relationship patterns
 */
export async function generateReminder(
  relationshipId: number,
  partnerName: string,
  loveLanguage: string
): Promise<AgentFollowUp | null> {
  try {
    const reminders = [
      `Did you call ${partnerName} today? A quick call means a lot.`,
      `Send ${partnerName} a thoughtful message - she'd love to hear from you.`,
      `It's been a while - plan something special for ${partnerName}.`,
      `Check in with ${partnerName} about how she's feeling.`,
      `Do something thoughtful for ${partnerName} today.`,
    ];

    const loveLanguageReminders: Record<string, string[]> = {
      quality_time: [
        `Put your phone away and spend quality time with ${partnerName}.`,
        `Plan a date night with ${partnerName} soon.`,
      ],
      acts_of_service: [
        `Do something helpful for ${partnerName} today.`,
        `Help ${partnerName} with something she's been stressed about.`,
      ],
      words_of_affirmation: [
        `Tell ${partnerName} something you appreciate about her.`,
        `Send ${partnerName} a sincere compliment.`,
      ],
      physical_touch: [
        `Give ${partnerName} a hug or hold her hand.`,
        `Show ${partnerName} physical affection today.`,
      ],
      receiving_gifts: [
        `Surprise ${partnerName} with a small gift.`,
        `Pick up something ${partnerName} would like.`,
      ],
    };

    const allReminders = [...reminders, ...(loveLanguageReminders[loveLanguage] || [])];
    const randomReminder = allReminders[Math.floor(Math.random() * allReminders.length)];

    return {
      type: "reminder",
      question: randomReminder,
      context: `Based on ${partnerName}'s love language: ${loveLanguage}`,
      urgency: "medium",
    };
  } catch (error) {
    console.error("[Agent] Failed to generate reminder:", error);
    return null;
  }
}

/**
 * Generate a suggestion based on past mistakes
 */
export async function generateMistakePrevention(
  relationshipId: number,
  partnerName: string
): Promise<AgentFollowUp | null> {
  try {
    const mistakes = await db.getMistakes(relationshipId);

    if (mistakes.length === 0) {
      return null;
    }

    // Get the most recent mistake
    const recentMistake = mistakes[0];

    if (!recentMistake?.preventionTip) {
      return null;
    }

    return {
      type: "suggestion",
      question: `Remember: ${recentMistake.preventionTip}`,
      context: `Learning from past: ${recentMistake.description}`,
      urgency: "high",
    };
  } catch (error) {
    console.error("[Agent] Failed to generate mistake prevention:", error);
    return null;
  }
}

/**
 * Analyze user response and generate insight
 */
export async function analyzeResponse(
  relationshipId: number,
  question: string,
  response: string,
  partnerName: string
): Promise<{ insight: string; sentiment: string }> {
  try {
    const systemPrompt = `You are analyzing a response about someone's relationship with ${partnerName}.
Analyze the response and provide:
1. A brief insight about what this tells us about their relationship
2. The sentiment (positive, neutral, negative, or concerned)

Format your response as JSON: { "insight": "...", "sentiment": "..." }`;

    const analysisResponse = await invokeLLM({
      messages: [
        {
          role: "system",
          content: systemPrompt,
        },
        {
          role: "user",
          content: `Question: ${question}\nResponse: ${response}`,
        },
      ],
    });

    const messageContent = analysisResponse.choices[0]?.message.content;
    const content = typeof messageContent === "string" ? messageContent : "{}";
    const analysis = JSON.parse(content);

    return {
      insight: analysis.insight || "",
      sentiment: analysis.sentiment || "neutral",
    };
  } catch (error) {
    console.error("[Agent] Failed to analyze response:", error);
    return {
      insight: "",
      sentiment: "neutral",
    };
  }
}

/**
 * Learn from user interactions and update agent memory
 */
export async function learnFromInteraction(
  relationshipId: number,
  interactionType: string,
  userResponse: string,
  sentiment: string
): Promise<void> {
  try {
    // Extract patterns from responses
    if (sentiment === "negative" || sentiment === "concerned") {
      // Store as a potential issue
      await db.saveAgentMemory(
        relationshipId,
        "concern",
        `User expressed ${sentiment} sentiment: ${userResponse.substring(0, 100)}`,
        0.7
      );
    }

    if (sentiment === "positive") {
      // Store as a strength or positive pattern
      await db.saveAgentMemory(
        relationshipId,
        "strength",
        `Positive interaction: ${userResponse.substring(0, 100)}`,
        0.8
      );
    }
  } catch (error) {
    console.error("[Agent] Failed to learn from interaction:", error);
  }
}
