import type { ServicesResponse, StatusResponse } from "./types";

type JsonBody = Record<string, string>;

async function request<T>(path: string, token: string, options: RequestInit = {}): Promise<T> {
  const response = await fetch(path, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      "X-Home-Token": token,
      ...options.headers
    }
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(text || `Request failed with status ${response.status}`);
  }

  return response.json() as Promise<T>;
}

export function getStatus(token: string): Promise<StatusResponse> {
  return request<StatusResponse>("/api/status", token);
}

export function getServices(token: string): Promise<ServicesResponse> {
  return request<ServicesResponse>("/api/services", token);
}

export function sendYoutube(token: string, body: JsonBody): Promise<{ status: string; message: string }> {
  return request("/api/youtube", token, {
    method: "POST",
    body: JSON.stringify(body)
  });
}

export function sendMagnet(token: string, body: JsonBody): Promise<{ status: string; message: string }> {
  return request("/api/magnet", token, {
    method: "POST",
    body: JSON.stringify(body)
  });
}
