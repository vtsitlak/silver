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
            const draft: WorkoutDraft = { mainTargetBodypart: 'chest' };
            expect(toWorkoutInfoFormModelFromSnapshot(draft).mainTargetBodypart).toBe('chest');
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
