import { inject, Injectable } from '@angular/core';
import { ActionSheetController } from '@ionic/angular/standalone';
import { WorkoutEditorFacade } from '@silver/tabata/states/workout-editor';

/**
 * Handles cancel confirmation for the workout editor: checks draft changes via the facade
 * and shows an Ion Action Sheet when there are unsaved changes.
 */
@Injectable({ providedIn: 'root' })
export class WorkoutEditorCancelService {
    private readonly facade = inject(WorkoutEditorFacade);
    private readonly actionSheetCtrl = inject(ActionSheetController);

    /**
     * Confirms cancel: returns false to leave (navigate), true to stay.
     * - No unsaved changes: clears draft and returns false (parent navigates).
     * - Unsaved changes: shows action sheet. "Stay in editor" -> true, "Continue canceling" -> clears draft and returns false.
     */
    async confirmCancel(): Promise<boolean> {
        if (!this.facade.hasUnsavedChanges()) {
            this.facade.clearDraft();
            return Promise.resolve(false);
        }
        const sheet = await this.actionSheetCtrl.create({
            header: 'All changes you made will be lost, are you sure?',
            buttons: [
                { text: 'Stay in editor', role: 'cancel' },
                { text: 'Confirm canceling', role: 'destructive', handler: () => this.facade.clearDraft() }
            ]
        });
        await sheet.present();
        const { role } = await sheet.onDidDismiss();
        return role === 'cancel';
    }
}
