import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, Router } from '@angular/router';
import { Cliente } from '../../services/cliente';
import { Pet } from '../../services/pet';
import { RotinaService } from '../../services/rotina';

@Component({
  selector: 'app-rotina',
  standalone: true,
  imports: [RouterLink, CommonModule],
  templateUrl: './rotina.html',
  styleUrls: ['./rotina.css'],
})

export class RotinaComponent implements OnInit {
  nomeCliente: string = '';
  clienteId: number | null = null;
  dataAtual: string = '';
  dataSimples: string = '';

  mostrarNotificacoes: boolean = false;
  notificacoesNaoLidas: number = 0;
  notificacoes: any[] = [];

  meusPets: any[] = [];
  petSelecionado: any = null;

  dataAgendamentoObj!: Date;
  dataAgendamentoCurta: string = '';
  dataAgendamentoLonga: string = '';

  statusDoPet: 'AGENDADO' | 'NA_CRECHE' | 'AUSENTE' = 'AGENDADO';
  atividadesDoDia: any[] = [];

  mostrarModalAusencia: boolean = false;
  estadoModal: 'confirmar' | 'sucesso' = 'confirmar';

  constructor(
    private clienteService: Cliente,
    private petService: Pet,
    private rotinaService: RotinaService,
    private router: Router,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit() {
    this.configurarData();
    this.carregarDadosUsuario();
  }

  configurarData() {
    const opcoesAtual: Intl.DateTimeFormatOptions = {
      weekday: 'short',
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    };

    this.dataAtual = new Date().toLocaleDateString('pt-BR', opcoesAtual).replace('.', '');

    const opcoesSimples: Intl.DateTimeFormatOptions = {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    };

    this.dataSimples = `Hoje — ${new Date().toLocaleDateString('pt-BR', opcoesSimples)}`;
  }

  carregarDadosUsuario() {
    if (typeof window !== 'undefined') {
      const token = localStorage.getItem('token');

      if (token) {
        try {
          const emailLogado = JSON.parse(atob(token.split('.')[1])).sub;
          this.clienteService.buscarTodosClientes().subscribe({
            next: (clientes: any) => {
              const clienteEncontrado = clientes.find((c: any) => c.email === emailLogado);
              setTimeout(() => {
                if (clienteEncontrado) {
                  this.nomeCliente = clienteEncontrado.nome || 'Tutor';
                  this.clienteId = clienteEncontrado.id;
                  this.carregarPets(this.clienteId!);
                }
                this.cdr.detectChanges();
              }, 0);
            }
          });
        } catch (e) { console.error(e); }
      }
    }
  }

  carregarPets(clienteId: number) {
    this.petService.buscarPorClienteId(clienteId).subscribe({
      next: (pets: any[]) => {
        this.meusPets = pets;

        if (this.meusPets.length > 0) {
          this.selecionarPet(this.meusPets[0]);
        }
        this.cdr.detectChanges();
      }
    });
  }

  selecionarPet(pet: any) {
    this.petSelecionado = pet;

    const proximaData = new Date();
    proximaData.setDate(proximaData.getDate() + 1);
    this.dataAgendamentoObj = proximaData;

    this.dataAgendamentoCurta = proximaData.toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit'
    });
    this.dataAgendamentoLonga = proximaData.toLocaleDateString('pt-BR', {
      day: 'numeric',
      month: 'long'
    });

    const hoje = new Date();
    const ehHoje = proximaData.getDate() === hoje.getDate() && proximaData.getMonth() === hoje.getMonth();
    this.statusDoPet = ehHoje ? 'NA_CRECHE' : 'AGENDADO';

    this.carregarRotinaDoBackend(pet.id);
  }

  carregarRotinaDoBackend(petId: number) {
    const ano = this.dataAgendamentoObj.getFullYear();
    const mes = String(this.dataAgendamentoObj.getMonth() + 1).padStart(2, '0');
    const dia = String(this.dataAgendamentoObj.getDate()).padStart(2, '0');
    const dataFormatadaBanco = `${ano}-${mes}-${dia}`;

    this.rotinaService.buscarAtividadesPorPetEData(petId, dataFormatadaBanco).subscribe({
      next: (atividadesBackend: any[]) => {
        this.atividadesDoDia = atividadesBackend;
        this.cdr.detectChanges();
      },
      error: (erro: any) => {
        console.error('Erro ao buscar rotina no banco:', erro);

        this.atividadesDoDia = [];
        this.cdr.detectChanges();
      }
    });
  }

  abrirModalAusencia() {
    this.estadoModal = 'confirmar';
    this.mostrarModalAusencia = true;
  }

  fecharModal() {
    this.mostrarModalAusencia = false;
  }

  confirmarAusenciaAcao() {
    const ano = this.dataAgendamentoObj.getFullYear();
    const mes = String(this.dataAgendamentoObj.getMonth() + 1).padStart(2, '0');
    const dia = String(this.dataAgendamentoObj.getDate()).padStart(2, '0');
    const dataFormatada = `${ano}-${mes}-${dia}`;

    this.statusDoPet = 'AUSENTE';
    this.atividadesDoDia = [];
    this.estadoModal = 'sucesso';
  }

  getImagem(fotoBase64: string): string {
    if (!fotoBase64)
      return 'https://images.unsplash.com/photo-1587300003388-59208cc962cb?w=60&h=60&fit=crop';

    return fotoBase64.includes('data:image') ? fotoBase64 : 'data:image/jpeg;base64,' + fotoBase64;
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
}
