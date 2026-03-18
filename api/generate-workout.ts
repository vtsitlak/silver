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

function extractRequestedBlocks(description: string): number | null {
    const d = (description || '').toLowerCase();
    if (!d.trim()) return null;

    const wordToNum: Record<string, number> = {
        one: 1,
        two: 2,
        three: 3,
        four: 4,
        five: 5,
        six: 6,
        seven: 7,
        eight: 8,
        nine: 9,
        ten: 10
    };

    if (/\b(single|one)\s+block\b/.test(d)) return 1;

    const numMatch = d.match(/\b(\d+)\s+blocks?\b/);
    if (numMatch?.[1]) {
        const n = Number(numMatch[1]);
        if (Number.isFinite(n) && n > 0 && n <= 20) return n;
    }

    const wordMatch = d.match(/\b(one|two|three|four|five|six|seven|eight|nine|ten)\s+blocks?\b/);
    if (wordMatch?.[1]) return wordToNum[wordMatch[1]] ?? null;

    return null;
}

function enforceBlockCount<T extends { exerciseId: string }>(blocks: T[], requested: number): T[] {
    const safe = Array.isArray(blocks) ? blocks.filter((b) => b && typeof b.exerciseId === 'string') : [];
    if (requested <= 0) return safe;
    if (safe.length === requested) return safe;
    if (safe.length > requested) return safe.slice(0, requested);
    if (safe.length === 0) return [];
    const out = [...safe];
    while (out.length < requested) {
        const pick = safe[out.length % safe.length];
        if (!pick) break;
        out.push({ ...pick });
    }
    return out;
}

type PhaseOut = { totalDurationSeconds: number; movements: { exerciseId: string; durationSeconds: number }[] };

function extractRequestedPhaseSeconds(description: string, phase: 'warmup' | 'cooldown'): number | null {
    const d = (description || '').toLowerCase();
    if (!d.trim()) return null;

    // "no warmup", "skip cooldown", etc.
    const noRe = new RegExp(`\\b(no|skip|without)\\s+${phase}\\b`);
    if (noRe.test(d)) return 0;

    const phaseRe = phase === 'warmup' ? /warm\s*up/ : /cool\s*down/;

    // e.g. "warmup 3 min", "cooldown: 120s"
    const minsAfter = d.match(new RegExp(`${phaseRe.source}[^0-9]{0,12}(\\d{1,3})\\s*(min|mins|minutes|m)\\b`));
    if (minsAfter?.[1]) {
        const n = Number(minsAfter[1]);
        if (Number.isFinite(n) && n >= 0 && n <= 60) return n * 60;
    }
    const secsAfter = d.match(new RegExp(`${phaseRe.source}[^0-9]{0,12}(\\d{1,4})\\s*(sec|secs|seconds|s)\\b`));
    if (secsAfter?.[1]) {
        const n = Number(secsAfter[1]);
        if (Number.isFinite(n) && n >= 0 && n <= 3600) return n;
    }

    // e.g. "3 min warmup", "120s cooldown"
    const minsBefore = d.match(new RegExp(`\\b(\\d{1,3})\\s*(min|mins|minutes|m)\\b[^.]{0,12}${phaseRe.source}`));
    if (minsBefore?.[1]) {
        const n = Number(minsBefore[1]);
        if (Number.isFinite(n) && n >= 0 && n <= 60) return n * 60;
    }
    const secsBefore = d.match(new RegExp(`\\b(\\d{1,4})\\s*(sec|secs|seconds|s)\\b[^.]{0,12}${phaseRe.source}`));
    if (secsBefore?.[1]) {
        const n = Number(secsBefore[1]);
        if (Number.isFinite(n) && n >= 0 && n <= 3600) return n;
    }

    return null;
}

function enforcePhaseDuration(phase: PhaseOut, requestedSeconds: number): PhaseOut {
    if (requestedSeconds <= 0) {
        return { totalDurationSeconds: 0, movements: [] };
    }

    const movements = Array.isArray(phase.movements) ? phase.movements.filter((m) => m?.exerciseId) : [];
    if (movements.length === 0) {
        return { totalDurationSeconds: requestedSeconds, movements: [] };
    }

    const currentTotal = movements.reduce((sum, m) => sum + (Number(m.durationSeconds) || 0), 0);
    if (currentTotal <= 0) {
        const per = Math.floor(requestedSeconds / movements.length);
        const rem = requestedSeconds - per * movements.length;
        return {
            totalDurationSeconds: requestedSeconds,
            movements: movements.map((m, idx) => ({ ...m, durationSeconds: per + (idx === movements.length - 1 ? rem : 0) }))
        };
    }

    const scaled = movements.map((m) => ({ ...m, durationSeconds: Math.max(1, Math.round((m.durationSeconds / currentTotal) * requestedSeconds)) }));
    const scaledTotal = scaled.reduce((sum, m) => sum + m.durationSeconds, 0);
    const delta = requestedSeconds - scaledTotal;
    if (delta !== 0) {
        const last = scaled[scaled.length - 1];
        if (last) last.durationSeconds = Math.max(1, last.durationSeconds + delta);
    }

    return { totalDurationSeconds: requestedSeconds, movements: scaled };
}

