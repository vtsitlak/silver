import { ComponentFixture, TestBed } from '@angular/core/testing';
import { WorkoutPlayerComponent } from './workout-player.component';

describe('WorkoutPlayerComponent', () => {
    let component: WorkoutPlayerComponent;
    let fixture: ComponentFixture<WorkoutPlayerComponent>;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [WorkoutPlayerComponent]
        }).compileComponents();

        fixture = TestBed.createComponent(WorkoutPlayerComponent);
        component = fixture.componentInstance;
        await fixture.whenStable();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });
});
