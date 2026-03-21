import { TestBed } from '@angular/core/testing';
import { ActionSheetController } from '@ionic/angular/standalone';
import { WorkoutEditorFacade } from '@silver/tabata/states/workout-editor';
import { WorkoutEditorCancelService } from './workout-editor-cancel.service';

describe('WorkoutEditorCancelService', () => {
    let service: WorkoutEditorCancelService;
    let facade: { hasUnsavedChanges: jest.Mock; reset: jest.Mock };
    let createSpy: jest.Mock;

    beforeEach(() => {
        facade = {
            hasUnsavedChanges: jest.fn(),
            reset: jest.fn()
        };
        const sheet = {
            present: jest.fn().mockResolvedValue(undefined),
            onDidDismiss: jest.fn().mockResolvedValue({ role: 'cancel' })
        };
        createSpy = jest.fn().mockResolvedValue(sheet);

        TestBed.configureTestingModule({
            providers: [
                WorkoutEditorCancelService,
                { provide: WorkoutEditorFacade, useValue: facade },
                { provide: ActionSheetController, useValue: { create: createSpy } }
            ]
        });
        service = TestBed.inject(WorkoutEditorCancelService);
    });

    it('should clear draft and not open sheet when no unsaved changes', async () => {
        facade.hasUnsavedChanges.mockReturnValue(false);
        const result = await service.confirmCancel();
        expect(result).toBe(false);
        expect(createSpy).not.toHaveBeenCalled();
        expect(facade.clearDraft).toHaveBeenCalled();
    });

    it('should coalesce concurrent confirmCancel into one action sheet', async () => {
        facade.hasUnsavedChanges.mockReturnValue(true);

        const a = service.confirmCancel();
        const b = service.confirmCancel();

        await expect(Promise.all([a, b])).resolves.toEqual([true, true]);
        expect(createSpy).toHaveBeenCalledTimes(1);
    });
});
