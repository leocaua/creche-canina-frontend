import { Component, OnInit, ChangeDetectorRef, HostListener } from '@angular/core';
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
  menuAberto: boolean = false;
  nomeCliente: string = 'Carregando...';
  clienteIdLogado: number = 0;
  meusPets: any[] = [];
  dataAtual: string = '';
  proximosAgendamentos: any[] = [];
  historico: any[] = [];

  planoAtivo: string = 'Nenhum';
  validadePlano: string = '-';

  mostrarNotificacoes: boolean = false;
  notificacoes: any[] = [];

  notificacoesNaoLidas: number = 0;

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

  toggleNotificacoes() {
    this.mostrarNotificacoes = !this.mostrarNotificacoes;
  }

  @HostListener('document:click')
  fecharNotificacoesAoClicarFora() {
    this.mostrarNotificacoes = false;
  }

  clicarNotificacao(notificacao: any) {
    if (!notificacao.lida) {
      this.notificacaoService.marcarComoLida(notificacao.id).subscribe({
        next: () => {
          notificacao.lida = true;
          this.notificacoesNaoLidas = this.notificacoes.filter(n => !n.lida).length;
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
        next: () => {
          n.lida = true;
          this.notificacoesNaoLidas = this.notificacoes.filter(x => !x.lida).length;
          this.cdr.detectChanges();
        }
      });
    });
  }

  limparNotificacoes() {
    if (this.clienteIdLogado > 0) {
      this.notificacaoService.limparDoCliente(this.clienteIdLogado).subscribe({
        next: () => {
          this.notificacoes = [];
          this.notificacoesNaoLidas = 0;
          this.cdr.detectChanges();
        },
        error: (erro: any) => console.error('Erro ao limpar notificações:', erro)
      });
    }
  }

  private carregarNotificacoes(clienteId: number) {
    this.notificacaoService.buscarPorClienteId(clienteId).subscribe({
      next: (notificacoes: any[]) => {
        this.notificacoes = notificacoes;
        this.notificacoesNaoLidas = this.notificacoes.filter(n => !n.lida).length;
        this.cdr.detectChanges();
      },
      error: (erro: any) => console.error('Erro ao carregar notificações:', erro)
    });
  }

  logout() {
    if (typeof window !== 'undefined') {
      const emailLembrado = localStorage.getItem('emailLembrado');
      localStorage.clear();

      if (emailLembrado) {
        localStorage.setItem('emailLembrado', emailLembrado);
      }
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
            this.clienteIdLogado = clienteEncontrado.id;
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
    if (!foto)
      return 'https://images.unsplash.com/photo-1587300003388-59208cc962cb?w=400&h=200&fit=crop';

    if (foto.startsWith('data:image') || foto.startsWith('http')) {
      return foto;
    }

    if (foto.length > 100) {
      return 'data:image/jpeg;base64,' + foto;
    }

    return `https://images.unsplash.com/photo-${foto}?w=400&h=200&fit=crop`;
  }

  lidarErroImagem(event: any) {
    event.target.src = 'https://images.unsplash.com/photo-1587300003388-59208cc962cb?w=400&h=400&fit=crop';
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
        const ativas = agendamentos ? agendamentos.filter(ag =>
          ag.status === true || ag.status === 'true' || ag.status === 1
        ) : [];

        if (ativas.length > 0) {
          const reserva = ativas[0];
          this.planoAtivo = reserva.plano ? reserva.plano.nome : 'Mensal';

          let dataObjeto = new Date();
          if (Array.isArray(reserva.dataReserva)) {
            dataObjeto = new Date(reserva.dataReserva[0], reserva.dataReserva[1] - 1, reserva.dataReserva[2]);
          } else if (reserva.dataReserva) {
            dataObjeto = new Date(reserva.dataReserva + 'T00:00:00');
          }

          const dataVencimento = new Date(dataObjeto);
          const planoLowerCase = this.planoAtivo.toLowerCase();
          const mesesParaAdicionar = planoLowerCase.includes('trimestral') ? 3 : planoLowerCase.includes('semestral') ? 6 : 1;

          dataVencimento.setMonth(dataVencimento.getMonth() + mesesParaAdicionar);
          this.validadePlano = dataVencimento.toLocaleDateString('pt-BR');

          const proximosFormatados: any[] = [];
          const historicoFormatado: any[] = [];
          const diasDaSemana = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'];
          const hoje = new Date();
          hoje.setHours(0, 0, 0, 0);

          ativas.forEach(ag => {
            let dataInicioMatricula = new Date(hoje);
            if (Array.isArray(ag.dataReserva)) {
              dataInicioMatricula = new Date(ag.dataReserva[0], ag.dataReserva[1] - 1, ag.dataReserva[2]);
            } else if (ag.dataReserva) {
              dataInicioMatricula = new Date(String(ag.dataReserva).substring(0, 10) + 'T00:00:00');
            }
            dataInicioMatricula.setHours(0, 0, 0, 0);

            let proximaDataAgendamento = new Date(hoje);
            const diasMatriculados = ag.diasSemana
              ? ag.diasSemana.split(',').map((d: string) => d.trim().replace('-feira', ''))
              : [];

            if (diasMatriculados.length > 0) {
              const diaAtualIndex = hoje.getDay();
              let diasParaAdicionar = 1;

              for (let i = 1; i <= 7; i++) {
                const proximoIndex = (diaAtualIndex + i) % 7;

                if (diasMatriculados.some((d: string) => d.includes(diasDaSemana[proximoIndex]))) {
                  diasParaAdicionar = i;
                  break;
                }
              }
              proximaDataAgendamento.setDate(proximaDataAgendamento.getDate() + diasParaAdicionar);
            } else {
              proximaDataAgendamento = dataInicioMatricula;
            }

            if (ag.pets && ag.pets.length > 0) {
              ag.pets.forEach((petDaMatricula: any) => {
                const petObj = {
                  ...petDaMatricula,
                  foto: petDaMatricula.foto ? petDaMatricula.foto : '1587300003388-59208cc962cb'
                };

                proximosFormatados.push({
                  ...ag,
                  pet: petObj,
                  data: proximaDataAgendamento.toLocaleDateString('pt-BR')
                });

                if (diasMatriculados.length > 0) {
                  const cursor = new Date(hoje);
                  while (cursor > dataInicioMatricula) {
                    const nomeDiaCursor = diasDaSemana[cursor.getDay()];
                    if (diasMatriculados.some((d: string) => d.includes(nomeDiaCursor))) {
                      const ehHoje = cursor.getTime() === hoje.getTime();
                      historicoFormatado.push({
                        ...ag,
                        pet: petObj,
                        data: cursor.toLocaleDateString('pt-BR'),
                        timestamp: cursor.getTime(),
                        statusTexto: ehHoje ? 'Hoje' : 'Realizado'
                      });
                    }
                    cursor.setDate(cursor.getDate() - 1);
                  }
                } else if (dataInicioMatricula <= hoje) {
                  const ehHoje = dataInicioMatricula.getTime() === hoje.getTime();
                  historicoFormatado.push({
                    ...ag,
                    pet: petObj,
                    data: dataInicioMatricula.toLocaleDateString('pt-BR'),
                    timestamp: dataInicioMatricula.getTime(),
                    statusTexto: ehHoje ? 'Hoje' : 'Realizado'
                  });
                }
              });
            }
          });

          historicoFormatado.sort((a, b) => b.timestamp - a.timestamp);

          this.proximosAgendamentos = proximosFormatados;
          this.historico = historicoFormatado;
        } else {
          this.planoAtivo = 'Nenhum';
          this.proximosAgendamentos = [];
          this.historico = [];
        }
        this.cdr.detectChanges();
      },
      error: (erro: any) => console.error('Erro ao carregar agendamentos:', erro)
    });
  }
}
