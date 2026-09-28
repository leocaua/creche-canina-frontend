import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { CommonModule, Location } from '@angular/common';
import { Cliente } from '../../services/cliente';
import { Pet } from '../../services/pet';

@Component({
  selector: 'app-pet-detalhes',
  standalone: true,
  imports: [RouterLink, FormsModule, CommonModule],
  templateUrl: './pet-detalhes.html',
  styleUrl: './pet-detalhes.css'
})

export class PetDetalhesComponent implements OnInit {
  isEdicao: boolean = false;
  modoEdicao: boolean = false;
  petId: string | null = null;
  abaAtiva: string = 'perfil';

  nomeCliente: string = '';
  mensagemErro: string = '';

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

  atividades: any[] = [];
  historicoMatriculas: any[] = [];
  planoAtivo: string = '';
  validadePlano: string = '';
  statusPlano: string = '';

  constructor(
    private route: ActivatedRoute,
    private location: Location,
    private router: Router,
    private clienteService: Cliente,
    private petService: Pet,
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

            this.planoAtivo = clienteEncontrado.planoAtivo || clienteEncontrado.plano || 'Trimestral';
            this.validadePlano = clienteEncontrado.validadePlano || '18/12/2026';
            this.statusPlano = this.planoAtivo !== 'Nenhum' && this.planoAtivo ? 'Ativo' : 'Inativo';

            if (this.statusPlano === 'Ativo') {
              this.historicoMatriculas = [{
                plano: this.planoAtivo,
                dataInicio: '18/09/2026',
                dataFim: this.validadePlano,
                status: this.statusPlano
              }];
            }

            if (this.isEdicao && this.petId) {
              this.carregarDadosPet(Number(this.petId), clienteEncontrado.id);
            }

            this.cdr.detectChanges();
          }
        },
        error: (erro: any) => console.error('Erro ao buscar clientes:', erro)
      });
    }
  }

  carregarDadosPet(petId: number, clienteId: number) {
    this.petService.buscarPorClienteId(clienteId).subscribe({
      next: (pets: any[]) => {
        const petEncontrado = pets.find(p => p.id === petId);

        if (petEncontrado) {
          this.pet = { ...this.pet, ...petEncontrado };

          if (!this.pet.cliente) {
            this.pet.cliente = { id: clienteId };
          }

          if (!this.pet.foto) this.pet.foto = '1587300003388-59208cc962cb';
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
    if (this.pet.foto.startsWith('data:image'))
      return this.pet.foto;
    return `https://images.unsplash.com/photo-${this.pet.foto}?w=400&h=400&fit=crop`;
  }

  habilitarEdicao() {
    this.modoEdicao = true;
  }

  cancelarEdicao() {
    this.modoEdicao = false;
    this.mensagemErro = '';
    if (this.petId)
      this.ngOnInit();
  }

  trocarAba(aba: string) {
    this.abaAtiva = aba;
    this.modoEdicao = false;
    this.mensagemErro = '';
  }

  voltar() {
    this.location.back();
  }

  logout() {
    localStorage.clear();
    this.router.navigate(['/login']);
  }

  salvarPet() {
    this.mensagemErro = '';

    if (this.isEdicao) {
      this.petService.atualizar(this.pet.id, this.pet).subscribe({
        next: (resposta: any) => {
          this.modoEdicao = false;
          this.cdr.detectChanges();
        },
        error: (erro: any) => {
          console.error('Erro ao atualizar pet:', erro);

          if (typeof erro.error === 'string') {
            this.mensagemErro = erro.error;
          } else {
            this.mensagemErro = erro.error?.message || 'Erro ao guardar as alterações. Tente novamente.';
          }
          this.cdr.detectChanges();
        }
      });
    } else {
      this.petService.cadastrar(this.pet).subscribe({
        next: (resposta: any) => {
          this.voltar();
        },
        error: (erro: any) => {
          console.error('Erro ao cadastrar pet:', erro);

          if (typeof erro.error === 'string') {
            this.mensagemErro = erro.error;
          } else {
            this.mensagemErro = erro.error?.message || erro.error || 'A creche não aceita cães sem vacina!';
          }
          this.cdr.detectChanges();
        }
      });
    }
  }
}
