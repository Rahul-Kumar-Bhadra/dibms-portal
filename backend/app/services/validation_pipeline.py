from typing import Dict, Any, List
from app.schemas import ValidationReport, ValidationIssue
import math

def is_nan(val):
    if val is None:
        return True
    try:
        return math.isnan(float(val))
    except:
        return False

def validate_excel_data(file_name: str, metadata: Dict[str, Any], data: Dict[str, Any], expected_plant_id: str) -> ValidationReport:
    """
    Multi-layer validation pipeline for parsed Excel data.
    """
    errors: List[ValidationIssue] = []
    warnings: List[ValidationIssue] = []
    
    # --- Layer 1 & 2: Structural/Metadata Validation ---
    if metadata.get("plant_id") != expected_plant_id:
        errors.append(ValidationIssue(
            column="Plant ID",
            value=str(metadata.get("plant_id")),
            rule="Uploaded template belongs to a different plant. Please use your own template."
        ))
        
    if not metadata.get("month") or not metadata.get("year"):
        errors.append(ValidationIssue(
            column="Reporting Period",
            rule="Missing month or year in template metadata."
        ))
        
    # Validation helper
    def check_field(field_key: str, display_name: str, is_required: bool, min_val=None, max_val=None, val_type=float):
        val = data.get(field_key)
        
        # Missing check
        if is_nan(val):
            if is_required:
                errors.append(ValidationIssue(column=display_name, value="Missing", rule=f"{display_name} is required."))
            return None
            
        # Type check
        try:
            parsed_val = val_type(val)
        except ValueError:
            errors.append(ValidationIssue(column=display_name, value=str(val), rule=f"{display_name} must be a number."))
            return None
            
        # Range check
        if min_val is not None and parsed_val < min_val:
            errors.append(ValidationIssue(column=display_name, value=str(parsed_val), rule=f"{display_name} cannot be less than {min_val}."))
            
        if max_val is not None and parsed_val > max_val:
            errors.append(ValidationIssue(column=display_name, value=str(parsed_val), rule=f"{display_name} cannot be greater than {max_val}."))
            
        # Update raw data with parsed type
        data[field_key] = parsed_val
        return parsed_val
        
    # --- Layer 3 & 4: Type and Requirement Validation ---
    revenue = check_field("revenue", "Revenue (INR)", True, min_val=0)
    expenses = check_field("expenses", "Expenses (INR)", True, min_val=0)
    check_field("production_units", "Production Units", True, min_val=0, val_type=int)
    att_rate = check_field("attendance_rate", "Attendance Rate (%)", True, min_val=0, max_val=100)
    check_field("safety_incidents", "Safety Incidents", False, min_val=0, val_type=int)
    qual_score = check_field("quality_score", "Quality Score (%)", True, min_val=0, max_val=100)
    
    # Default safety incidents to 0 if missing
    if is_nan(data.get("safety_incidents")):
        data["safety_incidents"] = 0
        
    # --- Layer 5: Business Rules ---
    if revenue is not None and expenses is not None:
        if expenses > revenue:
            warnings.append(ValidationIssue(
                column="Financials", 
                value=f"Rev: {revenue}, Exp: {expenses}", 
                rule="Expenses exceed revenue. Ensure this is correct."
            ))
            
    if att_rate is not None and att_rate < 50:
        warnings.append(ValidationIssue(
            column="Attendance Rate (%)",
            value=str(att_rate),
            rule="Attendance rate is critically low (<50%)."
        ))
        
    if qual_score is not None and qual_score < 70:
        warnings.append(ValidationIssue(
            column="Quality Score (%)",
            value=str(qual_score),
            rule="Quality score is critically low (<70%)."
        ))
        
    # Final status determination
    status = "FAILED" if errors else "WARNINGS" if warnings else "SUCCESS"
    
    # Calculate a rough validation score for logging
    total_checks = 8 # rough metric
    score = max(0, 100 - (len(errors) * (100/total_checks)) - (len(warnings) * 5))
    if status == "SUCCESS":
        score = 100.0
        
    # Construct preview data
    preview = None
    if status != "FAILED":
        preview = {
            "year": metadata.get("year"),
            "month": metadata.get("month"),
            "revenue": data.get("revenue"),
            "expenses": data.get("expenses"),
            "production_units": data.get("production_units"),
            "attendance_rate": data.get("attendance_rate"),
            "safety_incidents": data.get("safety_incidents"),
            "quality_score": data.get("quality_score"),
        }
    
    return ValidationReport(
        status=status,
        file_name=file_name,
        total_errors=len(errors),
        total_warnings=len(warnings),
        errors=errors,
        warnings=warnings,
        parsed_data=preview
    ), score
