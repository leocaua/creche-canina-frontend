import { ComponentFixture, TestBed } from '@angular/core/testing';

import { Tutores } from './tutores';

describe('Tutores', () => {
  let component: Tutores;
  let fixture: ComponentFixture<Tutores>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Tutores],
    }).compileComponents();

    fixture = TestBed.createComponent(Tutores);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
