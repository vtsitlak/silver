import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef, MatDialogTitle, MatDialogContent, MatDialogActions } from '@angular/material/dialog';
import { Note } from '@silver/notes-store';
import { form, FormField, required } from '@angular/forms/signals';
import { NotesFacade } from '@silver/notes-store';
import { CdkScrollable } from '@angular/cdk/scrolling';
import { MatProgressSpinner, MatSpinner } from '@angular/material/progress-spinner';
import { MatFormField, MatInput, MatError } from '@angular/material/input';
import { MatSlideToggle } from '@angular/material/slide-toggle';
import { MatButton } from '@angular/material/button';

@Component({
    selector: 'lib-note-dialog',
    templateUrl: './edit-note-dialog.component.html',
    styleUrls: ['./edit-note-dialog.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush,
    imports: [MatDialogTitle, CdkScrollable, MatDialogContent, MatProgressSpinner, MatSpinner, FormField, MatFormField, MatInput, MatError, MatSlideToggle, MatDialogActions, MatButton]
})
export class EditNoteDialogComponent {
    private dialogRef = inject(MatDialogRef<EditNoteDialogComponent>);
    private data = inject(MAT_DIALOG_DATA);
    notesFacade = inject(NotesFacade);

    dialogTitle = this.data.dialogTitle;
    note = this.data.note || {} as Note;
    mode = this.data.mode;

    noteModel = signal({
        title: this.mode === 'update' ? this.note.title || '' : '',
        body: this.mode === 'update' ? this.note.body || '' : '',
        important: this.mode === 'update' ? this.note.important || false : false
    });

    noteForm = form(this.noteModel, (schemaPath) => {
        required(schemaPath.title, { message: 'Title is required' });
        required(schemaPath.body, { message: 'Body is required' });
    });

    onClose() {
        this.dialogRef.close();
    }

    onSave() {
        const formData = this.noteModel();

        if (this.mode === 'update') {
            const note: Note = {
                ...this.note,
                ...formData
            };
            this.notesFacade.update(note.id, formData);
            this.dialogRef.close();
        } else if (this.mode === 'create') {
            const newNote: Omit<Note, 'id'> = {
                title: formData.title,
                body: formData.body,
                important: formData.important,
                created: new Date().toISOString()
            };
            this.notesFacade.add(newNote);
            this.dialogRef.close();
        }
    }
}
