import { createEmptyWorkoutInfoFormModel, EMPTY_WORKOUT_INFO_FORM_MODEL, toWorkoutInfoFormModelFromSnapshot, type WorkoutDraft } from './workout-editor.models';

describe('workout-editor.models', () => {
    describe('toWorkoutInfoFormModelFromSnapshot', () => {
        it('returns EMPTY_WORKOUT_INFO_FORM_MODEL when snapshot is null or undefined', () => {
            expect(toWorkoutInfoFormModelFromSnapshot(null)).toBe(EMPTY_WORKOUT_INFO_FORM_MODEL);
            expect(toWorkoutInfoFormModelFromSnapshot(undefined)).toBe(EMPTY_WORKOUT_INFO_FORM_MODEL);
        });

        it('normalizes empty or whitespace mainTargetBodypart to null', () => {
            const draft: WorkoutDraft = {
                mainTargetBodypart: '   ' as WorkoutDraft['mainTargetBodypart']
            };
            expect(toWorkoutInfoFormModelFromSnapshot(draft).mainTargetBodypart).toBeNull();
        });

        it('preserves non-empty mainTargetBodypart', () => {
            const draft: WorkoutDraft = { mainTargetBodypart: 'Upper Body' as const };
            expect(toWorkoutInfoFormModelFromSnapshot(draft).mainTargetBodypart).toBe('Upper Body');
        });

        it('normalizes missing or empty level to null', () => {
            expect(toWorkoutInfoFormModelFromSnapshot({}).level).toBeNull();
            expect(toWorkoutInfoFormModelFromSnapshot({ level: '   ' as WorkoutDraft['level'] }).level).toBeNull();
        });

        it('preserves non-empty level', () => {
            expect(toWorkoutInfoFormModelFromSnapshot({ level: 'expert' }).level).toBe('expert');
        });

        it('normalizes missing or empty primaryGoal to null', () => {
            expect(toWorkoutInfoFormModelFromSnapshot({}).primaryGoal).toBeNull();
            expect(toWorkoutInfoFormModelFromSnapshot({ primaryGoal: '   ' as WorkoutDraft['primaryGoal'] }).primaryGoal).toBeNull();
        });

        it('preserves non-empty primaryGoal', () => {
            expect(toWorkoutInfoFormModelFromSnapshot({ primaryGoal: 'Cardio' }).primaryGoal).toBe('Cardio');
        });
    });

    describe('createEmptyWorkoutInfoFormModel', () => {
        it('returns a new object with fresh array references', () => {
            const a = createEmptyWorkoutInfoFormModel();
            const b = createEmptyWorkoutInfoFormModel();
            expect(a).not.toBe(b);
            expect(a.availableEquipments).not.toBe(b.availableEquipments);
            expect(a.secondaryTargetBodyparts).not.toBe(b.secondaryTargetBodyparts);
        });
    });
});
