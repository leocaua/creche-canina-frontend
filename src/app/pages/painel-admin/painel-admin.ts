import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-painel-admin',
  standalone: true,
  imports: [RouterLink],
  templateUrl: './painel-admin.html',
  styleUrl: './painel-admin.css',
})
export class PainelAdmin {
  dataAtual: string = 'Seg, 30 Ago 2026';
}
