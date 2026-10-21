import { TestBed } from '@angular/core/testing';
import { Subject } from 'rxjs';
import { WorkoutEditorFacade } from './workout-editor.facade';
import { WorkoutEditorStore } from './workout-editor.store';

describe('WorkoutEditorFacade AI generation cancellation', () => {
    let facade: WorkoutEditorFacade;

    beforeEach(() => {
        TestBed.configureTestingModule({
            providers: [WorkoutEditorStore, WorkoutEditorFacade]
        });
        facade = TestBed.inject(WorkoutEditorFacade);
        facade.updateDraft({ name: 'Leg Day', description: 'Existing workout' });
    });

    it('drops a late AI result when the editor is reset', () => {
        const pending = new Subject<string>();
        const applied: string[] = [];
        facade.trackAiGeneration(pending.subscribe((value) => applied.push(value)));

        facade.reset();
        pending.next('late');

        expect(applied).toEqual([]);
        expect(facade.workoutDraft().name).not.toBe('Leg Day');
    });

    it('drops a late AI result when the draft is cleared on leave', () => {
        const pending = new Subject<string>();
        const applied: string[] = [];
        facade.trackAiGeneration(pending.subscribe((value) => applied.push(value)));

        facade.clearDraft();
        pending.next('late');

        expect(applied).toEqual([]);
        expect(facade.workoutDraft().name ?? '').toBe('');
    });

    it('replaces an older generation so only the latest result can apply', () => {
        const first = new Subject<string>();
        const second = new Subject<string>();
        const applied: string[] = [];

        facade.trackAiGeneration(first.subscribe((value) => applied.push(value)));
        facade.trackAiGeneration(second.subscribe((value) => applied.push(value)));

        first.next('stale');
        second.next('fresh');

        expect(applied).toEqual(['fresh']);
    });
});
