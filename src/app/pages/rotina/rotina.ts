import { Component, OnInit, ChangeDetectorRef, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, Router } from '@angular/router';
import { Cliente } from '../../services/cliente';
import { Pet } from '../../services/pet';
import { RotinaService } from '../../services/rotina';
import { NotificacaoService } from '../../services/notificacao';
import { HttpClient, HttpHeaders } from '@angular/common/http';

@Component({
  selector: 'app-rotina',
  standalone: true,
  imports: [RouterLink, CommonModule],
  templateUrl: './rotina.html',
  styleUrls: ['./rotina.css'],
})
export class RotinaComponent implements OnInit {
  menuAberto: boolean = false;
  nomeCliente: string = '';
  clienteId: number | null = null;
  dataAtual: string = '';
  dataSimples: string = '';
  exibindoRotinaAnterior: boolean = false;
  primeiraVisitaFutura: boolean = false;
  dataRotinaAnterior: string = '';

  mostrarNotificacoes: boolean = false;
  notificacoes: any[] = [];

  meusPets: any[] = [];
  petSelecionado: any = null;

  dataAgendamentoObj!: Date;
  dataAgendamentoCurta: string = '';
  dataAgendamentoLonga: string = '';
  dataFormatadaBanco: string = '';

  statusDoPet: string = 'AGENDADO';
  atividadesDoDia: any[] = [];
  matriculaAssociadaId: number | null = null;

  mostrarModalAusencia: boolean = false;
  estadoModal: 'confirmar' | 'sucesso' = 'confirmar';

