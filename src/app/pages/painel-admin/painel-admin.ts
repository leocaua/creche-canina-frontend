import { Component, OnInit, ChangeDetectorRef, HostListener } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { CommonModule } from '@angular/common';
import { RouterLink, RouterLinkActive, Router } from '@angular/router';
import { AdminService, AgendaItem } from '../../services/admin';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-painel-admin',
  standalone: true,
  imports: [CommonModule, RouterLink, RouterLinkActive],
  templateUrl: './painel-admin.html',
  styleUrls: ['./painel-admin.css']
})
export class PainelAdmin implements OnInit {
  dataAtual: string = '';
  dataSimples: string = '';
  dataFormatadaBanco: string = '';
  menuAberto: boolean = false;

  capacidadeTotal = { P: 8, M: 6, G: 6 };
  agendaDeHoje: AgendaItem[] = [];

  agendamentosSemana: number = 0;
  receitaMes: number = 0;

  mostrarNotificacoes: boolean = false;
  notificacoesNaoLidas: number = 0;
  notificacoes: any[] = [];

  capacidadeTotalGeral = 20;
  vagasOcupadasHoje = 0;
  porcentagemVagasHoje = 0;

  constructor(private adminService: AdminService,
              private router: Router,
              private cdr: ChangeDetectorRef,
              private http: HttpClient) {}

  ngOnInit() {
    this.configurarDatas();
    this.carregarAgenda();
    this.carregarMetricasGerais();
    this.carregarNotificacoes();
  }

  configurarDatas() {
    const hoje = new Date();
    const opcoesAtual: Intl.DateTimeFormatOptions = {
      weekday: 'short',
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    };

    this.dataAtual = hoje.toLocaleDateString('pt-BR', opcoesAtual).replace('.', '');

    const opcoesSimples: Intl.DateTimeFormatOptions = {
      day: 'numeric',
      month: 'long'
    };

    this.dataSimples = hoje.toLocaleDateString('pt-BR', opcoesSimples);

    const ano = hoje.getFullYear();
    const mes = String(hoje.getMonth() + 1).padStart(2, '0');
    const dia = String(hoje.getDate()).padStart(2, '0');

    this.dataFormatadaBanco = `${ano}-${mes}-${dia}`;
  }

  atualizarVagasDeHoje() {
    this.vagasOcupadasHoje = this.agendaDeHoje.filter(i =>
      i.status !== 'PENDENTE' && i.status !== 'AUSENTE'
    ).length;

    this.porcentagemVagasHoje = (this.vagasOcupadasHoje / this.capacidadeTotalGeral) * 100;
  }

  carregarAgenda() {
    this.adminService.buscarAgendaDoDia(this.dataFormatadaBanco).subscribe({
      next: (dadosBackend: AgendaItem[]) => {
        console.log('Dados vindos do Spring Boot:', dadosBackend);

        this.agendaDeHoje = dadosBackend || [];
        this.atualizarVagasDeHoje();
        this.cdr.detectChanges();
      },
      error: (erro: any) => {
        console.error('Sem dados de agenda:', erro);

        this.agendaDeHoje = [];
        this.vagasOcupadasHoje = 0;
        this.porcentagemVagasHoje = 0;
        this.cdr.detectChanges();
      }
    });
  }

  carregarMetricasGerais() {
    this.receitaMes = 0;
    this.agendamentosSemana = 0;

    const token = localStorage.getItem('token');
    const headers = new HttpHeaders().set('Authorization', `Bearer ${token}`);

    this.http.get<number>('http://localhost:8080/matriculas/admin/receita-total', { headers }).subscribe({
      next: (valorReceita) => {
        this.receitaMes = Number(valorReceita) || 0;
        this.cdr.detectChanges();
      },
      error: (err) => console.error('Erro ao buscar receita total:', err)
    });

    const dataRef = new Date();
    const diaDaSemana = dataRef.getDay();
    const diferencaParaSegunda = dataRef.getDate() - diaDaSemana + (diaDaSemana === 0 ? -6 : 1);

    const segundaFeira = new Date(dataRef.getTime());
    segundaFeira.setDate(diferencaParaSegunda);

    for (let i = 0; i < 6; i++) {
      const dataCorrente = new Date(segundaFeira.getTime());
      dataCorrente.setDate(segundaFeira.getDate() + i);

      const ano = dataCorrente.getFullYear();
      const mes = String(dataCorrente.getMonth() + 1).padStart(2, '0');
      const dia = String(dataCorrente.getDate()).padStart(2, '0');
      const dataBanco = `${ano}-${mes}-${dia}`;

      this.adminService.buscarAgendaDoDia(dataBanco).subscribe({
        next: (dados) => {
          const confirmados = (dados || []).filter(a =>
            (a.tipo === 'CRECHE' || a.tipo === 'REPOSICAO') && a.status !== 'PENDENTE'
          );
          this.agendamentosSemana += confirmados.length;
          this.cdr.detectChanges();
        },
        error: (err) => console.error(`Sem agendamentos para ${dataBanco}:`, err)
      });
    }
  }

