import { Component, OnInit, ChangeDetectorRef, HostListener } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { CommonModule } from '@angular/common';
import { RouterLink, RouterLinkActive, Router } from '@angular/router';
import { AdminService, AgendaItem } from '../../services/admin';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-agenda',
  standalone: true,
  imports: [CommonModule, RouterLink, RouterLinkActive],
  templateUrl: './agenda.html',
  styleUrls: ['./agenda.css']
})

export class AgendaComponent implements OnInit {
  menuAberto: boolean = false;
  dataAtual: string = '';

  mostrarNotificacoes: boolean = false;
  notificacoesNaoLidas: number = 0;
  notificacoes: any[] = [];

  dataReferencia: Date = new Date();
  textoPeriodoSemana: string = '';
  totalAgendamentosSemana: number = 0;

  diasDaSemana: { nome: string, dia: number, dataCompleta: Date, dataBanco: string }[] = [];
  portes = ['Pequeno', 'Médio', 'Grande'];
  agendamentosPorDia: { [data: string]: AgendaItem[] } = {};

  vagasOcupadasHoje = 0;
  capacidadeTotalGeral = 20;
  porcentagemVagasHoje = 0;

  constructor(private adminService: AdminService, private cdr: ChangeDetectorRef, private router: Router, private http: HttpClient) {}

  ngOnInit() {
    this.configurarDataTop();
    this.atualizarSemana();
    this.carregarNotificacoes();
    this.atualizarVagasDeHoje();
  }

  configurarDataTop() {
    const hoje = new Date();
    const opcoesAtual: Intl.DateTimeFormatOptions = {
      weekday: 'short',
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    };

    this.dataAtual = hoje.toLocaleDateString('pt-BR', opcoesAtual).replace('.', '');
  }

  formatarParaBanco(data: Date): string {
    const ano = data.getFullYear();
    const mes = String(data.getMonth() + 1).padStart(2, '0');
    const dia = String(data.getDate()).padStart(2, '0');

    return `${ano}-${mes}-${dia}`;
  }

  atualizarVagasDeHoje() {
    const hoje = new Date();
    const ano = hoje.getFullYear();
    const mes = String(hoje.getMonth() + 1).padStart(2, '0');
    const dia = String(hoje.getDate()).padStart(2, '0');
    const dataBanco = `${ano}-${mes}-${dia}`;

    this.adminService.buscarAgendaDoDia(dataBanco).subscribe({
      next: (dados: any[]) => {
        const confirmados = (dados || []).filter(a =>
          (a.tipo === 'CRECHE' || a.tipo === 'REPOSICAO') &&
          a.status !== 'PENDENTE' &&
          a.status !== 'AUSENTE'
        );

        this.vagasOcupadasHoje = confirmados.length;
        this.porcentagemVagasHoje = (this.vagasOcupadasHoje / this.capacidadeTotalGeral) * 100;

        if ((this as any).cdr) {
          (this as any).cdr.detectChanges();
        }
      },
      error: (e) => console.error('Erro ao atualizar vagas da barra lateral:', e)
    });
  }

  atualizarSemana() {
    this.gerarDiasDaSemana();
    this.gerarTextoPeriodo();
    this.carregarAgendaDaSemana();
  }

  gerarDiasDaSemana() {
    const dataRef = new Date(this.dataReferencia);
    const diaDaSemana = dataRef.getDay();
    const diferencaParaSegunda = dataRef.getDate() - diaDaSemana + (diaDaSemana === 0 ? -6 : 1);

    const segundaFeira = new Date(dataRef.setDate(diferencaParaSegunda));
    const nomesDias = ['SEG', 'TER', 'QUA', 'QUI', 'SEX', 'SÁB'];

    this.diasDaSemana = [];

    for (let i = 0; i < 6; i++) {
      const dataCorrente = new Date(segundaFeira);
      dataCorrente.setDate(segundaFeira.getDate() + i);

      this.diasDaSemana.push({
        nome: nomesDias[i],
        dia: dataCorrente.getDate(),
        dataCompleta: dataCorrente,
        dataBanco: this.formatarParaBanco(dataCorrente)
      });
    }
  }

