import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';
import { provideAnimations } from '@angular/platform-browser/animations';
import { MatDialog } from '@angular/material/dialog';
import { signal } from '@angular/core';
import { HomeComponent } from './home.component';
import { NotesFacade } from '@silver/notes-store';
import { Note } from '@silver/notes-store';

describe('HomeComponent', () => {
    let component: HomeComponent;
    let fixture: ComponentFixture<HomeComponent>;
    let facade: NotesFacade;
    let dialog: MatDialog;
    let loadedSignal: ReturnType<typeof signal<boolean>>;

    const mockNotes: Note[] = [{ id: 1, title: 'Test Note', body: 'Test body', important: false, created: '2026-01-25' }];

    beforeEach(waitForAsync(() => {
        loadedSignal = signal(true);

        TestBed.configureTestingModule({
            imports: [HomeComponent],
            providers: [
                provideAnimations(),
                {
                    provide: NotesFacade,
                    useValue: {
                        notes: signal<Note[]>(mockNotes),
                        loading: signal(false),
                        loaded: loadedSignal,
                        importantNotes: signal<Note[]>([]),
                        loadAll: jest.fn(),
                        update: jest.fn(),
                        add: jest.fn(),
                        delete: jest.fn()
                    }
                },
                {
                    provide: MatDialog,
                    useValue: {
                        open: jest.fn()
                    }
                }
            ]
        }).compileComponents();
        facade = TestBed.inject(NotesFacade);
        dialog = TestBed.inject(MatDialog);
    }));

    beforeEach(() => {
        fixture = TestBed.createComponent(HomeComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });

    it('should load notes on init if not loaded', () => {
        loadedSignal.set(false);
        component.ngOnInit();
        expect(facade.loadAll).toHaveBeenCalled();
    });

    it('should not load notes on init if already loaded', () => {
        loadedSignal.set(true);
        (facade.loadAll as jest.Mock).mockClear();
        component.ngOnInit();
        expect(facade.loadAll).not.toHaveBeenCalled();
    });

    it('should open dialog when onAddCourse is called', () => {
        component.onAddCourse();
        expect(dialog.open).toHaveBeenCalled();
    });
});
