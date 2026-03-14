import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { AuthFacade } from '@silver/tabata/auth';
import { HistoryComponent } from './history.component';
import { UserWorkoutsFacade } from '@silver/tabata/states/user-workouts';
import { WorkoutsFacade } from '@silver/tabata/states/workouts';
import { mockAuthFacade, mockUserWorkoutsFacade, mockWorkoutsFacade } from '@silver/tabata/testing';

describe('HistoryComponent', () => {
    let component: HistoryComponent;
    let fixture: ComponentFixture<HistoryComponent>;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [HistoryComponent],
            providers: [
                provideRouter([]),
                { provide: AuthFacade, useValue: mockAuthFacade },
                { provide: UserWorkoutsFacade, useValue: mockUserWorkoutsFacade },
                { provide: WorkoutsFacade, useValue: mockWorkoutsFacade }
            ]
        }).compileComponents();

        fixture = TestBed.createComponent(HistoryComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });
});
