/**
 * Vercel serverless handler for AI workout generation.
 * Uses Genkit with Google AI (Gemini).
 *
 * Env:
 * - GEMINI_API_KEY or GOOGLE_GENAI_API_KEY: API key from https://aistudio.google.com/apikey
 * - GEMINI_MODEL (optional): Model id, e.g. gemini-3-flash-preview.
 *   Default: gemini-3-flash-preview.
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
type BodyRegion = 'Upper Body' | 'Lower Body' | 'Full Body' | 'Core';

const TARGET_MUSCLES_BY_REGION: Record<Exclude<BodyRegion, 'Full Body'>, string[]> = {
    'Upper Body': ['neck', 'shoulders', 'chest', 'biceps', 'triceps', 'forearms', 'traps', 'lats', 'middle back'],
    'Lower Body': ['quadriceps', 'hamstrings', 'glutes', 'calves', 'abductors', 'adductors'],
    Core: ['abdominals', 'lower back']
};

const ALL_MUSCLES_FULL_BODY = Array.from(
    new Set([...TARGET_MUSCLES_BY_REGION['Upper Body'], ...TARGET_MUSCLES_BY_REGION['Lower Body'], ...TARGET_MUSCLES_BY_REGION['Core']])
);

function getTargetMusclesForRegions(mainRegion: string, secondaryRegions: string[]): { muscles: string[]; isFullBody: boolean } {
    const main = (mainRegion as BodyRegion) ?? 'Upper Body';
    const secondary = Array.isArray(secondaryRegions) ? (secondaryRegions as BodyRegion[]) : [];

    if (main === 'Full Body') {
        return { muscles: [...ALL_MUSCLES_FULL_BODY], isFullBody: true };
    }

    const musclesSet = new Set<string>(TARGET_MUSCLES_BY_REGION[main] ?? []);
    for (const r of secondary) {
        if (r === 'Full Body') {
            ALL_MUSCLES_FULL_BODY.forEach((m) => musclesSet.add(m));
            continue;
        }
        (TARGET_MUSCLES_BY_REGION[r] ?? []).forEach((m) => musclesSet.add(m));
    }
    return { muscles: [...musclesSet], isFullBody: false };
}

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

function buildGenerateWorkoutPrompt(input: {
    name: string;
    description: string;
    mainTargetBodypart: string;
    availableEquipments: string[];
    secondaryTargetBodyparts: string[];
    level?: string;
    primaryGoal?: string;
    exercises: {
        exerciseId: string;
        name: string;
        targetMuscles?: string[];
        secondaryMuscles?: string[];
        equipments?: string[];
        category?: string[];
        level?: string;
    }[];
    requestedBlocks?: number | null;
    requestedWarmupSeconds?: number | null;
    requestedCooldownSeconds?: number | null;
}): string {
    const { muscles: targetMuscles, isFullBody } = getTargetMusclesForRegions(input.mainTargetBodypart, input.secondaryTargetBodyparts);
    const targetMusclesList = targetMuscles.length > 0 ? targetMuscles.join(', ') : '';

    const primaryGoalToCategorySlug = (goal: string): string => {
        switch (goal) {
            case 'Strength':
                return 'strength';
            case 'Cardio':
                return 'cardio';
            case 'Explosion':
                return 'plyometrics';
            default:
                return goal.toLowerCase();
        }
    };
    const goalCategorySlug = primaryGoalToCategorySlug(input.primaryGoal ?? 'unknown');

    const exerciseList = input.exercises
        .map((e) => {
            const category = (e.category ?? []).join(', ');
            const level = e.level ?? 'unknown';
            return `- ${e.exerciseId}: ${e.name} (main: ${(e.targetMuscles ?? []).join(', ')}, secondary: ${(e.secondaryMuscles ?? []).join(', ')}, category: ${category}, level: ${level})`;
        })
        .join('\n');

    const requestedBlocksLine = input.requestedBlocks != null ? `- Requested number of blocks: ${input.requestedBlocks} (MUST match exactly)` : '';
    const requestedWarmupLine =
        input.requestedWarmupSeconds != null ? `- Requested warmup duration: ${input.requestedWarmupSeconds}s (MUST match exactly)` : '';
    const requestedCooldownLine =
        input.requestedCooldownSeconds != null ? `- Requested cooldown duration: ${input.requestedCooldownSeconds}s (MUST match exactly)` : '';

    const fullBodyInstruction = isFullBody
        ? `
FULL BODY: The target includes all muscle groups (Upper Body, Lower Body, Core). You MUST balance the workout across body parts: include a mix of exercises that target upper body, lower body, and core. Do not cluster all blocks in one region; spread them so the workout is balanced.`
        : '';

    return `You are an expert Tabata workout designer.
Design a workout that STRICTLY follows the user's brief and uses ONLY the exercise IDs from the list below. Do not invent any exercise IDs.
If the user explicitly specifies a constraint (e.g. number of blocks, total duration, specific structure), you MUST follow it even if it deviates from the “typical” guidelines below.
Do NOT add extra blocks or extra phases beyond what the user asked for. When the brief conflicts with default recommendations, the brief wins.

WORKOUT BRIEF (honor these in every phase):
- Name: ${input.name}
- Description: ${input.description}
- Main target body part: ${input.mainTargetBodypart}
- Secondary target body parts: ${input.secondaryTargetBodyparts.join(', ') || 'none'}
- Target muscles for this workout (choose exercises whose main OR secondary muscles overlap with these): ${targetMusclesList || 'all regions'}
- Workout level (difficulty tier): ${input.level ?? 'unknown'}
- Primary goal: ${input.primaryGoal ?? 'unknown'} (prefer exercise category: ${goalCategorySlug})
${requestedBlocksLine}
${requestedWarmupLine}
${requestedCooldownLine}
Note: Exercises are already prefiltered by available equipment before prompt generation. Prefer exercises whose category includes "${goalCategorySlug}".
${fullBodyInstruction}

EXERCISE SELECTION RULE:
For each phase (warmup, blocks, cooldown), select exercises where at least one of the exercise's main muscles (targetMuscles) or secondary muscles (secondaryMuscles) is in the target muscles list above. Prefer exercises whose main muscles match; secondary muscle match is also valid. Use the exercise name, category, and level to align with the workout name and description.

AVAILABLE EXERCISES (use only these exerciseId values):
${exerciseList}

---

WARMUP (5–10 minutes):
Purpose: Low-intensity joint and muscle preparation (safe “beginner level” warmup).
Technical Constraints (STRICT):
- Warmup MUST be built ONLY from exercises where category includes "cardio" OR category includes "stretching".
- Warmup MUST use exercise level "beginner" for every movement (ignore the workout’s main level).
- Warmup MUST NOT use exercises with category "plyometrics" or category "strength".
- Total warmup duration must be between 300–600 seconds (5–10 min). A usual target is ~5 minutes, but it may be shorter/longer as long as it stays <= 10 minutes.
- Pick 2–4 UNIQUE movements from the list (no exerciseId reuse anywhere in the workout). Each movement can be 60–120 seconds.

MAIN PHASE – TABATA BLOCKS:
- Each block = one exercise only, 8 rounds of 20 seconds work + 10 seconds rest (4 minutes per block).
- Default recommendation (ONLY if the user did not specify otherwise): Use 4–5 blocks for a full workout (~20 min of work).
- If the user says “one block” (or any specific number), output EXACTLY that many blocks.
- Rest between blocks: 1 minute (interBlockRestSeconds: 60) unless the user specifies a different rest.
- Choose blocks from exercises that match the workout targets, with category/level constraints below.
- STRICT UNIQUENESS: do not reuse any exerciseId across warmup, blocks, or cooldown.
- Category mix (3-category mix):
  - Allowed block categories are "strength", "cardio", and "plyometrics" ONLY (exclude "stretching" category entirely from the main blocks).
  - Prefer blocks whose category includes "${goalCategorySlug}" (primary goal bias).
- Primary goal bias: choose the majority of blocks from category "${goalCategorySlug}" (at least ceil(blockCount * 0.5)), when possible.
  - If the workout has 3 or more blocks, ensure at least one block from each of the three categories: strength + cardio + plyometrics.
- Downward Compatibility (STRICT):
  - Workout level "beginner" => ONLY exercises with level "beginner".
  - Workout level "intermediate" => exercises with level "beginner" or "intermediate".
  - Workout level "expert" => exercises with level "beginner", "intermediate", or "expert".
- Target matching: for every block, select exercises whose main OR secondary muscles overlap with the target muscles list above.
- Rounds: 8, workDurationSeconds: 20, restDurationSeconds: 10, interBlockRestSeconds: 60 for every block.

COOLDOWN (3–7 minutes):
Purpose: Lower intensity for recovery (no high-impact work).
Technical Constraints (STRICT):
- Cooldown MUST use ONLY exercises where category includes "stretching".
- Cooldown MUST use exercise level "beginner" for every movement (ignore the workout’s main level).
- Cooldown MUST exclude category "plyometrics" and exclude category "cardio" entirely.
- Total cooldown duration must be between 180–420 seconds (3–7 min).
- Pick 2–4 UNIQUE movements from the list (no exerciseId reuse anywhere in the workout). Each movement can be 60–120 seconds.

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
    "totalDurationSeconds": <number, between 180 and 420>,
    "movements": [{"exerciseId": "<id from list>", "durationSeconds": <number>}, ...]
  }
}

Rules: Use only exerciseIds from the list. Warmup must be 5–10 min (300–600 s). Cooldown must be 3–7 min (180–420 s). Main phase: 4–5 blocks, one exercise per block. Output valid JSON only.`;
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
        const modelId = (process.env['GEMINI_MODEL'] ?? 'gemini-3-flash-preview').trim() || 'gemini-3-flash-preview';

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
            level?: string;
            primaryGoal?: string;
            exercises?: {
                exerciseId: string;
                name: string;
                targetMuscles?: string[];
                equipments?: string[];
                category?: string[];
                level?: string;
            }[];
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
            const { googleAI } = await import('@genkit-ai/googleai');

            const ai = genkit({
                plugins: [googleAI({ apiKey })],
                // Use googleAI.model() instead of deprecated gemini(modelId).
                model: googleAI.model(modelId as `gemini-${string}`)
            });

            const requestedBlocks = extractRequestedBlocks(input.description ?? '');
            const requestedWarmupSeconds = extractRequestedPhaseSeconds(input.description ?? '', 'warmup');
            const requestedCooldownSeconds = extractRequestedPhaseSeconds(input.description ?? '', 'cooldown');
            const prompt = buildGenerateWorkoutPrompt({
                name: input.name,
                description: input.description ?? '',
                mainTargetBodypart: input.mainTargetBodypart,
                availableEquipments: input.availableEquipments ?? [],
                secondaryTargetBodyparts: input.secondaryTargetBodyparts ?? [],
                level: input.level,
                primaryGoal: input.primaryGoal,
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
                        error: 'AI quota limit reached. Try: (1) Set GEMINI_MODEL=gemini-3-flash-preview. (2) Check API key at https://aistudio.google.com/apikey and quota at https://ai.google.dev/gemini-api/docs/rate-limits'
                    }),
                    429
                );
            }
            return jsonResponse(JSON.stringify({ error: raw.length > 200 ? 'Generation failed' : raw }), 500);
        }
    }
};
