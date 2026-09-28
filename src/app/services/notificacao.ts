import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class NotificacaoService {
  private apiUrl = 'http://localhost:8080/notificacoes';

  constructor(private http: HttpClient) {}

  buscarPorClienteId(clienteId: number): Observable<any[]> {

    const token = localStorage.getItem('token');
    const headers = new HttpHeaders({
      
      'Authorization': `Bearer ${token}`
    });

    return this.http.get<any[]>(`${this.apiUrl}/cliente/${clienteId}`, { headers });
  }

  marcarComoLida(id: number): Observable<any> {

    const token = localStorage.getItem('token');
    const headers = new HttpHeaders({

      'Authorization': `Bearer ${token}`
    });

    return this.http.put<any>(`${this.apiUrl}/${id}/lida`, {}, { headers });
  }
}
