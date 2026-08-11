import { signalStore, withState, withMethods, patchState, withComputed } from '@ngrx/signals';
import { rxMethod } from '@ngrx/signals/rxjs-interop';
import { inject } from '@angular/core';
import { Note } from '../models/note';
import { NotesHttpService } from './notes-http.service';
import { pipe, switchMap, concatMap, tap, catchError, of } from 'rxjs';

interface NotesState {
    notes: Note[];
    loading: boolean;
    loaded: boolean;
}

const initialState: NotesState = {
    notes: [],
    loading: false,
    loaded: false
};

export const NotesStore = signalStore(
    { providedIn: 'root' },
    withState(initialState),
    withComputed((store) => ({
        importantNotes: () => store.notes().filter((note) => note.important === true)
    })),
    withMethods((store, notesHttpService = inject(NotesHttpService)) => ({
        loadAll: rxMethod<void>(
            pipe(
                tap(() => patchState(store, { loading: true })),
                switchMap(() =>
                    notesHttpService.findAllNotes().pipe(
                        tap({
                            next: (notes) => {
                                patchState(store, { notes, loading: false, loaded: true });
                            },
                            error: () => {
                                patchState(store, { loading: false });
                            }
                        })
                    )
                )
            )
        ),
        update: rxMethod<{ noteId: string | number; changes: Partial<Note> }>(
            pipe(
                // concatMap: rapid multi-note saves must not abort earlier PUTs (data loss).
                concatMap(({ noteId, changes }) =>
                    notesHttpService.saveNote(noteId, changes).pipe(
                        tap(() => {
                            patchState(store, (state) => ({
                                notes: state.notes.map((n) => (n.id === noteId ? { ...n, ...changes } : n))
                            }));
                        }),
                        catchError(() => of(null))
                    )
                )
            )
        ),
        add: rxMethod<Omit<Note, 'id'> | Note>(
            pipe(
                concatMap((note) =>
                    notesHttpService.createNote(note).pipe(
                        tap((createdNote) => {
                            patchState(store, (state) => ({
                                notes: [...state.notes, createdNote]
                            }));
                        }),
                        catchError(() => of(null))
                    )
                )
            )
        ),
        delete: rxMethod<string | number>(
            pipe(
                concatMap((noteId) =>
                    notesHttpService.deleteNote(noteId).pipe(
                        tap(() => {
                            patchState(store, (state) => ({
                                notes: state.notes.filter((n) => n.id !== noteId)
                            }));
                        }),
                        catchError(() => of(null))
                    )
                )
            )
        )
    }))
);
