import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { text } from 'stream/consumers';

@Injectable({
  providedIn: 'root',
})

export class AuthService {
  private apiUrl = 'http://localhost:8080/login'

  constructor(private http: HttpClient) {}

  fazerLoginApi(dadosLogin: any) {
    return this.http.post(this.apiUrl, dadosLogin, {responseType: 'text' });
  }
}