  carregarNotificacoes() {
    const token = localStorage.getItem('token');
    const headers = new HttpHeaders().set('Authorization', `Bearer ${token}`);

    this.http.get<any[]>('http://localhost:8080/notificacoes/admin', { headers }).subscribe({
      next: (dadosBackend) => {
        this.notificacoes = dadosBackend;
        this.atualizarContadorNaoLidas();
        this.cdr.detectChanges();
      },
      error: (err) => console.error('Erro ao carregar notificações do sistema', err)
    });
  }

  salvarNotificacoes() {
    localStorage.setItem('admin_notificacoes', JSON.stringify(this.notificacoes));
  }

  atualizarContadorNaoLidas() {
    this.notificacoesNaoLidas = this.notificacoes.filter(n => !n.lida).length;
  }

  toggleNotificacoes() {
    this.mostrarNotificacoes = !this.mostrarNotificacoes;
  }

  @HostListener('document:click')
  fecharNotificacoesAoClicarFora() {
    this.mostrarNotificacoes = false;
  }

  marcarTodasComoLidas() {
    const naoLidas = this.notificacoes.filter(n => !n.lida);
    naoLidas.forEach(n => this.clicarNotificacao(n));
  }

  limparNotificacoes() {
    Swal.fire({
      title: 'Limpar Notificações?',
      text: 'Tem a certeza de que deseja apagar todo o histórico de notificações? Esta ação não pode ser desfeita.',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#8C827A',
      confirmButtonText: 'Sim, limpar tudo!',
      cancelButtonText: 'Cancelar'
    }).then((result) => {

      if (result.isConfirmed) {
        const token = localStorage.getItem('token');
        const headers = new HttpHeaders().set('Authorization', `Bearer ${token}`);

        this.http.delete('http://localhost:8080/notificacoes/admin/limpar', { headers }).subscribe({
          next: () => {
            this.notificacoes = [];
            this.atualizarContadorNaoLidas();

            Swal.fire({
              title: 'Limpas!',
              text: 'O histórico de notificações foi apagado.',
              icon: 'success',
              confirmButtonColor: '#8C5637'
            });

            if (this.cdr)
              this.cdr.detectChanges();
          },
          error: (err: any) => console.error('Erro ao limpar banco de notificações', err)
        });
      }
    });
  }

  clicarNotificacao(n: any) {
    if (!n.lida) {
      const token = localStorage.getItem('token');
      const headers = new HttpHeaders().set('Authorization', `Bearer ${token}`);

      this.http.put(`http://localhost:8080/notificacoes/${n.id}/lida`, {}, { headers }).subscribe({
        next: () => {
          n.lida = true;
          this.atualizarContadorNaoLidas();
        },
        error: (err: any) => console.error('Erro ao marcar notificação como lida', err)
      });
    }
  }

  aprovarPendencia(item: AgendaItem) {
    if (confirm(`Deseja aprovar a ${item.tipo.toLowerCase()} de ${item.petNome}? O tutor será notificado.`)) {
      this.adminService.atualizarStatus(item.id, 'APROVAR').subscribe({
        next: () => {
          this.carregarAgenda();
          this.carregarMetricasGerais();
        },
        error: (err) => {
          console.error(err);
          alert('Erro ao aprovar. Verifique o console.');
        }
      });
    }
  }

  recusarPendencia(item: AgendaItem) {
    if (confirm(`Tem certeza que deseja recusar este pedido? O valor ou crédito será estornado.`)) {
      this.adminService.atualizarStatus(item.id, 'RECUSAR').subscribe({
        next: () => {
          this.carregarAgenda();
          this.carregarMetricasGerais();
        },
        error: (err) => {
          console.error(err);
          alert('Erro ao recusar pedido.');
        }
      });
    }
  }

  fazerCheckin(item: AgendaItem) {
    this.adminService.atualizarStatus(item.id, 'CHECKIN').subscribe({
      next: () => {
        this.carregarAgenda();
        this.carregarMetricasGerais();
      },
      error: (err) => {
        console.error('Erro no check-in:', err);
        alert('Falha ao dar entrada. Verifique o console.');
      }
    });
  }

