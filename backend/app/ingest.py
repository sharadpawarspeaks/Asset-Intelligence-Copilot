import os
import glob
import json
import re
import uuid
import datetime
from pathlib import Path
from sqlalchemy.orm import Session
from app.database import engine, SessionLocal, Base
from app.models import (
    Area, Team, User, Well, Equipment, Inspection, Maintenance,
    RegulatoryEvent, ContextNote, RepairReport, DocumentChunk, IngestionRun
)
from app.config import settings

def parse_markdown_report(report_path: Path, asset_id: str, maintenance_id: str = None) -> dict:
    if not report_path.exists():
        return {}
    
    content = report_path.read_text(encoding="utf-8")
    sections = {}
    current_sec = "header"
    sections[current_sec] = []
    
    for line in content.splitlines():
        if line.startswith("## "):
            current_sec = line[3:].strip().lower()
            sections[current_sec] = []
        else:
            sections[current_sec].append(line)
            
    parsed_sections = {k: "\n".join(v).strip() for k, v in sections.items()}
    
    # Extract containment hours
    containment_hours = None
    what_happened = parsed_sections.get("what happened", "")
    match = re.search(r'contained\s+(?:about\s+|in\s+)?([0-9.]+)\s*hours', what_happened, re.IGNORECASE)
    if not match:
        compliance_sec = parsed_sections.get("compliance check", "")
        match = re.search(r'contained\s+(?:about\s+|in\s+)?([0-9.]+)\s*hours', compliance_sec, re.IGNORECASE)
    if match:
        try:
            containment_hours = float(match.group(1))
        except ValueError:
            pass

    # Extract written date
    written_at = None
    header_text = parsed_sections.get("header", "")
    w_match = re.search(r'Report written:\s*([0-9-]+)', header_text)
    if w_match:
        written_at = w_match.group(1)
        
    return {
        "report_id": f"RPT-{report_path.stem}",
        "asset_id": asset_id,
        "maintenance_id": maintenance_id,
        "report_file": report_path.name,
        "written_at": written_at,
        "what_happened": parsed_sections.get("what happened"),
        "root_cause": parsed_sections.get("root cause"),
        "safety_steps": parsed_sections.get("safety and permits"),
        "work_done": parsed_sections.get("work done"),
        "testing": parsed_sections.get("testing and return to service"),
        "spill_cleanup": parsed_sections.get("spill clean-up and waste"),
        "containment_hours": containment_hours,
        "compliance_checks_json": parsed_sections.get("compliance check"),
        "notes_recommendations": parsed_sections.get("notes and recommendations"),
        "raw_markdown": content
    }

def chunk_document(doc_id: str, doc_type: str, title: str, source_path: str, content: str) -> list[dict]:
    chunks = []
    # Split by markdown headers
    sections = re.split(r'\n(?=##?\s+)', content)
    for idx, sec in enumerate(sections):
        sec_text = sec.strip()
        if not sec_text:
            continue
        first_line = sec_text.splitlines()[0].strip()
        section_name = first_line.lstrip("#").strip()
        chunk_id = f"{doc_id}-chunk-{idx}"
        chunks.append({
            "chunk_id": chunk_id,
            "doc_id": doc_id,
            "doc_type": doc_type,
            "title": title,
            "source_path": source_path,
            "section": section_name,
            "content": sec_text,
            "metadata_json": json.dumps({"doc_id": doc_id, "doc_type": doc_type, "section": section_name})
        })
    return chunks

