import { Injectable, effect, inject, signal } from '@angular/core';
import { ExercisesFacade } from '@silver/tabata/states/exercises';
import { ToastService } from '@silver/tabata/helpers';

interface ExerciseFilterState {
    term: string;
    muscles: string[];
    equipment: string[];
    category: string[];
    level: string[];
}

@Injectable({ providedIn: 'root' })
export class ExerciseFilterService {
    private readonly facade = inject(ExercisesFacade);
    private readonly toast = inject(ToastService);

    private readonly filterState = signal<ExerciseFilterState>({
        term: '',
        muscles: [],
        equipment: [],
        category: [],
        level: []
    });

    private readonly pageSize = 20;
    private currentOffset = 0;
    private filterTimeoutId: number | null = null;
    private lastFilterInvokeTime = 0;
    private readonly filterDebounceMs = 800;
    private readonly minFilterIntervalMs = 2000;
    private cooldownUntil = 0;
    private readonly cooldownMs = 8000;
    private cooldownTimeoutId: number | null = null;

    constructor() {
        effect(
            () => {
                const err = this.facade.error();
                if (!err) return;
                const lower = String(err).toLowerCase();
                if (lower.includes('429') || lower.includes('too many requests')) {
                    const now = Date.now();
                    this.cooldownUntil = now + this.cooldownMs;

                    if (this.cooldownTimeoutId !== null) {
                        clearTimeout(this.cooldownTimeoutId);
                    }

                    this.cooldownTimeoutId = window.setTimeout(() => {
                        this.cooldownUntil = 0;
                        this.cooldownTimeoutId = null;
                        this.facade.clearError();
                    }, this.cooldownMs);

                    void this.toast.show('Too many requests to ExerciseDB. Please wait a moment and try again.');
                }
            },
            { allowSignalWrites: true }
        );

        effect(
            () => {
                const now = Date.now();
                if (now < this.cooldownUntil) {
                    return;
                }

                const { term, muscles, equipment, category, level } = this.filterState();

                const hasOtherFilters = muscles.length > 0 || equipment.length > 0 || category.length > 0 || level.length > 0;
                if (!hasOtherFilters && term.length > 0 && term.length < 3) {
                    return;
                }
                // Local API behavior:
                // - muscles, equipment, category all support comma-separated OR:
                //   e.g. "chest,back" or "dumbbell,barbell".
                //   Muscles are matched against both primary and secondary muscles.
                const musclesParam = muscles.length > 0 ? muscles.join(',') : undefined;
                const equipmentParam = equipment.length > 0 ? equipment.join(',') : undefined;
                const categoryParam = category.length > 0 ? category.join(',') : undefined;
                const levelParam = level.length > 0 ? level.join(',') : undefined;

                if (this.filterTimeoutId !== null) {
                    clearTimeout(this.filterTimeoutId);
                }

                const timeSinceLast = now - this.lastFilterInvokeTime;
                const extraDelay = timeSinceLast < this.minFilterIntervalMs ? this.minFilterIntervalMs - timeSinceLast : 0;
                const delay = this.filterDebounceMs + extraDelay;

                this.filterTimeoutId = window.setTimeout(() => {
                    this.lastFilterInvokeTime = Date.now();
                    this.currentOffset = 0;
                    this.facade.filterExercises({
                        limit: this.pageSize,
                        offset: 0,
                        search: term || undefined,
                        muscles: musclesParam,
                        equipment: equipmentParam,
                        category: categoryParam,
                        level: levelParam,
                        sortBy: 'name',
                        sortOrder: 'desc'
                    });
                }, delay);
            },
            { allowSignalWrites: true }
        );
    }

    updateFilters(partial: Partial<ExerciseFilterState>): void {
        this.filterState.update((prev) => ({
            ...prev,
            ...partial
        }));
    }

    loadMore(): void {
        const now = Date.now();
        if (now < this.cooldownUntil) {
            return;
        }

        const { term, muscles, equipment, category, level } = this.filterState();

        const musclesParam = muscles.length > 0 ? muscles.join(',') : undefined;
        const equipmentParam = equipment.length > 0 ? equipment.join(',') : undefined;
        const categoryParam = category.length > 0 ? category.join(',') : undefined;
        const levelParam = level.length > 0 ? level.join(',') : undefined;

        this.facade.filterExercises({
            limit: this.pageSize,
            offset: this.currentOffset,
            search: term || undefined,
            muscles: musclesParam,
            equipment: equipmentParam,
            category: categoryParam,
            level: levelParam,
            sortBy: 'name',
            sortOrder: 'desc'
        });
        this.currentOffset += this.pageSize;
    }
}
