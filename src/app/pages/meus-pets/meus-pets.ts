import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { Cliente } from '../../services/cliente';
import { Pet } from '../../services/pet';
import { NotificacaoService } from '../../services/notificacao';

@Component({
  selector: 'app-meus-pets',
  standalone: true,
  imports: [RouterLink],
  templateUrl: './meus-pets.html',
  styleUrl: './meus-pets.css'
})

export class MeusPets implements OnInit {
  nomeCliente: string = 'Carregando...';
  meusPets: any[] = [];
  dataAtual: string = '';

  mostrarNotificacoes: boolean = false;
  notificacoes: any[] = [];

  constructor(
    private clienteService: Cliente,
    private petService: Pet,
    private notificacaoService: NotificacaoService,
    private cdr: ChangeDetectorRef,
    private router: Router
  ) {
    const opcoes: Intl.DateTimeFormatOptions = {
      weekday: 'short',
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    };
    this.dataAtual = new Date().toLocaleDateString('pt-BR', opcoes);
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
          const clienteEncontrado = clientes.find((c: any) => c.email === emailLogado);
          if (clienteEncontrado) {
            this.nomeCliente = clienteEncontrado.nome;
            this.carregarMeusPets(clienteEncontrado.id);
            this.carregarNotificacoes(clienteEncontrado.id);
          } else {
            this.nomeCliente = 'Visitante';
            this.cdr.detectChanges();
          }
        },
        error: (erro: any) => console.error('Erro ao buscar clientes:', erro)
      });
    }
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

  private carregarNotificacoes(clienteId: number) {
    this.notificacaoService.buscarPorClienteId(clienteId).subscribe({
      next: (notificacoes: any[]) => {
        this.notificacoes = notificacoes;
        this.cdr.detectChanges();
      },
      error: (erro: any) => console.error('Erro ao carregar notificações:', erro)
    });
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
        }
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

  getImagemCard(foto: string): string {
  if (!foto) return 'https://images.unsplash.com/photo-1587300003388-59208cc962cb?w=400&h=200&fit=crop';
  if (foto.startsWith('data:image')) {
    return foto;
  }
  return `https://images.unsplash.com/photo-${foto}?w=400&h=200&fit=crop`;
}

  abrirPerfilPet(petId: number) {
    this.router.navigate([`/meus-pets/detalhes`, petId]);
  }

  abrirCadastroPet() {
    this.router.navigate(['/meus-pets/novo']);
  }

  logout() {
    if (typeof window !== 'undefined') {
      localStorage.clear();
      this.router.navigate(['/login']);
    }
  }
}