  gerarTextoPeriodo() {
    if (this.diasDaSemana.length === 0)
      return;

    const primeiraData = this.diasDaSemana[0].dataCompleta;
    const ultimaData = this.diasDaSemana[5].dataCompleta;

    const diaInicio = primeiraData.getDate();
    const diaFim = ultimaData.getDate();
    const mesNome = ultimaData.toLocaleDateString('pt-BR', { month: 'long' });
    const ano = ultimaData.getFullYear();

    if (primeiraData.getMonth() === ultimaData.getMonth()) {
      this.textoPeriodoSemana = `${diaInicio}–${diaFim} de ${mesNome}, ${ano}`;
    }
    else {
      const mesInicio = primeiraData.toLocaleDateString('pt-BR', { month: 'short' }).replace('.', '');
      this.textoPeriodoSemana = `${diaInicio} de ${mesInicio} – ${diaFim} de ${mesNome}, ${ano}`;
    }
  }

  carregarAgendaDaSemana() {
    const hojeBanco = this.formatarParaBanco(new Date());
    this.totalAgendamentosSemana = 0;

    this.diasDaSemana.forEach(dia => {
      this.adminService.buscarAgendaDoDia(dia.dataBanco).subscribe({

        next: (dados: AgendaItem[]) => {
          const confirmadosEReposicoes = (dados || []).filter(a => a.tipo === 'CRECHE' || a.tipo === 'REPOSICAO');

          this.agendamentosPorDia[dia.dataBanco] = confirmadosEReposicoes;
          this.calcularTotalSemana();

          if (dia.dataBanco === hojeBanco) {
            this.vagasOcupadasHoje = confirmadosEReposicoes.filter(a => a.status !== 'PENDENTE').length;
            this.porcentagemVagasHoje = (this.vagasOcupadasHoje / this.capacidadeTotalGeral) * 100;
          }
          this.cdr.detectChanges();
        },
        error: () => {
          this.agendamentosPorDia[dia.dataBanco] = [];
          this.cdr.detectChanges();
        }
      });
    });
  }

  calcularTotalSemana() {
    let total = 0;

    this.diasDaSemana.forEach(dia => {
      total += (this.agendamentosPorDia[dia.dataBanco] || []).length;
    });

    this.totalAgendamentosSemana = total;
  }

  semanaAnterior() {
    this.dataReferencia.setDate(this.dataReferencia.getDate() - 7);
    this.atualizarSemana();
  }

  proximaSemana() {
    this.dataReferencia.setDate(this.dataReferencia.getDate() + 7);
    this.atualizarSemana();
  }

  getAgendamentos(porteTexto: string, indexDia: number) {
    const dataDoDia = this.diasDaSemana[indexDia].dataBanco;
    const listaDoDia = this.agendamentosPorDia[dataDoDia] || [];

    return listaDoDia.filter(a => {
      const p = (a.porte || 'P').toUpperCase();

      if (porteTexto === 'Pequeno')
        return p === 'P' || p === 'PEQUENO';
      if (porteTexto === 'Médio')
        return p === 'M' || p === 'MÉDIO' || p === 'MEDIO';
      if (porteTexto === 'Grande')
        return p === 'G' || p === 'GRANDE';

      return false;
    });
  }

  carregarNotificacoes() {
    const token = localStorage.getItem('token');
    const headers = new HttpHeaders().set('Authorization', `Bearer ${token}`);

    this.http.get<any[]>('http://localhost:8080/notificacoes/admin', { headers }).subscribe({
      next: (dadosBackend: any) => {
        this.notificacoes = dadosBackend;
        this.atualizarContadorNaoLidas();

        if (this.cdr)
          this.cdr.detectChanges();
      },
      error: (err: any) => console.error('Erro ao carregar notificações', err)
    });
  }

  salvarNotificacoes() {
    localStorage.setItem('admin_notificacoes', JSON.stringify(this.notificacoes));
  }

  atualizarContadorNaoLidas() {
    this.notificacoesNaoLidas = this.notificacoes.filter(n => !n.lida).length;
  }

  toggleNotificacoes(event?: Event) {
    if (event) event.stopPropagation();

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

            if (this.cdr) this.cdr.detectChanges();
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
        error: (err: any) => console.error('Erro ao ler notificação', err)
      });
    }
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
