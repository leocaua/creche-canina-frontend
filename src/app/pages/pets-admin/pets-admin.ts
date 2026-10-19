import { Component, OnInit, ChangeDetectorRef, HostListener } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { CommonModule } from '@angular/common';
import { RouterLink, RouterLinkActive, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { AdminService } from '../../services/admin';
import Swal from 'sweetalert2';

interface Pet {
  id: number;
  nome: string;
  raca: string;
  cor: string;
  sexo: string;
  idade: string;
  idadeNumero: number;
  porte: string;
  porteSigla: string;
  peso: string;
  pesoNumero: number;
  vacinado: boolean;
  castrado: boolean;
  tutor: string;
  foto: string;
  originalData: any;
}

@Component({
  selector: 'app-pets-admin',
  standalone: true,
  imports: [CommonModule, RouterLink, RouterLinkActive, FormsModule],
  templateUrl: './pets-admin.html',
  styleUrls: ['./pets-admin.css']
})

export class PetsAdminComponent implements OnInit {
  menuAberto: boolean = false;
  dataAtual: string = '';

  mostrarNotificacoes: boolean = false;
  notificacoesNaoLidas: number = 0;
  notificacoes: any[] = [];

  pets: Pet[] = [];
  petsFiltrados: Pet[] = [];

  vagasOcupadasHoje = 0;
  capacidadeTotalGeral = 20;
  porcentagemVagasHoje = 0;

  modalAberto: boolean = false;
  modoEdicao: boolean = false;
  petSelecionado: Pet | null = null;
  petEditando: any = {};

  constructor(
    private adminService: AdminService,
    private cdr: ChangeDetectorRef,
    private router: Router,
    private http: HttpClient
  ) {}

  ngOnInit() {
    this.configurarDataTop();
    this.carregarNotificacoes();
    this.carregarPets();
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

  carregarPets() {
    const token = localStorage.getItem('token');
    const headers = new HttpHeaders().set('Authorization', `Bearer ${token}`);

    this.http.get<any[]>('http://localhost:8080/tutores-painel', { headers }).subscribe({
      next: (tutoresPainel: any[]) => {
        const mapaTutorPorNomePet = new Map<string, string>();

        (tutoresPainel || []).forEach(t => {
          if (t.nome && Array.isArray(t.pets)) {
            t.pets.forEach((nomePet: string) => {
              if (nomePet) {
                mapaTutorPorNomePet.set(nomePet.trim().toLowerCase(), t.nome);
              }
            });
          }
        });
        this.buscarListaDePets(mapaTutorPorNomePet);
      },
      error: () => {
        this.buscarListaDePets(new Map<string, string>());
      }
    });
  }

  private buscarListaDePets(mapaTutorPorNomePet: Map<string, string>) {
    this.adminService.buscarTodosPets().subscribe({
      next: (dadosBackend: any[]) => {
        this.pets = dadosBackend.map(pet => {
          const tutorPeloMapa = pet.nome ? mapaTutorPorNomePet.get(pet.nome.trim().toLowerCase()) : undefined;

          return {
            id: pet.id,
            nome: pet.nome,
            raca: pet.raca || 'Sem raça',
            cor: pet.cor || 'Não informada',
            sexo: pet.sexo === 'M' ? 'Macho' : (pet.sexo === 'F' ? 'Fêmea' : (pet.sexo || 'N/A')),
            idade: pet.idade ? `${pet.idade} anos` : 'Idade n/a',
            idadeNumero: pet.idade,
            porte: pet.porte === 'P' ? 'Pequeno' : (pet.porte === 'M' ? 'Médio' : (pet.porte === 'G' ? 'Grande' : pet.porte)),
            porteSigla: pet.porte,
            peso: pet.peso ? `${pet.peso} kg` : 'N/A',
            pesoNumero: pet.peso,
            vacinado: pet.vacinado === true,
            castrado: pet.castrado === true,
            tutor: pet.cliente?.nome || pet.tutor?.nome || pet.tutorNome || tutorPeloMapa || 'Tutor não informado',
            foto: pet.foto || 'https://images.unsplash.com/photo-1543466835-00a7907e9de1?w=400&h=300&fit=crop',
            originalData: pet
          };
        });

        this.petsFiltrados = [...this.pets];
        this.cdr.detectChanges();
      },
      error: (erro) => console.error('Erro ao carregar pets:', erro)
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

  abrirModal(pet: Pet) {
    this.petSelecionado = pet;
    this.modoEdicao = false;
    this.modalAberto = true;
  }

  fecharModal() {
    this.modalAberto = false;
    this.modoEdicao = false;
    setTimeout(() => this.petSelecionado = null, 200);
  }

  iniciarEdicao() {
    this.modoEdicao = true;
    this.petEditando = { ...this.petSelecionado };
  }

  cancelarEdicao() {
    this.modoEdicao = false;
  }

  salvarEdicao() {
    const payload = {

      ...this.petEditando.originalData,
      nome: this.petEditando.nome,
      raca: this.petEditando.raca,
      cor: this.petEditando.cor,
      sexo: this.petEditando.sexo,
      idade: this.petEditando.idadeNumero,
      peso: this.petEditando.pesoNumero,
      porte: this.petEditando.porteSigla,
      vacinado: this.petEditando.vacinado,
      castrado: this.petEditando.castrado
    };

    this.adminService.atualizarPet(this.petEditando.id, payload).subscribe({
      next: () => {
        this.carregarPets();
        this.fecharModal();
      },
      error: (err) => {
        console.error('Erro ao salvar edições:', err);
        alert('Erro ao guardar as alterações. Verifique a consola.');
      }
    });
  }

  filtrarPets(event: Event) {
    const termo = (event.target as HTMLInputElement).value.toLowerCase();

    this.petsFiltrados = this.pets.filter(pet =>
      pet.nome.toLowerCase().includes(termo) ||
      pet.raca.toLowerCase().includes(termo) ||
      pet.tutor.toLowerCase().includes(termo)
    );
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

  getImagemPet(foto?: string): string {
    if (!foto)
      return 'https://images.unsplash.com/photo-1587300003388-59208cc962cb?w=400&h=400&fit=crop';

    if (foto.startsWith('data:image') || foto.startsWith('http'))
      return foto;

    if (foto.length > 100)
      return 'data:image/jpeg;base64,' + foto;

    return `https://images.unsplash.com/photo-${foto}?w=400&h=400&fit=crop`;
  }

  lidarErroImagem(event: any) {
    event.target.src = 'https://images.unsplash.com/photo-1587300003388-59208cc962cb?w=400&h=400&fit=crop';
  }

  excluirPet(pet: Pet) {
    Swal.fire({
      title: `Excluir ${pet.nome}?`,
      text: 'Tem certeza de que deseja remover este pet do sistema? Esta ação não pode ser desfeita.',
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

        this.http.delete(`http://localhost:8080/pets/${pet.id}`, { headers, responseType: 'text' }).subscribe({
          next: () => {
            this.fecharModal();
            this.carregarPets();

            Swal.fire({
              title: 'Excluído!',
              text: 'O pet foi removido com sucesso.',
              icon: 'success',
              confirmButtonColor: '#D4722A'
            });
          },
          error: (err) => {
            const msg = (typeof err.error === 'string' && err.error)
              ? err.error
              : 'Este pet possui matrícula vinculada e não pode ser excluído.';

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

