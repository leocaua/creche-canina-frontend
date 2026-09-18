import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../services/auth';
import { Router } from '@angular/router';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [FormsModule],
  templateUrl: './login.html',
  styleUrl: './login.css',
})
export class Login {

  constructor(private authService: AuthService, private router: Router) {}

  email = '';
  senha = '';

  fazerLogin() {
    const pacote = {
      email: this.email,
      senha: this.senha
    };

    this.authService.fazerLoginApi(pacote).subscribe({
      next: (resposta) => {
        localStorage.setItem('token', resposta);

        this.router.navigate(['/home']);
            },
      error: (erro) => {
        alert('Erro ao tentar logar. Verifique o console ou ligue o backend!');
        console.error('Detalhes do erro:', erro);
      }
    });
  }
}
