import { Component, ChangeDetectionStrategy, input, output } from '@angular/core';
import { IonModal, IonHeader, IonToolbar, IonTitle, IonButtons, IonButton, IonContent, IonItem, IonLabel, IonInput } from '@ionic/angular/standalone';

@Component({
    selector: 'tbt-duration-input-modal',
    templateUrl: './duration-input-modal.component.html',
    styleUrl: './duration-input-modal.component.scss',
    changeDetection: ChangeDetectionStrategy.OnPush,
    imports: [IonModal, IonHeader, IonToolbar, IonTitle, IonButtons, IonButton, IonContent, IonItem, IonLabel, IonInput]
})
export class DurationInputModalComponent {
    readonly isOpen = input.required<boolean>();
    readonly exerciseName = input<string | null>(null);
    readonly durationSeconds = input.required<number>();

    readonly save = output<number>();
    readonly didDismiss = output<void>();
    readonly durationChange = output<number>();

    getExerciseNameDisplay(): string {
        const name = this.exerciseName();
        return name != null && typeof name === 'string' ? name : '';
    }

    onSave(): void {
        this.save.emit(this.durationSeconds());
    }

    onDismiss(): void {
        this.didDismiss.emit();
    }

    onDurationInput(event: Event): void {
        const value = (event as CustomEvent<{ value: string }>).detail?.value ?? '60';
        const num = parseInt(value, 10);
        const seconds = isNaN(num) ? 60 : Math.max(1, num);
        this.durationChange.emit(seconds);
    }
}
