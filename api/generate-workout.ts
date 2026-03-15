/**
 * Vercel serverless handler for AI workout generation.
 * Uses Genkit with Google AI (Gemini).
 *
 * Env:
 * - GEMINI_API_KEY or GOOGLE_GENAI_API_KEY: API key from https://aistudio.google.com/apikey
 * - GEMINI_MODEL (optional): Model id, e.g. gemini-2.5-flash-lite, gemini-2.5-flash, gemini-2.5-pro.
 *   Default: gemini-2.5-flash-lite (good free-tier quota). Avoid gemini-2.0-flash (deprecated, quota often 0).
 *
 * Request body: GenerateWorkoutInput (name, description, mainTargetBodypart, availableEquipments, secondaryTargetBodyparts, exercises[]).
 * Response: GenerateWorkoutOutput (totalDurationMinutes, warmup, blocks, cooldown).
 */

const CORS_HEADERS: Record<string, string> = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type'
};

function jsonResponse(body: string, status: number): Response {
    return new Response(body, {
        status,
        headers: { 'Content-Type': 'application/json', ...CORS_HEADERS }
    });
}

function buildPrompt(input: {
    name: string;
    description: string;
    mainTargetBodypart: string;
    availableEquipments: string[];
    secondaryTargetBodyparts: string[];
    exercises: { exerciseId: string; name: string; targetMuscles: string[]; equipments: string[] }[];
}): string {
    const exerciseList = input.exercises
        .map((e) => `- ${e.exerciseId}: ${e.name} (targets: ${(e.targetMuscles || []).join(', ')}, equipment: ${(e.equipments || []).join(', ')})`)
        .join('\n');

    const equipmentList = ['body only', ...(input.availableEquipments || []).filter((e: string) => e !== 'Bodyweight')].join(', ');

    return `You are an expert Tabata workout designer. Design a workout that strictly follows the user's brief and uses ONLY the exercise IDs from the list below. Do not invent any exercise IDs.

WORKOUT BRIEF (honor these in every phase):
- Name: ${input.name}
- Description: ${input.description}
- Main target body part: ${input.mainTargetBodypart}
- Secondary target body parts: ${(input.secondaryTargetBodyparts || []).join(', ') || 'none'}
- Available equipment: ${equipmentList}
Note: body only is always available; choose exercises that match the target body parts and the listed equipment.

AVAILABLE EXERCISES (use only these exerciseId values):
${exerciseList}

---

WARMUP (5–10 minutes):
Purpose: Prepare muscles for high-intensity intervals. Total warmup duration must be 300–600 seconds (5–10 min).
- Prefer dynamic movements: e.g. jumping jacks, mountain climbers, high knees, butt kicks when bodyweight is available.
- If equipment is available: light cardio on bike/rower or myofascial release–style movements are also suitable.
- Pick 2–4 movements from the list that fit the main/secondary targets and equipment. Each movement can be 60–120 seconds.

MAIN PHASE – TABATA BLOCKS:
- Each block = one exercise only, 8 rounds of 20 seconds work + 10 seconds rest (4 minutes per block).
- Use 4–5 blocks for a full workout (~20 min of work); 1 minute rest between blocks (interBlockRestSeconds: 60).
- Choose different exercises per block that align with the main and secondary target body parts and available equipment.
- Rounds: 8, workDurationSeconds: 20, restDurationSeconds: 10, interBlockRestSeconds: 60 for every block.

COOLDOWN (5–10 minutes):
Purpose: Gradually lower heart rate. Total cooldown duration must be 300–600 seconds (5–10 min).
- Prefer low-intensity movements and stretching for the muscle groups worked: e.g. walking-in-place style moves, then static stretches.
- If equipment allows: light pedaling or resistance-band assisted stretching from the list.
- Pick 2–4 movements from the list; each can be 60–120 seconds.

---

Return a single JSON object with this exact structure (no markdown, no code fence):
{
  "totalDurationMinutes": <number, total of warmup + all blocks + cooldown in minutes>,
  "warmup": {
    "totalDurationSeconds": <number, between 300 and 600>,
    "movements": [{"exerciseId": "<id from list>", "durationSeconds": <number>}, ...]
  },
  "blocks": [
    {
      "rounds": 8,
      "workDurationSeconds": 20,
      "restDurationSeconds": 10,
      "exerciseId": "<id from list>",
      "interBlockRestSeconds": 60
    }
  ],
  "cooldown": {
    "totalDurationSeconds": <number, between 300 and 600>,
    "movements": [{"exerciseId": "<id from list>", "durationSeconds": <number>}, ...]
  }
}

Rules: Use only exerciseIds from the list. Warmup and cooldown each 5–10 min (300–600 s). Main phase: 4–5 blocks, one exercise per block. Output valid JSON only.`;
}

