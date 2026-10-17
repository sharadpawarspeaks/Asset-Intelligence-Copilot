export interface Citation {
  source_id: string;
  source_type: string;
  asset_id?: string;
  date?: string;
  source_file?: string;
  excerpt?: string;
  field_values?: Record<string, any>;
}

export interface StatusCardData {
  asset_id: string;
  name?: string;
  well_type: string;
  area_name?: string;
  latest_inspection_id: string;
  latest_inspected_at: string;
  inspector_name: string;
  method: string;
  ambient_temp_c: number;
  wellhead_temp_c: number;
  temp_difference: number;
  applicable_threshold_c: number;
  is_producing: boolean;
  recorded_status: string;
  recorded_status_out_of_date: boolean;
  reason?: string;
  notes?: string;
  citations: Citation[];
}

export interface TableColumn {
  key: string;
  label: string;
}

export interface TableData {
  title?: string;
  columns: TableColumn[];
  rows: Record<string, any>[];
  total_count: number;
}

export interface LineChartSeries {
  key: string;
  name: string;
  color: string;
}

export interface LineChartData {
  title: string;
  x_axis_key: string;
  series: LineChartSeries[];
  data: Record<string, any>[];
  threshold?: number;
  non_producing_dates?: string[];
}

export interface BarChartData {
  title: string;
  x_axis_key: string;
  y_axis_key: string;
  data: Record<string, any>[];
  unit?: string;
}

export interface MapPin {
  asset_id: string;
  name?: string;
  lat: number;
  lon: number;
  date?: string;
  barrels?: number;
  status?: string;
  popup_text?: string;
}

export interface MapData {
  title: string;
  center_lat: number;
  center_lon: number;
  zoom: number;
  pins: MapPin[];
}

export interface HeatmapData {
  title: string;
  x_labels: string[];
  y_labels: string[];
  matrix: number[][];
  row_totals: number[];
  total: number;
}

export interface VisualResponse {
  type: 'status_card' | 'table' | 'line_chart' | 'bar_chart' | 'map' | 'heatmap' | 'metric_card' | 'text';
  data?: any;
}

export interface ChatResponse {
  conversation_id: string;
  message: string;
  visual?: VisualResponse;
  citations: Citation[];
  conflict_detected?: boolean;
  conflict_details?: string;
  follow_up_suggestions?: string[];
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  visual?: VisualResponse;
  citations?: Citation[];
  conflict_detected?: boolean;
  conflict_details?: string;
  timestamp: string;
}

export interface User {
  user_id: string;
  name: string;
  role: string;
  team_id?: string;
}

export interface Area {
  area_id: string;
  name: string;
  team_id?: string;
  center_lat?: number;
  center_lon?: number;
}

export interface WellItem {
  asset_id: string;
  name: string;
  well_type: string;
  area_id: string;
  team_id?: string;
  lat?: number;
  lon?: number;
  installed_on?: string;
  recorded_status?: string;
  is_producing: boolean;
  temp_difference?: number;
  recorded_status_out_of_date?: boolean;
}
