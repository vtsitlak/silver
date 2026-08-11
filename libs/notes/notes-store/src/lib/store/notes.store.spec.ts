import { TestBed } from '@angular/core/testing';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideHttpClient, withInterceptorsFromDi, withXhr } from '@angular/common/http';
import { NotesStore } from './notes.store';
import { Note } from '../models/note';

describe('NotesStore', () => {
    let store: InstanceType<typeof NotesStore>;
    let httpTestingController: HttpTestingController;

    const mockNotes: Note[] = [
        { id: 1, title: 'Note One', body: 'Body One', important: false, created: '2026-01-25' },
        { id: 2, title: 'Note Two', body: 'Body Two', important: true, created: '2026-01-26' }
    ];

    beforeEach(() => {
        TestBed.configureTestingModule({
            providers: [provideHttpClient(withXhr(), withInterceptorsFromDi()), provideHttpClientTesting()]
        });
        store = TestBed.inject(NotesStore);
        httpTestingController = TestBed.inject(HttpTestingController);
    });

    afterEach(() => {
        httpTestingController.verify();
    });

    it('should load all notes into state', () => {
        store.loadAll();

        const req = httpTestingController.expectOne('/api/notes');
        expect(req.request.method).toBe('GET');
        req.flush(mockNotes);

        expect(store.notes()).toEqual(mockNotes);
        expect(store.loaded()).toBe(true);
        expect(store.loading()).toBe(false);
    });

    it('should queue rapid updates with concatMap so the first PUT is not aborted', () => {
        store.loadAll();
        httpTestingController.expectOne('/api/notes').flush(mockNotes);

        store.update({ noteId: 1, changes: { title: 'Updated One' } });
        store.update({ noteId: 2, changes: { title: 'Updated Two' } });

        // First mutation is in flight; the second must wait (concatMap), not cancel it (switchMap).
        const firstPut = httpTestingController.expectOne('/api/notes/1');
        expect(firstPut.request.method).toBe('PUT');
        httpTestingController.expectNone('/api/notes/2');

        firstPut.flush({ ...mockNotes[0], title: 'Updated One' });

        const secondPut = httpTestingController.expectOne('/api/notes/2');
        expect(secondPut.request.method).toBe('PUT');
        secondPut.flush({ ...mockNotes[1], title: 'Updated Two' });

        expect(store.notes().find((n) => n.id === 1)?.title).toBe('Updated One');
        expect(store.notes().find((n) => n.id === 2)?.title).toBe('Updated Two');
    });
});
