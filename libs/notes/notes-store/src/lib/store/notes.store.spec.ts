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

    it('should keep accepting loadAll after a failed GET (no rxMethod soft-lock)', () => {
        store.loadAll();

        const failed = httpTestingController.expectOne('/api/notes');
        failed.flush('Server Error', { status: 500, statusText: 'Server Error' });

        expect(store.loading()).toBe(false);
        expect(store.loaded()).toBe(false);
        expect(store.notes()).toEqual([]);

        store.loadAll();

        const retry = httpTestingController.expectOne('/api/notes');
        expect(retry.request.method).toBe('GET');
        retry.flush(mockNotes);

        expect(store.notes()).toEqual(mockNotes);
        expect(store.loaded()).toBe(true);
        expect(store.loading()).toBe(false);
    });

    it('should optimistically patch updates so a rapid re-edit sees the in-flight save', () => {
        store.loadAll();
        httpTestingController.expectOne('/api/notes').flush(mockNotes);

        store.update({
            noteId: 1,
            changes: { id: 1, title: 'Updated One', body: 'Body One', important: false, created: '2026-01-25' }
        });

        // Dialog closes before PUT ack; list/re-open must already reflect the saved title.
        expect(store.notes().find((n) => n.id === 1)?.title).toBe('Updated One');

        const put = httpTestingController.expectOne('/api/notes/1');
        expect(put.request.method).toBe('PUT');
        put.flush({ ...mockNotes[0], title: 'Updated One' });

        expect(store.notes().find((n) => n.id === 1)?.title).toBe('Updated One');
    });

    it('should revert an optimistic update when the PUT fails', () => {
        store.loadAll();
        httpTestingController.expectOne('/api/notes').flush(mockNotes);

        store.update({ noteId: 1, changes: { title: 'Updated One' } });
        expect(store.notes().find((n) => n.id === 1)?.title).toBe('Updated One');

        const put = httpTestingController.expectOne('/api/notes/1');
        put.flush('save failed', { status: 500, statusText: 'Server Error' });

        expect(store.notes().find((n) => n.id === 1)?.title).toBe('Note One');
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
        expect(store.notes().find((n) => n.id === 1)?.title).toBe('Updated One');
        // Second update is queued; optimistic patch for note 2 applies when that request starts.
        expect(store.notes().find((n) => n.id === 2)?.title).toBe('Note Two');

        firstPut.flush({ ...mockNotes[0], title: 'Updated One' });

        const secondPut = httpTestingController.expectOne('/api/notes/2');
        expect(secondPut.request.method).toBe('PUT');
        expect(store.notes().find((n) => n.id === 2)?.title).toBe('Updated Two');
        secondPut.flush({ ...mockNotes[1], title: 'Updated Two' });

        expect(store.notes().find((n) => n.id === 1)?.title).toBe('Updated One');
        expect(store.notes().find((n) => n.id === 2)?.title).toBe('Updated Two');
    });
});
