import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../services/auth';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [FormsModule],
  templateUrl: './login.html',
  styleUrl: './login.css',
})
export class Login {

  constructor(private authService: AuthService) {}

  email = '';
  senha = '';

  fazerLogin() {
    const pacote = {
      login: this.email,
      senha: this.senha
    };

    this.authService.fazerLoginApi(pacote).subscribe({
      next: (resposta) => {
        alert('Login aprovado pelo Backend! \nResposta:' + JSON.stringify(resposta));
      },
      error: (erro) => {
        alert('Erro ao tentar logar. Verifique o console ou ligue o backend!');
        console.error('Detalhes do erro:', erro);
      }
    });
  }
}
