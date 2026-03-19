import { buildGenerateWorkoutPrompt } from './prompts';
import type { GenerateWorkoutInput } from './types';

jest.mock('@silver/tabata/helpers', () => ({
    getTargetMusclesForRegions: jest.fn((main: string, _secondary: string[]) => {
        if (main === 'Full Body') {
            return { muscles: ['quadriceps', 'chest', 'abdominals'], isFullBody: true };
        }
        return {
            muscles: ['neck', 'shoulders', 'chest', 'biceps', 'triceps', 'forearms', 'traps', 'lats', 'middle back'],
            isFullBody: false
        };
    })
}));

describe('buildGenerateWorkoutPrompt', () => {
    const baseInput: GenerateWorkoutInput = {
        name: 'Test Workout',
        description: 'Quick strength focus',
        mainTargetBodypart: 'Upper Body',
        availableEquipments: ['Bodyweight'],
        secondaryTargetBodyparts: [],
        exercises: [
            {
                exerciseId: 'ex1',
                name: 'Push-up',
                targetMuscles: ['chest', 'triceps'],
                secondaryMuscles: ['shoulders'],
                category: ['strength'],
                equipments: ['body only']
            }
        ]
    };

    it('should include workout name and description as goals', () => {
        const prompt = buildGenerateWorkoutPrompt(baseInput);
        expect(prompt).toContain('Test Workout');
        expect(prompt).toContain('Quick strength focus');
        expect(prompt).toContain("user's goals");
    });

    it('should include target muscles for non–Full Body', () => {
        const prompt = buildGenerateWorkoutPrompt(baseInput);
        expect(prompt).toContain('Target muscles for this workout');
        expect(prompt).toContain('chest');
        expect(prompt).toContain('triceps');
    });

    it('should include main and secondary muscles in exercise list', () => {
        const prompt = buildGenerateWorkoutPrompt(baseInput);
        expect(prompt).toContain('main: chest, triceps');
        expect(prompt).toContain('secondary: shoulders');
    });

    it('should include Full Body balance instruction when main target is Full Body', () => {
        const input: GenerateWorkoutInput = {
            ...baseInput,
            mainTargetBodypart: 'Full Body',
            secondaryTargetBodyparts: []
        };
        const prompt = buildGenerateWorkoutPrompt(input);
        expect(prompt).toContain('FULL BODY');
        expect(prompt).toContain('balance');
        expect(prompt).toContain('upper body, lower body, and core');
    });

    it('should include exercise selection rule for main/secondary muscles', () => {
        const prompt = buildGenerateWorkoutPrompt(baseInput);
        expect(prompt).toContain('main muscles (targetMuscles) or secondary muscles (secondaryMuscles)');
        expect(prompt).toContain('target muscles list');
    });
});
