import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { CommonModule, Location } from '@angular/common';
import { Cliente } from '../../services/cliente';
import { Pet } from '../../services/pet';
import { MatriculaService } from '../../services/matricula';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-pet-detalhes',
  standalone: true,
  imports: [RouterLink, FormsModule, CommonModule],
  templateUrl: './pet-detalhes.html',
  styleUrl: './pet-detalhes.css'
})
export class PetDetalhesComponent implements OnInit {
  menuAberto: boolean = false;
  isEdicao: boolean = false;
  modoEdicao: boolean = false;
  petId: string | null = null;
  abaAtiva: string = 'perfil';

  nomeCliente: string = '';

  pet: any = {
    nome: '',
    raca: '',
    sexo: 'M',
    idade: null,
    peso: null,
    porte: 'M',
    cor: '',
    vacinado: false,
    castrado: false,
    foto: '1587300003388-59208cc962cb',
    cliente: { id: null }
  };

  historicoMatriculas: any[] = [];
  planoAtivo: string = 'Nenhum';
  validadePlano: string = '--';
  statusPlano: string = 'Inativo';

  constructor(
    private route: ActivatedRoute,
    private location: Location,
    private router: Router,
    private clienteService: Cliente,
    private petService: Pet,
    private matriculaService: MatriculaService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit() {
    this.petId = this.route.snapshot.paramMap.get('id');
    if (this.petId) this.isEdicao = true;

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
            this.pet.cliente.id = clienteEncontrado.id;

            if (this.isEdicao && this.petId) {
              this.carregarDadosPet(Number(this.petId), clienteEncontrado.id);
              this.carregarHistoricoMatriculas(clienteEncontrado.id, Number(this.petId));
            }

            this.cdr.detectChanges();
          }
        },
        error: (erro: any) => console.error('Erro ao buscar clientes:', erro)
      });
    }
  }

  carregarHistoricoMatriculas(clienteId: number, petId: number) {
    this.matriculaService.buscarPorClienteId(clienteId).subscribe({
      next: (matriculas: any[]) => {
        const matriculasDoPet = matriculas ? matriculas.filter(m =>
          m.pets && m.pets.some((p: any) => p.id === petId)
        ) : [];

        if (matriculasDoPet.length > 0) {
          const ativas = matriculasDoPet.filter(m => m.status === true || m.status === 'true' || m.status === 1);

          if (ativas.length > 0) {
            const atual = ativas[0];
            this.planoAtivo = atual.plano ? atual.plano.nome : 'Mensal';
            this.statusPlano = 'Ativo';

            let dataObjeto = new Date();
            if (Array.isArray(atual.dataReserva)) {
              dataObjeto = new Date(atual.dataReserva[0], atual.dataReserva[1] - 1, atual.dataReserva[2]);
            } else if (atual.dataReserva) {
              dataObjeto = new Date(atual.dataReserva + 'T00:00:00');
            }

            const vencimento = new Date(dataObjeto);
            const planoLowerCase = this.planoAtivo.toLowerCase();
            const meses = planoLowerCase.includes('trimestral') ? 3 : planoLowerCase.includes('semestral') ? 6 : 1;

            vencimento.setMonth(vencimento.getMonth() + meses);
            this.validadePlano = vencimento.toLocaleDateString('pt-BR');
          } else {
            this.planoAtivo = 'Nenhum';
            this.statusPlano = 'Inativo';
            this.validadePlano = '--';
          }

          this.historicoMatriculas = matriculasDoPet.map(m => {
            let dInicio = new Date();

            if (Array.isArray(m.dataReserva)) {
              dInicio = new Date(m.dataReserva[0], m.dataReserva[1] - 1, m.dataReserva[2]);
            } else if (m.dataReserva) {
              dInicio = new Date(m.dataReserva + 'T00:00:00');
            }

            const planoNome = m.plano ? m.plano.nome : 'Mensal';
            const meses = planoNome.toLowerCase().includes('trimestral') ? 3 : planoNome.toLowerCase().includes('semestral') ? 6 : 1;

            const dFim = new Date(dInicio);
            dFim.setMonth(dFim.getMonth() + meses);

            return {
              plano: planoNome,
              dataInicio: dInicio.toLocaleDateString('pt-BR'),
              dataFim: dFim.toLocaleDateString('pt-BR'),
              status: (m.status === true || m.status === 'true' || m.status === 1) ? 'Ativo' : 'Inativo'
            };
          });
        } else {
           this.planoAtivo = 'Nenhum';
           this.statusPlano = 'Inativo';
           this.validadePlano = '--';
           this.historicoMatriculas = [];
        }
        this.cdr.detectChanges();
      },
      error: (erro: any) => console.error('Erro ao carregar matrículas:', erro)
    });
  }

  carregarDadosPet(petId: number, clienteId: number) {
    this.petService.buscarPorClienteId(clienteId).subscribe({
      next: (pets: any[]) => {
        const petEncontrado = pets.find(p => p.id === petId);

        if (petEncontrado) {
          this.pet = {
            ...this.pet, ...petEncontrado
          };

          if (!this.pet.cliente) {
            this.pet.cliente = {
              id: clienteId
            };
          }

          this.pet.sexo = (this.pet.sexo === 'F' || this.pet.sexo === 'Fêmea') ? 'F' : 'M';

          if (!this.pet.foto)
            this.pet.foto = '1587300003388-59208cc962cb';
        }
        this.cdr.detectChanges();
      },
      error: (erro: any) => console.error('Erro ao carregar pet:', erro)
    });
  }

  onFileSelected(event: any) {
    const file: File = event.target.files[0];

    if (file) {
      const reader = new FileReader();

      reader.onload = (e: any) => {
        const img = new Image();
        img.src = e.target.result;

        img.onload = () => {
          const canvas = document.createElement('canvas');
          const max_width = 400;
          const scaleSize = max_width / img.width;

          canvas.width = max_width;
          canvas.height = img.height * scaleSize;

          const ctx = canvas.getContext('2d');
          ctx?.drawImage(img, 0, 0, canvas.width, canvas.height);

          this.pet.foto = canvas.toDataURL('image/jpeg', 0.7);
          this.cdr.detectChanges();
        };
      };
      reader.readAsDataURL(file);
    }
  }

  getImagemPet(): string {
    if (!this.pet.foto)
      return 'https://images.unsplash.com/photo-1587300003388-59208cc962cb?w=400&h=400&fit=crop';

    if (this.pet.foto.startsWith('data:image') || this.pet.foto.startsWith('http'))
      return this.pet.foto;

    if (this.pet.foto.length > 100)
      return 'data:image/jpeg;base64,' + this.pet.foto;

    return `https://images.unsplash.com/photo-${this.pet.foto}?w=400&h=400&fit=crop`;
  }

  lidarErroImagem(event: any) {
    event.target.src = 'https://images.unsplash.com/photo-1587300003388-59208cc962cb?w=400&h=400&fit=crop';
  }

  habilitarEdicao() {
    this.modoEdicao = true;
  }

  cancelarEdicao() {
    this.modoEdicao = false;
    if (this.petId)
      this.ngOnInit();
  }

  trocarAba(aba: string) {
    this.abaAtiva = aba;
    this.modoEdicao = false;
  }

  voltar() {
    this.location.back();
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

  salvarPet() {
    if (this.pet.vacinado === false || this.pet.vacinado === 'false' || !this.pet.vacinado) {
      Swal.fire({
        title: 'Acesso Negado',
        text: 'A creche não aceita cães sem a vacinação em dia!',
        icon: 'warning',
        confirmButtonColor: '#B85A10'
      });

      return;
    }
    if (!this.pet.nome || !this.pet.raca) {
      Swal.fire({
        title: 'Campos Obrigatórios',
        text: 'Por favor, preencha o nome e a raça.',
        icon: 'info',
        confirmButtonColor: '#B85A10'
      });

      return;
    }

    if (!this.pet.cliente || !this.pet.cliente.id) {
      Swal.fire({
        title: 'Aguarde...',
        text: 'Ainda estamos carregando os seus dados de Tutor. Tente clicar em salvar novamente em 1 segundo.',
        icon: 'warning',
        confirmButtonColor: '#B85A10'
      });

      return;
    }

    const petPayload = {
      ...this.pet,
      cliente: {
        id: this.pet.cliente.id
      }
    };

    if (this.isEdicao) {
      this.petService.atualizar(this.pet.id, petPayload).subscribe({
        next: () => {
          Swal.fire({
            title: 'Atualizado!',
            text: 'Dados do pet atualizados com sucesso!',
            icon: 'success',
            timer: 2000,
            showConfirmButton: false
          }).then(() => {
            this.modoEdicao = false;
            this.cdr.detectChanges();
          });
        },
        error: (erro: any) => Swal.fire({
          title: 'Erro',
          text: 'Falha ao atualizar.',
          icon: 'error'
        })
      });
    } else {
      this.petService.cadastrar(petPayload).subscribe({
        next: () => {
          Swal.fire({
            title: 'Cadastrado!',
            text: 'Pet cadastrado com sucesso!',
            icon: 'success',
            confirmButtonColor: '#B85A10'
          }).then(() =>
            this.voltar());
        },
        error: (erro: any) => Swal.fire({
          title: 'Erro',
          text: 'Falha no cadastro.',
          icon: 'error'
        })
      });
    }
  }
}
