import { ChangeDetectionStrategy, Component, OnInit, inject } from '@angular/core';
import { Note } from '@silver/notes-store';
import { defaultDialogConfig } from '../shared/default-dialog-config';
import { EditNoteDialogComponent } from '../edit-note-dialog/edit-note-dialog.component';
import { MatDialog } from '@angular/material/dialog';
import { MatMiniFabButton } from '@angular/material/button';
import { MatIcon } from '@angular/material/icon';
import { MatTooltip } from '@angular/material/tooltip';
import { MatTabGroup, MatTab } from '@angular/material/tabs';
import { NotesTableListComponent } from '../notes-table-list/notes-table-list.component';
import { NotesFacade } from '@silver/notes-store';


@Component({
    selector: 'lib-home',
    templateUrl: './home.component.html',
    styleUrls: ['./home.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush,
    imports: [MatMiniFabButton, MatIcon, MatTooltip, MatTabGroup, MatTab, NotesTableListComponent]
})
export class HomeComponent implements OnInit {

  notesFacade = inject(NotesFacade);
  private dialog = inject(MatDialog);

  ngOnInit() {
    // Only load if data hasn't been loaded yet
    if (!this.notesFacade.loaded()) {
      this.notesFacade.loadAll();
    }
  }

  reload() {
    this.notesFacade.loadAll();
  }

  onAddCourse() {

    const dialogConfig = defaultDialogConfig();

    dialogConfig.data = {
      dialogTitle: 'Create Note',
      mode: 'create'
    };

    this.dialog.open(EditNoteDialogComponent, dialogConfig);

  }


}
