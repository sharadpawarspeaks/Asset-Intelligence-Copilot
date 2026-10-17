import datetime
from sqlalchemy import (
    Column, String, Integer, Float, Boolean, DateTime, Text, ForeignKey, Index
)
from sqlalchemy.orm import relationship
from app.database import Base

class Area(Base):
    __tablename__ = "areas"
    
    area_id = Column(String(50), primary_key=True)
    name = Column(String(100), nullable=False)
    team_id = Column(String(50), nullable=True)
    center_lat = Column(Float, nullable=True)
    center_lon = Column(Float, nullable=True)
    
    wells = relationship("Well", back_populates="area")

class Team(Base):
    __tablename__ = "teams"
    
    team_id = Column(String(50), primary_key=True)
    name = Column(String(100), nullable=False)
    lead_user_id = Column(String(50), nullable=True)
    
    users = relationship("User", back_populates="team")

class User(Base):
    __tablename__ = "users"
    
    user_id = Column(String(50), primary_key=True)
    name = Column(String(100), nullable=False)
    role = Column(String(50), nullable=False)
    team_id = Column(String(50), ForeignKey("teams.team_id"), nullable=True)
    
    team = relationship("Team", back_populates="users")
    conversations = relationship("Conversation", back_populates="user")

class Well(Base):
    __tablename__ = "wells"
    
    asset_id = Column(String(50), primary_key=True)
    name = Column(String(100), nullable=False)
    asset_category = Column(String(50), default="oil_well")
    well_type = Column(String(20), nullable=False) # T200 or T350
    area_id = Column(String(50), ForeignKey("areas.area_id"), nullable=True)
    team_id = Column(String(50), nullable=True)
    in_charge_user_id = Column(String(50), nullable=True)
    lat = Column(Float, nullable=True)
    lon = Column(Float, nullable=True)
    installed_on = Column(String(30), nullable=True)
    recorded_status = Column(String(50), nullable=True) # active, down
    last_inspection_id = Column(String(50), nullable=True)
    last_inspected_at = Column(String(50), nullable=True)
    last_inspector_user_id = Column(String(50), nullable=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    
    area = relationship("Area", back_populates="wells")
    equipment = relationship("Equipment", back_populates="well")
    inspections = relationship("Inspection", back_populates="well")
    maintenance_records = relationship("Maintenance", back_populates="well")
    regulatory_events = relationship("RegulatoryEvent", back_populates="well")
    context_notes = relationship("ContextNote", back_populates="well")

class Equipment(Base):
    __tablename__ = "equipment"
    
    equipment_id = Column(String(100), primary_key=True)
    asset_id = Column(String(50), ForeignKey("wells.asset_id"), nullable=False)
    kind = Column(String(50), nullable=False) # wellhead, pump_jack, rod_string, etc.
    model = Column(String(100), nullable=True)
    
    well = relationship("Well", back_populates="equipment")

class Inspection(Base):
    __tablename__ = "inspections"
    
    inspection_id = Column(String(50), primary_key=True)
    asset_id = Column(String(50), ForeignKey("wells.asset_id"), nullable=False, index=True)
    inspected_at = Column(String(50), nullable=False, index=True)
    inspector_user_id = Column(String(50), nullable=True)
    method = Column(String(30), nullable=True) # drone, manual
    ambient_temp_c = Column(Float, nullable=False)
    wellhead_temp_c = Column(Float, nullable=False)
    spill_detected = Column(Boolean, default=False, index=True)
    spill_area_pct = Column(Float, nullable=True)
    spill_est_volume_bbl = Column(Float, nullable=True)
    evidence_images_json = Column(Text, nullable=True)
    notes = Column(Text, nullable=True)
    
    well = relationship("Well", back_populates="inspections")

class Maintenance(Base):
    __tablename__ = "maintenance"
    
    maintenance_id = Column(String(50), primary_key=True)
    asset_id = Column(String(50), ForeignKey("wells.asset_id"), nullable=False, index=True)
    started_at = Column(String(50), nullable=False, index=True)
    completed_at = Column(String(50), nullable=True)
    maintenance_type = Column(String(50), nullable=False, index=True) # scheduled, corrective
    equipment_kind = Column(String(50), nullable=False, index=True)
    issue = Column(Text, nullable=True)
    action_taken = Column(Text, nullable=True)
    technician_user_id = Column(String(50), nullable=True)
    contractor = Column(String(100), nullable=True)
    downtime_hours = Column(Float, default=0.0)
    cost_labor = Column(Float, default=0.0)
    cost_parts = Column(Float, default=0.0)
    cost_total = Column(Float, default=0.0)
    triggered_by_inspection_id = Column(String(50), nullable=True, index=True)
    report_file = Column(String(255), nullable=True)
    
    well = relationship("Well", back_populates="maintenance_records")

class RegulatoryEvent(Base):
    __tablename__ = "regulatory_events"
    
    event_id = Column(String(50), primary_key=True)
    asset_id = Column(String(50), ForeignKey("wells.asset_id"), nullable=False, index=True)
    date = Column(String(30), nullable=False, index=True)
    agency = Column(String(100), nullable=True)
    event_type = Column(String(100), nullable=False, index=True)
    protocol_id = Column(String(50), nullable=True)
    related_inspection_id = Column(String(50), nullable=True, index=True)
    hours_to_report = Column(Float, nullable=True)
    detail = Column(Text, nullable=True)
    fine_usd = Column(Float, default=0.0)
    status = Column(String(50), default="open") # open, closed
    
    well = relationship("Well", back_populates="regulatory_events")

class ContextNote(Base):
    __tablename__ = "context_notes"
    
    note_id = Column(String(50), primary_key=True)
    asset_id = Column(String(50), ForeignKey("wells.asset_id"), nullable=False, index=True)
    created_at = Column(String(50), nullable=False)
    author_user_id = Column(String(50), nullable=True)
    note_type = Column(String(50), nullable=False) # operator_feedback, operator_note, correction
    inspection_id = Column(String(50), nullable=True, index=True)
    text = Column(Text, nullable=False)
    valid_from = Column(String(50), nullable=True)
    valid_to = Column(String(50), nullable=True)
    is_unconfirmed = Column(Boolean, default=False)
    
    well = relationship("Well", back_populates="context_notes")

class RepairReport(Base):
    __tablename__ = "repair_reports"
    
    report_id = Column(String(100), primary_key=True)
    asset_id = Column(String(50), nullable=False, index=True)
    maintenance_id = Column(String(50), nullable=True, index=True)
    report_file = Column(String(255), nullable=False)
    written_at = Column(String(50), nullable=True)
    crew_lead_user_id = Column(String(50), nullable=True)
    what_happened = Column(Text, nullable=True)
    root_cause = Column(Text, nullable=True)
    safety_steps = Column(Text, nullable=True)
    work_done = Column(Text, nullable=True)
    testing = Column(Text, nullable=True)
    spill_cleanup = Column(Text, nullable=True)
    containment_hours = Column(Float, nullable=True)
    parts_cost_detail_json = Column(Text, nullable=True)
    compliance_checks_json = Column(Text, nullable=True)
    notes_recommendations = Column(Text, nullable=True)
    raw_markdown = Column(Text, nullable=True)

class DocumentChunk(Base):
    __tablename__ = "document_chunks"
    
    chunk_id = Column(String(100), primary_key=True)
    doc_id = Column(String(100), nullable=False, index=True)
    doc_type = Column(String(50), nullable=False, index=True) # manual, sop, report, note
    title = Column(String(200), nullable=True)
    source_path = Column(String(255), nullable=False)
    section = Column(String(100), nullable=True)
    content = Column(Text, nullable=False)
    metadata_json = Column(Text, nullable=True)
    embedding_json = Column(Text, nullable=True)

class Conversation(Base):
    __tablename__ = "conversations"
    
    conversation_id = Column(String(50), primary_key=True)
    user_id = Column(String(50), ForeignKey("users.user_id"), nullable=False, index=True)
    title = Column(String(200), nullable=False)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.datetime.utcnow, onupdate=datetime.datetime.utcnow)
    
    user = relationship("User", back_populates="conversations")
    messages = relationship("ConversationMessage", back_populates="conversation", cascade="all, delete-orphan")

