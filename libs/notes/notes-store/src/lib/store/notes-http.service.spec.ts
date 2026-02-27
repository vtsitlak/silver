import { TestBed } from '@angular/core/testing';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { HttpClient, provideHttpClient, withInterceptorsFromDi } from '@angular/common/http';
import { NotesHttpService } from './notes-http.service';
import { Note } from '../models/note';

describe('NotesHttpService', () => {
    let service: NotesHttpService;
    let httpClient: HttpClient;
    let httpTestingController: HttpTestingController;

    const mockNotes: Note[] = [
        { id: 1, title: 'Test Note', body: 'Test body', important: false, created: '2026-01-25' },
        { id: 2, title: 'Another Note', body: 'Another body', important: true, created: '2026-01-26' }
    ];

    beforeEach(() => {
        TestBed.configureTestingModule({
            imports: [],
            providers: [provideHttpClient(withInterceptorsFromDi()), provideHttpClientTesting()]
        });
        service = TestBed.inject(NotesHttpService);
        httpClient = TestBed.inject(HttpClient);
        httpTestingController = TestBed.inject(HttpTestingController);
    });

    afterEach(() => {
        httpTestingController.verify();
    });

    it('should be created', () => {
        expect(service).toBeTruthy();
    });

    it('should get all notes', () => {
        service.findAllNotes().subscribe((data) => {
            expect(data).toEqual(mockNotes);
        });

        const req = httpTestingController.expectOne('/api/notes');
        expect(req.request.method).toEqual('GET');
        req.flush(mockNotes);
    });

    it('should get note by id', () => {
        const noteId = '1';
        const mockNote = mockNotes[0];

        service.findNoteByUrl(noteId).subscribe((data) => {
            expect(data).toEqual(mockNote);
        });

        const req = httpTestingController.expectOne(`/api/notes/${noteId}`);
        expect(req.request.method).toEqual('GET');
        req.flush(mockNote);
    });

    it('should create a note', () => {
        const newNote: Omit<Note, 'id'> = {
            title: 'New Note',
            body: 'New body',
            important: false,
            created: '2026-01-27'
        };
        const createdNote: Note = { ...newNote, id: 3 };

        service.createNote(newNote).subscribe((data) => {
            expect(data).toEqual(createdNote);
        });

        const req = httpTestingController.expectOne('/api/notes');
        expect(req.request.method).toEqual('POST');
        expect(req.request.body).toEqual(newNote);
        req.flush(createdNote);
    });

    it('should update a note', () => {
        const noteId = 1;
        const changes: Partial<Note> = { title: 'Updated Title' };

        service.saveNote(noteId, changes).subscribe();

        const req = httpTestingController.expectOne(`/api/notes/${noteId}`);
        expect(req.request.method).toEqual('PUT');
        expect(req.request.body).toEqual(changes);
        req.flush({});
    });

    it('should delete a note', () => {
        const noteId = 1;

        service.deleteNote(noteId).subscribe();

        const req = httpTestingController.expectOne(`/api/notes/${noteId}`);
        expect(req.request.method).toEqual('DELETE');
        req.flush(null);
    });
});
