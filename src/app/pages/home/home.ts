import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { Cliente } from '../../services/cliente';
import { Pet } from '../../services/pet';
import { Router, RouterLink } from '@angular/router';
import { MatriculaService } from '../../services/matricula';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [RouterLink],
  templateUrl: './home.html',
  styleUrl: './home.css',
})

export class Home implements OnInit {

  nomeCliente: string = 'Carregando...';
  meusPets: any[] = [];
  dataAtual: string = '';
  proximoAgendamento: any = null;
  historico: any[] = [];

  constructor(private clienteService: Cliente,
              private petService: Pet,
              private cdr: ChangeDetectorRef,
              private router: Router,
              private matriculaService: MatriculaService
            ) {
              const opcoes: Intl.DateTimeFormatOptions = { weekday: 'short',
                                                           day: '2-digit',
                                                           month: 'short',
                                                           year: 'numeric' };
              this.dataAtual = new Date().toLocaleDateString('pt-BR', opcoes);
            }



            logout() {

              if (typeof window !== 'undefined') {
                
              this.router.navigate(['/login']);
            }
          }

            irParaPets() {
              this.router.navigate(['/meus-pets']);
            }

    ngOnInit() {

      const token = localStorage.getItem('token');
      let emailLogado = '';

      if (token) {
        const payload = JSON.parse(atob(token.split('.')[1]));
        emailLogado = payload.sub;
      }

      this.clienteService.buscarTodosClientes().subscribe({
        next: (clientes: any) => {

          const clienteEncontrado = clientes.find((cliente: any) => cliente.email === emailLogado);

          if (clienteEncontrado) {
            this.nomeCliente = clienteEncontrado.nome;

            this.meusPets = [
              { id: 1, nome: 'Thor', raca: 'Golden Retriever', foto: '1587300003388-59208cc962cb' },
              { id: 2, nome: 'Luna', raca: 'Poodle Toy', foto: '1568572933382-74d440642117' }
            ];

            this.proximoAgendamento = {
              pet: this.meusPets[0],
              data: '13/07/2026',
              status: 'Confirmado'
            };

            this.historico = [
              { id: 1, pet: this.meusPets[0], data: '13/07/2026' },
              { id: 2, pet: this.meusPets[1], data: '11/07/2026' }
            ];

            this.cdr.detectChanges();
            return;

          } else {
            this.nomeCliente = 'Visitante';
          }
            this.cdr.detectChanges();
        },
        error: (erro: any) => {
          console.error('Erro ao buscar a lista de clientes:', erro);
        }
      });
    }
  }
