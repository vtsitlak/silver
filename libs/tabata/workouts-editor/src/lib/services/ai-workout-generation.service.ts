import { inject, Injectable } from '@angular/core';
import { type BodyRegion, type EquipmentCategory, equipmentOptions, type WorkoutLevel, type WorkoutPrimaryGoal } from '@silver/tabata/helpers';
import { ExercisesService } from '@silver/tabata/states/exercises';
import { AiWorkoutGeneratorService, type GenerateWorkoutOutput } from '@silver/tabata/ai-workout-generator';
import { ToastService } from '@silver/tabata/helpers';
import { EMPTY, Observable, firstValueFrom } from 'rxjs';
import { catchError, switchMap } from 'rxjs/operators';
import type { Exercise } from '@silver/tabata/states/exercises';

export interface AiWorkoutGenerationInput {
    name: string;
    description: string;
    mainTargetBodypart: BodyRegion;
    availableEquipments: EquipmentCategory[];
    secondaryTargetBodyparts: BodyRegion[];
    level: WorkoutLevel;
    primaryGoal: WorkoutPrimaryGoal;
}

@Injectable({ providedIn: 'root' })
export class AiWorkoutGenerationService {
    private readonly exercisesService = inject(ExercisesService);
    private readonly aiGenerator = inject(AiWorkoutGeneratorService);
    private readonly toast = inject(ToastService);

    generateWorkout(request: AiWorkoutGenerationInput): Observable<GenerateWorkoutOutput> {
        const equipmentParam = this.getEquipmentParamForCategories(request.availableEquipments ?? []);
        const levelParam = this.getExerciseLevelParam(request.level);

        return this.loadAllExercisesForGeneration({
            equipment: equipmentParam || undefined,
            level: levelParam || undefined
        }).pipe(
            catchError(() => {
                this.toast.showError('Failed to load exercises');
                return EMPTY;
            }),
            switchMap((exercises) => {
                const summaries = exercises.map((e) => ({
                    exerciseId: e.exerciseId,
                    name: e.name,
                    targetMuscles: e.targetMuscles ?? [],
                    secondaryMuscles: e.secondaryMuscles ?? [],
                    category: e.category ?? [],
                    equipments: e.equipments ?? [],
                    level: e.level
                }));

                if (summaries.length === 0) {
                    this.toast.showError('No exercises found for the selected equipment and level. Try different equipment or a lower difficulty.');
                    return EMPTY;
                }

                return this.aiGenerator
                    .generateWorkout({
                        name: request.name,
                        description: request.description,
                        mainTargetBodypart: request.mainTargetBodypart,
                        availableEquipments: request.availableEquipments,
                        secondaryTargetBodyparts: request.secondaryTargetBodyparts,
                        exercises: summaries,
                        level: request.level,
                        primaryGoal: request.primaryGoal
                    })
                    .pipe(
                        catchError((err: unknown) => {
                            const msg = err instanceof Error ? err.message : 'AI generation failed';
                            this.toast.showError(msg);
                            return EMPTY;
                        })
                    );
            })
        );
    }

    /**
     * Loads *all* exercises matching the generation filters via pagination.
     * The backend supports filtering; we intentionally paginate client-side so we don't
     * risk missing candidates due to a small `limit`.
     */
    private loadAllExercisesForGeneration(filters: { equipment?: string; level?: string }): Observable<Exercise[]> {
        const pageSize = 25; // keep in sync with ExercisesService MAX_LIMIT clamp
        const maxTotal = 1000; // safety guard against unexpected huge result sets

        return new Observable<Exercise[]>((subscriber) => {
            (async () => {
                const all: Exercise[] = [];
                let offset = 0;

                while (all.length < maxTotal) {
                    const batch = await firstValueFrom(
                        this.exercisesService.filterExercises({
                            limit: pageSize,
                            offset,
                            equipment: filters.equipment,
                            level: filters.level,
                            sortBy: 'name',
                            sortOrder: 'asc'
                        })
                    );

                    if (batch.length === 0) break;
                    all.push(...batch);
                    offset += pageSize;
                }

                subscriber.next(all);
                subscriber.complete();
            })().catch((err) => subscriber.error(err));
        });
    }

    private getExerciseLevelParam(level: WorkoutLevel): string {
        const order: WorkoutLevel[] = ['beginner', 'intermediate', 'expert'];
        const maxIndex = order.indexOf(level);
        if (maxIndex < 0) return '';
        // Inclusion rule:
        // - expert => expert + intermediate + beginner
        // - intermediate => intermediate + beginner
        // - beginner => beginner
        return order.slice(0, maxIndex + 1).join(',');
    }

    private getEquipmentParamForCategories(categories: EquipmentCategory[]): string {
        const equipmentStrings = new Set<string>();
        const bodyweightItem = equipmentOptions.find((e) => e.equipmentCategory === 'Bodyweight');
        bodyweightItem?.equipmentOptions?.forEach((eq) => equipmentStrings.add(eq));

        for (const cat of categories) {
            const item = equipmentOptions.find((e) => e.equipmentCategory === cat);
            item?.equipmentOptions?.forEach((eq) => equipmentStrings.add(eq));
        }

        return Array.from(equipmentStrings).join(',');
    }
}
