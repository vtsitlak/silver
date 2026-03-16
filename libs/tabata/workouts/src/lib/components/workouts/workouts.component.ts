import { Component, ChangeDetectionStrategy, computed, inject, signal } from '@angular/core';
import { Router, NavigationEnd } from '@angular/router';
import { filter } from 'rxjs/operators';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { debounceTime, distinctUntilChanged, skip } from 'rxjs/operators';
import { toObservable } from '@angular/core/rxjs-interop';
import { IonContent, IonHeader, IonSearchbar, IonButton, IonList, IonItem, IonIcon } from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { add } from 'ionicons/icons';
import { ToolbarComponent } from '@silver/tabata/ui';
import { WorkoutsFacade, TabataWorkout } from '@silver/tabata/states/workouts';
import { AuthFacade } from '@silver/tabata/auth';
import { ToastService } from '@silver/tabata/helpers';
import { WorkoutItemComponent } from '../workout-item/workout-item.component';
import { WorkoutEditorFacade } from '@silver/tabata/states/workout-editor';

@Component({
    selector: 'tbt-workouts',
    templateUrl: 'workouts.component.html',
    styleUrls: ['workouts.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush,
    imports: [IonHeader, ToolbarComponent, IonContent, IonSearchbar, IonButton, IonList, IonItem, IonIcon, WorkoutItemComponent]
})
export class WorkoutsComponent {
    private readonly facade = inject(WorkoutsFacade);
    private readonly authFacade = inject(AuthFacade);
    private readonly router = inject(Router);
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
            .subscribe(() => this.facade.loadWorkouts(this.searchTerm() || undefined));
        toObservable(this.searchTerm)
            .pipe(skip(1), debounceTime(300), distinctUntilChanged(), takeUntilDestroyed())
            .subscribe((term) => this.facade.loadWorkouts(term || undefined));
    }

    private isWorkoutsListUrl(): boolean {
        const url = this.router.url;
        return url.includes('/workouts') && !url.includes('/workouts/edit') && !url.includes('/workouts/create') && !/\/workouts\/[^/]+$/.test(url);
    }

    readonly searchTerm = signal('');
    readonly workouts = this.facade.workouts;
    readonly isLoading = this.facade.isLoading;
    readonly error = this.facade.error;

    /** Workouts created by the currently logged-in user. */
    readonly userWorkouts = computed(() => {
        const userId = (this.authFacade.user() as { uid?: string } | null)?.uid;
        const all = this.workouts();
        if (!userId) {
            return all;
        }
        return all.filter((w) => w.createdByUserId === userId);
    });

    onSearchInput(ev: Event): void {
        const customEv = ev as CustomEvent<{ value: string }>;
        this.searchTerm.set(customEv.detail?.value ?? '');
    }

    addWorkout(): void {
        this.workoutEditorFacade.reset();
        this.router.navigate(['/tabs/workouts/create']);
    }

    onDetailsClick(workout: TabataWorkout): void {
        this.router.navigate(['/tabs/workouts', workout.id]);
    }

    onEditClick(workout: TabataWorkout): void {
        this.workoutEditorFacade.setWorkout(workout);
        this.router.navigate(['/tabs/workouts/edit', workout.id, 'info']);
    }

    onPlayClick(workout: TabataWorkout): void {
        this.router.navigate(['/workouts', workout.id, 'play']);
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