  constructor(
    private clienteService: Cliente,
    private petService: Pet,
    private rotinaService: RotinaService,
    private notificacaoService: NotificacaoService,
    private http: HttpClient,
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

    const hoje = new Date();
    this.dataAgendamentoObj = hoje;
    this.dataAgendamentoCurta = hoje.toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit'
    });
    this.dataAgendamentoLonga = hoje.toLocaleDateString('pt-BR', {
      day: 'numeric',
      month: 'long'
    });

    const ano = hoje.getFullYear();
    const mes = String(hoje.getMonth() + 1).padStart(2, '0');
    const dia = String(hoje.getDate()).padStart(2, '0');

    this.dataFormatadaBanco = `${ano}-${mes}-${dia}`;
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

              if (clienteEncontrado) {
                this.nomeCliente = clienteEncontrado.nome || 'Tutor';
                this.clienteId = clienteEncontrado.id;

                this.carregarNotificacoes(this.clienteId!);
                this.carregarPets(this.clienteId!);
              } else {

                this.nomeCliente = 'Tutor';
              }
              this.cdr.detectChanges();
            },
            error: (erro: any) => console.error('Erro ao buscar cliente pós-F5:', erro)
          });
        } catch (e) {
          console.error('Erro ao processar token:', e);
        }
      } else {
        this.router.navigate(['/login']);
      }
    }
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

    if (notificacao.tipo === 'agendamento') {
      this.router.navigate(['/matriculas']);
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

  carregarPets(clienteId: number) {
    this.petService.buscarPorClienteId(clienteId).subscribe({
      next: (pets: any[]) => {
        this.meusPets = pets;

        if (this.meusPets.length > 0) {
          this.selecionarPet(this.meusPets[0]);
        }

        this.cdr.detectChanges();
      },
      error: (err: any) => console.error('Erro ao carregar pets', err)
    });
  }

  selecionarPet(pet: any) {
    this.petSelecionado = pet;

    const token = localStorage.getItem('token');
    const headers = new HttpHeaders().set('Authorization', `Bearer ${token}`);

    this.http.get<any[]>(`http://localhost:8080/matriculas/cliente/${this.clienteId}`, { headers }).subscribe({
      next: (matriculas) => {
        const matriculaDoPet = matriculas?.find(m =>
          (m.status === true || m.status === 'true' || m.status === 1) &&
          m.pets?.some((p: any) => p.id === pet.id)
        );

        if (!matriculaDoPet) {
          const matriculaPendente = matriculas?.find(m =>
            !(m.status === true || m.status === 'true' || m.status === 1) &&
            m.pets?.some((p: any) => p.id === pet.id)
          );

          this.statusDoPet = matriculaPendente ? 'PENDENTE' : 'SEM_MATRICULA';
          this.exibindoRotinaAnterior = false;
          this.primeiraVisitaFutura = false;
          this.matriculaAssociadaId = null;
          this.atividadesDoDia = [];
          this.cdr.detectChanges();

          return;
        }

        let dataInicioStr = '';
        if (Array.isArray(matriculaDoPet.dataReserva)) {
          const [y, m, d] = matriculaDoPet.dataReserva;
          dataInicioStr = `${y}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
        } else if (matriculaDoPet.dataReserva) {

          dataInicioStr = String(matriculaDoPet.dataReserva).substring(0, 10);
        }
        const matriculadoHoje = dataInicioStr === this.dataFormatadaBanco;

        this.http.get<any[]>(`http://localhost:8080/agenda?data=${this.dataFormatadaBanco}`, { headers }).subscribe({
          next: (agendaDoDia: any[]) => {
            const agendaDoMeuPet = agendaDoDia.find(item => item.petNome === pet.nome && item.status !== 'PENDENTE');

            if (agendaDoMeuPet && !matriculadoHoje) {
              this.statusDoPet = agendaDoMeuPet.status;
              this.matriculaAssociadaId = agendaDoMeuPet.id;

              this.exibindoRotinaAnterior = false;
              this.primeiraVisitaFutura = false;

              const hoje = new Date();
              this.dataAgendamentoObj = hoje;
              this.dataAgendamentoCurta = hoje.toLocaleDateString('pt-BR', {
                day: '2-digit',
                month: '2-digit'
                });
              this.dataAgendamentoLonga = hoje.toLocaleDateString('pt-BR', {
                day: 'numeric',
                month: 'long'
              });
              this.carregarRotinaDoBackend(pet.id, this.dataFormatadaBanco);

            } else {
              this.statusDoPet = 'AGENDADO';

              const hoje = new Date();
              const diasDaSemana = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'];
              const diaAtualIndex = hoje.getDay();

              let diasParaAdicionar = 1;
              let diasParaSubtrair = 1;

              if (matriculaDoPet.diasSemana) {
                const diasMatriculados = matriculaDoPet.diasSemana.split(',').map((d: string) => d.trim().replace('-feira', ''));

                for (let i = 1; i <= 7; i++) {
                  const proximoIndex = (diaAtualIndex + i) % 7;
                  if (diasMatriculados.some((d: string) => d.includes(diasDaSemana[proximoIndex]))) {
                    diasParaAdicionar = i;
                    break;
                  }
                }

                for (let i = 1; i <= 7; i++) {
                  const prevIndex = (diaAtualIndex - i + 7) % 7;
                  if (diasMatriculados.some((d: string) => d.includes(diasDaSemana[prevIndex]))) {
                    diasParaSubtrair = i;
                    break;
                  }
                }
              }

              const proximaData = new Date(hoje);
              proximaData.setDate(proximaData.getDate() + diasParaAdicionar);

              this.dataAgendamentoObj = proximaData;
              this.dataAgendamentoCurta = proximaData.toLocaleDateString('pt-BR', {
                day: '2-digit',
                month: '2-digit'
              });
              this.dataAgendamentoLonga = proximaData.toLocaleDateString('pt-BR', {
                day: 'numeric',
                month: 'long'
              });

              const anoProx = proximaData.getFullYear();
              const mesProx = String(proximaData.getMonth() + 1).padStart(2, '0');
              const diaProx = String(proximaData.getDate()).padStart(2, '0');

              this.http.get<any[]>(`http://localhost:8080/agenda?data=${anoProx}-${mesProx}-${diaProx}`, { headers }).subscribe({
                next: (agendaFutura) => {
                  const agendaDoMeuPetFutura = agendaFutura.find(item => item.petNome === pet.nome);

                  if (agendaDoMeuPetFutura) {
                    this.matriculaAssociadaId = agendaDoMeuPetFutura.id;

                    if (agendaDoMeuPetFutura.status === 'CANCELADO' || agendaDoMeuPetFutura.status === 'AUSENTE' || agendaDoMeuPetFutura.status === 'FALTA') {
                      this.statusDoPet = 'AUSENTE';
                    } else {
                      this.statusDoPet = agendaDoMeuPetFutura.status;
                    }
                  } else {
                    this.matriculaAssociadaId = matriculaDoPet.id;
                    this.statusDoPet = 'AGENDADO';
                  }

                  this.cdr.detectChanges();
                },
                error: () => {
                  this.matriculaAssociadaId = matriculaDoPet.id;
                  this.statusDoPet = 'AGENDADO';
                  this.cdr.detectChanges();
                }
              });

              const dataAnterior = new Date(hoje);
              dataAnterior.setDate(dataAnterior.getDate() - diasParaSubtrair);

              const anoAnt = dataAnterior.getFullYear();
              const mesAnt = String(dataAnterior.getMonth() + 1).padStart(2, '0');
              const diaAnt = String(dataAnterior.getDate()).padStart(2, '0');
              const dataAnteriorBanco = `${anoAnt}-${mesAnt}-${diaAnt}`;

              if (dataInicioStr && dataAnteriorBanco <= dataInicioStr) {
                this.exibindoRotinaAnterior = false;
                this.primeiraVisitaFutura = true;

                this.atividadesDoDia = [];
                this.cdr.detectChanges();
              } else {
                this.exibindoRotinaAnterior = true;
                this.primeiraVisitaFutura = false;

                this.dataRotinaAnterior = dataAnterior.toLocaleDateString('pt-BR', {
                  day: '2-digit',
                  month: 'long'
                });
                this.cdr.detectChanges();
                this.carregarRotinaDoBackend(pet.id, dataAnteriorBanco);
              }
            }
          },
          error: (err) => console.error('Erro ao verificar status na agenda', err)
        });
      },
      error: (err) => console.error('Erro ao buscar matrículas do cliente', err)
    });
  }

  carregarRotinaDoBackend(petId: number, dataConsulta: string) {
    this.rotinaService.buscarAtividadesPorPetEData(petId, dataConsulta).subscribe({
      next: (atividadesBackend: any[]) => {
        this.atividadesDoDia = atividadesBackend.map(ativ => {

          let tituloReal = 'Atividade';
          let descricaoReal = ativ.descricao || '';

          if (descricaoReal.includes('|||')) {
            const partes = descricaoReal.split('|||');

            tituloReal = partes[0].trim();
            descricaoReal = partes.slice(1).join(' ').trim();
          }
          else if (descricaoReal.includes(': ')) {
            const partes = descricaoReal.split(': ');

            tituloReal = partes[0].trim();
            descricaoReal = partes.slice(1).join(': ').trim();
          }
          else if (descricaoReal.includes(' - ')) {
            const partes = descricaoReal.split(' - ');

            tituloReal = partes[0].trim();
            descricaoReal = partes.slice(1).join(' - ').trim();
          }
          else if (descricaoReal.includes('\n')) {
            const partes = descricaoReal.split('\n');

            tituloReal = partes[0].trim();
            descricaoReal = partes.slice(1).join('\n').trim();
          }

          return {
            horario: ativ.horario.length > 5 ? ativ.horario.split('T')[1].substring(0, 5) : ativ.horario,
            titulo: tituloReal,
            descricao: descricaoReal
          };
        });

        this.atividadesDoDia.sort((a: any, b: any) => b.horario.localeCompare(a.horario));

        this.cdr.detectChanges();
      },
      error: (erro: any) => {
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
    if (!this.matriculaAssociadaId) {
      alert("Não foi possível encontrar o agendamento do pet para esta data.");
      this.fecharModal();

      return;
    }

    const token = localStorage.getItem('token');
    const headers = new HttpHeaders().set('Authorization', `Bearer ${token}`);

    const ano = this.dataAgendamentoObj.getFullYear();
    const mes = String(this.dataAgendamentoObj.getMonth() + 1).padStart(2, '0');
    const dia = String(this.dataAgendamentoObj.getDate()).padStart(2, '0');
    const dataAlvo = `${ano}-${mes}-${dia}`;

    const payload = {
      acao: 'AUSENCIA',
      data: dataAlvo
    };

    this.http.put(`http://localhost:8080/agenda/${this.matriculaAssociadaId}/status`, payload, { headers }).subscribe({
      next: () => {
        this.statusDoPet = 'AUSENTE';
        this.atividadesDoDia = [];
        this.estadoModal = 'sucesso';
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error("Erro ao informar ausência", err);
        alert("Ocorreu um erro ao comunicar a ausência ao sistema.");
        this.fecharModal();
      }
    });
  }

  getImagem(fotoBase64: string): string {
    const imagemPadrao = 'https://images.unsplash.com/photo-1587300003388-59208cc962cb?w=400&h=400&fit=crop';
    if (!fotoBase64)
      return imagemPadrao;

    if (fotoBase64.startsWith('data:image') || fotoBase64.startsWith('http'))
      return fotoBase64;

    if (fotoBase64.length > 100)
      return 'data:image/jpeg;base64,' + fotoBase64;

    return `https://images.unsplash.com/photo-${fotoBase64}?w=400&h=400&fit=crop`;
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
