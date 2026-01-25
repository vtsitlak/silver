
export interface Note {
  id: number;
  title: string;
  body: string;
  important: boolean;
  created: string;
}


export function compareNotes(c1: Note, c2: Note) {

  const compare = c1.id - c2.id;

  if (compare > 0) {
    return 1;
  } else if (compare < 0) {
    return -1;
  } else {
    return 0;
  }

}
