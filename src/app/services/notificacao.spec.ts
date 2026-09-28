import { TestBed } from '@angular/core/testing';

import { Notificacao } from './notificacao';

describe('Notificacao', () => {
  let service: Notificacao;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(Notificacao);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
