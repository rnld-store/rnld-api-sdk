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

export interface RnldIdentityConflict {
  /** Tipo do identificador em conflito */
  kind: 'discord_id' | 'steamhex' | 'license' | 'license2';
  value: string;
  /** Token amigável que já possui o identificador */
  token: string;
}

/** 409: identificador já pertence a outro token da mesma guild. */
export class RnldConflictError extends RnldApiError {
  constructor(
    message: string,
    public readonly conflictingTokens: string[] = [],
    public readonly conflicts: RnldIdentityConflict[] = [],
    body?: unknown,
  ) {
    super(409, message, body);
    this.name = 'RnldConflictError';
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
