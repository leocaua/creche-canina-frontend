import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { Cliente } from '../../services/cliente';
import { Pet } from '../../services/pet';
import { Router, RouterLink } from '@angular/router';
import { MatriculaService } from '../../services/matricula';
import { NotificacaoService } from '../../services/notificacao';

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

  planoAtivo: string = 'Nenhum';
  validadePlano: string = '-';

  mostrarNotificacoes: boolean = false;
  notificacoes: any[] = [];

  constructor(
    private clienteService: Cliente,
    private petService: Pet,
    private cdr: ChangeDetectorRef,
    private router: Router,
    private matriculaService: MatriculaService,
    private notificacaoService: NotificacaoService
  ) {
    const opcoes: Intl.DateTimeFormatOptions = {
      weekday: 'short',
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    };
    this.dataAtual = new Date().toLocaleDateString('pt-BR', opcoes);
  }


  get notificacoesNaoLidas() {
    return this.notificacoes.filter(n => !n.lida).length;
  }

  toggleNotificacoes() {
    this.mostrarNotificacoes = !this.mostrarNotificacoes;
  }

  clicarNotificacao(notificacao: any) {
    if (!notificacao.lida) {
      this.notificacaoService.marcarComoLida(notificacao.id).subscribe({
        next: () => {
          notificacao.lida = true;
          this.cdr.detectChanges();
        },
        error: (erro: any) => console.error('Erro ao marcar notificação:', erro)
      });
    }

    this.mostrarNotificacoes = false;

    if (notificacao.tipo === 'agendamento') {
      this.router.navigate(['/matriculas']);
    } else if (notificacao.tipo === 'rotina') {
      this.router.navigate(['/rotina']);
    }
  }

  marcarTodasComoLidas() {
    const naoLidas = this.notificacoes.filter(n => !n.lida);

    naoLidas.forEach(n => {
      this.notificacaoService.marcarComoLida(n.id).subscribe({
        next: () => n.lida = true
      });
    });
  }

  private carregarNotificacoes(clienteId: number) {
    this.notificacaoService.buscarPorClienteId(clienteId).subscribe({
      next: (notificacoes: any[]) => {
        this.notificacoes = notificacoes;
        this.cdr.detectChanges();
      },
      error: (erro: any) => console.error('Erro ao carregar notificações:', erro)
    });
  }


  logout() {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('token');
      localStorage.removeItem('usuarioLogado');
      this.router.navigate(['/login']);
    }
  }

  irParaPets() {
    this.router.navigate(['/meus-pets']);
  }

  irParaAgendamento() {
    this.router.navigate(['/matriculas']);
  }

  irParaRotina() {
    this.router.navigate(['/rotina']);
  }


  ngOnInit() {
    if (typeof window !== 'undefined') {
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
            this.carregarMeusPets(clienteEncontrado.id);
            this.carregarAgendamentos(clienteEncontrado.id);
            this.carregarNotificacoes(clienteEncontrado.id);
          }
          else {
            this.nomeCliente = 'Visitante';
            this.cdr.detectChanges();
          }
        },
        error: (erro: any) => {
          console.error('Erro ao buscar a lista de clientes:', erro);
        }
      });
    }
  }

  getImagemCard(foto: string): string {
  if (!foto) return 'https://images.unsplash.com/photo-1587300003388-59208cc962cb?w=400&h=200&fit=crop';
  if (foto.startsWith('data:image')) {
    return foto;
  }
  return `https://images.unsplash.com/photo-${foto}?w=400&h=200&fit=crop`;
}

  private carregarMeusPets(clienteId: number) {
    this.petService.buscarPorClienteId(clienteId).subscribe({
      next: (pets: any[]) => {
        this.meusPets = pets.map(p => ({
          ...p,
          foto: p.foto ? p.foto : '1587300003388-59208cc962cb'
        }));
        this.cdr.detectChanges();
      },
      error: (erro: any) => console.error('Erro ao carregar pets:', erro)
    });
  }

  private carregarAgendamentos(clienteId: number) {
    this.matriculaService.buscarPorClienteId(clienteId).subscribe({
      next: (agendamentos: any[]) => {
        if (agendamentos && agendamentos.length > 0) {

          const reserva = agendamentos[0];
          this.planoAtivo = reserva.plano ? reserva.plano.nome : 'Mensal';

          const dataVencimento = new Date(reserva.dataReserva + 'T00:00:00');
          const mesesParaAdicionar = this.planoAtivo.toLowerCase() === 'trimestral' ? 3 : 1;

          dataVencimento.setMonth(dataVencimento.getMonth() + mesesParaAdicionar);
          this.validadePlano = dataVencimento.toLocaleDateString('pt-BR');

          const historicoFormatado = agendamentos.map(ag => {
            const dataObjeto = new Date(ag.dataReserva + 'T00:00:00');
            const dataBr = dataObjeto.toLocaleDateString('pt-BR');
            const petDaMatricula = ag.pets && ag.pets.length > 0 ? ag.pets[0] : { nome: 'Pet' };

            return {
              ...ag,
              pet: {
                ...petDaMatricula,
                foto: petDaMatricula.foto ? petDaMatricula.foto : '1587300003388-59208cc962cb'
              },
              data: dataBr
            };
          });

          this.proximoAgendamento = historicoFormatado[0];
          this.historico = historicoFormatado;
        } else {
          this.proximoAgendamento = null;
          this.historico = [];
        }
        this.cdr.detectChanges();
      },
      error: (erro: any) => console.error('Erro ao carregar agendamentos:', erro)
    });
  }
}
