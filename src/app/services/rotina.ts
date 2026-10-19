import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { HttpHeaders } from '@angular/common/http';

@Injectable({
  providedIn: 'root'
})
export class RotinaService {
  private apiUrl = 'http://localhost:8080/rotinas';

  constructor(private http: HttpClient) {}

  buscarAtividadesPorPetEData(petId: number, data: string) {
    const token = localStorage.getItem('token');
    const headers = new HttpHeaders().set('Authorization', `Bearer ${token}`);

    return this.http.get<any[]>(`http://localhost:8080/rotinas/pet/${petId}?data=${data}`, { headers });
  }

  informarAusencia(petId: number, data: string): Observable<any> {
    
    return this.http.post(`${this.apiUrl}/ausencia`, { petId, data });
  }
}
