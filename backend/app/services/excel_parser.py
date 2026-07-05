import pandas as pd
import io
from typing import Dict, Any, Tuple

def parse_excel(file_content: bytes) -> Tuple[Dict[str, Any], Dict[str, Any]]:
    """
    Parses the uploaded Excel file using pandas.
    Returns a tuple of (metadata, data) where data is the extracted metrics.
    Raises exceptions for structural errors (wrong format, missing sheets).
    """
    try:
        # Load the workbook into memory
        excel_file = pd.ExcelFile(io.BytesIO(file_content))
    except Exception as e:
        raise ValueError("Invalid Excel file format. Please upload a valid .xlsx file.")
        
    required_sheets = ["Monthly Report", "Reference Data"]
    for sheet in required_sheets:
        if sheet not in excel_file.sheet_names:
            raise ValueError(f"Missing required sheet: '{sheet}'. Please use the provided template.")
            
    # 1. Extract Metadata from "Reference Data" (Hidden sheet)
    try:
        df_ref = pd.read_excel(excel_file, sheet_name="Reference Data", header=None)
        # Expected format: Col A (Keys), Col B (Values)
        metadata_dict = dict(zip(df_ref[0], df_ref[1]))
        
        metadata = {
            "template_version": metadata_dict.get("Template Version"),
            "plant_id": metadata_dict.get("Plant ID"),
            "month": int(metadata_dict.get("Month", 0)),
            "year": int(metadata_dict.get("Year", 0)),
            "checksum": metadata_dict.get("Checksum")
        }
    except Exception as e:
        raise ValueError("Template metadata is corrupted or missing. Please download a fresh template.")
        
    # 2. Extract Operational Data from "Monthly Report"
    try:
        # Data table starts at row 10, headers are "Metric", "Value", "Remarks"
        # Since pandas is 0-indexed, skip 9 rows
        df_report = pd.read_excel(excel_file, sheet_name="Monthly Report", skiprows=9)
        
        # We expect specific metrics in the "Metric" column
        # Filter for rows where Metric is not null
        df_report = df_report[df_report['Metric'].notna()]
        
        # Convert to dictionary mapping Metric string to Value
        raw_data = dict(zip(df_report['Metric'].str.strip(), df_report['Value']))
        
        # Clean the keys to match our internal schema mapping
        data = {
            "revenue": raw_data.get("Revenue (INR)"),
            "expenses": raw_data.get("Expenses (INR)"),
            "production_units": raw_data.get("Production Units"),
            "attendance_rate": raw_data.get("Attendance Rate (%)"),
            "safety_incidents": raw_data.get("Safety Incidents"),
            "quality_score": raw_data.get("Quality Score (%)")
        }
        
    except Exception as e:
        raise ValueError(f"Failed to parse data table. Please ensure the structural cells were not modified. Error: {str(e)}")
        
    return metadata, data
