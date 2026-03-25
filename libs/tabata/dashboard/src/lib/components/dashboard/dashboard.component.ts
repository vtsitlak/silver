import { Component, ChangeDetectionStrategy, computed, effect, inject } from '@angular/core';
import { Router } from '@angular/router';
import { IonHeader, IonContent, IonList, IonItem, IonLabel, IonButton, IonIcon, IonSpinner } from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { playCircle } from 'ionicons/icons';
import { ToolbarComponent } from '@silver/tabata/ui';
import { AuthFacade } from '@silver/tabata/auth';
import { UserWorkoutsFacade } from '@silver/tabata/states/user-workouts';
import { WorkoutsFacade } from '@silver/tabata/states/workouts';
import { resolveWorkoutName } from '@silver/tabata/helpers';

@Component({
    selector: 'tbt-dashboard',
    templateUrl: 'dashboard.component.html',
    styleUrls: ['dashboard.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush,
    imports: [IonHeader, IonContent, IonList, IonItem, IonLabel, IonButton, IonIcon, IonSpinner, ToolbarComponent]
})
export class DashboardComponent {
    private readonly authFacade = inject(AuthFacade);
    private readonly userWorkoutsFacade = inject(UserWorkoutsFacade);
    private readonly workoutsFacade = inject(WorkoutsFacade);
    private readonly router = inject(Router);

    readonly user = this.authFacade.user;
    readonly userWorkout = this.userWorkoutsFacade.userWorkout;
    readonly isLoading = this.userWorkoutsFacade.isLoading;

    readonly greeting = computed(() => {
        const u = this.user();
        if (!u) return '';
        const name = (u as { displayName?: string }).displayName?.trim();
        const email = (u as { email?: string }).email?.trim();
        return name || email || 'there';
    });

    readonly lastWorkoutItem = computed(() => {
        const items = this.userWorkout()?.workoutItems ?? [];
        return [...items].sort((a, b) => (b.startedAt || '').localeCompare(a.startedAt || ''))[0] ?? null;
    });

    readonly mostPopularWorkout = computed(() => {
        const items = this.userWorkout()?.workoutItems ?? [];
        const byId = new Map<string, { count: number; lastStartedAt: string }>();
        for (const item of items) {
            const cur = byId.get(item.workoutId);
            const lastStarted = !cur || (item.startedAt || '') > (cur.lastStartedAt || '') ? item.startedAt : cur.lastStartedAt;
            byId.set(item.workoutId, { count: (cur?.count ?? 0) + 1, lastStartedAt: lastStarted });
        }
        const sorted = Array.from(byId.entries())
            .map(([workoutId, data]) => ({ workoutId, ...data }))
            .sort((a, b) => b.count - a.count);
        return sorted[0] ?? null;
    });

    readonly favoriteIds = computed(() => this.userWorkout()?.favoriteWorkouts ?? []);

    readonly workoutNameMap = computed(() => {
        const list = this.workoutsFacade.workouts();
        return new Map(list.map((w) => [w.id, w.name]));
    });

    constructor() {
        addIcons({ playCircle });
        effect(() => {
            const uid = this.user()?.uid;
            if (uid) this.userWorkoutsFacade.getOrCreateUserWorkout(uid);
        });
        effect(() => {
            if (this.userWorkout()) this.workoutsFacade.loadWorkouts();
        });
    }

    getWorkoutName(workoutId: string): string {
        return resolveWorkoutName(this.workoutNameMap(), workoutId, this.workoutsFacade.hasWorkouts());
    }

    formatDateTime(dateStr: string): string {
        if (!dateStr) return '';
        const d = new Date(dateStr);
        return isNaN(d.getTime()) ? dateStr : d.toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' });
    }

    playWorkout(workoutId: string): void {
        this.router.navigate(['/workouts', workoutId, 'play']);
    }

    openWorkoutDetails(workoutId: string): void {
        this.router.navigate(['/tabs/workouts', workoutId]);
    }
}
