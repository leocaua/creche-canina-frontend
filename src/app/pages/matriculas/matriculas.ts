import { Component, OnInit, ChangeDetectorRef, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, Router } from '@angular/router';
import { MatriculaService } from '../../services/matricula';
import { MatriculaRequestDto } from '../../models/matricula-request.dto';
import { Cliente } from '../../services/cliente';
import { Pet } from '../../services/pet';
import { NotificacaoService } from '../../services/notificacao';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-matriculas',
  standalone: true,
  imports: [RouterLink, CommonModule],
  templateUrl: './matriculas.html',
  styleUrls: ['./matriculas.css'],
})

export class MatriculasComponent implements OnInit {
  menuAberto: boolean = false;
  nomeCliente: string = '';
  clienteId: number | null = null;
  dataAtual: string = '';

  mostrarNotificacoes: boolean = false;
  notificacoes: any[] = [];
  meusPets: any[] = [];

  matriculasAtuais: any[] = [];
  exibirWizard: boolean = true;
  temMatriculaAtiva: boolean = false;
  temMatriculaPendente: boolean = false;

  etapaAtual: number = 1;
  planoSelecionadoId: number | null = null;
  frequenciaSelecionada: number = 0;
  petsSelecionadosIds: number[] = [];
  diasSelecionados: string[] = [];

