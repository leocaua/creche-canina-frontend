import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root',
})

export class AuthService {
  private apiUrl = 'http://localhost:8080/login'

  constructor(private http: HttpClient) {}

  cadastrarCliente(cliente: any): Observable<any> {
    return this.http.post('http://localhost:8080/clientes', cliente);
  }

  esqueciSenhaApi(dados: any): Observable<any> {
    return this.http.put('http://localhost:8080/clientes/esqueci-senha', dados, { responseType: 'text' });
  }

  fazerLoginApi(dadosLogin: any) {
    return this.http.post(this.apiUrl, dadosLogin, {responseType: 'text' });
  }
}
