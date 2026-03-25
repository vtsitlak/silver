import { Component, ChangeDetectionStrategy, inject, effect, computed } from '@angular/core';
import {
    IonHeader,
    IonToolbar,
    IonTitle,
    IonButtons,
    IonButton,
    IonContent,
    IonCard,
    IonCardHeader,
    IonCardTitle,
    IonCardContent,
    IonList,
    IonItem,
    IonLabel,
    IonChip,
    IonIcon,
    IonSpinner,
    ModalController
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { timeOutline, fitnessOutline, flashOutline, saveOutline, refreshOutline, closeOutline } from 'ionicons/icons';
import { WorkoutEditorFacade } from '@silver/tabata/states/workout-editor';
import { WorkoutSubmitService } from '../../services/workout-submit.service';
import { ExercisesFacade } from '@silver/tabata/states/exercises';
import { WorkoutsFacade } from '@silver/tabata/states/workouts';
import { formatDurationMinutes, getBlockDurationMinutes, formatSecondsToMinutes, resolveExerciseName } from '@silver/tabata/helpers';
@Component({
    selector: 'tbt-ai-workout-preview-modal',
    templateUrl: './ai-workout-preview-modal.component.html',
    styleUrls: ['./ai-workout-preview-modal.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush,
    imports: [
        IonHeader,
        IonToolbar,
        IonTitle,
        IonButtons,
        IonButton,
        IonContent,
        IonCard,
        IonCardHeader,
        IonCardTitle,
        IonCardContent,
        IonList,
        IonItem,
        IonLabel,
        IonChip,
        IonIcon,
        IonSpinner
    ]
})
export class AiWorkoutPreviewModalComponent {
    private readonly facade = inject(WorkoutEditorFacade);
    private readonly submitService = inject(WorkoutSubmitService);
    private readonly exercisesFacade = inject(ExercisesFacade);
    private readonly workoutsFacade = inject(WorkoutsFacade);
    private readonly modalCtrl = inject(ModalController);

    readonly draft = this.facade.workoutDraft;
    readonly isSaving = this.workoutsFacade.isSaving;
    readonly exercisesMap = this.exercisesFacade.exercisesMap;
    readonly hasExercisesMap = computed(() => Object.keys(this.exercisesMap()).length > 0);

    readonly formatDurationMinutes = formatDurationMinutes;
    readonly getBlockDurationMinutes = getBlockDurationMinutes;
    readonly formatSecondsToMinutes = formatSecondsToMinutes;

    /** Collect exercise IDs from draft and load map when draft has structure. */
    private readonly exerciseIds = computed(() => {
        const d = this.draft();
        const ids: string[] = [];
        d.blocks?.forEach((b) => b.exerciseId && ids.push(b.exerciseId));
        d.warmup?.movements?.forEach((m) => m.exerciseId && ids.push(m.exerciseId));
        d.cooldown?.movements?.forEach((m) => m.exerciseId && ids.push(m.exerciseId));
        return [...new Set(ids)];
    });

    constructor() {
        addIcons({
            timeOutline,
            fitnessOutline,
            flashOutline,
            saveOutline,
            refreshOutline,
            closeOutline
        });
        effect(() => {
            const ids = this.exerciseIds();
            if (ids.length > 0) {
                this.exercisesFacade.loadExercisesMap(ids);
            }
        });
    }

    getExerciseName(exerciseId: string): string {
        return resolveExerciseName(this.exercisesMap(), exerciseId, this.hasExercisesMap());
    }

    getExerciseImage(exerciseId: string): string {
        const images = this.exercisesMap()[exerciseId]?.images;
        return images?.length ? images[0] : '';
    }

    onSave(): void {
        this.submitService.submitWorkout({
            navigateToWorkouts: false,
            showSuccessToast: false,
            showErrorToast: true,
            onSuccess: (workout) => this.modalCtrl.dismiss({ workout }, 'save')
        });
    }

    onTryAgain(): void {
        this.modalCtrl.dismiss(null, 'tryAgain');
    }

    onCancel(): void {
        this.modalCtrl.dismiss(null, 'cancel');
    }
}
