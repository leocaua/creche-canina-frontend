import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { AuthService } from '../../services/auth';

@Component({
  selector: 'app-cadastro',
  standalone: true,
  imports: [FormsModule, RouterModule],
  templateUrl: './cadastro.html',
  styleUrl: './cadastro.css'
})
export class CadastroComponent {
  nome = '';
  email = '';
  senha = '';
  endereco = '';
  contato = '';

  constructor(private authService: AuthService, private router: Router) {}

  fazerCadastro() {
    const novoCliente = {
      nome: this.nome,
      email: this.email,
      senha: this.senha,
      endereco: this.endereco,
      contato: this.contato
    };

    this.authService.cadastrarCliente(novoCliente).subscribe({
      next: () => {
        alert('Conta criada com sucesso! Faça login para continuar.');
        this.router.navigate(['/login']);
      },
      error: (erro: any) => {
        alert('Erro ao criar conta. Verifique os dados e tente novamente.');
        console.error(erro);
      }
    });
  }
}
