import { Component, OnInit, ChangeDetectorRef, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, RouterLinkActive, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { AdminService, AgendaItem } from '../../services/admin';
import Swal from 'sweetalert2';
import { RotinaService } from '../../services/rotina';

@Component({
  selector: 'app-rotinas-admin',
  standalone: true,
  imports: [CommonModule, RouterLink, RouterLinkActive, FormsModule],
  templateUrl: './rotinas-admin.html',
  styleUrls: ['./rotinas-admin.css']
})
export class RotinasAdminComponent implements OnInit {
  dataAtual: string = '';
  menuAberto: boolean = false;

  mostrarNotificacoes: boolean = false;
  notificacoesNaoLidas: number = 0;
  notificacoes: any[] = [];

  vagasOcupadasHoje: number = 0;
  capacidadeTotalGeral: number = 20;
  porcentagemVagasHoje: number = 0;

  petsHoje: any[] = [];
  petSelecionado: any = null;

  novaRotina = {
    horario: '',
    titulo: '',
    detalhes: ''
  };

  constructor(
    private http: HttpClient,
    private cdr: ChangeDetectorRef,
    private adminService: AdminService,
    private rotinaService: RotinaService,
    private router: Router
  ) {}

  ngOnInit() {
    this.configurarDataTop();
    this.carregarNotificacoes();
    this.atualizarVagasDeHoje();

    setTimeout(() => {
      this.carregarPetsHoje();
    }, 10);
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

  carregarPetsHoje() {
    const hoje = new Date();
    const ano = hoje.getFullYear();
    const mes = String(hoje.getMonth() + 1).padStart(2, '0');
    const dia = String(hoje.getDate()).padStart(2, '0');
    const dataBanco = `${ano}-${mes}-${dia}`;

    this.adminService.buscarAgendaDoDia(dataBanco).subscribe({
      next: (dadosBackend: AgendaItem[]) => {
        const petsValidos = (dadosBackend || []).filter(item =>
          (item.tipo === 'CRECHE' || item.tipo === 'REPOSICAO') &&
          (item.status === 'NA_CRECHE' || item.status === 'AGENDADO' || item.status === 'FINALIZADO')
        );

        this.petsHoje = petsValidos.map((item: any) => {
          return {
            idMatricula: item.id,
            nome: item.petNome,
            tutor: item.tutorNome,
            petId: item.petId || item.idPet || item.pet?.id,
            rotinas: []
          };
        });

        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Erro ao buscar pets para as rotinas:', err);
        this.petsHoje = [];
        this.cdr.detectChanges();
      }
    });
  }

  selecionarPet(pet: any) {
    this.petSelecionado = pet;

    const agora = new Date();
    const horas = String(agora.getHours()).padStart(2, '0');
    const minutos = String(agora.getMinutes()).padStart(2, '0');

    this.novaRotina.horario = `${horas}:${minutos}`;
    this.novaRotina.titulo = '';
    this.novaRotina.detalhes = '';

    const ano = agora.getFullYear();
    const mes = String(agora.getMonth() + 1).padStart(2, '0');
    const dia = String(agora.getDate()).padStart(2, '0');
    const dataFormatadaBanco = `${ano}-${mes}-${dia}`;

    const token = localStorage.getItem('token');
    const headers = new HttpHeaders().set('Authorization', `Bearer ${token}`);

    this.http.get<any[]>('http://localhost:8080/pets', { headers }).subscribe({
      next: (todosPets) => {
        const petReal = todosPets.find(p => p.nome === pet.nome);

        if (petReal && petReal.id) {
          pet.petId = petReal.id;
          this.rotinaService.buscarAtividadesPorPetEData(petReal.id, dataFormatadaBanco).subscribe({
            next: (atividadesBackend: any[]) => {

              pet.rotinas = atividadesBackend.map(ativ => {
                let descFormatada = ativ.descricao || '';

                if (descFormatada.includes('|||')) {
                  descFormatada = descFormatada.replace('|||', ' - ');

                } else if (descFormatada.includes('\n')) {
                  descFormatada = descFormatada.replace('\n', ' - ');
                }

                let horaLimpa = ativ.horario;
                if (horaLimpa && horaLimpa.length > 5 && horaLimpa.includes('T')) {
                    horaLimpa = horaLimpa.split('T')[1].substring(0, 5);
                }

                return {
                  horario: horaLimpa,
                  descricao: descFormatada
                };
              });

              pet.rotinas.sort((a: any, b: any) => b.horario.localeCompare(a.horario));

              this.cdr.detectChanges();
            },
            error: (err) => {
              console.error('Erro ao buscar rotina no banco:', err);
              pet.rotinas = [];
              this.cdr.detectChanges();
            }
          });
        } else {
          console.warn('O pet não foi encontrado na base de dados geral.');
          pet.rotinas = [];
          this.cdr.detectChanges();
        }
      },
      error: (err) => console.error('Erro ao listar pets para descobrir o ID:', err)
    });
  }

  salvarRotina() {
    if (!this.novaRotina.titulo || !this.novaRotina.detalhes) {
      Swal.fire({
        title: 'Atenção',
        text: 'Preencha o título e os detalhes antes de salvar o registo.',
        icon: 'warning',
        confirmButtonColor: '#B85A10'
      });
      return;
    }

    const token = localStorage.getItem('token');
    const headers = new HttpHeaders().set('Authorization', `Bearer ${token}`);

    const agora = new Date();
    const ano = agora.getFullYear();
    const mes = String(agora.getMonth() + 1).padStart(2, '0');
    const dia = String(agora.getDate()).padStart(2, '0');
    const hojeLocal = `${ano}-${mes}-${dia}`;

    const horarioISO = `${hojeLocal}T${this.novaRotina.horario}:00`;

    const descricaoFinal = `${this.novaRotina.titulo}|||${this.novaRotina.detalhes}`;

    const payload: any = {
      horario: horarioISO,
      descricao: descricaoFinal,
      matricula: { id: this.petSelecionado.idMatricula },
      pet: {
        id: this.petSelecionado.petId || null,
        nome: this.petSelecionado.nome
      }
    };

    this.http.post('http://localhost:8080/rotinas', payload, { headers }).subscribe({
      next: () => {
        if (!this.petSelecionado.rotinas) {
          this.petSelecionado.rotinas = [];
        }

        this.petSelecionado.rotinas.push({
          horario: this.novaRotina.horario,
          descricao: descricaoFinal.replace('|||', ' - ')
        });

        this.petSelecionado.rotinas.sort((a: any, b: any) => b.horario.localeCompare(a.horario));
        this.carregarNotificacoes();

        Swal.fire({
          title: 'Registado!',
          text: 'A atividade foi adicionada ao diário do pet e o tutor foi notificado.',
          icon: 'success',
          confirmButtonColor: '#B85A10',
          timer: 2000,
          showConfirmButton: false
        }).then(() => {

          this.novaRotina.titulo = '';
          this.novaRotina.detalhes = '';
          this.cdr.detectChanges();
        });
      },
      error: (err) => {
        console.error('Erro ao salvar rotina', err);
        Swal.fire({
          title: 'Erro',
          text: 'Ocorreu um problema ao salvar o relatório. Tente novamente.',
          icon: 'error',
          confirmButtonColor: '#B85A10'
        });
      }
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

  atualizarContadorNaoLidas() {
    this.notificacoesNaoLidas = this.notificacoes.filter(n => !n.lida).length;
  }

  toggleNotificacoes(event?: Event) {
    if (event)
      event.stopPropagation();
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
