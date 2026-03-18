import { Component, ChangeDetectionStrategy, computed, effect, inject } from '@angular/core';
import { Router } from '@angular/router';
import { IonHeader, IonContent, IonSegment, IonSegmentButton, IonLabel, IonList, IonItem, IonBadge, IonSpinner } from '@ionic/angular/standalone';
import { ToolbarComponent } from '@silver/tabata/ui';
import { AuthFacade } from '@silver/tabata/auth';
import { UserWorkoutsFacade } from '@silver/tabata/states/user-workouts';
import { WorkoutsFacade } from '@silver/tabata/states/workouts';

type TabValue = 'history' | 'most-used' | 'favorites';

@Component({
    selector: 'tbt-history',
    templateUrl: 'history.component.html',
    styleUrls: ['history.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush,
    imports: [IonHeader, IonContent, IonSegment, IonSegmentButton, IonLabel, IonList, IonItem, IonBadge, IonSpinner, ToolbarComponent]
})
export class HistoryComponent {
    private readonly authFacade = inject(AuthFacade);
    private readonly userWorkoutsFacade = inject(UserWorkoutsFacade);
    private readonly workoutsFacade = inject(WorkoutsFacade);
    private readonly router = inject(Router);

    readonly user = this.authFacade.user;
    readonly userWorkout = this.userWorkoutsFacade.userWorkout;
    readonly isLoading = this.userWorkoutsFacade.isLoading;
    readonly error = this.userWorkoutsFacade.error;

    selectedTab = 'history' as TabValue;

    readonly hasNoData = computed(() => {
        const uw = this.userWorkout();
        if (!uw) return true;
        return uw.workoutItems.length === 0 && uw.favoriteWorkouts.length === 0;
    });

    readonly sortedWorkoutItems = computed(() => {
        const items = this.userWorkout()?.workoutItems ?? [];
        return [...items].sort((a, b) => (b.startedAt || '').localeCompare(a.startedAt || ''));
    });

    readonly mostUsedWorkouts = computed(() => {
        const items = this.userWorkout()?.workoutItems ?? [];
        const byId = new Map<string, { count: number; lastStartedAt: string }>();
        for (const item of items) {
            const cur = byId.get(item.workoutId);
            const lastStarted = !cur || (item.startedAt || '') > (cur.lastStartedAt || '') ? item.startedAt : cur.lastStartedAt;
            byId.set(item.workoutId, { count: (cur?.count ?? 0) + 1, lastStartedAt: lastStarted });
        }
        return Array.from(byId.entries())
            .map(([workoutId, data]) => ({ workoutId, ...data }))
            .sort((a, b) => b.count - a.count)
            .slice(0, 5);
    });

    readonly favoriteIds = computed(() => this.userWorkout()?.favoriteWorkouts ?? []);

    readonly workoutNameMap = computed(() => {
        const list = this.workoutsFacade.workouts();
        return new Map(list.map((w) => [w.id, w.name]));
    });

    constructor() {
        effect(() => {
            const uid = this.user()?.uid;
            if (uid) {
                this.userWorkoutsFacade.getOrCreateUserWorkout(uid);
            }
        });
        effect(() => {
            if (this.userWorkout()) {
                this.workoutsFacade.loadWorkouts();
            }
        });
    }

    getWorkoutName(workoutId: string): string {
        return this.workoutNameMap().get(workoutId) ?? workoutId;
    }

    formatDateTime(dateStr: string): string {
        if (!dateStr) return '';
        const d = new Date(dateStr);
        return isNaN(d.getTime()) ? dateStr : d.toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' });
    }

    openWorkoutDetails(workoutId: string): void {
        this.router.navigate(['/tabs/workouts', workoutId]);
    }
}
