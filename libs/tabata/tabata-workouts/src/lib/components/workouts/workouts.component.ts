import { Component, computed, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { IonContent, IonHeader, IonSearchbar, IonButton, IonList, IonItem, IonIcon } from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { add } from 'ionicons/icons';
import { ToolbarComponent } from '@silver/tabata/ui';
import { WorkoutsFacade } from '../../store/workouts.facade';

@Component({
    selector: 'tbt-workouts',
    templateUrl: 'workouts.component.html',
    styleUrls: ['workouts.component.scss'],
    standalone: true,
    imports: [IonHeader, ToolbarComponent, IonContent, IonSearchbar, IonButton, IonList, IonItem, IonIcon]
})
export class WorkoutsComponent {
    private readonly facade = inject(WorkoutsFacade);
    private readonly router = inject(Router);

    constructor() {
        addIcons({ add });
        this.facade.loadWorkouts();
    }

    readonly searchTerm = signal('');
    readonly workouts = this.facade.workouts;
    readonly isLoading = this.facade.isLoading;
    readonly error = this.facade.error;

    readonly filteredWorkouts = computed(() => {
        const term = this.searchTerm().trim().toLowerCase();
        const list = this.workouts();
        if (!term) return list;
        return list.filter((w) => w.name.toLowerCase().includes(term));
    });

    onSearchInput(ev: Event): void {
        const customEv = ev as CustomEvent<{ value: string }>;
        this.searchTerm.set(customEv.detail?.value ?? '');
    }

    addWorkout(): void {
        this.router.navigate(['/tabs/workouts/create']);
    }
}
