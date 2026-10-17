from typing import Any, Optional, Literal
from pydantic import BaseModel, Field

# Visual Models
class Citation(BaseModel):
    source_id: str
    source_type: str # inspection, maintenance, repair_report, regulatory_event, note, manual, sop, rule, calculation
    asset_id: Optional[str] = None
    date: Optional[str] = None
    source_file: Optional[str] = None
    excerpt: Optional[str] = None
    field_values: Optional[dict[str, Any]] = None

class StatusCardData(BaseModel):
    asset_id: str
    name: Optional[str] = None
    well_type: str
    area_name: Optional[str] = None
    latest_inspection_id: str
    latest_inspected_at: str
    inspector_name: str
    method: str
    ambient_temp_c: float
    wellhead_temp_c: float
    temp_difference: float
    applicable_threshold_c: float
    is_producing: bool
    recorded_status: str
    recorded_status_out_of_date: bool = False
    reason: Optional[str] = None
    notes: Optional[str] = None
    citations: list[Citation] = []

class TableData(BaseModel):
    columns: list[dict[str, str]] # {"key": "asset_id", "label": "Well"}
    rows: list[dict[str, Any]]
    total_count: int
    title: Optional[str] = None

class LineChartData(BaseModel):
    title: str
    x_axis_key: str = "date"
    series: list[dict[str, Any]] # [{"key": "wellhead_temp_c", "name": "Wellhead Temp (°C)", "color": "#ef4444"}]
    data: list[dict[str, Any]]
    threshold: Optional[float] = None
    non_producing_dates: list[str] = []

class BarChartData(BaseModel):
    title: str
    x_axis_key: str = "asset_id"
    y_axis_key: str = "value"
    data: list[dict[str, Any]]
    unit: str = "days"

class MapPin(BaseModel):
    asset_id: str
    name: Optional[str] = None
    lat: float
    lon: float
    date: Optional[str] = None
    barrels: Optional[float] = None
    status: Optional[str] = None
    popup_text: Optional[str] = None

class MapData(BaseModel):
    title: str
    center_lat: float = 32.0
    center_lon: float = -102.3
    zoom: int = 10
    pins: list[MapPin] = []

class HeatmapData(BaseModel):
    title: str
    x_labels: list[str] # ["Jan", "Feb", ...]
    y_labels: list[str] # ["Southwest Block 23", ...]
    matrix: list[list[int]] # 2D array [row][col]
    row_totals: list[int]
    total: int

class VisualResponse(BaseModel):
    type: Literal["status_card", "table", "line_chart", "bar_chart", "map", "heatmap", "metric_card", "text"]
    data: Optional[dict[str, Any]] = None

# Chat Schemas
class ChatRequest(BaseModel):
    message: str
    conversation_id: Optional[str] = None
    user_id: str = "U-201" # Default Michael Turner
    preferred_visual: Optional[str] = None # status_card, table, line_chart, bar_chart, map, heatmap

class ChatResponse(BaseModel):
    conversation_id: str
    message: str
    visual: Optional[VisualResponse] = None
    citations: list[Citation] = []
    conflict_detected: bool = False
    conflict_details: Optional[str] = None
    follow_up_suggestions: list[str] = []

# Operational Rule & Correction Schemas
class CorrectionProposeRequest(BaseModel):
    target_table: str
    target_id: str
    target_field: str
    corrected_value: str
    author_user_id: str
    reason: str
    scope: str = "single_record"

class TypeRuleProposeRequest(BaseModel):
    well_type: str
    rule_name: str
    parameter_name: str
    parameter_value: str
    author_user_id: str
    reason: str

class SharedKnowledgeCreateRequest(BaseModel):
    asset_id: Optional[str] = None
    well_type_scope: Optional[str] = None
    statement: str
    author_user_id: str
    valid_from: Optional[str] = None
    valid_to: Optional[str] = None
