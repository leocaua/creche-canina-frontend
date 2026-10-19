import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { AuthService } from '../../services/auth';
import Swal from 'sweetalert2';

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

  mostrarNovaSenha = false;
  mostrarConfirmaSenha = false;

  constructor(private router: Router, private authService: AuthService) {}

  toggleNovaSenha() {
    this.mostrarNovaSenha = !this.mostrarNovaSenha;
  }

  toggleConfirmaSenha() {
    this.mostrarConfirmaSenha = !this.mostrarConfirmaSenha;
  }

  redefinirSenha() {
    if (!this.email || !this.novaSenha || !this.confirmaSenha) {
      Swal.fire({
        title: 'Atenção',
        text: 'Por favor, preencha todos os campos.',
        icon: 'warning',
        confirmButtonColor: '#B85A10'
      });
      return;
    }

    if (this.novaSenha !== this.confirmaSenha) {
      Swal.fire({
        title: 'Atenção',
        text: 'As senhas não coincidem!',
        icon: 'warning',
        confirmButtonColor: '#B85A10'
      });
      return;
    }

    const dados = {
      email: this.email,
      senha: this.novaSenha
    };

    this.authService.esqueciSenhaApi(dados).subscribe({
      next: () => {
        Swal.fire({
          title: 'Sucesso!',
          text: 'Senha alterada com sucesso! Faça login com a nova senha.',
          icon: 'success',
          confirmButtonColor: '#B85A10'
        }).then(() => {
          this.router.navigate(['/login']);
        });
      },
      error: (erro) => {
        Swal.fire({
          title: 'Erro',
          text: 'Não foi possível redefinir a senha. Verifique se o e-mail está correto.',
          icon: 'error',
          confirmButtonColor: '#B85A10'
        });
        console.error('Detalhes do erro:', erro);
      }
    });
  }
}