  constructor(
    private matriculaService: MatriculaService,
    private clienteService: Cliente,
    private petService: Pet,
    private notificacaoService: NotificacaoService,
    private router: Router,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit() {
    this.configurarData();
    this.carregarDadosUsuario();
  }

  configurarData() {
    const opcoes: Intl.DateTimeFormatOptions = { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' };
    this.dataAtual = new Date().toLocaleDateString('pt-BR', opcoes).replace('.', '');
  }

  carregarDadosUsuario() {
    if (typeof window !== 'undefined') {
      const token = localStorage.getItem('token');

      if (token) {
        try {
          const payload = JSON.parse(atob(token.split('.')[1]));
          const emailLogado = payload.sub;

          this.clienteService.buscarTodosClientes().subscribe({
            next: (clientes: any) => {
              const clienteEncontrado = clientes.find((c: any) => c.email === emailLogado);

              setTimeout(() => {
                if (clienteEncontrado) {
                  this.nomeCliente = clienteEncontrado.nome || 'Tutor';
                  this.clienteId = clienteEncontrado.id;

                  this.carregarNotificacoes(this.clienteId!);
                  this.carregarMatriculasDoCliente(this.clienteId!);
                } else {
                  this.nomeCliente = 'Tutor';
                }
                this.cdr.detectChanges();
              }, 0);
            },
            error: (erro: any) => console.error('Erro ao buscar cliente:', erro)
          });
        } catch (e) {
          console.error('Erro ao processar token:', e);
        }
      }
    }
  }

  carregarMatriculasDoCliente(clienteId: number) {
    this.matriculaService.buscarPorClienteId(clienteId).subscribe({
      next: (matriculas: any[]) => {
        if (matriculas && matriculas.length > 0) {

          const hoje = new Date();
          hoje.setHours(0, 0, 0, 0);

          const matriculasProcessadas = matriculas.map(m => {
            let isAtiva = (m.status === true || m.status === 'true' || m.status === 1);
            let dInicio = new Date();

            if (Array.isArray(m.dataReserva)) {
              dInicio = new Date(m.dataReserva[0], m.dataReserva[1] - 1, m.dataReserva[2]);
            } else if (m.dataReserva) {
              dInicio = new Date(m.dataReserva + 'T00:00:00');
            }

            const planoNome = m.plano?.nome || 'Mensal';
            const meses = planoNome.toLowerCase().includes('trimestral') ? 3 : planoNome.toLowerCase().includes('semestral') ? 6 : 1;

            const vencimento = new Date(dInicio);
            vencimento.setMonth(vencimento.getMonth() + meses);

            let statusFinal = isAtiva ? 'Ativa' : 'Pendente';
            if (isAtiva && vencimento < hoje) {
              statusFinal = 'Vencida';
            }

            const diasOrdenados = m.diasSemana
              ? this.ordenarDiasProximoDiaUtil(
                  m.diasSemana.split(',').map((d: string) => d.trim()),
                  dInicio
                ).join(', ')
              : '';

            return {
              ...m,
              diasSemana: diasOrdenados,
              statusFormatado: statusFinal,
              petsFormatados: m.pets ? m.pets.map((p: any) => p.nome).join(', ') : '',
              validadeFormatada: vencimento.toLocaleDateString('pt-BR')
            };
          });

          this.matriculasAtuais = matriculasProcessadas
            .filter(m => m.statusFormatado === 'Ativa' || m.statusFormatado === 'Pendente')
            .sort((a, b) => b.id - a.id);

          if (this.matriculasAtuais.length > 0) {
            this.temMatriculaAtiva = true;
            this.temMatriculaPendente = this.matriculasAtuais.some(m => m.statusFormatado === 'Pendente');
            this.exibirWizard = false;
          } else {
            this.temMatriculaAtiva = false;
            this.temMatriculaPendente = false;
            this.exibirWizard = true;
          }

        } else {
          this.temMatriculaAtiva = false;
          this.temMatriculaPendente = false;
          this.exibirWizard = true;
          this.matriculasAtuais = [];
        }

        this.carregarPets(clienteId);
        this.cdr.detectChanges();
      },
      error: (err: any) => console.error('Erro ao carregar histórico de matrículas', err)
    });
  }

  abrirNovaMatricula() {
    this.exibirWizard = true;
    this.etapaAtual = 1;
    this.planoSelecionadoId = null;
    this.frequenciaSelecionada = 0;
    this.petsSelecionadosIds = [];
    this.diasSelecionados = [];
  }

  cancelarNovaMatricula() {
    this.exibirWizard = false;
  }

  carregarPets(clienteId: number) {
    this.petService.buscarPorClienteId(clienteId).subscribe({
      next: (pets: any[]) => {

        if (this.matriculasAtuais && this.matriculasAtuais.length > 0) {
          const petsJaMatriculados = this.matriculasAtuais.flatMap(m => m.pets ? m.pets.map((p:any) => p.id) : []);

          this.meusPets = pets.filter(p => !petsJaMatriculados.includes(p.id));
        } else {
          this.meusPets = pets;
        }

        this.cdr.detectChanges();
      },
      error: (err: any) => console.error('Erro ao carregar pets:', err)
    });
  }

  private carregarNotificacoes(clienteId: number) {
    this.notificacaoService.buscarPorClienteId(clienteId).subscribe({
      next: (notificacoes: any[]) => {
        this.notificacoes = notificacoes;
        this.cdr.detectChanges();
      }
    });
  }

  get notificacoesNaoLidas() {
    return this.notificacoes.filter(n => !n.lida).length;
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
          this.cdr.detectChanges();
        }
      });
    }
    this.mostrarNotificacoes = false;
  }

  marcarTodasComoLidas() {
    const naoLidas = this.notificacoes.filter(n => !n.lida);
    naoLidas.forEach(n => {
      this.notificacaoService.marcarComoLida(n.id).subscribe({
        next: () => n.lida = true
      });
    });
  }

  limparNotificacoes() {
    if (this.clienteId && this.clienteId > 0) {
      this.notificacaoService.limparDoCliente(this.clienteId).subscribe({
        next: () => {
          this.notificacoes = [];
          this.cdr.detectChanges();
        }
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

  selecionarPlano(id: number) {
    this.planoSelecionadoId = this.planoSelecionadoId === id ? null : id;
  }

  selecionarFrequencia(dias: number) {
    if (this.frequenciaSelecionada === dias) {

      this.frequenciaSelecionada = 0;
      this.diasSelecionados = [];
    } else {

      this.frequenciaSelecionada = dias;
      this.diasSelecionados = [];
    }
  }

  selecionarPet(petId: number) {
    const index = this.petsSelecionadosIds.indexOf(petId);

    if (index > -1)
      this.petsSelecionadosIds.splice(index, 1);
    else
      this.petsSelecionadosIds.push(petId);
  }

  selecionarDia(dia: string) {
    const index = this.diasSelecionados.indexOf(dia);

    if (index > -1) {
      this.diasSelecionados.splice(index, 1);
    } else {
      if (this.diasSelecionados.length < this.frequenciaSelecionada) {
        this.diasSelecionados.push(dia);
        this.diasSelecionados = this.ordenarDiasProximoDiaUtil(this.diasSelecionados);
      } else {
        Swal.fire({
          title: 'Limite Atingido!',
          text: `O plano escolhido é de ${this.frequenciaSelecionada}x na semana. Desmarque um dia para escolher outro!`,
          icon: 'info',
          confirmButtonColor: '#B85A10'
        });
      }
    }
  }

  get diasRestantes(): number {
    return this.frequenciaSelecionada - this.diasSelecionados.length;
  }

  get nomePlanoFormatado(): string {
    if (this.planoSelecionadoId === 1)
      return 'Mensal';
    if (this.planoSelecionadoId === 2)
      return 'Trimestral';
    if (this.planoSelecionadoId === 3)
      return 'Semestral';

    return 'Não selecionado';
  }

  get valorTotalCalculado(): number {
    let valorBase = 0;

    if (this.planoSelecionadoId === 1)
      valorBase = 150;
    else if (this.planoSelecionadoId === 2)
      valorBase = 400;
    else if (this.planoSelecionadoId === 3)
      valorBase = 750;

    let valorPorPet = valorBase * (this.frequenciaSelecionada || 1);
    const qtdPets = this.petsSelecionadosIds.length > 0 ? this.petsSelecionadosIds.length : 1;

    return valorPorPet * qtdPets;
  }

  get imagemCheckout(): string {
    if (this.petsSelecionadosIds.length === 1) {
      const pet = this.meusPets.find(p => p.id === this.petsSelecionadosIds[0]);

      if (pet && pet.foto) {
        if (pet.foto.startsWith('data:image') || pet.foto.startsWith('http'))
          return pet.foto;
        if (pet.foto.length > 100)
          return 'data:image/jpeg;base64,' + pet.foto;

        return `https://images.unsplash.com/photo-${pet.foto}?w=400&h=400&fit=crop`;
      }
    }
    return 'https://images.unsplash.com/photo-1587300003388-59208cc962cb?w=400&h=400&fit=crop';
  }

  lidarErroImagem(event: any) {
    event.target.src = 'https://images.unsplash.com/photo-1587300003388-59208cc962cb?w=400&h=400&fit=crop';
  }

  get textoPetsCheckout(): string {
    if (this.petsSelecionadosIds.length === 1) {
      const pet = this.meusPets.find(p => p.id === this.petsSelecionadosIds[0]);

      return pet ? pet.nome : '1 pet(s)';
    }
    return `${this.petsSelecionadosIds.length} pets selecionados`;
  }

  avancar() {
    if (this.etapaAtual < 3)
      this.etapaAtual++;
    }
  voltar() {
    if (this.etapaAtual > 1)
      this.etapaAtual--;
    }

  finalizarMatricula() {
    const codigoPix = '00020126580014BR.GOV.BCB.PIX0136a234567b-1234-4c56-9d8e-123456789abc5204000053039865405150.005802BR5909PETDAY LTDA...';

    Swal.fire({
      title: 'Pagamento via Pix',
      html: `
        <div style="text-align: center; font-family: 'Plus Jakarta Sans', sans-serif;">
          <p style="font-size: 14px; color: #594D42; margin-bottom: 16px;">Abra o app do seu banco e escaneie o QR Code abaixo:</p>
          <img src="https://upload.wikimedia.org/wikipedia/commons/d/d0/QR_code_for_mobile_English_Wikipedia.svg" width="180" height="180" style="border: 2px solid #D4722A; border-radius: 12px; padding: 8px;">
          <p style="margin-top: 20px; font-size: 13px; color: #8C827A; font-weight: bold;">Ou use o código Pix Copia e Cola:</p>
          <div style="background: #F8F5F0; padding: 12px; border-radius: 8px; font-family: monospace; word-break: break-all; font-size: 11px; border: 1px solid #E8DDD0; margin-top: 8px; margin-bottom: 12px; color: #1C1208; letter-spacing: 0.5px;">
            ${codigoPix}
          </div>
          <button onclick="navigator.clipboard.writeText('${codigoPix}'); this.innerText='Copiado! ✓'; this.style.backgroundColor='#2E9E66'; this.style.color='white'; this.style.borderColor='#2E9E66';" style="padding: 8px 16px; border: 1px solid #D4722A; background: transparent; color: #D4722A; border-radius: 8px; font-weight: bold; cursor: pointer; font-size: 12px; transition: all 0.2s;">
            Copiar Código
          </button>
        </div>
      `,
      showCancelButton: true,
      cancelButtonText: 'Cancelar Pagamento',
      confirmButtonText: 'Já realizei o pagamento',
      confirmButtonColor: '#2E9E66',
      cancelButtonColor: '#8C827A',
      reverseButtons: true,
      width: '450px'
    }).then((result) => {
      if (result.isConfirmed) {
        this.enviarMatriculaBackend();
      }
    });
  }

  private ordenarDiasProximoDiaUtil(dias: string[], dataBase: Date = new Date()): string[] {
    const mapaDiaIndex: { [key: string]: number } = {
      'Domingo': 0,
      'Segunda': 1,
      'Terça': 2,
      'Quarta': 3,
      'Quinta': 4,
      'Sexta': 5,
      'Sábado': 6
    };
    const diaBase = dataBase.getDay();

    return [...dias].sort((a, b) => {
      const idxA = mapaDiaIndex[a.trim().replace('-feira', '')] ?? 7;
      const idxB = mapaDiaIndex[b.trim().replace('-feira', '')] ?? 7;
      const distA = ((idxA - diaBase + 7) % 7) || 7;
      const distB = ((idxB - diaBase + 7) % 7) || 7;

      return distA - distB;
    });
  }

  private enviarMatriculaBackend() {
    const diasOrdenados = this.ordenarDiasProximoDiaUtil(this.diasSelecionados);

    const dto: MatriculaRequestDto = {
      planoId: this.planoSelecionadoId!,
      petIds: this.petsSelecionadosIds,
      diasSemana: diasOrdenados.join(', '),
      frequencia: this.frequenciaSelecionada
    };

    this.matriculaService.criarMatricula(dto).subscribe({
      next: (resposta: any) => {
        Swal.fire({
          title: 'Matrícula em Análise!',
          text: 'O seu pedido foi enviado. O administrador irá confirmar o seu pagamento em breve!',
          icon: 'success',
          confirmButtonColor: '#B85A10'
        }).then(() => {
          this.exibirWizard = false;
          this.carregarDadosUsuario();
        });
      },
      error: (erro: any) => {
        console.error('Erro ao gerar matrícula', erro);
        Swal.fire({
          title: 'Erro',
          text: 'Ocorreu um erro ao processar sua matrícula.',
          icon: 'error',
          confirmButtonColor: '#B85A10'
        });
      }
    });
  }
}
