import type { Agent, AgentCreate, AgentUpdate, Trade } from "./types";

const BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

export class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

const ngrokHeaders: HeadersInit = process.env.NEXT_PUBLIC_NGROK_MODE
  ? { "ngrok-skip-browser-warning": "1" }
  : {};

async function req<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    ...init,
    headers: { ...ngrokHeaders, ...init?.headers },
  });
  if (!res.ok) {
    throw new ApiError(
      res.status,
      `${init?.method ?? "GET"} ${path} → ${res.status}`,
    );
  }
  return res.json() as Promise<T>;
}

async function reqVoid(path: string, init?: RequestInit): Promise<void> {
  const res = await fetch(`${BASE}${path}`, {
    ...init,
    headers: { ...ngrokHeaders, ...init?.headers },
  });
  if (!res.ok) {
    throw new ApiError(
      res.status,
      `${init?.method ?? "GET"} ${path} → ${res.status}`,
    );
  }
}

function bearer(token: string) {
  return { Authorization: `Bearer ${token}` };
}

export async function getNonce(address: string): Promise<string> {
  const data = await req<{ nonce: string }>(`/auth/nonce/${address}`);
  return data.nonce;
}

export async function verifySignature(
  address: string,
  message: string,
  signature: string,
): Promise<string> {
  const data = await req<{ token: string }>("/auth/verify", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ address, message, signature }),
  });
  return data.token;
}

export async function getAgents(token: string): Promise<Agent[]> {
  return req<Agent[]>("/agents", { headers: bearer(token) });
}

export async function getAgentById(token: string, id: number): Promise<Agent> {
  return req<Agent>(`/agents/${id}`, { headers: bearer(token) });
}

export async function createAgent(
  token: string,
  data: AgentCreate,
): Promise<Agent> {
  return req<Agent>("/agents", {
    method: "POST",
    headers: { "Content-Type": "application/json", ...bearer(token) },
    body: JSON.stringify(data),
  });
}

export async function updateAgent(
  token: string,
  id: number,
  data: AgentUpdate,
): Promise<Agent> {
  return req<Agent>(`/agents/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json", ...bearer(token) },
    body: JSON.stringify(data),
  });
}

export async function deleteAgent(token: string, id: number): Promise<void> {
  return reqVoid(`/agents/${id}`, {
    method: "DELETE",
    headers: bearer(token),
  });
}

export async function getAgentTrades(
  token: string,
  id: number,
): Promise<Trade[]> {
  return req<Trade[]>(`/agents/${id}/trades`, { headers: bearer(token) });
}
