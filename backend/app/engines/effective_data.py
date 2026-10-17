from sqlalchemy.orm import Session
from app.models import Correction, ContextNote, TypeOperationalRule, Inspection

class EffectiveDataLayer:
    def __init__(self, db: Session):
        self.db = db
        self.reload()

    def reload(self):
        # Load all accepted corrections
        self.corrections = self.db.query(Correction).filter(Correction.status == "accepted").all()
        # Map: (target_table, target_id, target_field) -> corrected_value
        self.corr_map = {
            (c.target_table, c.target_id, c.target_field): c.corrected_value
            for c in self.corrections
        }
        
        # Load all false-positive spill corrections from context notes
        # In the dataset, any ContextNote with note_type == 'correction' and an inspection_id
        # is a formal correction overriding that inspection's spill detection (e.g. rainwater, shadow, washout).
        false_spill_notes = self.db.query(ContextNote).filter(
            ContextNote.note_type == "correction",
            ContextNote.inspection_id.isnot(None)
        ).all()
        self.false_spill_inspection_ids = {n.inspection_id for n in false_spill_notes if n.inspection_id}

        # Load active operational type rules
        self.type_rules = self.db.query(TypeOperationalRule).filter(
            TypeOperationalRule.is_active == True
        ).all()

    def get_effective_inspection(self, insp: Inspection) -> dict:
        """
        Returns a dictionary representation of an inspection with accepted corrections applied.
        """
        iid = insp.inspection_id
        wellhead = float(insp.wellhead_temp_c)
        ambient = float(insp.ambient_temp_c)
        spill_detected = bool(insp.spill_detected)
        spill_vol = float(insp.spill_est_volume_bbl) if insp.spill_est_volume_bbl is not None else None
        
        # Apply wellhead temp correction
        if ("inspections", iid, "wellhead_temp_c") in self.corr_map:
            try:
                wellhead = float(self.corr_map[("inspections", iid, "wellhead_temp_c")])
            except ValueError:
                pass
                
        # Apply ambient temp correction
        if ("inspections", iid, "ambient_temp_c") in self.corr_map:
            try:
                ambient = float(self.corr_map[("inspections", iid, "ambient_temp_c")])
            except ValueError:
                pass

        # Apply false positive spill correction from notes or corrections table
        if iid in self.false_spill_inspection_ids:
            spill_detected = False
            spill_vol = 0.0
            
        if ("inspections", iid, "spill_detected") in self.corr_map:
            val = self.corr_map[("inspections", iid, "spill_detected")].lower()
            spill_detected = val in ["true", "1", "yes"]

        # Apply spill volume correction
        if ("inspections", iid, "spill_est_volume_bbl") in self.corr_map:
            try:
                spill_vol = float(self.corr_map[("inspections", iid, "spill_est_volume_bbl")])
                spill_detected = True
            except ValueError:
                pass

        return {
            "inspection_id": iid,
            "asset_id": insp.asset_id,
            "inspected_at": insp.inspected_at,
            "inspector_user_id": insp.inspector_user_id,
            "method": insp.method,
            "ambient_temp_c": ambient,
            "wellhead_temp_c": wellhead,
            "temp_diff": round(wellhead - ambient, 1),
            "spill_detected": spill_detected,
            "spill_area_pct": insp.spill_area_pct,
            "spill_est_volume_bbl": spill_vol,
            "notes": insp.notes,
            "has_corrections": (
                ("inspections", iid, "wellhead_temp_c") in self.corr_map or
                ("inspections", iid, "spill_est_volume_bbl") in self.corr_map or
                iid in self.false_spill_inspection_ids
            )
        }

    def get_rca_threshold(self, well_type: str, equipment_kind: str) -> tuple[int, bool, str]:
        """
        Returns (threshold, is_custom_rule, source_description)
        """
        for r in self.type_rules:
            if r.well_type == well_type and (
                r.parameter_name == f"{equipment_kind}_rca_threshold" or
                r.rule_name == "pump_jack_rca_repairs_threshold" or
                "rca" in r.rule_name.lower() or
                "rca" in r.parameter_name.lower()
            ):
                try:
                    val = int(r.parameter_value)
                    return (val, True, f"User-provided rule by author {r.author_user_id} ({r.reason or 'team policy'})")
                except ValueError:
                    pass
        # Default manual requirement: 3 corrective events in 12 months
        return (3, False, f"{well_type} Operating Manual §10 (3 corrective events in 12 months)")
