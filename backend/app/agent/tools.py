import json
import datetime
from sqlalchemy.orm import Session
from app.models import Well, Area, Inspection, Maintenance, ContextNote, Correction, TypeOperationalRule, User, RepairReport
from app.engines.production_engine import calculate_well_status
from app.engines.downtime_engine import calculate_well_downtime, get_area_top_downtime_wells
from app.engines.compliance_engine import calculate_spill_records, analyze_well_compliance
from app.engines.maintenance_engine import calculate_well_repair_costs, find_wells_requiring_rca
from app.engines.memory_engine import MemoryEngine
from app.engines.effective_data import EffectiveDataLayer
from app.rag.retriever import DocumentRetriever
from app.schemas import Citation

class AgentTools:
    def __init__(self, db: Session, user_id: str = "U-201"):
        self.db = db
        self.user_id = user_id
        self.memory = MemoryEngine(db)
        self.retriever = DocumentRetriever(db)
        self.eff_layer = EffectiveDataLayer(db)

    def calculate_production_status(self, well_id: str) -> dict:
        card = calculate_well_status(well_id, self.db)
        if not card:
            return {"error": f"Well {well_id} not found."}
        return card.model_dump()

    def get_non_producing_wells_in_area(self, area_name_or_id: str) -> list[dict]:
        area = self.db.query(Area).filter((Area.area_id == area_name_or_id) | (Area.name == area_name_or_id)).first()
        if not area:
            return []
        wells = self.db.query(Well).filter(Well.area_id == area.area_id).all()
        results = []
        for w in wells:
            card = calculate_well_status(w.asset_id, self.db)
            if card and not card.is_producing:
                results.append(card.model_dump())
        return results

    def get_temperature_history(self, well_id: str, weeks: int = 13) -> dict:
        well = self.db.query(Well).filter(Well.asset_id == well_id).first()
        if not well:
            return {"error": f"Well {well_id} not found"}
            
        threshold = 20.0 if well.well_type == "T350" else 15.0
        inspections = self.db.query(Inspection).filter(
            Inspection.asset_id == well_id
        ).order_by(Inspection.inspected_at.desc()).limit(weeks).all()
        
        inspections = sorted(inspections, key=lambda x: x.inspected_at)
        series_data = []
        non_producing_dates = []
        citations = []
        
        for raw in inspections:
            eff = self.eff_layer.get_effective_inspection(raw)
            date_str = eff["inspected_at"][:10]
            diff = eff["temp_diff"]
            is_prod = diff >= threshold
            if not is_prod:
                non_producing_dates.append(date_str)
                
            series_data.append({
                "date": date_str,
                "wellhead_temp_c": eff["wellhead_temp_c"],
                "ambient_temp_c": eff["ambient_temp_c"],
                "temp_diff": diff,
                "is_producing": is_prod
            })
            citations.append(Citation(
                source_id=eff["inspection_id"],
                source_type="inspection",
                asset_id=well_id,
                date=eff["inspected_at"],
                excerpt=f"{date_str}: Wellhead {eff['wellhead_temp_c']} °C, Ambient {eff['ambient_temp_c']} °C, Diff {diff} °C"
            ))
            
        return {
            "well_id": well_id,
            "well_type": well.well_type,
            "threshold": threshold,
            "series": series_data,
            "non_producing_dates": non_producing_dates,
            "citations": [c.model_dump() for c in citations]
        }

    def calculate_downtime(self, well_id: str, start_date: str, end_date: str) -> dict:
        return calculate_well_downtime(well_id, start_date, end_date, self.db)

    def get_top_downtime_wells_in_area(self, area_name_or_id: str, start_date: str = "2026-06-16", end_date: str = "2026-10-16", limit: int = 3) -> list[dict]:
        area = self.db.query(Area).filter((Area.area_id == area_name_or_id) | (Area.name == area_name_or_id)).first()
        if not area:
            return []
        return get_area_top_downtime_wells(area.area_id, start_date, end_date, limit, self.db)

    def get_spills_report(self, well_id: str = None, area_name_or_id: str = None, start_date: str = "2022-10-20", end_date: str = "2026-10-16") -> dict:
        area_id = None
        if area_name_or_id:
            area = self.db.query(Area).filter((Area.area_id == area_name_or_id) | (Area.name == area_name_or_id)).first()
            if area:
                area_id = area.area_id
                
        spills = calculate_spill_records(asset_id=well_id, area_id=area_id, start_date=start_date, end_date=end_date, db=self.db)
        total_bbl = round(sum(s["spill_est_volume_bbl"] for s in spills), 1)
        
        # Add well coordinates
        for s in spills:
            w = self.db.query(Well).filter(Well.asset_id == s["asset_id"]).first()
            if w:
                s["lat"] = w.lat
                s["lon"] = w.lon
                s["well_name"] = w.name
                
        return {
            "spill_count": len(spills),
            "total_barrels": total_bbl,
            "spills": spills
        }

    def get_spill_heatmap_data(self, year: int = 2026) -> dict:
        areas = self.db.query(Area).all()
        order_map = {"SW-23": 0, "SW-24": 1, "NE-07": 2, "NE-08": 3}
        ordered_areas = sorted(areas, key=lambda a: order_map.get(a.area_id, 99))
        area_labels = [a.name for a in ordered_areas]
        months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct"]
        
        matrix = []
        row_totals = []
        overall_total = 0
        
        for a in ordered_areas:
            row = [0] * len(months)
            spills = calculate_spill_records(area_id=a.area_id, start_date=f"{year}-01-01", end_date=f"{year}-10-16", db=self.db)
            for s in spills:
                m_idx = int(s["date"][5:7]) - 1
                if 0 <= m_idx < len(months):
                    row[m_idx] += 1
            matrix.append(row)
            rt = sum(row)
            row_totals.append(rt)
            overall_total += rt
            
        return {
            "x_labels": months,
            "y_labels": area_labels,
            "matrix": matrix,
            "row_totals": row_totals,
            "total": overall_total
        }

    def analyze_compliance(self, well_id: str) -> dict:
        return analyze_well_compliance(well_id, self.db)

    def get_containment_limit_exceeded_spills(self, area_name_or_id: str = "Southwest Block 24", days: int = 90) -> list[dict]:
        area = self.db.query(Area).filter((Area.area_id == area_name_or_id) | (Area.name == area_name_or_id)).first()
        if not area:
            return []
        start_date = "2026-07-18" # 90 days before 2026-10-16
        end_date = "2026-10-16"
        
        spills = calculate_spill_records(area_id=area.area_id, start_date=start_date, end_date=end_date, db=self.db)
        exceeded = []
        
        for s in spills:
            iid = s["inspection_id"]
            wid = s["asset_id"]
            # Look up repair report
            maint = self.db.query(Maintenance).filter(
                Maintenance.asset_id == wid,
                Maintenance.triggered_by_inspection_id == iid
            ).first()
            if maint and maint.report_file:
                rep = self.db.query(RepairReport).filter(
                    RepairReport.asset_id == wid,
                    RepairReport.maintenance_id == maint.maintenance_id
                ).first()
                if rep and rep.containment_hours and rep.containment_hours > 4.0:
                    exceeded.append({
                        "asset_id": wid,
                        "date": s["date"],
                        "inspection_id": iid,
                        "maintenance_id": maint.maintenance_id,
                        "report_file": rep.report_file,
                        "report_id": rep.report_id,
                        "containment_hours": rep.containment_hours,
                        "barrels": s["spill_est_volume_bbl"],
                        "sop_limit_hours": 4.0
                    })
        return exceeded

    def calculate_repairs_for_wells(self, well_ids: list[str], year: int = 2026) -> dict:
        return calculate_well_repair_costs(well_ids, year=year, db=self.db)

    def find_rca_required_wells(self, area_name_or_id: str = "Northeast Block 7", equipment_kind: str = "pump_jack") -> list[dict]:
        return find_wells_requiring_rca(area_name_or_id, equipment_kind=equipment_kind, db=self.db)

    def propose_data_correction(self, target_table: str, target_id: str, target_field: str, corrected_value: str, reason: str, author_user_id: str = None) -> dict:
        user_id = author_user_id or self.user_id
        corr_id = f"CORR-{target_id}-{target_field}"
        
        # Check original value
        orig_val = None
        conflict_notes = []
        if target_table == "inspections":
            insp = self.db.query(Inspection).filter(Inspection.inspection_id == target_id).first()
            if insp:
                orig_val = str(getattr(insp, target_field, ""))
                if insp.notes:
                    conflict_notes.append(f"Inspector noted: \"{insp.notes}\" (Inspector: {insp.inspector_user_id})")
                    
        # Check if already exists, else insert
        existing = self.db.query(Correction).filter(Correction.correction_id == corr_id).first()
        if existing:
            existing.corrected_value = corrected_value
            existing.reason = reason
            existing.author_user_id = user_id
            existing.status = "accepted"
        else:
            new_corr = Correction(
                correction_id=corr_id,
                target_table=target_table,
                target_id=target_id,
                target_field=target_field,
                original_value=orig_val,
                corrected_value=corrected_value,
                author_user_id=user_id,
                created_at=datetime.datetime.utcnow().isoformat(),
                reason=reason,
                scope="single_record",
                status="accepted",
                conflict_detected=len(conflict_notes) > 0,
                conflict_notes="\n".join(conflict_notes)
            )
            self.db.add(new_corr)
        self.db.commit()
        self.eff_layer.reload()
        
        return {
            "status": "accepted",
            "correction_id": corr_id,
            "original_value": orig_val,
            "corrected_value": corrected_value,
            "conflict_detected": len(conflict_notes) > 0,
            "conflict_notes": conflict_notes
        }

    def propose_type_rule(self, well_type: str, rule_name: str, parameter_value: str, reason: str, author_user_id: str = None) -> dict:
        user_id = author_user_id or self.user_id
        rule_id = f"RULE-{well_type}-{rule_name}"
        existing = self.db.query(TypeOperationalRule).filter(TypeOperationalRule.rule_id == rule_id).first()
        if existing:
            existing.parameter_value = parameter_value
            existing.reason = reason
            existing.author_user_id = user_id
            existing.is_active = True
        else:
            new_r = TypeOperationalRule(
                rule_id=rule_id,
                well_type=well_type,
                rule_name=rule_name,
                parameter_name=rule_name,
                parameter_value=parameter_value,
                author_user_id=user_id,
                created_at=datetime.datetime.utcnow().isoformat(),
                reason=reason,
                is_active=True
            )
            self.db.add(new_r)
        self.db.commit()
        self.eff_layer.reload()
        return {
            "rule_id": rule_id,
            "well_type": well_type,
            "parameter_value": parameter_value,
            "status": "active"
        }
