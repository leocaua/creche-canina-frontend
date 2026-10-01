import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, Router } from '@angular/router';
import { MatriculaService } from '../../services/matricula';
import { MatriculaRequestDto } from '../../models/matricula-request.dto';
import { Cliente } from '../../services/cliente';
import { Pet } from '../../services/pet';

@Component({
  selector: 'app-matriculas',
  standalone: true,
  imports: [RouterLink, CommonModule],
  templateUrl: './matriculas.html',
  styleUrls: ['./matriculas.css'],
})

export class MatriculasComponent implements OnInit {
  nomeCliente: string = '';
  clienteId: number | null = null;
  dataAtual: string = '';
  mostrarNotificacoes: boolean = false;
  notificacoesNaoLidas: number = 0;
  notificacoes: any[] = [];

  meusPets: any[] = [];

  etapaAtual: number = 1;
  planoSelecionadoId: number | null = null;
  frequenciaSelecionada: number = 0;
  petsSelecionadosIds: number[] = [];
  diasSelecionados: string[] = [];

  constructor(
    private matriculaService: MatriculaService,
    private clienteService: Cliente,
    private petService: Pet,
    private router: Router,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit() {
    this.configurarData();
    this.carregarDadosUsuario();
  }

  configurarData() {
    const opcoes: Intl.DateTimeFormatOptions = {
      weekday: 'short',
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    };

    this.dataAtual = new Date().toLocaleDateString('pt-BR', opcoes).replace('.', '');
  }

  carregarDadosUsuario() {
    if (typeof window !== 'undefined') {
      const token = localStorage.getItem('token');
      if (token) {
        try {
          const payload = JSON.parse(atob(token.split('.')[1]));
          const emailLogado = payload.sub;

          this.clienteService.buscarTodosClientes().subscribe({
            next: (clientes: any) => {
              const clienteEncontrado = clientes.find((c: any) => c.email === emailLogado);

              setTimeout(() => {
                if (clienteEncontrado) {
                  this.nomeCliente = clienteEncontrado.nome || 'Tutor';
                  this.clienteId = clienteEncontrado.id;
                  this.carregarPets(this.clienteId!);
                } else {
                  this.nomeCliente = 'Tutor';
                }
                this.cdr.detectChanges();
              }, 0);
            },
            error: (erro: any) => {
              console.error('Erro ao buscar cliente:', erro);
              setTimeout(() => {
                this.nomeCliente = 'Tutor';
                this.cdr.detectChanges();
              }, 0);
            }
          });
        } catch (e) {
          console.error('Erro ao processar token:', e);
        }
      }
    }
  }

  carregarPets(clienteId: number) {
    this.petService.buscarPorClienteId(clienteId).subscribe({
      next: (pets: any[]) => {
        this.meusPets = pets;
        this.cdr.detectChanges();
      },
      error: (err: any) => console.error('Erro ao carregar pets:', err)
    });
  }

  toggleNotificacoes() {
    this.mostrarNotificacoes = !this.mostrarNotificacoes;
  }

  marcarTodasComoLidas() {
    this.notificacoes.forEach(n => n.lida = true);
    this.notificacoesNaoLidas = 0;
  }

  clicarNotificacao(notificacao: any) {
    if (!notificacao.lida) {
      notificacao.lida = true;
      this.notificacoesNaoLidas = Math.max(0, this.notificacoesNaoLidas - 1);
    }
  }

  logout() {
    localStorage.clear();
    this.router.navigate(['/login']);
  }

  selecionarPlano(id: number) {
    if (this.planoSelecionadoId === id) {
      this.planoSelecionadoId = null;
    } else {
      this.planoSelecionadoId = id;
    }
  }

  selecionarFrequencia(dias: number) {
    if (this.frequenciaSelecionada === dias) {
      this.frequenciaSelecionada = 0;
    } else {
      this.frequenciaSelecionada = dias;
    }
  }

  selecionarPet(petId: number) {
    const index = this.petsSelecionadosIds.indexOf(petId);
    if (index > -1) {
      this.petsSelecionadosIds.splice(index, 1);
    } else {
      this.petsSelecionadosIds.push(petId);
    }
  }

  selecionarDia(dia: string) {
    const index = this.diasSelecionados.indexOf(dia);
    if (index > -1) {
      this.diasSelecionados.splice(index, 1);
    } else {
      if (this.diasSelecionados.length < this.frequenciaSelecionada) {
        this.diasSelecionados.push(dia);
      } else {
        alert(`O plano escolhido é de ${this.frequenciaSelecionada}x na semana. Desmarque um dia para escolher outro!`);
      }
    }
  }

  get nomePlanoFormatado(): string {
    if (this.planoSelecionadoId === 1)
      return 'Mensal';
    if (this.planoSelecionadoId === 2)
      return 'Trimestral';
    if (this.planoSelecionadoId === 3)
      return 'Semestral';
    return 'Não selecionado';
  }

  get valorTotalCalculado(): number {
    let valorBase = 0;

    if (this.planoSelecionadoId === 1)
      valorBase = 150;
    else if (this.planoSelecionadoId === 2)
      valorBase = 400;
    else if (this.planoSelecionadoId === 3)
      valorBase = 750;

    let valorPorPet = valorBase * (this.frequenciaSelecionada || 1);
    const qtdPets = this.petsSelecionadosIds.length > 0 ? this.petsSelecionadosIds.length : 1;

    return valorPorPet * qtdPets;
  }

  get imagemCheckout(): string {
    if (this.petsSelecionadosIds.length === 1) {
      const pet = this.meusPets.find(p => p.id === this.petsSelecionadosIds[0]);
      if (pet && pet.foto) {
        return pet.foto.includes('data:image') ? pet.foto : 'data:image/jpeg;base64,' + pet.foto;
      }
    }
    return 'https://cdn-icons-png.flaticon.com/512/616/616408.png';
  }

  get textoPetsCheckout(): string {
    if (this.petsSelecionadosIds.length === 1) {
      const pet = this.meusPets.find(p => p.id === this.petsSelecionadosIds[0]);
      return pet ? pet.nome : '1 pet(s)';
    }
    return `${this.petsSelecionadosIds.length} pets selecionados`;
  }

  avancar() {
    if (this.etapaAtual < 3) this.etapaAtual++;
  }

  voltar() {
    if (this.etapaAtual > 1) this.etapaAtual--;
  }

  finalizarMatricula() {
    const dto: MatriculaRequestDto = {
      planoId: this.planoSelecionadoId!,
      petIds: this.petsSelecionadosIds,
      diasSemana: this.diasSelecionados.join(', '),
      frequencia: this.frequenciaSelecionada
    };

    this.matriculaService.criarMatricula(dto).subscribe({
      next: (resposta: any) => {
        console.log('Matrícula gerada com sucesso!', resposta);
        alert('Matrícula gerada com sucesso! Código Pix liberado.');
      },
      error: (erro: any) => {
        console.error('Erro ao gerar matrícula', erro);
        alert('Ocorreu um erro ao processar sua matrícula.');
      }
    });
  }
}