class ConversationMessage(Base):
    __tablename__ = "conversation_messages"
    
    message_id = Column(String(50), primary_key=True)
    conversation_id = Column(String(50), ForeignKey("conversations.conversation_id"), nullable=False, index=True)
    sender_role = Column(String(20), nullable=False) # user, assistant, system
    content = Column(Text, nullable=False)
    visual_type = Column(String(50), nullable=True) # status_card, table, line_chart, bar_chart, map, heatmap, text
    visual_data_json = Column(Text, nullable=True)
    citations_json = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    
    conversation = relationship("Conversation", back_populates="messages")

class ConversationWellReference(Base):
    __tablename__ = "conversation_well_references"
    
    id = Column(Integer, primary_key=True, autoincrement=True)
    conversation_id = Column(String(50), nullable=False, index=True)
    user_id = Column(String(50), nullable=False, index=True)
    asset_id = Column(String(50), nullable=False, index=True)
    referenced_at = Column(DateTime, default=datetime.datetime.utcnow)

class SharedKnowledge(Base):
    __tablename__ = "shared_knowledge"
    
    id = Column(Integer, primary_key=True, autoincrement=True)
    asset_id = Column(String(50), nullable=True, index=True)
    well_type_scope = Column(String(20), nullable=True)
    statement = Column(Text, nullable=False)
    author_user_id = Column(String(50), nullable=False)
    created_at = Column(String(50), nullable=False)
    valid_from = Column(String(50), nullable=True)
    valid_to = Column(String(50), nullable=True)
    status = Column(String(50), default="active") # active, superseded, expired
    evidence_json = Column(Text, nullable=True)

