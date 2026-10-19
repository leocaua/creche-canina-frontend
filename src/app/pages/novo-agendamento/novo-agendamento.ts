import { Component, OnInit, HostListener, ElementRef, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, RouterLinkActive, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { AdminService, AgendaItem } from '../../services/admin';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-novo-agendamento',
  standalone: true,
  imports: [CommonModule, RouterLink, RouterLinkActive, FormsModule],
  templateUrl: './novo-agendamento.html',
  styleUrls: ['./novo-agendamento.css']
})
export class NovoAgendamentoComponent implements OnInit {
  menuAberto: boolean = false;
  dataAtual: string = '';

  mostrarNotificacoes: boolean = false;
  notificacoesNaoLidas: number = 0;
  notificacoes: any[] = [];

  vagasOcupadasHoje: number = 0;
  capacidadeTotalGeral: number = 20;
  porcentagemVagasHoje: number = 0;

  tutores: any[] = [];

  tutorSelecionado: any = null;
  petsSelecionados: string[] = [];
  planoSelecionado: string = '';
  diasSelecionados: string[] = [];
  statusPagamento: string = 'pendente';

  diasDaSemana = ['Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'];

  dropdownAberto: string = '';
  carregandoPets: boolean = false;

  constructor(
    private http: HttpClient,
    private eRef: ElementRef,
    private adminService: AdminService,
    private cdr: ChangeDetectorRef,
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
    this.dataAtual = hoje.toLocaleDateString('pt-BR', {
      weekday: 'short',
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    }).replace('.', '');
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

  carregarTutores() {
    const token = localStorage.getItem('token');
    const headers = new HttpHeaders().set('Authorization', `Bearer ${token}`);

    this.http.get<any[]>('http://localhost:8080/tutores-painel', { headers }).subscribe({
      next: (dados) => {
        this.tutores = dados.filter((tutor: any) => tutor.email !== 'admin@petday.com.br');
      },
      error: (err) => console.error('Erro ao carregar tutores', err)
    });
  }

  salvarAgendamento() {
    if (!this.tutorSelecionado) {
      alert('Por favor, certifique-se de selecionar um tutor na lista suspensa antes de salvar.');
      return;
    }

    const token = localStorage.getItem('token');
    const headers = new HttpHeaders().set('Authorization', `Bearer ${token}`);

    const idDoCliente = this.tutorSelecionado.id || this.tutorSelecionado.idCliente;

    if (!idDoCliente) {
       alert('Erro: O tutor selecionado não possui um ID válido no sistema.');
       return;
    }

    const payload = {
      clienteId: idDoCliente,
      nomesPets: this.petsSelecionados,
      planoNome: this.planoSelecionado,
      dias: this.diasSelecionados,
      statusPagamento: this.statusPagamento
    };

    this.http.post('http://localhost:8080/matriculas/admin', payload, { headers }).subscribe({
      next: () => {
        Swal.fire({
          title: 'Sucesso!',
          text: 'Matrícula operacional gerada com sucesso!',
          icon: 'success',
          confirmButtonColor: '#8C5637',
          confirmButtonText: 'Concluir'
        });

        this.limparFormulario();
      },
      error: (err) => {
        console.error('Erro ao salvar matrícula', err);
        alert('Erro ao comunicar com o servidor. Verifique o console.');
      }
    });
  }

  limparFormulario() {
    this.tutorSelecionado = null;
    this.petsSelecionados = [];
    this.planoSelecionado = '';
    this.diasSelecionados = [];
    this.statusPagamento = 'pendente';
  }

  @HostListener('document:click')
  cliqueFora() {
    this.dropdownAberto = '';
    this.mostrarNotificacoes = false;
  }

  toggleDropdown(menu: string, event: Event) {
    event.stopPropagation();
    this.dropdownAberto = this.dropdownAberto === menu ? '' : menu;
  }

  selecionarTutorCustom(tutor: any) {
    if (!tutor) {
      this.tutorSelecionado = null;
      this.petsSelecionados = [];
      this.dropdownAberto = '';

      return;
    }

    this.tutorSelecionado = JSON.parse(JSON.stringify(tutor));
    this.tutorSelecionado.pets = [];
    this.petsSelecionados = [];
    this.dropdownAberto = '';
    this.carregandoPets = true;

    this.cdr.detectChanges();

    const idDoCliente = tutor.id || tutor.idCliente;
    if (!idDoCliente)
      return;

    const token = localStorage.getItem('token');
    const headers = new HttpHeaders().set('Authorization', `Bearer ${token}`);

    this.http.get<any[]>(`http://localhost:8080/pets/cliente/${idDoCliente}`, { headers }).subscribe({
      next: (petsDoBanco) => {

        this.http.get<any[]>(`http://localhost:8080/matriculas/cliente/${idDoCliente}`, { headers }).subscribe({
          next: (matriculas) => {
            const ativas = matriculas.filter(m => m.status === true || m.status === 'true' || m.status === 1);

            const nomesPetsMatriculados = new Set<string>();
            ativas.forEach(m => {
              if (m.pets) {
                m.pets.forEach((p: any) => {
                  if (p.nome)
                    nomesPetsMatriculados.add(p.nome.trim().toUpperCase());
                });
              }
            });

            this.tutorSelecionado.pets = petsDoBanco.filter((pet: any) => {
              return pet.nome && !nomesPetsMatriculados.has(pet.nome.trim().toUpperCase());
            });

            this.carregandoPets = false;
            this.cdr.detectChanges();
          },
          error: (err) => {
            console.error('Erro ao buscar matrículas:', err);
            this.carregandoPets = false;
            this.cdr.detectChanges();
          }
        });
      },
      error: (err) => {
        console.error('Erro ao buscar pets:', err);
        this.carregandoPets = false;
        this.cdr.detectChanges();
      }
    });
  }

  selecionarPlanoCustom(plano: string) {
    this.planoSelecionado = plano;
    this.dropdownAberto = '';
  }

  selecionarStatusCustom(status: string) {
    this.statusPagamento = status;
    this.dropdownAberto = '';
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
    if (event)
      event.stopPropagation();

    this.mostrarNotificacoes = !this.mostrarNotificacoes;
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
        error: (err: any) => console.error('Erro ao ler notificação', err)
      });
    }
  }

  togglePet(petNome: string) {
    const index = this.petsSelecionados.indexOf(petNome);

    if (index > -1)
      this.petsSelecionados.splice(index, 1);
    else
      this.petsSelecionados.push(petNome);
  }

  toggleDia(dia: string) {
    const index = this.diasSelecionados.indexOf(dia);

    if (index > -1)
      this.diasSelecionados.splice(index, 1);
    else
      this.diasSelecionados.push(dia);
  }

  temPlanoAtivo(tutor: any): boolean {
    if (!tutor || this.carregandoPets)
      return false;
    if (!tutor.pets)
      return false;

    return tutor.pets.length === 0;
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
