import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, map } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class NotificacaoService {
  private apiUrl = 'http://localhost:8080/notificacoes';

  constructor(private http: HttpClient) {}

  buscarPorClienteId(clienteId: number): Observable<any[]> {
    const token = localStorage.getItem('token');
    const headers = new HttpHeaders({ 'Authorization': `Bearer ${token}` });

    return this.http.get<any[]>(`${this.apiUrl}/cliente/${clienteId}`, { headers }).pipe(
      map((notificacoes: any[]) =>
        (notificacoes || []).map(n => ({
          ...n,
          texto: this.formatarTextoParaTutor(n.texto)
        }))
      )
    );
  }

  private formatarTextoParaTutor(texto: string): string {
    if (!texto) return '';

    const matchSolicitada = texto.match(/Nova matr[íi]cula solicitada para (.+?)\s*\(.+?\)/i);
    if (matchSolicitada && matchSolicitada[1]) {
      const nomePet = matchSolicitada[1].trim();

      return `Pedido de matrícula de ${nomePet} enviado! Aguardando confirmação da creche.`;
    }

    if (/Nova Matr[íi]cula criada\s*-\s*Tutor/i.test(texto)) {
      return 'Sua matrícula foi registrada pela recepção da creche!';
    }

    return texto;
  }

  marcarComoLida(notificacaoId: number): Observable<any> {
    const token = localStorage.getItem('token');
    const headers = new HttpHeaders({ 'Authorization': `Bearer ${token}` });

    return this.http.put<any>(`${this.apiUrl}/${notificacaoId}/lida`, {}, { headers });
  }

  limparDoCliente(clienteId: number): Observable<any> {
    const token = localStorage.getItem('token');
    const headers = new HttpHeaders({ 'Authorization': `Bearer ${token}` });
    
    return this.http.delete<any>(`${this.apiUrl}/cliente/${clienteId}/limpar`, { headers });
  }
}
