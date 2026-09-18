import { ComponentFixture, TestBed } from '@angular/core/testing';

import { Rotina } from './rotina';

describe('Rotina', () => {
  let component: Rotina;
  let fixture: ComponentFixture<Rotina>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Rotina],
    }).compileComponents();

    fixture = TestBed.createComponent(Rotina);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
