import { Injectable, inject } from '@angular/core';
import { NotesStore } from './notes.store';
import { Note } from '../models/note';

/**
 * Facade for NotesStore that provides a clean API layer
 * for components to interact with the notes state management.
 */
@Injectable({
  providedIn: 'root'
})
export class NotesFacade {
  private readonly store = inject(NotesStore);

  // State signals
  readonly notes = this.store.notes;
  readonly loading = this.store.loading;
  readonly loaded = this.store.loaded;
  readonly importantNotes = this.store.importantNotes;

  // Methods
  loadAll(): void {
    this.store.loadAll();
  }

  update(noteId: string | number, changes: Partial<Note>): void {
    this.store.update({ noteId, changes });
  }

  add(note: Omit<Note, 'id'> | Note): void {
    this.store.add(note);
  }

  delete(noteId: string | number): void {
    this.store.delete(noteId);
  }
}