function computeTotalDurationMinutes(output: {
    warmup: { totalDurationSeconds: number };
    blocks: { rounds: number; workDurationSeconds: number; restDurationSeconds: number; interBlockRestSeconds: number }[];
    cooldown: { totalDurationSeconds: number };
}): number {
    const warmupSeconds = output.warmup.totalDurationSeconds ?? 0;
    const cooldownSeconds = output.cooldown.totalDurationSeconds ?? 0;
    const blocksSeconds = (output.blocks ?? []).reduce((sum, b) => {
        const rounds = b.rounds ?? 8;
        const work = b.workDurationSeconds ?? 20;
        const rest = b.restDurationSeconds ?? 10;
        const between = b.interBlockRestSeconds ?? 60;
        return sum + rounds * (work + rest) + between;
    }, 0);
    return Math.round((warmupSeconds + blocksSeconds + cooldownSeconds) / 60);
}

function buildPrompt(input: {
    name: string;
    description: string;
    mainTargetBodypart: string;
    availableEquipments: string[];
    secondaryTargetBodyparts: string[];
    exercises: { exerciseId: string; name: string; targetMuscles?: string[]; equipments?: string[] }[];
    requestedBlocks: number | null;
    requestedWarmupSeconds: number | null;
    requestedCooldownSeconds: number | null;
}): string {
    const exerciseList = input.exercises
        .map((e) => `- ${e.exerciseId}: ${e.name} (targets: ${(e.targetMuscles || []).join(', ')}, equipment: ${(e.equipments || []).join(', ')})`)
        .join('\n');

    const equipmentList = ['body only', ...(input.availableEquipments || []).filter((e: string) => e !== 'Bodyweight')].join(', ');

    const requestedBlocksLine = input.requestedBlocks != null ? `- Requested number of blocks: ${input.requestedBlocks} (MUST match exactly)` : '';
    const requestedWarmupLine =
        input.requestedWarmupSeconds != null ? `- Requested warmup duration: ${input.requestedWarmupSeconds}s (MUST match exactly)` : '';
    const requestedCooldownLine =
        input.requestedCooldownSeconds != null ? `- Requested cooldown duration: ${input.requestedCooldownSeconds}s (MUST match exactly)` : '';

    return `You are an expert Tabata workout designer.
Design a workout that STRICTLY follows the user's brief and uses ONLY the exercise IDs from the list below. Do not invent any exercise IDs.
If the user explicitly specifies a constraint (e.g. number of blocks, total duration, specific structure), you MUST follow it even if it deviates from the “typical” guidelines below.
Do NOT add extra blocks or extra phases beyond what the user asked for. When the brief conflicts with default recommendations, the brief wins.

WORKOUT BRIEF (honor these in every phase):
- Name: ${input.name}
- Description: ${input.description}
- Main target body part: ${input.mainTargetBodypart}
- Secondary target body parts: ${(input.secondaryTargetBodyparts || []).join(', ') || 'none'}
- Available equipment: ${equipmentList}
${requestedBlocksLine}
${requestedWarmupLine}
${requestedCooldownLine}
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
- Default recommendation (ONLY if the user did not specify otherwise): Use 4–5 blocks for a full workout (~20 min of work).
- If the user says “one block” (or any specific number), output EXACTLY that many blocks.
- Rest between blocks: 1 minute (interBlockRestSeconds: 60) unless the user specifies a different rest.
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

            const requestedBlocks = extractRequestedBlocks(input.description ?? '');
            const requestedWarmupSeconds = extractRequestedPhaseSeconds(input.description ?? '', 'warmup');
            const requestedCooldownSeconds = extractRequestedPhaseSeconds(input.description ?? '', 'cooldown');
            const prompt = buildPrompt({
                name: input.name,
                description: input.description ?? '',
                mainTargetBodypart: input.mainTargetBodypart,
                availableEquipments: input.availableEquipments ?? [],
                secondaryTargetBodyparts: input.secondaryTargetBodyparts ?? [],
                exercises: input.exercises,
                requestedBlocks,
                requestedWarmupSeconds,
                requestedCooldownSeconds
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

            const baseOutput = {
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

            const warmup = requestedWarmupSeconds != null ? enforcePhaseDuration(baseOutput.warmup, requestedWarmupSeconds) : baseOutput.warmup;
            const cooldown = requestedCooldownSeconds != null ? enforcePhaseDuration(baseOutput.cooldown, requestedCooldownSeconds) : baseOutput.cooldown;
            const blocks = requestedBlocks != null ? enforceBlockCount(baseOutput.blocks, requestedBlocks) : baseOutput.blocks;
            const output = {
                ...baseOutput,
                warmup,
                blocks,
                cooldown,
                totalDurationMinutes: computeTotalDurationMinutes({
                    warmup,
                    blocks,
                    cooldown
                })
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
