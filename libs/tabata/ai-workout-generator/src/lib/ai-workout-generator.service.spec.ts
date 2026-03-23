import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { AiWorkoutGeneratorService } from './ai-workout-generator.service';
import type { GenerateWorkoutInput } from './types';

describe('AiWorkoutGeneratorService', () => {
    let service: AiWorkoutGeneratorService;
    let httpMock: HttpTestingController;

    beforeEach(() => {
        TestBed.configureTestingModule({
            imports: [HttpClientTestingModule],
            providers: [AiWorkoutGeneratorService]
        });
        service = TestBed.inject(AiWorkoutGeneratorService);
        httpMock = TestBed.inject(HttpTestingController);
    });

    afterEach(() => {
        httpMock.verify();
    });

    it('should be created', () => {
        expect(service).toBeTruthy();
    });

    it('should POST to /api/generate-workout with input and return output', () => {
        const input: GenerateWorkoutInput = {
            name: 'Test',
            description: 'Desc',
            mainTargetBodypart: 'Upper Body',
            availableEquipments: ['Bodyweight'],
            secondaryTargetBodyparts: [],
            level: 'beginner',
            primaryGoal: 'Strength',
            exercises: [
                {
                    exerciseId: 'e1',
                    name: 'Push-up',
                    targetMuscles: [],
                    secondaryMuscles: [],
                    category: [],
                    equipments: [],
                    level: 'beginner'
                }
            ]
        };
        const mockOutput = {
            totalDurationMinutes: 30,
            warmup: { totalDurationSeconds: 240, movements: [] },
            blocks: [],
            cooldown: { totalDurationSeconds: 120, movements: [] }
        };

        service.generateWorkout(input).subscribe((out) => {
            expect(out).toEqual(mockOutput);
        });

        const req = httpMock.expectOne('/api/generate-workout');
        expect(req.request.method).toBe('POST');
        expect(req.request.body).toEqual(input);
        req.flush(mockOutput);
    });
});
