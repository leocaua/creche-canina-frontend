import { TestBed } from '@angular/core/testing';

import { Rotina } from './rotina';

describe('Rotina', () => {
  let service: Rotina;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(Rotina);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
