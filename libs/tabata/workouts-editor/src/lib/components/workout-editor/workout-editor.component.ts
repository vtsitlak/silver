import { Component, inject, OnInit, signal } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { IonHeader, IonContent, IonButton, IonInput, IonTextarea, IonItem, IonList, IonButtons, IonBackButton } from '@ionic/angular/standalone';
import { FormsModule } from '@angular/forms';
import { ToolbarComponent } from '@silver/tabata/ui';

@Component({
    selector: 'tbt-workout-editor',
    templateUrl: 'workout-editor.component.html',
    styleUrls: ['workout-editor.component.scss'],
    standalone: true,
    imports: [IonHeader, IonContent, IonButton, IonInput, IonTextarea, IonItem, IonList, IonButtons, IonBackButton, FormsModule, ToolbarComponent]
})
export class WorkoutEditorComponent implements OnInit {
    private readonly route = inject(ActivatedRoute);
    private readonly router = inject(Router);

    readonly workoutId = signal<string | null>(null);
    readonly isEditMode = signal(false);
    readonly pageTitle = signal('Create Workout');

    readonly workoutName = signal('');
    readonly workoutDescription = signal('');

    ngOnInit(): void {
        const id = this.route.snapshot.paramMap.get('workoutId');
        if (id) {
            this.workoutId.set(id);
            this.isEditMode.set(true);
            this.pageTitle.set('Edit Workout');
            this.loadWorkout(id);
        }
    }

    private loadWorkout(id: string): void {
        // TODO: Load workout data from service
        console.log('Loading workout:', id);
    }

    onSave(): void {
        const workout = {
            name: this.workoutName(),
            description: this.workoutDescription()
        };

        if (this.isEditMode()) {
            // TODO: Update existing workout
            console.log('Updating workout:', this.workoutId(), workout);
        } else {
            // TODO: Create new workout
            console.log('Creating workout:', workout);
        }

        this.router.navigate(['/tabs/workouts']);
    }

    onCancel(): void {
        this.router.navigate(['/tabs/workouts']);
    }
}
