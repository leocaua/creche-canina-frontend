import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PetDetalhes } from './pet-detalhes';

describe('PetDetalhes', () => {
  let component: PetDetalhes;
  let fixture: ComponentFixture<PetDetalhes>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PetDetalhes],
    }).compileComponents();

    fixture = TestBed.createComponent(PetDetalhes);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
