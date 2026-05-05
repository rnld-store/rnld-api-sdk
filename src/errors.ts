export class RnldApiError extends Error {
  constructor(
    public readonly statusCode: number,
    message: string,
    public readonly body?: unknown,
  ) {
    super(message);
    this.name = 'RnldApiError';
  }
}

export class RnldNotFoundError extends RnldApiError {
  constructor(message = 'Jogador não encontrado') {
    super(404, message);
    this.name = 'RnldNotFoundError';
  }
}

export class RnldUnauthorizedError extends RnldApiError {
  constructor(message = 'API Key inválida ou guild_id incorreto') {
    super(403, message);
    this.name = 'RnldUnauthorizedError';
  }
}