class Correction(Base):
    __tablename__ = "corrections"
    
    correction_id = Column(String(50), primary_key=True)
    target_table = Column(String(50), nullable=False) # inspections, maintenance, etc.
    target_id = Column(String(50), nullable=False, index=True) # e.g. INS-0164-0205
    target_field = Column(String(50), nullable=False) # wellhead_temp_c, spill_est_volume_bbl
    original_value = Column(String(100), nullable=True)
    corrected_value = Column(String(100), nullable=False)
    author_user_id = Column(String(50), nullable=False)
    created_at = Column(String(50), nullable=False)
    reason = Column(Text, nullable=True)
    scope = Column(String(50), default="single_record") # single_record, well_type, fleet
    status = Column(String(50), default="accepted") # proposed, accepted, rejected, disputed
    conflict_detected = Column(Boolean, default=False)
    conflict_notes = Column(Text, nullable=True)
    review_comment = Column(Text, nullable=True)

class TypeOperationalRule(Base):
    __tablename__ = "type_operational_rules"
    
    rule_id = Column(String(50), primary_key=True)
    well_type = Column(String(20), nullable=False, index=True) # T200, T350
    rule_name = Column(String(100), nullable=False) # e.g. pump_jack_rca_repairs_threshold
    parameter_name = Column(String(50), nullable=False)
    parameter_value = Column(String(100), nullable=False) # e.g. "2"
    author_user_id = Column(String(50), nullable=False)
    created_at = Column(String(50), nullable=False)
    reason = Column(Text, nullable=True)
    is_active = Column(Boolean, default=True)

class IngestionRun(Base):
    __tablename__ = "ingestion_runs"
    
    run_id = Column(String(50), primary_key=True)
    started_at = Column(DateTime, default=datetime.datetime.utcnow)
    completed_at = Column(DateTime, nullable=True)
    status = Column(String(30), default="in_progress") # in_progress, completed, failed
    files_discovered = Column(Integer, default=0)
    records_imported = Column(Integer, default=0)
    records_updated = Column(Integer, default=0)
    duplicates_skipped = Column(Integer, default=0)
    errors_count = Column(Integer, default=0)
    summary_json = Column(Text, nullable=True)

Index("idx_insp_asset_date", Inspection.asset_id, Inspection.inspected_at)
Index("idx_maint_asset_type", Maintenance.asset_id, Maintenance.maintenance_type, Maintenance.equipment_kind)
Index("idx_corr_target", Correction.target_table, Correction.target_id, Correction.status)
Index("idx_docchunk_type_doc", DocumentChunk.doc_type, DocumentChunk.doc_id)
