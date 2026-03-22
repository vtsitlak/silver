import { inject, Injectable } from '@angular/core';
import { AuthFacade } from '@silver/tabata/auth';
import { WorkoutEditorFacade } from '@silver/tabata/states/workout-editor';
import { type CreateWorkoutPayload, type UpdateWorkoutPayload, type TabataWorkout } from '@silver/tabata/states/workouts';
import { WorkoutsFacade } from '@silver/tabata/states/workouts';

function totalDurationMinutesFromDraft(draft: Partial<TabataWorkout>): number {
    const warmupSeconds = draft.warmup?.totalDurationSeconds ?? 0;
    const cooldownSeconds = draft.cooldown?.totalDurationSeconds ?? 0;
    const blocks = draft.blocks ?? [];
    const blocksSeconds = blocks.reduce((sum, block) => {
        const roundTotal = block.rounds * (block.workDurationSeconds + block.restDurationSeconds);
        return sum + roundTotal + (block.interBlockRestSeconds ?? 0);
    }, 0);
    const totalSeconds = warmupSeconds + blocksSeconds + cooldownSeconds;
    return Math.round(totalSeconds / 60);
}

export interface SubmitWorkoutOptions {
    /** Defaults to true. When true, navigates to `/tabs/workouts` on success. */
    navigateToWorkouts?: boolean;
    /** Defaults to `navigateToWorkouts` value. */
    showSuccessToast?: boolean;
    /** Defaults to true. */
    showErrorToast?: boolean;
    onSuccess?: (workout: TabataWorkout) => void;
}

@Injectable({ providedIn: 'root' })
export class WorkoutSubmitService {
    private readonly authFacade = inject(AuthFacade);
    private readonly workoutEditorFacade = inject(WorkoutEditorFacade);
    private readonly workoutsFacade = inject(WorkoutsFacade);

    /**
     * Submit current draft (create or update).
     */
    submitWorkout(options: SubmitWorkoutOptions = {}): void {
        const draft = this.workoutEditorFacade.workoutDraft();
        const isEditMode = this.workoutEditorFacade.isEditMode();
        const baseline = this.workoutEditorFacade.initialDraftSnapshot();
        const existingWorkoutId = baseline?.id;

        const userId = this.authFacade.user()?.uid ?? '';
        const navigateToWorkouts = options.navigateToWorkouts ?? true;
        const showSuccessToast = options.showSuccessToast ?? navigateToWorkouts;
        const showErrorToast = options.showErrorToast ?? true;

        if (isEditMode && existingWorkoutId) {
            const draftObj = draft as Record<string, unknown>;
            const rest = Object.fromEntries(Object.entries(draftObj).filter(([k]) => k !== 'updatedAt'));
            const payload: UpdateWorkoutPayload = {
                ...rest,
                totalDurationMinutes: totalDurationMinutesFromDraft(draft),
                updatedByUserId: userId
            };

            this.workoutsFacade
                .submitWorkoutAsUpdate(existingWorkoutId, payload, {
                    navigateToWorkouts,
                    showSuccessToast,
                    showErrorToast
                })
                .subscribe({
                    next: (workout) => options.onSuccess?.(workout),
                    error: () => undefined
                });
            return;
        }

        const merged = this.workoutEditorFacade.mergedWorkout() as Record<string, unknown>;
        const rest = Object.fromEntries(Object.entries(merged).filter(([k]) => k !== 'id' && k !== 'createdAt' && k !== 'updatedAt'));
        const payload: CreateWorkoutPayload = {
            ...rest,
            totalDurationMinutes: totalDurationMinutesFromDraft(this.workoutEditorFacade.workoutDraft()),
            createdByUserId: userId,
            updatedByUserId: userId
        } as CreateWorkoutPayload;
        this.workoutsFacade
            .submitWorkoutAsCreate(payload, {
                navigateToWorkouts,
                showSuccessToast,
                showErrorToast
            })
            .subscribe({
                next: (workout) => {
                    this.workoutEditorFacade.reset();
                    options.onSuccess?.(workout);
                },
                error: () => undefined
            });
    }
}
