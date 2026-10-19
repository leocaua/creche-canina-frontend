import { ComponentFixture, TestBed } from '@angular/core/testing';

import { RotinasAdmin } from './rotinas-admin';

describe('RotinasAdmin', () => {
  let component: RotinasAdmin;
  let fixture: ComponentFixture<RotinasAdmin>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [RotinasAdmin],
    }).compileComponents();

    fixture = TestBed.createComponent(RotinasAdmin);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
