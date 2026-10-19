import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, of, forkJoin, map, catchError } from 'rxjs';

export interface AgendaItem {
  id: number;
  petNome: string;
  tutorNome: string;
  foto: string;
  porte: 'P' | 'M' | 'G';
  tipo: 'CRECHE' | 'MATRICULA' | 'REPOSICAO';
  status: 'PENDENTE' | 'AGENDADO' | 'NA_CRECHE' | 'AUSENTE' | 'FINALIZADO';
}

@Injectable({
  providedIn: 'root'
})

export class AdminService {
  private apiUrl = 'http://localhost:8080';

  constructor(private http: HttpClient) {}

  private obterCabecalhosSeguros(): HttpHeaders {
    let token = localStorage.getItem('token');

    if (token && token.startsWith('"') && token.endsWith('"')) {
      token = token.substring(1, token.length - 1);
    }

    return new HttpHeaders({
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    });
  }

  buscarTodosPets(): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/pets`, {
      headers: this.obterCabecalhosSeguros()
    });
  }

  buscarAgendaDoDia(data: string): Observable<AgendaItem[]> {
    const headers = this.obterCabecalhosSeguros();
    const agenda$ = this.http.get<AgendaItem[]>(`${this.apiUrl}/agenda?data=${data}`, { headers });

    const hoje = new Date();
    const hojeStr = `${hoje.getFullYear()}-${String(hoje.getMonth() + 1).padStart(2, '0')}-${String(hoje.getDate()).padStart(2, '0')}`;

    if (data !== hojeStr) {
      return agenda$;
    }

    const matriculas$ = this.http.get<any[]>(`${this.apiUrl}/matriculas`, { headers }).pipe(
      catchError(() => of([]))
    );

    return forkJoin([agenda$, matriculas$]).pipe(
      map(([itensAgenda, matriculas]) => {
        const idsCriadosHoje = new Set<number>();

        (matriculas || []).forEach(m => {
          let dRes = '';
          if (Array.isArray(m.dataReserva)) {

            const [y, mo, d] = m.dataReserva;
            dRes = `${y}-${String(mo).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
          } else if (m.dataReserva) {
            dRes = String(m.dataReserva).substring(0, 10);
          }
          if (dRes === hojeStr && m.id != null) {
            idsCriadosHoje.add(Number(m.id));
          }
        });

        return (itensAgenda || []).filter(item => {
          if (item.status !== 'PENDENTE' && idsCriadosHoje.has(Number(item.id))) {
            return false;
          }
          return true;
        });
      })
    );
  }

  atualizarStatus(id: number, acao: 'APROVAR' | 'RECUSAR' | 'CHECKIN' | 'CHECKOUT'): Observable<any> {
    console.log(`Enviando ordem de ${acao} para o Spring Boot no ID: ${id}`);

    return this.http.put(`${this.apiUrl}/agenda/${id}/status`, { acao }, {
      headers: this.obterCabecalhosSeguros()
    });
  }

  atualizarPet(id: number, dadosPet: any): Observable<any> {
    return this.http.put(`${this.apiUrl}/pets/${id}`, dadosPet, {
      headers: this.obterCabecalhosSeguros()
    });
  }

  listarMatriculas(): Observable<any[]> {
    const token = localStorage.getItem('token');
    const headers = new HttpHeaders().set('Authorization', `Bearer ${token}`);
    
    return this.http.get<any[]>(`${this.apiUrl.replace('/agenda', '')}/matriculas`, { headers });
  }
}