export default {
    async fetch(request: Request): Promise<Response> {
        if (request.method === 'OPTIONS') {
            return new Response(null, { status: 204, headers: CORS_HEADERS });
        }

        if (request.method !== 'POST') {
            return jsonResponse(JSON.stringify({ error: 'Method not allowed' }), 405);
        }

        const apiKey = process.env['GEMINI_API_KEY'] ?? process.env['GOOGLE_GENAI_API_KEY'];
        if (!apiKey) {
            return jsonResponse(JSON.stringify({ error: 'GEMINI_API_KEY (or GOOGLE_GENAI_API_KEY) must be set' }), 503);
        }
        const modelId = (process.env['GEMINI_MODEL'] ?? 'gemini-2.5-flash-lite').trim() || 'gemini-2.5-flash-lite';

        let body: unknown;
        try {
            body = await request.json();
        } catch {
            return jsonResponse(JSON.stringify({ error: 'Invalid JSON body' }), 400);
        }

        const input = body as {
            name?: string;
            description?: string;
            mainTargetBodypart?: string;
            availableEquipments?: string[];
            secondaryTargetBodyparts?: string[];
            exercises?: { exerciseId: string; name: string; targetMuscles?: string[]; equipments?: string[] }[];
        };

        if (!input?.name || !input?.mainTargetBodypart || !Array.isArray(input.exercises) || input.exercises.length === 0) {
            return jsonResponse(
                JSON.stringify({
                    error: 'Missing required fields: name, mainTargetBodypart, and non-empty exercises'
                }),
                400
            );
        }

        try {
            const { genkit } = await import('genkit');
            const { googleAI, gemini } = await import('@genkit-ai/googleai');

            const ai = genkit({
                plugins: [googleAI({ apiKey })],
                model: gemini(modelId)
            });

            const prompt = buildPrompt({
                name: input.name,
                description: input.description ?? '',
                mainTargetBodypart: input.mainTargetBodypart,
                availableEquipments: input.availableEquipments ?? [],
                secondaryTargetBodyparts: input.secondaryTargetBodyparts ?? [],
                exercises: input.exercises
            });

            const result = await ai.generate({ prompt });
            const text = typeof result?.text === 'string' ? result.text.trim() : '';
            const jsonMatch = text.match(/\{[\s\S]*\}/);
            const jsonStr = jsonMatch ? jsonMatch[0] : text;
            const parsed = JSON.parse(jsonStr) as {
                totalDurationMinutes?: number;
                warmup?: { totalDurationSeconds?: number; movements?: { exerciseId: string; durationSeconds: number }[] };
                blocks?: { rounds: number; workDurationSeconds: number; restDurationSeconds: number; exerciseId: string; interBlockRestSeconds: number }[];
                cooldown?: { totalDurationSeconds?: number; movements?: { exerciseId: string; durationSeconds: number }[] };
            };

            const output = {
                totalDurationMinutes: parsed.totalDurationMinutes ?? 30,
                warmup: {
                    totalDurationSeconds: parsed.warmup?.totalDurationSeconds ?? 240,
                    movements: parsed.warmup?.movements ?? []
                },
                blocks: parsed.blocks ?? [],
                cooldown: {
                    totalDurationSeconds: parsed.cooldown?.totalDurationSeconds ?? 120,
                    movements: parsed.cooldown?.movements ?? []
                }
            };

            return jsonResponse(JSON.stringify(output), 200);
        } catch (err) {
            const raw = err instanceof Error ? err.message : String(err);
            const isQuota = raw.includes('429') || raw.includes('quota') || raw.includes('Quota exceeded');
            if (isQuota) {
                return jsonResponse(
                    JSON.stringify({
                        error: 'AI quota limit reached. Try: (1) Set GEMINI_MODEL=gemini-2.5-flash-lite or gemini-2.5-flash (gemini-2.0-flash is deprecated and often has no free quota). (2) Check API key at https://aistudio.google.com/apikey and quota at https://ai.google.dev/gemini-api/docs/rate-limits'
                    }),
                    429
                );
            }
            return jsonResponse(JSON.stringify({ error: raw.length > 200 ? 'Generation failed' : raw }), 500);
        }
    }
};
