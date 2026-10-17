import sys
import argparse
from pathlib import Path

# Add backend to sys.path
backend_dir = Path(__file__).resolve().parent.parent / "backend"
sys.path.insert(0, str(backend_dir))

from app.ingest import run_ingestion

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Ingest Asset Intelligence dataset")
    parser.add_argument("--data-dir", type=str, default=None, help="Path to sample-data directory")
    args = parser.parse_args()
    
    report = run_ingestion(data_dir=args.data_dir)
    print("\n--- INGESTION REPORT ---")
    print(f"Wells: {report.get('wells_count')}")
    print(f"Inspections: {report.get('inspections_count')}")
    print(f"Maintenance: {report.get('maintenance_count')}")
    print(f"Reports: {report.get('reports_count')}")
    print(f"Regulatory Events: {report.get('regulatory_events_count')}")
    print(f"Context Notes: {report.get('context_notes_count')}")
    print(f"Document Chunks: {report.get('document_chunks_count')}")
    print(f"Total Imported: {report.get('records_imported')}")
    print(f"Duplicates Skipped: {report.get('duplicates_skipped')}")
