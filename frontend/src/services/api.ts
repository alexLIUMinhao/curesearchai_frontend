import { API_BASE_URL } from '../utils/constants';
import type { ApiErrorShape, ApiResponse } from '../types/api';

export class ApiError extends Error {
  code?: number;
  status?: number;

  constructor(message: string, options?: ApiErrorShape) {
    super(message);
    this.name = 'ApiError';
    this.code = options?.code;
    this.status = options?.status;
  }
}

async function parseResponse<T>(response: Response): Promise<T> {
  const contentType = response.headers.get('content-type') || '';
  const isJson = contentType.includes('application/json');
  const body = isJson ? ((await response.json()) as ApiResponse<T>) : null;

  if (!response.ok) {
    throw new ApiError(body?.message || 'Request failed', {
      code: body?.code,
      status: response.status,
    });
  }

  if (!body) {
    throw new ApiError('Unexpected non-JSON response', { status: response.status });
  }

  if (body.code !== 0) {
    throw new ApiError(body.message || 'API error', {
      code: body.code,
      status: response.status,
    });
  }

  return body.data;
}

export async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const headers = new Headers(init?.headers || {});
  if (init?.body && !(init.body instanceof FormData) && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json');
  }

  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...init,
    headers,
  });

  return parseResponse<T>(response);
}

export async function requestForm<T>(path: string, formData: FormData, init?: RequestInit): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...init,
    body: formData,
  });

  return parseResponse<T>(response);
}