  fazerCheckout(item: AgendaItem) {
    this.adminService.atualizarStatus(item.id, 'CHECKOUT').subscribe({
      next: () => {
        this.carregarAgenda();
        this.carregarMetricasGerais();
        this.carregarNotificacoes();
      },
      error: (err: any) => console.error('Erro ao fazer check-out', err)
    });
  }

  aprovarMatricula(agendamento: any, event: Event) {
    event.preventDefault();

    Swal.fire({
      title: 'Aprovar Matrícula?',
      text: `Deseja aprovar a ${agendamento.petNome} na creche? O tutor será notificado.`,
      icon: 'question',
      showCancelButton: true,
      confirmButtonColor: '#4CAF50',
      cancelButtonColor: '#d33',
      confirmButtonText: 'Sim, aprovar!',
      cancelButtonText: 'Cancelar'
    }).then((result) => {

      if (result.isConfirmed) {
        const token = localStorage.getItem('token');
        const headers = new HttpHeaders().set('Authorization', `Bearer ${token}`);

        this.http.put(`http://localhost:8080/matriculas/${agendamento.id}/aprovar`, {}, { headers }).subscribe({
          next: () => {
            this.carregarAgenda();
            this.carregarMetricasGerais();
            this.carregarNotificacoes();

            Swal.fire({
              title: 'Aprovada!',
              text: 'Matrícula ativada com sucesso.',
              icon: 'success',
              confirmButtonColor: '#8C5637'
            });
          },
          error: (err: any) => console.error('Erro ao aprovar matrícula', err)
        });
      }
    });
  }

  recusarMatricula(agendamento: any, event: Event) {
    event.preventDefault();

    Swal.fire({
      title: 'Tem a certeza?',
      text: `Deseja RECUSAR e cancelar a matrícula de ${agendamento.petNome}? Esta ação não pode ser desfeita.`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#8C827A',
      confirmButtonText: 'Sim, recusar',
      cancelButtonText: 'Cancelar'
    }).then((result) => {

      if (result.isConfirmed) {
        const token = localStorage.getItem('token');
        const headers = new HttpHeaders().set('Authorization', `Bearer ${token}`);

        this.http.delete(`http://localhost:8080/matriculas/${agendamento.id}/recusar`, { headers }).subscribe({
          next: () => {
            this.carregarAgenda();
            this.carregarMetricasGerais();
            this.carregarNotificacoes();

            Swal.fire({
              title: 'Recusada!',
              text: 'Matrícula removida com sucesso.',
              icon: 'success',
              confirmButtonColor: '#8C5637'
            });
          },
          error: (err: any) => console.error('Erro ao recusar matrícula', err)
        });
      }
    });
  }

  getImagemPet(foto?: string): string {
    if (!foto)
      return 'https://images.unsplash.com/photo-1587300003388-59208cc962cb?w=400&h=400&fit=crop';

    if (foto.startsWith('data:image') || foto.startsWith('http'))
      return foto;

    return `https://images.unsplash.com/photo-${foto}?w=400&h=400&fit=crop`;
  }

  lidarErroImagem(event: any) {
    event.target.src = 'https://images.unsplash.com/photo-1587300003388-59208cc962cb?w=400&h=400&fit=crop';
  }

  get totalPendentes() {
    return this.agendaDeHoje.filter(i => i.status === 'PENDENTE').length;
  }

  get vagasP() {
    return this.agendaDeHoje.filter(i => i.porte === 'P' && i.status !== 'PENDENTE' && i.status !== 'AUSENTE').length;
  }

  get vagasM() {
    return this.agendaDeHoje.filter(i => i.porte === 'M' && i.status !== 'PENDENTE' && i.status !== 'AUSENTE').length;
  }

  get vagasG() {
    return this.agendaDeHoje.filter(i => i.porte === 'G' && i.status !== 'PENDENTE' && i.status !== 'AUSENTE').length;
  }

  calcularPorcentagem(ocupado: number, total: number): number {
    return total === 0 ? 0 : (ocupado / total) * 100;
  }

  logout() {
    if (typeof window !== 'undefined') {
      const emailLembrado = localStorage.getItem('emailLembrado');
      localStorage.clear();
      
      if (emailLembrado) {
        localStorage.setItem('emailLembrado', emailLembrado);
      }
    }
    this.router.navigate(['/login']);
  }
}
