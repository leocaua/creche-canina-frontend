import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../services/auth';
import { Router, RouterModule } from '@angular/router';

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

  ngOnInit(): void {
    const emailSalvo = localStorage.getItem('emailLembrado');
    if (emailSalvo) {
      this.email = emailSalvo;
      this.lembrarMe = true;
    }
  }

  fazerLogin() {
    const pacote = {
      email: this.email,
      senha: this.senha
    };

    this.authService.fazerLoginApi(pacote).subscribe({
      next: (resposta) => {
        localStorage.setItem('token', resposta);

        if (this.lembrarMe) {
          localStorage.setItem('emailLembrado', this.email);
        } else {
          localStorage.removeItem('emailLembrado');
        }

        this.router.navigate(['/home']);
      },
      error: (erro) => {
        alert('Erro ao tentar logar. Verifique o console ou ligue o backend!');
        console.error('Detalhes do erro:', erro);
      }
    });
  }
}
