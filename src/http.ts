import { RnldApiError, RnldNotFoundError, RnldUnauthorizedError } from './errors.js';

export async function post<T>(
  url: string,
  apiKey: string,
  body: Record<string, unknown>,
): Promise<T> {
  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
    },
    body: JSON.stringify(body),
  });

  return handleResponse<T>(res);
}

export async function del<T>(
  url: string,
  apiKey: string,
  body: Record<string, unknown>,
): Promise<T> {
  const res = await fetch(url, {
    method: 'DELETE',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
    },
    body: JSON.stringify(body),
  });

  return handleResponse<T>(res);
}

async function handleResponse<T>(res: Response): Promise<T> {
  let data: unknown;

  try {
    data = await res.json();
  } catch {
    throw new RnldApiError(res.status, `HTTP ${res.status}: resposta inválida`);
  }

  if (res.status === 401 || res.status === 403) {
    const msg = (data as { mensagem?: string })?.mensagem ?? 'Não autorizado';
    throw new RnldUnauthorizedError(msg);
  }

  if (res.status === 404) {
    const msg = (data as { mensagem?: string })?.mensagem ?? 'Não encontrado';
    throw new RnldNotFoundError(msg);
  }

  if (!res.ok) {
    const msg = (data as { mensagem?: string })?.mensagem ?? `HTTP ${res.status}`;
    throw new RnldApiError(res.status, msg, data);
  }

  return data as T;
}
