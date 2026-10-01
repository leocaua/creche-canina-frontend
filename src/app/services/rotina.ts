import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class RotinaService {
  private apiUrl = 'http://localhost:8080/rotinas';

  constructor(private http: HttpClient) {}

  buscarAtividadesPorPetEData(petId: number, data: string): Observable<any[]> {

    return this.http.get<any[]>(`${this.apiUrl}/pet/${petId}?data=${data}`);
  }

  informarAusencia(petId: number, data: string): Observable<any> {
    
    return this.http.post(`${this.apiUrl}/ausencia`, { petId, data });
  }
}
