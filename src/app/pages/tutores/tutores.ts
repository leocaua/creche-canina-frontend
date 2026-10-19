import { Component, OnInit, ChangeDetectorRef, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { RouterLink, RouterLinkActive, Router } from '@angular/router';
import { AdminService, AgendaItem } from '../../services/admin';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-tutores',
  standalone: true,
  imports: [CommonModule, RouterLink, RouterLinkActive],
  templateUrl: './tutores.html',
  styleUrls: ['./tutores.css']
})
export class TutoresComponent implements OnInit {
  menuAberto: boolean = false;
  tutores: any[] = [];
  dataAtual: string = '';

  mostrarNotificacoes: boolean = false;
  notificacoesNaoLidas: number = 0;
  notificacoes: any[] = [];

  vagasOcupadasHoje = 0;
  capacidadeTotalGeral = 20;
  porcentagemVagasHoje = 0;

  constructor(
    private http: HttpClient,
    private cdr: ChangeDetectorRef,
    private adminService: AdminService,
    private router: Router
  ) {}

  ngOnInit() {
    this.configurarDataTop();
    this.carregarNotificacoes();
    this.carregarTutores();
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

  carregarTutores() {
    const token = localStorage.getItem('token');
    const headers = new HttpHeaders().set('Authorization', `Bearer ${token}`);

    this.http.get<any[]>('http://localhost:8080/tutores-painel', { headers }).subscribe({
      next: (dados) => {
        this.tutores = dados
          .filter(tutor => tutor.email !== 'admin@petday.com.br')
          .sort((a, b) => a.nome.localeCompare(b.nome));

        this.cdr.detectChanges();
      },
      error: (err) => console.error('Erro ao carregar tutores', err)
    });
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

  getEstiloPlano(plano: string) {
    if (!plano)
      return 'badge-sem-plano';

    if (plano.toLowerCase().includes('mensal'))
      return 'badge-mensal';

    if (plano.toLowerCase().includes('trimestral'))
      return 'badge-trimestral';

    if (plano.toLowerCase().includes('semestral'))
      return 'badge-semestral';

    return 'badge-sem-plano';
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

  excluirTutor(tutor: any) {
    Swal.fire({
      title: `Excluir ${tutor.nome}?`,
      text: 'Tem certeza de que deseja remover este tutor? Só é permitido excluir tutores sem pets ou matrículas vinculadas.',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#C94A4A',
      cancelButtonColor: '#8C827A',
      confirmButtonText: 'Sim, excluir',
      cancelButtonText: 'Cancelar'
    }).then((result) => {

      if (result.isConfirmed) {
        const token = localStorage.getItem('token');
        const headers = new HttpHeaders().set('Authorization', `Bearer ${token}`);

        this.http.delete(`http://localhost:8080/clientes/${tutor.id}`, { headers, responseType: 'text' }).subscribe({
          next: () => {
            this.carregarTutores();

            Swal.fire({
              title: 'Excluído!',
              text: 'O tutor foi removido com sucesso.',
              icon: 'success',
              confirmButtonColor: '#D4722A'
            });
          },
          error: (err) => {
            const msg = (typeof err.error === 'string' && err.error)
              ? err.error
              : 'Este tutor possui pets ou matrículas vinculadas. Remova os vínculos antes de excluir.';

            Swal.fire({
              title: 'Não foi possível excluir',
              text: msg,
              icon: 'error',
              confirmButtonColor: '#D4722A'
            });
          }
        });
      }
    });
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
