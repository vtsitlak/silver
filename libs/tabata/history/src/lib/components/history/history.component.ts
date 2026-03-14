import { Component, ChangeDetectionStrategy, computed, effect, inject } from '@angular/core';
import { IonHeader, IonContent, IonSegment, IonSegmentButton, IonLabel, IonList, IonItem, IonBadge, IonSpinner } from '@ionic/angular/standalone';
import { ToolbarComponent } from '@silver/tabata/ui';
import { AuthFacade } from '@silver/tabata/auth';
import { UserWorkoutsFacade } from '@silver/tabata/states/user-workouts';

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

    constructor() {
        effect(() => {
            const uid = this.user()?.uid;
            if (uid) {
                this.userWorkoutsFacade.getOrCreateUserWorkout(uid);
            }
        });
    }

    formatDate(dateStr: string): string {
        if (!dateStr) return '';
        const d = new Date(dateStr);
        return isNaN(d.getTime()) ? dateStr : d.toLocaleDateString(undefined, { dateStyle: 'medium' });
    }
}
