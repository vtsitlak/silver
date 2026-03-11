import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';
import { provideAnimations } from '@angular/platform-browser/animations';
import { MatDialog } from '@angular/material/dialog';
import { NotesTableListComponent } from './notes-table-list.component';
import { NotesFacade } from '@silver/notes-store';
import { Note } from '@silver/notes-store';

describe('NotesTableListComponent', () => {
    let component: NotesTableListComponent;
    let fixture: ComponentFixture<NotesTableListComponent>;
    let facade: NotesFacade;
    let dialog: MatDialog;

    const mockNotes: Note[] = [{ id: 1, title: 'Test Note', body: 'Test body', important: false, created: '2026-01-25' }];

    beforeEach(waitForAsync(() => {
        TestBed.configureTestingModule({
            imports: [NotesTableListComponent],
            providers: [
                provideAnimations(),
                {
                    provide: NotesFacade,
                    useValue: {
                        delete: jest.fn()
                    }
                },
                {
                    provide: MatDialog,
                    useValue: {
                        open: jest.fn().mockReturnValue({
                            afterClosed: jest.fn().mockReturnValue({ subscribe: jest.fn() })
                        })
                    }
                }
            ]
        }).compileComponents();
        facade = TestBed.inject(NotesFacade);
        dialog = TestBed.inject(MatDialog);
    }));

    beforeEach(() => {
        fixture = TestBed.createComponent(NotesTableListComponent);
        component = fixture.componentInstance;
        fixture.componentRef.setInput('notes', mockNotes);
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });

    it('should delete note when onDeleteCourse is called', () => {
        const note = mockNotes[0];
        component.onDeleteCourse(note);
        expect(facade.delete).toHaveBeenCalledWith(note.id);
    });

    it('should open dialog when editCourse is called', () => {
        const note = mockNotes[0];
        component.editCourse(note);
        expect(dialog.open).toHaveBeenCalled();
    });
});