def run_ingestion(data_dir: str = None) -> dict:
    if data_dir is None:
        data_dir = settings.DATASET_DIR
    
    data_path = Path(data_dir)
    if not data_path.exists():
        # Check fallback
        alt_path = Path(settings.BASE_DIR) / "sample-data"
        if (alt_path / "sample-data").exists():
            data_path = alt_path / "sample-data"
        elif (alt_path / "fleet").exists():
            data_path = alt_path

    print(f"[*] Starting ingestion from {data_path}...")
    Base.metadata.create_all(bind=engine)
    
    db: Session = SessionLocal()
    run_id = f"RUN-{datetime.datetime.utcnow().strftime('%Y%m%d%H%M%S')}"
    run_record = IngestionRun(
        run_id=run_id,
        started_at=datetime.datetime.utcnow(),
        status="in_progress"
    )
    db.add(run_record)
    db.commit()

    report = {
        "run_id": run_id,
        "data_dir": str(data_path),
        "files_discovered": 0,
        "records_imported": 0,
        "records_updated": 0,
        "duplicates_skipped": 0,
        "errors_count": 0,
        "wells_count": 0,
        "inspections_count": 0,
        "maintenance_count": 0,
        "reports_count": 0,
        "regulatory_events_count": 0,
        "context_notes_count": 0,
        "document_chunks_count": 0,
        "missing_reports": []
    }

    try:
        # 1. Ingest Fleet Areas & Teams
        areas_file = data_path / "fleet" / "areas.json"
        if areas_file.exists():
            report["files_discovered"] += 1
            areas_data = json.loads(areas_file.read_text(encoding="utf-8"))
            for t in areas_data.get("teams", []):
                existing_team = db.query(Team).filter_by(team_id=t["team_id"]).first()
                if not existing_team:
                    db.add(Team(team_id=t["team_id"], name=t["name"], lead_user_id=t.get("lead_user_id")))
                    report["records_imported"] += 1
            for a in areas_data.get("areas", []):
                existing_area = db.query(Area).filter_by(area_id=a["area_id"]).first()
                if not existing_area:
                    db.add(Area(
                        area_id=a["area_id"],
                        name=a["name"],
                        team_id=a.get("team_id"),
                        center_lat=a.get("center", {}).get("lat"),
                        center_lon=a.get("center", {}).get("lon")
                    ))
                    report["records_imported"] += 1
            db.commit()

        # 2. Ingest Users
        users_file = data_path / "fleet" / "users.json"
        if users_file.exists():
            report["files_discovered"] += 1
            users_data = json.loads(users_file.read_text(encoding="utf-8"))
            for u in users_data.get("users", []):
                existing_user = db.query(User).filter_by(user_id=u["user_id"]).first()
                if not existing_user:
                    db.add(User(
                        user_id=u["user_id"],
                        name=u["name"],
                        role=u["role"],
                        team_id=u.get("team_id")
                    ))
                    report["records_imported"] += 1
            db.commit()

        # 3. Ingest Fleet Manuals & SOPs
        doc_files = [
            ("fleet/well-types/T200.md", "manual", "T200 Operating Manual", "T200"),
            ("fleet/well-types/T350.md", "manual", "T350 Operating Manual", "T350"),
            ("fleet/sops/spill-response-sop.md", "sop", "Spill Response SOP", "SOP-SR"),
            ("fleet/sops/regulatory-compliance-sop.md", "sop", "Regulatory Compliance SOP", "SOP-RC"),
            ("fleet/sops/field-work-sop.md", "sop", "Field Work SOP", "SOP-WS"),
        ]
        for rel_path, doc_type, title, doc_id in doc_files:
            p = data_path / rel_path
            if p.exists():
                report["files_discovered"] += 1
                text = p.read_text(encoding="utf-8")
                chunks = chunk_document(doc_id, doc_type, title, str(p), text)
                for chunk in chunks:
                    existing = db.query(DocumentChunk).filter_by(chunk_id=chunk["chunk_id"]).first()
                    if not existing:
                        db.add(DocumentChunk(**chunk))
                        report["records_imported"] += 1
                        report["document_chunks_count"] += 1
        db.commit()

        # 4. Ingest Asset Directories
        asset_dirs = sorted(glob.glob(str(data_path / "assets" / "WELL-*")))
        report["wells_count"] = len(asset_dirs)

        inspections_batch = []
        maintenance_batch = []
        regulatory_batch = []
        context_batch = []
        reports_batch = []
        equipment_batch = []
        chunks_batch = []

        existing_inspection_ids = {r[0] for r in db.query(Inspection.inspection_id).all()}
        existing_maint_ids = {r[0] for r in db.query(Maintenance.maintenance_id).all()}
        existing_reg_ids = {r[0] for r in db.query(RegulatoryEvent.event_id).all()}
        existing_note_ids = {r[0] for r in db.query(ContextNote.note_id).all()}
        existing_report_ids = {r[0] for r in db.query(RepairReport.report_id).all()}

        for well_dir_str in asset_dirs:
            well_dir = Path(well_dir_str)
            wid = well_dir.name
            
            # Metadata
            meta_path = well_dir / "metadata.json"
            if meta_path.exists():
                report["files_discovered"] += 1
                meta = json.loads(meta_path.read_text(encoding="utf-8"))
                existing_well = db.query(Well).filter_by(asset_id=wid).first()
                if not existing_well:
                    db.add(Well(
                        asset_id=wid,
                        name=meta.get("name", wid),
                        asset_category=meta.get("asset_category", "oil_well"),
                        well_type=meta.get("well_type", "T200"),
                        area_id=meta.get("area_id"),
                        team_id=meta.get("team_id"),
                        in_charge_user_id=meta.get("in_charge_user_id"),
                        lat=meta.get("location", {}).get("lat"),
                        lon=meta.get("location", {}).get("lon"),
                        installed_on=meta.get("installed_on"),
                        recorded_status=meta.get("recorded_status"),
                        last_inspection_id=meta.get("last_inspection", {}).get("inspection_id"),
                        last_inspected_at=meta.get("last_inspection", {}).get("inspected_at"),
                        last_inspector_user_id=meta.get("last_inspection", {}).get("inspector_user_id")
                    ))
                    report["records_imported"] += 1
                    
                    for eq in meta.get("equipment", []):
                        equipment_batch.append(Equipment(
                            equipment_id=eq["equipment_id"],
                            asset_id=wid,
                            kind=eq.get("kind"),
                            model=eq.get("model")
                        ))

            # Inspections
            insp_path = well_dir / "inspections.jsonl"
            if insp_path.exists():
                report["files_discovered"] += 1
                with open(insp_path, "r", encoding="utf-8") as f:
                    for line in f:
                        if not line.strip():
                            continue
                        item = json.loads(line)
                        iid = item["inspection_id"]
                        if iid not in existing_inspection_ids:
                            inspections_batch.append(Inspection(
                                inspection_id=iid,
                                asset_id=wid,
                                inspected_at=item["inspected_at"],
                                inspector_user_id=item.get("inspector_user_id"),
                                method=item.get("method"),
                                ambient_temp_c=float(item["ambient_temp_c"]),
                                wellhead_temp_c=float(item["wellhead_temp_c"]),
                                spill_detected=bool(item.get("spill_detected", False)),
                                spill_area_pct=float(item["spill_area_pct"]) if item.get("spill_area_pct") is not None else None,
                                spill_est_volume_bbl=float(item["spill_est_volume_bbl"]) if item.get("spill_est_volume_bbl") is not None else None,
                                evidence_images_json=json.dumps(item.get("evidence_images", [])),
                                notes=item.get("notes")
                            ))
                            existing_inspection_ids.add(iid)
                            report["inspections_count"] += 1
                            report["records_imported"] += 1
                        else:
                            report["duplicates_skipped"] += 1

            # Maintenance
            maint_path = well_dir / "maintenance.jsonl"
            if maint_path.exists():
                report["files_discovered"] += 1
                with open(maint_path, "r", encoding="utf-8") as f:
                    for line in f:
                        if not line.strip():
                            continue
                        item = json.loads(line)
                        mid = item["maintenance_id"]
                        if mid not in existing_maint_ids:
                            cost = item.get("cost_usd", {})
                            rep_file = item.get("report_file")
                            maintenance_batch.append(Maintenance(
                                maintenance_id=mid,
                                asset_id=wid,
                                started_at=item["started_at"],
                                completed_at=item.get("completed_at"),
                                maintenance_type=item.get("maintenance_type", "corrective"),
                                equipment_kind=item.get("equipment_kind"),
                                issue=item.get("issue"),
                                action_taken=item.get("action_taken"),
                                technician_user_id=item.get("technician_user_id"),
                                contractor=item.get("contractor"),
                                downtime_hours=float(item.get("downtime_hours", 0.0)),
                                cost_labor=float(cost.get("labor", 0.0)),
                                cost_parts=float(cost.get("parts", 0.0)),
                                cost_total=float(cost.get("total", 0.0)),
                                triggered_by_inspection_id=item.get("triggered_by_inspection_id"),
                                report_file=rep_file
                            ))
                            existing_maint_ids.add(mid)
                            report["maintenance_count"] += 1
                            report["records_imported"] += 1
                            
                            # Parse markdown report if referenced
                            if rep_file:
                                full_rep_path = well_dir / rep_file
                                if not full_rep_path.exists():
                                    full_rep_path = well_dir / "maintenance-reports" / Path(rep_file).name
                                if full_rep_path.exists():
                                    parsed = parse_markdown_report(full_rep_path, wid, mid)
                                    rid = parsed.get("report_id")
                                    if rid and rid not in existing_report_ids:
                                        reports_batch.append(RepairReport(**parsed))
                                        existing_report_ids.add(rid)
                                        report["reports_count"] += 1
                                        report["records_imported"] += 1
                                        # Index report for RAG
                                        rep_chunks = chunk_document(rid, "repair_report", f"Report {mid} for {wid}", str(full_rep_path), parsed["raw_markdown"])
                                        chunks_batch.extend([DocumentChunk(**rc) for rc in rep_chunks])
                                else:
                                    report["missing_reports"].append(f"{wid}: {rep_file}")
                        else:
                            report["duplicates_skipped"] += 1

            # Regulatory events
            reg_path = well_dir / "regulatory-events.jsonl"
            if reg_path.exists():
                report["files_discovered"] += 1
                with open(reg_path, "r", encoding="utf-8") as f:
                    for line in f:
                        if not line.strip():
                            continue
                        item = json.loads(line)
                        eid = item["event_id"]
                        if eid not in existing_reg_ids:
                            regulatory_batch.append(RegulatoryEvent(
                                event_id=eid,
                                asset_id=wid,
                                date=item["date"],
                                agency=item.get("agency"),
                                event_type=item["event_type"],
                                protocol_id=item.get("protocol_id"),
                                related_inspection_id=item.get("related_inspection_id"),
                                hours_to_report=float(item["hours_to_report"]) if item.get("hours_to_report") is not None else None,
                                detail=item.get("detail"),
                                fine_usd=float(item.get("fine_usd", 0.0)),
                                status=item.get("status", "open")
                            ))
                            existing_reg_ids.add(eid)
                            report["regulatory_events_count"] += 1
                            report["records_imported"] += 1
                        else:
                            report["duplicates_skipped"] += 1

            # Context notes
            ctx_path = well_dir / "context.jsonl"
            if ctx_path.exists():
                report["files_discovered"] += 1
                with open(ctx_path, "r", encoding="utf-8") as f:
                    for line in f:
                        if not line.strip():
                            continue
                        item = json.loads(line)
                        nid = item["note_id"]
                        if nid not in existing_note_ids:
                            context_batch.append(ContextNote(
                                note_id=nid,
                                asset_id=wid,
                                created_at=item["created_at"],
                                author_user_id=item.get("author_user_id"),
                                note_type=item["note_type"],
                                inspection_id=item.get("inspection_id"),
                                text=item["text"],
                                valid_from=item.get("valid_from"),
                                valid_to=item.get("valid_to"),
                                is_unconfirmed=bool(item.get("is_unconfirmed", False))
                            ))
                            existing_note_ids.add(nid)
                            report["context_notes_count"] += 1
                            report["records_imported"] += 1
                        else:
                            report["duplicates_skipped"] += 1

        # Bulk save batches
        if equipment_batch:
            db.bulk_save_objects(equipment_batch)
        if inspections_batch:
            db.bulk_save_objects(inspections_batch)
        if maintenance_batch:
            db.bulk_save_objects(maintenance_batch)
        if reports_batch:
            db.bulk_save_objects(reports_batch)
        if regulatory_batch:
            db.bulk_save_objects(regulatory_batch)
        if context_batch:
            db.bulk_save_objects(context_batch)
        if chunks_batch:
            db.bulk_save_objects(chunks_batch)
            report["document_chunks_count"] += len(chunks_batch)

        db.commit()

        run_record.completed_at = datetime.datetime.utcnow()
        run_record.status = "completed"
        run_record.files_discovered = report["files_discovered"]
        run_record.records_imported = report["records_imported"]
        run_record.duplicates_skipped = report["duplicates_skipped"]
        run_record.errors_count = report["errors_count"]
        run_record.summary_json = json.dumps(report)
        db.commit()

    except Exception as e:
        db.rollback()
        run_record.completed_at = datetime.datetime.utcnow()
        run_record.status = "failed"
        run_record.errors_count += 1
        db.commit()
        report["status"] = "failed"
        report["error"] = str(e)
        raise e
    finally:
        db.close()

    print(f"[+] Ingestion completed successfully: {report['records_imported']} records imported across {report['wells_count']} wells.")
    return report
