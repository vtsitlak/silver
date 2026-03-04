import { Component, computed, inject, signal } from '@angular/core';
import { IonContent, IonHeader, IonSearchbar, IonButton, IonList, IonItem, IonIcon } from '@ionic/angular/standalone';
import { ToolbarComponent } from '@silver/tabata/ui';
import { WorkoutsFacade } from '@silver/tabata/tabata-workouts';

@Component({
    selector: 'tbt-workouts',
    templateUrl: 'workouts.component.html',
    styleUrls: ['workouts.component.scss'],
    standalone: true,
    imports: [IonHeader, ToolbarComponent, IonContent, IonSearchbar, IonButton, IonList, IonItem, IonIcon]
})
export class WorkoutsComponent {
    private readonly facade = inject(WorkoutsFacade);

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

    constructor() {
        this.facade.loadWorkouts();
    }

    onSearchInput(ev: Event): void {
        const customEv = ev as CustomEvent<{ value: string }>;
        this.searchTerm.set(customEv.detail?.value ?? '');
    }

    addWorkout(): void {
        // TODO: create new workout - not implemented yet
    }
}
