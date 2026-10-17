import { ChatResponse, StatusCardData, User, Area, WellItem } from '../types';

const API_BASE = (import.meta.env.VITE_API_URL || import.meta.env.VITE_API_BASE_URL || '/api').replace(/\/$/, '');

export async function sendChatMessage(
  message: string,
  conversationId?: string,
  userId: string = 'U-201',
  preferredVisual?: string
): Promise<ChatResponse> {
  const res = await fetch(`${API_BASE}/chat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      message,
      conversation_id: conversationId,
      user_id: userId,
      preferred_visual: preferredVisual
    })
  });
  if (!res.ok) {
    throw new Error(`Chat API error: ${res.statusText}`);
  }
  return res.json();
}

export async function fetchUsers(): Promise<User[]> {
  const res = await fetch(`${API_BASE}/users`);
  return res.json();
}

export async function fetchAreas(): Promise<Area[]> {
  const res = await fetch(`${API_BASE}/areas`);
  return res.json();
}

export async function fetchWells(params?: { area_id?: string; well_type?: string; search?: string; limit?: number }): Promise<{ total: number; items: WellItem[] }> {
  const q = new URLSearchParams();
  if (params?.area_id) q.set('area_id', params.area_id);
  if (params?.well_type) q.set('well_type', params.well_type);
  if (params?.search) q.set('search', params.search);
  if (params?.limit) q.set('limit', params.limit.toString());
  
  const res = await fetch(`${API_BASE}/wells?${q.toString()}`);
  return res.json();
}

export async function fetchWellDetails(wellId: string): Promise<any> {
  const res = await fetch(`${API_BASE}/wells/${wellId}`);
  return res.json();
}

export async function fetchDowntimeAnalytics(areaId = 'NE-07', startDate = '2026-06-16', endDate = '2026-10-16'): Promise<any> {
  const res = await fetch(`${API_BASE}/analytics/downtime?area_id=${areaId}&start_date=${startDate}&end_date=${endDate}`);
  return res.json();
}

export async function fetchMaintenanceAnalytics(year = 2026): Promise<any> {
  const res = await fetch(`${API_BASE}/analytics/maintenance?year=${year}`);
  return res.json();
}

export async function fetchRcaRequirements(areaId = 'NE-07', equipmentKind = 'pump_jack'): Promise<any> {
  const res = await fetch(`${API_BASE}/analytics/rca-requirements?area_id=${areaId}&equipment_kind=${equipmentKind}`);
  return res.json();
}

export async function fetchSpills(areaId?: string, startDate?: string, endDate?: string): Promise<any> {
  const q = new URLSearchParams();
  if (areaId) q.set('area_id', areaId);
  if (startDate) q.set('start_date', startDate);
  if (endDate) q.set('end_date', endDate);
  const res = await fetch(`${API_BASE}/compliance/spills?${q.toString()}`);
  return res.json();
}

export async function fetchSpillHeatmap(year = 2026): Promise<any> {
  const res = await fetch(`${API_BASE}/compliance/heatmap?year=${year}`);
  return res.json();
}

export async function fetchCorrections(): Promise<any> {
  const res = await fetch(`${API_BASE}/corrections`);
  return res.json();
}

export async function proposeCorrection(data: any): Promise<any> {
  const res = await fetch(`${API_BASE}/corrections/propose`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  });
  return res.json();
}

export async function proposeTypeRule(data: any): Promise<any> {
  const res = await fetch(`${API_BASE}/corrections/type-rule`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  });
  return res.json();
}

export async function fetchSharedKnowledge(): Promise<any> {
  const res = await fetch(`${API_BASE}/knowledge`);
  return res.json();
}

export async function addSharedKnowledge(data: any): Promise<any> {
  const res = await fetch(`${API_BASE}/knowledge`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  });
  return res.json();
}

export async function fetchDocuments(query: string, docType?: string): Promise<any> {
  const q = new URLSearchParams({ q: query });
  if (docType) q.set('doc_type', docType);
  const res = await fetch(`${API_BASE}/documents/search?${q.toString()}`);
  return res.json();
}

export async function fetchIngestionRuns(): Promise<any> {
  const res = await fetch(`${API_BASE}/ingestion/runs`);
  return res.json();
}

export async function triggerIngestion(dataDir?: string): Promise<any> {
  const q = dataDir ? `?data_dir=${encodeURIComponent(dataDir)}` : '';
  const res = await fetch(`${API_BASE}/ingestion/run${q}`, { method: 'POST' });
  return res.json();
}

export async function fetchHealth(): Promise<any> {
  const res = await fetch(`${API_BASE}/health`);
  return res.json();
}
