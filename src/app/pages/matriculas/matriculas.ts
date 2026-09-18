import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { MatriculaService } from '../../services/matricula';
import { MatriculaRequestDto } from '../../models/matricula-request.dto';

@Component({
  selector: 'app-matriculas',
  standalone: true,
  imports: [RouterLink, CommonModule],
  templateUrl: './matriculas.html',
  styleUrls: ['./matriculas.css'],
})
export class MatriculasComponent {
  etapaAtual: number = 1;

  planoSelecionadoId: number | null = null;
  frequenciaSelecionada: number = 0;
  petsSelecionadosIds: number[] = [];
  diasSelecionados: string[] = [];

  constructor(private matriculaService: MatriculaService) {}

  selecionarPlano(id: number) {
    if (this.planoSelecionadoId === id) {
      this.planoSelecionadoId = null;
    } else {
      this.planoSelecionadoId = id;
    }
  }

  selecionarFrequencia(dias: number) {
    if (this.frequenciaSelecionada === dias) {
      this.frequenciaSelecionada = 0;
    } else {
      this.frequenciaSelecionada = dias;
    }
  }

  selecionarPet(petId: number) {
  const index = this.petsSelecionadosIds.indexOf(petId);
  if (index > -1) {
    this.petsSelecionadosIds.splice(index, 1);
  } else {
    this.petsSelecionadosIds.push(petId);
  }
}

  selecionarDia(dia: string) {
  const index = this.diasSelecionados.indexOf(dia);

  if (index > -1) {
    this.diasSelecionados.splice(index, 1);
  } else {
    if (this.diasSelecionados.length < this.frequenciaSelecionada) {
      this.diasSelecionados.push(dia);
    } else {
      alert(`O plano escolhido é de ${this.frequenciaSelecionada}x na semana. Desmarque um dia para escolher outro!`);
    }
  }
}

  get nomePlanoFormatado(): string {
  if (this.planoSelecionadoId === 1) return 'Mensal';
  if (this.planoSelecionadoId === 2) return 'Trimestral';
  if (this.planoSelecionadoId === 3) return 'Semestral';
  return 'Não selecionado';
}

  get valorTotalCalculado(): number {
  let valorBase = 0;

  if (this.planoSelecionadoId === 1) valorBase = 150;      // Mensal
  else if (this.planoSelecionadoId === 2) valorBase = 400; // Trimestral
  else if (this.planoSelecionadoId === 3) valorBase = 750; // Semestral

  let valorPorPet = valorBase * (this.frequenciaSelecionada || 1);

  const qtdPets = this.petsSelecionadosIds.length > 0 ? this.petsSelecionadosIds.length : 1;

  return valorPorPet * qtdPets;
}

  avancar() {
    if (this.etapaAtual < 3) {
      this.etapaAtual++;
    }
  }

  voltar() {
    if (this.etapaAtual > 1) {
      this.etapaAtual--;
    }
  }

  finalizarMatricula() {
    const dto: MatriculaRequestDto = {
      planoId: this.planoSelecionadoId!,
      petIds: this.petsSelecionadosIds,
      diasSemana: this.diasSelecionados.join(', '),
      frequencia: this.frequenciaSelecionada
    };

    this.matriculaService.criarMatricula(dto).subscribe({
      next: (resposta: any) => {
        console.log('Matrícula gerada com sucesso!', resposta);
        alert('Matrícula gerada com sucesso! Código Pix liberado.');
      },
      error: (erro: any) => {
        console.error('Erro ao gerar matrícula', erro);
        alert('Ocorreu um erro ao processar sua matrícula.');
      }
    });
  }
}
