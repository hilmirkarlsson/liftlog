// Claude-powered coach. Sends the same compact training summary the local
// engine uses and gets back a plan in the identical shape, guaranteed by a
// JSON schema (structured outputs). Runs client-side with the user's own
// API key — LiftLog has no backend, so the key never leaves this device
// except to call the Anthropic API directly.
import Anthropic from "@anthropic-ai/sdk";

const PLAN_SCHEMA = {
  type: "object",
  properties: {
    weeklyFocus: {
      type: "string",
      description: "One sentence: the single most important thing to focus on this week.",
    },
    insights: {
      type: "array",
      description: "What to improve, most important first. 3-5 items.",
      items: {
        type: "object",
        properties: {
          area: { type: "string" },
          observation: { type: "string", description: "What the data shows, citing actual numbers." },
          recommendation: { type: "string", description: "Concrete, actionable advice." },
        },
        required: ["area", "observation", "recommendation"],
        additionalProperties: false,
      },
    },
    targets: {
      type: "array",
      description: "Per-split targets for the next session of that split.",
      items: {
        type: "object",
        properties: {
          split: { type: "string" },
          exercises: {
            type: "array",
            items: {
              type: "object",
              properties: {
                name: { type: "string" },
                sets: { type: "integer" },
                reps: { type: "integer", description: "Target reps per set." },
                weight: { type: ["number", "null"], description: "Target working weight in kg; null for bodyweight." },
                note: { type: "string", description: "One short line on why this target." },
              },
              required: ["name", "sets", "reps", "weight", "note"],
              additionalProperties: false,
            },
          },
        },
        required: ["split", "exercises"],
        additionalProperties: false,
      },
    },
  },
  required: ["weeklyFocus", "insights", "targets"],
  additionalProperties: false,
};

const SYSTEM_PROMPT = `You are the AI coach inside LiftLog, a strength training logbook. You receive a JSON summary of the user's recent training: every session with its split (muscle group), every exercise, and every set as "weight x reps", plus per-exercise trend labels and known all-time bests.

Produce a coaching plan:
- insights: tell the user what to improve, grounded in their actual numbers (stalls, skipped muscle groups, low frequency, rep ranges, volume swings, imbalances). Cite the data.
- targets: for each split they actually train, calculate what to hit next session, building on how they have been training. Apply progressive overload: small weight jumps (2.5kg, or 5kg on lifts over 100kg) when they hit the top of a rep range, extra reps at the same weight otherwise, and a ~10% deload when a lift has been stalled for 4+ sessions. Keep the exercises they already do unless something is clearly missing for that split; you may add at most one exercise per split, with a note explaining why. Weights are in kg and must land on 2.5kg increments; use null for bodyweight movements.
- weeklyFocus: the single most important point, one sentence.

Be specific and grounded — never invent sessions or numbers that are not in the data.`;

export async function generateAiPlan(apiKey, summary) {
  const client = new Anthropic({ apiKey, dangerouslyAllowBrowser: true });

  const stream = client.messages.stream({
    model: "claude-opus-4-8",
    max_tokens: 16000,
    thinking: { type: "adaptive" },
    system: SYSTEM_PROMPT,
    output_config: { format: { type: "json_schema", schema: PLAN_SCHEMA } },
    messages: [{ role: "user", content: JSON.stringify(summary) }],
  });

  const message = await stream.finalMessage();
  if (message.stop_reason === "refusal") {
    throw new Error("The AI declined to answer this request.");
  }
  const text = message.content.find((b) => b.type === "text")?.text;
  if (!text) throw new Error("Empty response from the AI coach.");
  return JSON.parse(text);
}
