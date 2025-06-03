import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface Exercise {
  bodyPart: string;
  equipment: string;
  gifUrl: string;
  id: string;
  name: string;
  target: string;
  secondaryMuscles: string[];
  instructions: string[];
}

@Injectable({
  providedIn: 'root',
})
export class ExercisesService {
  private readonly apiUrl = 'https://exercisedb.p.rapidapi.com';
  private readonly apiKey = '0931163cf3msh5b4a52dbdd10264p120c72jsn9565a9bee028';
  private readonly apiHost = 'exercisedb.p.rapidapi.com';

  constructor(private http: HttpClient) {}

  private getHeaders(): HttpHeaders {
    return new HttpHeaders({
      'x-rapidapi-key': this.apiKey,
      'x-rapidapi-host': this.apiHost,
    });
  }

  getAllExercises(limit = 10, offset = 0): Observable<Exercise[]> {
    return this.http.get<Exercise[]>(
      `${this.apiUrl}/exercises?limit=${limit}&offset=${offset}`,
      { headers: this.getHeaders() }
    );
  }

  getExerciseById(id: string): Observable<Exercise> {
    return this.http.get<Exercise>(
      `${this.apiUrl}/exercises/exercise/${id}`,
      { headers: this.getHeaders() }
    );
  }

  getExercisesByName(name: string, limit = 10, offset = 0): Observable<Exercise[]> {
    return this.http.get<Exercise[]>(
      `${this.apiUrl}/exercises/name/${encodeURIComponent(name)}?limit=${limit}&offset=${offset}`,
      { headers: this.getHeaders() }
    );
  }

  getExercisesByTarget(target: string, limit = 10, offset = 0): Observable<Exercise[]> {
    return this.http.get<Exercise[]>(
      `${this.apiUrl}/exercises/target/${encodeURIComponent(target)}?limit=${limit}&offset=${offset}`,
      { headers: this.getHeaders() }
    );
  }

  getExercisesByEquipment(equipment: string, limit = 10, offset = 0): Observable<Exercise[]> {
    return this.http.get<Exercise[]>(
      `${this.apiUrl}/exercises/equipment/${encodeURIComponent(equipment)}?limit=${limit}&offset=${offset}`,
      { headers: this.getHeaders() }
    );
  }

  getExercisesByBodyPart(bodyPart: string, limit = 10, offset = 0): Observable<Exercise[]> {
    return this.http.get<Exercise[]>(
      `${this.apiUrl}/exercises/bodyPart/${encodeURIComponent(bodyPart)}?limit=${limit}&offset=${offset}`,
      { headers: this.getHeaders() }
    );
  }

  getTargetList(): Observable<string[]> {
    return this.http.get<string[]>(
      `${this.apiUrl}/exercises/targetList`,
      { headers: this.getHeaders() }
    );
  }

  getEquipmentList(): Observable<string[]> {
    return this.http.get<string[]>(
      `${this.apiUrl}/exercises/equipmentList`,
      { headers: this.getHeaders() }
    );
  }

  getBodyPartList(): Observable<string[]> {
    return this.http.get<string[]>(
      `${this.apiUrl}/exercises/bodyPartList`,
      { headers: this.getHeaders() }
    );
  }
}
