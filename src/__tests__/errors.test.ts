import { describe, it, expect } from 'vitest';
import { RnldApiError, RnldNotFoundError, RnldUnauthorizedError } from '../errors.js';

describe('RnldApiError', () => {
  it('armazena statusCode e mensagem', () => {
    const err = new RnldApiError(500, 'erro interno');
    expect(err.statusCode).toBe(500);
    expect(err.message).toBe('erro interno');
    expect(err.name).toBe('RnldApiError');
    expect(err).toBeInstanceOf(Error);
  });

  it('armazena body opcional', () => {
    const body = { detail: 'x' };
    const err = new RnldApiError(400, 'bad request', body);
    expect(err.body).toEqual(body);
  });
});

describe('RnldNotFoundError', () => {
  it('tem statusCode 404', () => {
    const err = new RnldNotFoundError();
    expect(err.statusCode).toBe(404);
    expect(err.name).toBe('RnldNotFoundError');
    expect(err).toBeInstanceOf(RnldApiError);
  });

  it('aceita mensagem customizada', () => {
    const err = new RnldNotFoundError('player não encontrado');
    expect(err.message).toBe('player não encontrado');
  });
});

describe('RnldUnauthorizedError', () => {
  it('tem statusCode 403', () => {
    const err = new RnldUnauthorizedError();
    expect(err.statusCode).toBe(403);
    expect(err.name).toBe('RnldUnauthorizedError');
    expect(err).toBeInstanceOf(RnldApiError);
  });
});
