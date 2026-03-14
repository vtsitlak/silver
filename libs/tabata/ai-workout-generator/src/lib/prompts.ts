import type { GenerateWorkoutInput, ExerciseSummary } from './types';

/**
 * Builds the system + user prompt for the AI to generate a Tabata workout.
 * Uses only the provided exercises (by exerciseId) so the output is valid.
 */
export function buildGenerateWorkoutPrompt(input: GenerateWorkoutInput): string {
    const exerciseList = input.exercises
        .map((e) => `- ${e.exerciseId}: ${e.name} (targets: ${e.targetMuscles.join(', ')}, equipment: ${e.equipments.join(', ')})`)
        .join('\n');

    return `You are a Tabata workout designer. Generate a single JSON object for a Tabata workout. Use ONLY the exercise IDs listed below; do not invent IDs.

Workout brief:
- Name: ${input.name}
- Description: ${input.description}
- Main target body part: ${input.mainTargetBodypart}
- Secondary targets: ${input.secondaryTargetBodyparts.join(', ') || 'none'}
- Available equipment: ${input.availableEquipments.join(', ')}

Available exercises (use only these exerciseId values):
${exerciseList}

Return a JSON object with this exact structure (no markdown, no code fence):
{
  "totalDurationMinutes": <number, sum of warmup + blocks + cooldown in minutes>,
  "warmup": {
    "totalDurationSeconds": <number>,
    "movements": [{"exerciseId": "<id from list>", "durationSeconds": <number>}, ...]
  },
  "blocks": [
    {
      "rounds": 8,
      "workDurationSeconds": 20,
      "restDurationSeconds": 10,
      "exerciseId": "<id from list>",
      "interBlockRestSeconds": 60
    },
    ...
  ],
  "cooldown": {
    "totalDurationSeconds": <number>,
    "movements": [{"exerciseId": "<id from list>", "durationSeconds": <number>}, ...]
  }
}

Rules: warmup 3-5 min, 2-4 Tabata blocks, cooldown 2-4 min. Only use exerciseIds from the list. Output valid JSON only.`;
}
