import { inject, Injectable } from '@angular/core';
import { type BodyRegion, type EquipmentCategory, equipmentOptions, muscleOptions } from '@silver/tabata/helpers';
import { ExercisesService } from '@silver/tabata/states/exercises';
import { AiWorkoutGeneratorService, type GenerateWorkoutOutput } from '@silver/tabata/ai-workout-generator';
import { ToastService } from '@silver/tabata/helpers';
import { EMPTY, type Observable } from 'rxjs';
import { catchError, switchMap } from 'rxjs/operators';

export interface AiWorkoutGenerationInput {
    name: string;
    description: string;
    mainTargetBodypart: BodyRegion;
    availableEquipments: EquipmentCategory[];
    secondaryTargetBodyparts: BodyRegion[];
}

@Injectable({ providedIn: 'root' })
export class AiWorkoutGenerationService {
    private readonly exercisesService = inject(ExercisesService);
    private readonly aiGenerator = inject(AiWorkoutGeneratorService);
    private readonly toast = inject(ToastService);

    generateWorkout(request: AiWorkoutGenerationInput): Observable<GenerateWorkoutOutput> {
        const musclesParam = this.getMusclesParamForRegion(request.mainTargetBodypart);
        const equipmentParam = this.getEquipmentParamForCategories(request.availableEquipments ?? []);

        return this.exercisesService
            .filterExercises({
                limit: 40,
                muscles: musclesParam || undefined,
                equipment: equipmentParam || undefined,
                sortBy: 'name',
                sortOrder: 'asc'
            })
            .pipe(
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
                        equipments: e.equipments ?? []
                    }));

                    if (summaries.length === 0) {
                        this.toast.showError(
                            'No exercises found for the selected target and equipment. Try different equipment or a broader target (e.g. Full Body).'
                        );
                        return EMPTY;
                    }

                    return this.aiGenerator.generateWorkout({
                        name: request.name,
                        description: request.description,
                        mainTargetBodypart: request.mainTargetBodypart,
                        availableEquipments: request.availableEquipments,
                        secondaryTargetBodyparts: request.secondaryTargetBodyparts,
                        exercises: summaries
                    }).pipe(
                        catchError((err: unknown) => {
                            const msg = err instanceof Error ? err.message : 'AI generation failed';
                            this.toast.showError(msg);
                            return EMPTY;
                        })
                    );
                })
            );
    }

    private getMusclesParamForRegion(region: BodyRegion): string {
        if (region === 'Full Body') return '';
        const mapping = muscleOptions.find((m) => m.region === region);
        if (!mapping?.muscles?.length) return '';
        return mapping.muscles.join(',');
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

