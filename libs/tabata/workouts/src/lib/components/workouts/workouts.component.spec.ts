import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { AuthFacade } from '@silver/tabata/states/auth';
import { WorkoutsFacade, TabataWorkout } from '@silver/tabata/states/workouts';
import { ToastService } from '@silver/tabata/helpers';
import { mockAuthFacade, mockModalController, mockToastService, createMockWorkoutsFacade, mockActionSheetController } from '@silver/tabata/testing';
import { WorkoutsComponent } from './workouts.component';
import { ActionSheetController, ModalController } from '@ionic/angular/standalone';
import { of } from 'rxjs';
import { DeleteWorkoutService } from '../../services/delete-workout.service';

describe('WorkoutsComponent', () => {
    let component: WorkoutsComponent;
    let fixture: ComponentFixture<WorkoutsComponent>;
    const mockWorkoutsFacade = createMockWorkoutsFacade();
    const mockDeleteWorkoutService = {
        deleteWorkoutAndCleanup: jest.fn(() => of({ success: true }))
    };

    beforeEach(async () => {
        mockAuthFacade.user.set(null);
        mockDeleteWorkoutService.deleteWorkoutAndCleanup.mockReset();
        mockDeleteWorkoutService.deleteWorkoutAndCleanup.mockReturnValue(of({ success: true }));
        mockActionSheetController.create.mockReset();
        mockActionSheetController.create.mockResolvedValue({
            present: jest.fn(),
            onDidDismiss: jest.fn().mockResolvedValue({ role: 'destructive' })
        });
        await TestBed.configureTestingModule({
            imports: [WorkoutsComponent],
            providers: [
                provideRouter([]),
                { provide: AuthFacade, useValue: mockAuthFacade },
                { provide: WorkoutsFacade, useValue: mockWorkoutsFacade },
                { provide: DeleteWorkoutService, useValue: mockDeleteWorkoutService },
                { provide: ModalController, useValue: mockModalController },
                { provide: ToastService, useValue: mockToastService },
                { provide: ActionSheetController, useValue: mockActionSheetController }
            ]
        }).compileComponents();

        fixture = TestBed.createComponent(WorkoutsComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });

    it('should expose only workouts created by current user in userWorkouts', () => {
        mockAuthFacade.user.set({ uid: 'user-1' });
        const workoutsSignal = mockWorkoutsFacade.workouts as unknown as {
            (): TabataWorkout[];
            set(value: TabataWorkout[]): void;
        };
        const base = workoutsSignal()[0];
        workoutsSignal.set([
            { ...base, id: 'w1', createdByUserId: 'user-1' },
            { ...base, id: 'w2', createdByUserId: 'user-2' }
        ]);

        fixture.detectChanges();

        const result = component['userWorkouts']();
        expect(result.map((w: { id: string }) => w.id)).toEqual(['w1']);
    });

    it('should call deleteWorkoutAndCleanup when delete is confirmed', async () => {
        await component.onRemoveClick({ id: 'w1', name: 'Workout 1' } as TabataWorkout);

        expect(mockDeleteWorkoutService.deleteWorkoutAndCleanup).toHaveBeenCalledWith('w1');
    });
});
