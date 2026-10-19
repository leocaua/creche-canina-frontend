import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../services/auth';
import { Router, RouterModule } from '@angular/router';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [FormsModule, RouterModule],
  templateUrl: './login.html',
  styleUrl: './login.css',
})
export class Login implements OnInit {

  constructor(private router: Router, private authService: AuthService) {}

  email = '';
  senha = '';
  lembrarMe = false;

  mostrarSenha = false;

  ngOnInit(): void {
    if (typeof window !== 'undefined') {
      const emailSalvo = localStorage.getItem('emailLembrado');

      if (emailSalvo) {
        this.email = emailSalvo;
        this.lembrarMe = true;
      }
    }
  }

  toggleSenha() {
    this.mostrarSenha = !this.mostrarSenha;
  }

  fazerLogin() {
    const pacote = {
      email: this.email,
      senha: this.senha
    };

    const emailDaEmpresa = 'admin@petday.com.br';

    this.authService.fazerLoginApi(pacote).subscribe({
      next: (resposta) => {
        localStorage.setItem('token', resposta);

        if (this.lembrarMe) {
          localStorage.setItem('emailLembrado', this.email);
        } else {
          localStorage.removeItem('emailLembrado');
        }

        if (this.email === emailDaEmpresa) {
          localStorage.setItem('perfil', 'ADMIN');
          this.router.navigate(['/painel-admin']);
        } else {
          localStorage.setItem('perfil', 'TUTOR');
          this.router.navigate(['/home']);
        }
      },
      error: (erro) => {
        Swal.fire({
          title: 'Acesso Negado',
          text: 'E-mail ou senha incorretos. Tente novamente.',
          icon: 'error',
          confirmButtonColor: '#B85A10'
        });
        console.error('Detalhes do erro:', erro);
      }
    });
  }
}
