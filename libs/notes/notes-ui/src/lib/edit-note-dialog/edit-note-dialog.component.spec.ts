import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';
import { provideAnimations } from '@angular/platform-browser/animations';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { signal } from '@angular/core';
import { EditNoteDialogComponent } from './edit-note-dialog.component';
import { NotesFacade } from '@silver/notes-store';
import { Note } from '@silver/notes-store';

describe('EditNoteDialogComponent', () => {
  let component: EditNoteDialogComponent;
  let fixture: ComponentFixture<EditNoteDialogComponent>;
  let facade: NotesFacade;
  let dialogRef: MatDialogRef<EditNoteDialogComponent>;

  const mockNote: Note = {
    id: 1,
    title: 'Test Note',
    body: 'Test body',
    important: false,
    created: '2026-01-25'
  };

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      imports: [EditNoteDialogComponent],
      providers: [
        provideAnimations(),
        {
          provide: MAT_DIALOG_DATA,
          useValue: {
            dialogTitle: 'Edit Note',
            note: mockNote,
            mode: 'update'
          }
        },
        {
          provide: MatDialogRef,
          useValue: {
            close: jest.fn()
          }
        },
        {
          provide: NotesFacade,
          useValue: {
            loading: signal(false),
            update: jest.fn(),
            add: jest.fn()
          }
        }
      ]
    }).compileComponents();
    facade = TestBed.inject(NotesFacade);
    dialogRef = TestBed.inject(MatDialogRef);
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(EditNoteDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should close dialog when onClose is called', () => {
    component.onClose();
    expect(dialogRef.close).toHaveBeenCalled();
  });

  it('should update note when onSave is called in update mode', () => {
    component.onSave();
    expect(facade.update).toHaveBeenCalled();
    expect(dialogRef.close).toHaveBeenCalled();
  });
});
