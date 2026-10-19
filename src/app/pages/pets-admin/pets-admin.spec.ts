import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PetsAdmin } from './pets-admin';

describe('PetsAdmin', () => {
  let component: PetsAdmin;
  let fixture: ComponentFixture<PetsAdmin>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PetsAdmin],
    }).compileComponents();

    fixture = TestBed.createComponent(PetsAdmin);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
