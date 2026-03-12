import { Component, ChangeDetectionStrategy, computed, inject, OnInit, signal } from '@angular/core';
import { Router, NavigationEnd } from '@angular/router';
import { filter } from 'rxjs/operators';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { IonContent, IonHeader, IonSearchbar, IonButton, IonList, IonItem, IonIcon } from '@ionic/angular/standalone';
import { ModalController } from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { add } from 'ionicons/icons';
import { ToolbarComponent } from '@silver/tabata/ui';
import { WorkoutsFacade, TabataWorkout } from '@silver/tabata/states/workouts';
import { ToastService } from '@silver/tabata/helpers';
import { WorkoutItemComponent } from '../workout-item/workout-item.component';
import { WorkoutDetailsModalComponent } from '../workout-details-modal/workout-details-modal.component';
import { WorkoutEditorFacade } from '@silver/tabata/states/workout-editor';

@Component({
    selector: 'tbt-workouts',
    templateUrl: 'workouts.component.html',
    styleUrls: ['workouts.component.scss'],
    standalone: true,
    changeDetection: ChangeDetectionStrategy.OnPush,
    imports: [IonHeader, ToolbarComponent, IonContent, IonSearchbar, IonButton, IonList, IonItem, IonIcon, WorkoutItemComponent]
})
export class WorkoutsComponent implements OnInit {
    private readonly facade = inject(WorkoutsFacade);
    private readonly router = inject(Router);
    private readonly modalCtrl = inject(ModalController);
    private readonly toast = inject(ToastService);
    private readonly workoutEditorFacade = inject(WorkoutEditorFacade);

    constructor() {
        addIcons({ add });
        this.router.events
            .pipe(
                filter((e): e is NavigationEnd => e instanceof NavigationEnd),
                filter(() => this.isWorkoutsListUrl()),
                takeUntilDestroyed()
            )
            .subscribe(() => this.facade.loadWorkouts());
    }

    ngOnInit(): void {
        this.facade.loadWorkouts();
    }

    private isWorkoutsListUrl(): boolean {
        const url = this.router.url;
        return url.includes('/workouts') && !url.includes('/workouts/edit') && !url.includes('/workouts/create') && !/\/workouts\/[^/]+$/.test(url);
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
        this.workoutEditorFacade.reset();
        this.router.navigate(['/tabs/workouts/create']);
    }

    async onDetailsClick(workout: TabataWorkout): Promise<void> {
        const modal = await this.modalCtrl.create({
            component: WorkoutDetailsModalComponent,
            componentProps: { workout }
        });
        await modal.present();
    }

    onEditClick(workout: TabataWorkout): void {
        this.workoutEditorFacade.setWorkout(workout);
        this.router.navigate(['/tabs/workouts/edit', workout.id, 'info']);
    }

    onPlayClick(workout: TabataWorkout): void {
        this.router.navigate(['/tabs/workouts', workout.id]);
    }

    onRemoveClick(workout: TabataWorkout): void {
        this.facade.removeWorkout(workout.id).subscribe({
            next: (res) => {
                if (res?.success) {
                    this.toast.showSuccess('Workout removed');
                } else {
                    this.toast.showError(this.facade.error() ?? 'Failed to remove workout');
                }
            },
            error: () => {
                this.toast.showError(this.facade.error() ?? 'Failed to remove workout');
            }
        });
    }
}
