import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { AuthService } from '../../services/auth';
import Swal from 'sweetalert2';

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

  rua = '';
  numero = '';
  bairro = '';

  contato = '';

  mostrarSenha = false;

  constructor(private authService: AuthService, private router: Router) {}

  toggleSenha() {
    this.mostrarSenha = !this.mostrarSenha;
  }

  aplicarMascaraTelefone(event: any) {
    let valor = event.target.value.replace(/\D/g, '');

    if (valor.length === 0) {
      this.contato = '';
      return;
    }

    if (valor.length <= 2) {
      this.contato = `(${valor}`;
    } else if (valor.length <= 7) {
      this.contato = `(${valor.substring(0, 2)}) ${valor.substring(2)}`;
    } else {
      this.contato = `(${valor.substring(0, 2)}) ${valor.substring(2, 7)}-${valor.substring(7, 11)}`;
    }

    event.target.value = this.contato;
  }

  fazerCadastro() {
    const enderecoCompleto = `${this.rua}, ${this.numero}, ${this.bairro}`;

    const novoCliente = {
      nome: this.nome,
      email: this.email,
      senha: this.senha,
      endereco: enderecoCompleto,
      contato: this.contato
    };

    this.authService.cadastrarCliente(novoCliente).subscribe({
      next: () => {
        Swal.fire({
          title: 'Bem-vindo!',
          text: 'Conta criada com sucesso! Faça login para continuar.',
          icon: 'success',
          confirmButtonColor: '#B85A10'
        }).then(() => {
          this.router.navigate(['/login']);
        });
      },
      error: (erro: any) => {
        Swal.fire({
          title: 'Erro no Cadastro',
          text: 'Verifique os dados informados e tente novamente.',
          icon: 'error',
          confirmButtonColor: '#B85A10'
        });
        console.error(erro);
      }
    });
  }
}
