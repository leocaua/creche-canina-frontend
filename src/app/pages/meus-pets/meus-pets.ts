import { Component, OnInit } from '@angular/core';
import { Router, RouterLink } from '@angular/router';

@Component({
  selector: 'app-meus-pets',
  standalone: true,
  imports: [RouterLink],
  templateUrl: './meus-pets.html',
  styleUrl: './meus-pets.css',
})
export class MeusPets implements OnInit {
  nomeCliente: string = 'Maria Silva';
  dataAtual: string = '';
  meusPets: any[] = [];

  constructor(private router: Router) {
    const opcoes: Intl.DateTimeFormatOptions = {
      weekday: 'short', day: '2-digit', month: 'short', year: 'numeric'
    };
    this.dataAtual = new Date().toLocaleDateString('pt-BR', opcoes);
  }

  ngOnInit() {
    this.meusPets = [
      { id: 1, nome: 'Thor', raca: 'Golden Retriever', idade: 3, foto: '1587300003388-59208cc962cb', vacinado: true },
      { id: 2, nome: 'Luna', raca: 'Poodle Toy', idade: 1, foto: '1568572933382-74d440642117', vacinado: true }
    ];
  }

  logout() {
    localStorage.removeItem('token');
    this.router.navigate(['/login']);
  }
}
