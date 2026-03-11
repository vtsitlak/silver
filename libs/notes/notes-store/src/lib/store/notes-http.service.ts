import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Note } from '../models/note';
import { map } from 'rxjs/operators';

@Injectable({
    providedIn: 'root'
})
export class NotesHttpService {
    private readonly http = inject(HttpClient);

    findAllNotes(): Observable<Note[]> {
        return this.http.get<Note[]>('/api/notes').pipe(map((notes: Note[]) => notes));
    }

    findNoteByUrl(noteId: string): Observable<Note> {
        return this.http.get<Note>(`/api/notes/${noteId}`);
    }

    saveNote(noteId: string | number, changes: Partial<Note>) {
        return this.http.put('/api/notes/' + noteId, changes);
    }

    createNote(note: Omit<Note, 'id'> | Note): Observable<Note> {
        return this.http.post<Note>('/api/notes', note);
    }

    deleteNote(noteId: string | number): Observable<void> {
        return this.http.delete<void>(`/api/notes/${noteId}`);
    }
}
