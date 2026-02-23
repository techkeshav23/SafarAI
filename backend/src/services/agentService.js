/**
 * Agent Service - Agentic travel assistant with Gemini function calling.
 *
 * Architecture:
 *   User Query + History → Gemini (with tool definitions)
 *     → Tool Calls → Execute → Results → Gemini → Final Response
 *
 * Refactored to use modular components in ./agent/
 */
import { GoogleGenerativeAI } from "@google/generative-ai";
import dotenv from "dotenv";
import { parseIntent } from "./intentParser.js";
import {
  SYSTEM_INSTRUCTION,
  functionDeclarations,
} from "./agent/prompts.js";
import {
  executeTool,
  executeSearchHotels,
  executeSearchFlights,
  executeSearchActivities,
} from "./agent/tools.js";
import {
  buildMapActions,
  estimateCost,
  getStepText,
} from "./agent/helpers.js";

dotenv.config();

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");
const AGENT_MODEL = process.env.GEMINI_MODEL || "gemini-2.0-flash";

// ─── Main Agent Loop ────────────────────────────────────────────

/**
 * Run the agentic travel assistant.
 * @param {string} query - The user's natural language query.
 * @param {Array<{role: string, content: string}>} history - Conversation history (last N messages).
 * @returns {Promise<Object>} - Unified search response with steps, results, and actions.
 */
export async function runAgent(query, history = []) {
  const steps = [];
  const collected = {
    hotels: [],
    flights: [],
    activities: [],
    destination: null,
    origin: null,
    check_in: null,
    check_out: null,
    dataSource: "mock",
  };

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey || apiKey === "your_gemini_api_key_here") {
    console.warn("[Agent] No Gemini API key — using fallback.");
    return await runFallback(query, steps, collected);
  }

  steps.push({
    type: "thinking",
    text: "Understanding your travel request...",
  });

  try {
    const model = genAI.getGenerativeModel({
      model: AGENT_MODEL,
      tools: [{ functionDeclarations }],
      systemInstruction: SYSTEM_INSTRUCTION,
    });

    // Build Gemini chat history from conversation (keep last 6 messages for context)
    const chatHistory = (history || [])
      .slice(-6)
      .map((msg) => ({
        role: msg.role === "assistant" ? "model" : "user",
        parts: [{ text: msg.content }],
      }));

    const chat = model.startChat({ history: chatHistory });

    console.log("[Agent] Sending query to Gemini...");
    // Send user query
    let result = await chat.sendMessage(query);
    console.log("[Agent] Gemini response received.");
    let response = result.response;

    // Agent loop — handle function calls iteratively
    let iterations = 0;
    const MAX_ITERATIONS = 5;

    while (iterations < MAX_ITERATIONS) {
      console.log(`[Agent] Iteration ${iterations + 1}: Checking function calls...`);
      const functionCalls = response.functionCalls();
      if (!functionCalls || functionCalls.length === 0) {
          console.log("[Agent] No function calls found. Loop ending.");
          break;
      }
      
      console.log(`[Agent] Found ${functionCalls.length} function calls:`, functionCalls.map(f => f.name));

      // Execute all function calls in parallel for speed
      const toolResponses = await Promise.all(
        functionCalls.map(async (call) => {
          steps.push({
            type: "tool_call",
            tool: call.name,
            text: getStepText(call.name, call.args),
          });

          const toolResult = await executeTool(
            call.name,
            call.args,
            collected
          );

          return {
            functionResponse: {
              name: call.name,
              response: toolResult,
            },
          };
        })
      );

      steps.push({
        type: "analyzing",
        text: "Analyzing results and comparing options...",
      });

      // Send tool results back to Gemini for synthesis
      result = await chat.sendMessage(toolResponses);
      response = result.response;
      iterations++;
    }

    const summary =
      response.text() || "Here are the best options I found for you!";

    steps.push({
      type: "done",
      text: "Done! Here are your personalized results.",
    });

    const actions = buildMapActions(collected);

    return {
      summary,
      steps,
      destination: collected.destination || "Multiple",
      origin: collected.origin || null,
      dates_suggestion: null,
      check_in: collected.check_in,
      check_out: collected.check_out,
      search_params: collected.search_params,
      hotels: collected.hotels,
      flights: collected.flights,
      activities: collected.activities,
      actions,
      total_estimated_cost: estimateCost(collected),
      ai_reasoning: `Agent completed in ${iterations} tool-call round(s)`,
      data_source: collected.dataSource,
    };
  } catch (error) {
    console.error("[Agent] Loop error, falling back:", error.message);
    steps.push({ type: "error", text: "Switching to direct search..." });
    return await runFallback(query, steps, collected);
  }
}

// ─── Fallback (no Gemini or on error) ───────────────────────────

async function runFallback(query, steps = [], collected = {}) {
  // Ensure lists exist
  if (!collected.hotels) collected.hotels = [];
  if (!collected.flights) collected.flights = [];
  if (!collected.activities) collected.activities = [];

  try {
    // Use keyword-based intent parsing (works without Gemini)
    const intent = await parseIntent(query);
    const destination = intent.destination || "";

    steps.push({
      type: "tool_call",
      tool: "search_hotels",
      text: `Searching hotels in ${destination || "your destination"}...`,
    });
    steps.push({
      type: "tool_call",
      tool: "search_flights",
      text: `Finding flights to ${destination || "your destination"}...`,
    });
    steps.push({
      type: "tool_call",
      tool: "search_activities",
      text: "Looking for activities...",
    });

    // Parallel search execution
    await Promise.all([
      executeSearchHotels(
        {
          destination,
          check_in: intent.check_in,
          check_out: intent.check_out,
          budget_max: intent.budget_max,
          style_tags: intent.style_tags,
          themes: intent.themes,
        },
        collected
      ),
      executeSearchFlights(
        {
          destination,
          origin: intent.origin,
          departure_date: intent.check_in,
        },
        collected
      ),
      executeSearchActivities(
        { destination, themes: intent.themes },
        collected
      ),
    ]);

    steps.push({ type: "done", text: "Search complete." });

    const dest =
      collected.destination || destination || "your destination";
    let summary = `Here are the best travel options for **${dest}**!`;
    if (collected.hotels.length > 0) {
      summary += `\n\n🏨 Top hotel: **${collected.hotels[0].name}** — $${collected.hotels[0].price_per_night}/night`;
    }
    if (collected.flights.length > 0) {
      summary += `\n✈️ Best flight: **${collected.flights[0].airline}** — $${collected.flights[0].price}`;
    }

    return {
      summary,
      steps,
      destination: dest,
      origin: collected.origin || intent.origin || null,
      dates_suggestion: null,
      check_in: collected.check_in || intent.check_in,
      check_out: collected.check_out || intent.check_out,
      hotels: collected.hotels,
      flights: collected.flights,
      activities: collected.activities,
      actions: buildMapActions(collected),
      total_estimated_cost: estimateCost(collected),
      ai_reasoning: `Fallback search. Intent: ${JSON.stringify(intent)}`,
      data_source: collected.dataSource || "mock",
    };
  } catch (err) {
    console.error("[Agent] Fallback also failed:", err);
    return {
      summary:
        "I'm having trouble searching right now. Please try again in a moment.",
      steps: [
        { type: "error", text: "Search service temporarily unavailable." },
      ],
      destination: "Multiple",
      hotels: [],
      flights: [],
      activities: [],
      actions: [],
      total_estimated_cost: 0,
      ai_reasoning: `Error: ${err.message}`,
      data_source: "none",
    };
  }
}
