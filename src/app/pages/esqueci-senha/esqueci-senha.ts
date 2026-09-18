import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { AuthService } from '../../services/auth';

@Component({
  selector: 'app-esqueci-senha',
  standalone: true,
  imports: [FormsModule, RouterModule],
  templateUrl: './esqueci-senha.html',
  styleUrl: './esqueci-senha.css'
})
export class EsqueciSenha {
  email = '';
  novaSenha = '';
  confirmaSenha = '';

  constructor(private router: Router, private authService: AuthService) {}

  redefinirSenha() {
    if (!this.email || !this.novaSenha || !this.confirmaSenha) {
      alert('Por favor, preencha todos os campos.');
      return;
    }

    if (this.novaSenha !== this.confirmaSenha) {
      alert('As senhas não coincidem!');
      return;
    }

    const dados = {
      email: this.email,
      senha: this.novaSenha
    };

    this.authService.esqueciSenhaApi(dados).subscribe({
      next: () => {
        alert('Senha alterada com sucesso! Faça login com a nova senha.');
        this.router.navigate(['/login']);
      },
      error: (erro) => {
        alert('Erro ao redefinir a senha. Verifique se o e-mail está correto.');
        console.error('Detalhes do erro:', erro);
      }
    });
  }
}
