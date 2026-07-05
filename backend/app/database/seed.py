import random
from datetime import datetime, timedelta, timezone
from sqlalchemy.orm import Session
from app.models import Plant, User, Employee, OperationsReport, PlantDocument, Notification, AuditLog
from app.core.security import get_password_hash

def seed_db(db: Session):
    # Check if database is already seeded by checking if plants exist
    if db.query(Plant).first() is not None:
        print("Database already seeded.")
        return

    print("Seeding database with manufacturing operations data...")

    # 1. Create Plants
    plants_data = [
        {"id": "PL001", "name": "Pune Plant", "state": "Maharashtra", "location": "Pune", "region": "West", "contact_email": "manager.pune@dana-demo.com", "contact_phone": "+91 20 6601 2345"},
        {"id": "PL002", "name": "Chennai Plant", "state": "Tamil Nadu", "location": "Chennai", "region": "South", "contact_email": "manager.chennai@dana-demo.com", "contact_phone": "+91 44 2446 6789"},
        {"id": "PL003", "name": "Bengaluru Plant", "state": "Karnataka", "location": "Bengaluru", "region": "South", "contact_email": "manager.bengaluru@dana-demo.com", "contact_phone": "+91 80 4123 5678"},
        {"id": "PL004", "name": "Gurugram Plant", "state": "Haryana", "location": "Gurugram", "region": "North", "contact_email": "manager.gurugram@dana-demo.com", "contact_phone": "+91 124 400 5000"},
        {"id": "PL005", "name": "Kolkata Plant", "state": "West Bengal", "location": "Kolkata", "region": "East", "contact_email": "manager.kolkata@dana-demo.com", "contact_phone": "+91 33 2288 9900"},
        {"id": "PL006", "name": "Jamshedpur Plant", "state": "Jharkhand", "location": "Jamshedpur", "region": "East", "contact_email": "manager.jamshedpur@dana-demo.com", "contact_phone": "+91 657 223 4567"},
        {"id": "PL007", "name": "Hyderabad Plant", "state": "Telangana", "location": "Hyderabad", "region": "South", "contact_email": "manager.hyderabad@dana-demo.com", "contact_phone": "+91 40 2300 4000"},
        {"id": "PL008", "name": "Ahmedabad Plant", "state": "Gujarat", "location": "Ahmedabad", "region": "West", "contact_email": "manager.ahmedabad@dana-demo.com", "contact_phone": "+91 79 2656 1234"},
    ]

    plants = []
    for p_data in plants_data:
        plant = Plant(**p_data)
        db.add(plant)
        plants.append(plant)
    
    db.commit()
    print(f"Seeded {len(plants)} plants.")

    # 2. Create Users
    # Enterprise Admin
    admin_user = User(
        email="admin@dana-demo.com",
        hashed_password=get_password_hash("Admin@123"),
        role="Enterprise Admin",
        first_name="Rajesh",
        last_name="Kumar",
        plant_id=None
    )
    db.add(admin_user)

    # Plant Managers
    managers = []
    for plant in plants:
        city_lower = plant.location.lower()
        manager_email = f"manager.{city_lower}@dana-demo.com"
        manager_pwd = "Manager@123"
        
        manager = User(
            email=manager_email,
            hashed_password=get_password_hash(manager_pwd),
            role="Plant Manager",
            first_name=f"{plant.location} Plant Manager",
            last_name="DMEOP",
            plant_id=plant.id
        )
        db.add(manager)
        managers.append(manager)

    db.commit()
    print("Seeded Users (Enterprise Admin and Plant Managers).")

    # 3. Create Workforce
    departments = [
        "Assembly & Machining",
        "Quality Assurance (QA)",
        "Logistics & Supply Chain",
        "Plant Engineering",
        "EH&S (Safety)"
    ]
    designations = {
        "Assembly & Machining": ["Machinist", "Assembly Technician", "Production Supervisor"],
        "Quality Assurance (QA)": ["QA Inspector", "QA Lead", "Quality Auditor"],
        "Logistics & Supply Chain": ["Logistics Coordinator", "Warehouse Specialist", "Dispatcher"],
        "Plant Engineering": ["Plant Director", "Maintenance Technician", "Automation Engineer"],
        "EH&S (Safety)": ["EHS Specialist", "Safety Inspector"]
    }

    first_names = ["Arjun", "Neha", "Rohan", "Sneha", "Aditya", "Priya", "Vikram", "Anjali", "Sanjay", "Kiran", "Amit", "Ritu", "Deepak", "Shalini", "Vivek", "Preeti"]
    last_names = ["Sharma", "Patel", "Verma", "Rao", "Joshi", "Nair", "Singh", "Gupta", "Das", "Reddy", "Mehta", "Mishra", "Choudhury", "Bose", "Pillai", "Kulkarni"]

    workforce_seeded = 0
    now_dt = datetime.now()
    for plant in plants:
        num_employees = random.randint(10, 20)
        for _ in range(num_employees):
            dept = random.choice(departments)
            desg = random.choice(designations[dept])
            f_name = random.choice(first_names)
            l_name = random.choice(last_names)
            email = f"{f_name.lower()}.{l_name.lower()}@{plant.id.lower()}-dana.com"
            
            joining_days_ago = random.randint(30, 1000)
            joining_date = now_dt - timedelta(days=joining_days_ago)

            employee = Employee(
                plant_id=plant.id,
                first_name=f_name,
                last_name=l_name,
                email=email,
                department=dept,
                designation=desg,
                status="active" if random.random() > 0.1 else "inactive",
                joining_date=joining_date
            )
            db.add(employee)
            workforce_seeded += 1
            
    db.commit()
    print(f"Seeded {workforce_seeded} workforce personnel across all plants.")

    # 4. Create Operations Reports (Last 6 Months)
    months_to_seed = []
    temp_date = now_dt.replace(day=1)
    for _ in range(6):
        temp_date = temp_date - timedelta(days=1)
        months_to_seed.append((temp_date.year, temp_date.month))
    months_to_seed.reverse()
    
    reports_seeded = 0
    for year, month in months_to_seed:
        for plant in plants:
            multiplier = 1.0 + (int(plant.id[-1]) * 0.1)
            
            base_rev = 8000000 * multiplier
            revenue = round(base_rev + random.uniform(-1000000, 1000000), 2)
            expenses = round(revenue * random.uniform(0.65, 0.78), 2)
            
            production_units = int((15000 * multiplier) + random.randint(-2000, 2000))
            attendance_rate = round(random.uniform(88.5, 98.2), 2)
            safety_incidents = 0 if random.random() > 0.08 else random.randint(1, 2)
            quality_score = round(random.uniform(92.0, 99.5), 1)
            
            plant_manager = db.query(User).filter(User.plant_id == plant.id).first()
            submitted_by_id = plant_manager.id if plant_manager else None
            
            if month == 12:
                next_month = 1
                next_year = year + 1
            else:
                next_month = month + 1
                next_year = year
            submitted_at = datetime(next_year, next_month, 5, 10, 0) + timedelta(days=random.randint(0, 3))
            
            report = OperationsReport(
                plant_id=plant.id,
                year=year,
                month=month,
                revenue=revenue,
                expenses=expenses,
                production_units=production_units,
                attendance_rate=attendance_rate,
                safety_incidents=safety_incidents,
                quality_score=quality_score,
                remarks=f"Operational metrics within expected manufacturing targets for {plant.name}.",
                status="Approved",
                submitted_by=submitted_by_id,
                submitted_at=submitted_at
            )
            db.add(report)
            reports_seeded += 1

    db.commit()
    print(f"Seeded {reports_seeded} monthly operations reports.")

    # 5. Create Plant Technical & Quality Documents
    doc_types = [
        {"name": "Q1_EHS_Safety_Compliance.pdf", "category": "EH&S Compliance", "type": "PDF", "size": 1524300},
        {"name": f"Machinery_Calibration_Schedule_{now_dt.year}.xlsx", "category": "Equipment Calibration", "type": "Excel", "size": 420500},
        {"name": "Plant_Floor_Layout.png", "category": "SOP", "type": "Image", "size": 3120400},
        {"name": "ISO_9001_Quality_Certificate.pdf", "category": "SOP", "type": "PDF", "size": 2400300}
    ]

    docs_seeded = 0
    for plant in plants:
        num_docs = random.randint(1, 2)
        selected_docs = random.sample(doc_types, num_docs)
        
        plant_manager = db.query(User).filter(User.plant_id == plant.id).first()
        uploader_id = plant_manager.id if plant_manager else None
        
        for doc_info in selected_docs:
            doc = PlantDocument(
                plant_id=plant.id,
                file_name=doc_info["name"],
                file_path=f"uploads/{plant.id}/{doc_info['name']}",
                file_type=doc_info["type"],
                file_size=doc_info["size"],
                category=doc_info["category"],
                uploaded_by=uploader_id,
                uploaded_at=now_dt - timedelta(days=random.randint(2, 30))
            )
            db.add(doc)
            docs_seeded += 1

    db.commit()
    print(f"Seeded {docs_seeded} plant document records.")

    # 6. Create Notifications
    prev_completed_month_name = (now_dt.replace(day=1) - timedelta(days=1)).strftime("%B %Y")
    pending_notif_message = f"Monthly operations report for {prev_completed_month_name} is due for submission."

    notifications_data = [
        {"title": "Welcome to DMEOP Platform", "message": "Dana Manufacturing Enterprise Operations Platform is now active.", "type": "announcement", "plant_id": None},
        {"title": "Pending Operations Submission", "message": pending_notif_message, "type": "alert", "plant_id": None},
        {"title": "EHS Directives Issued", "message": "All plants must verify EHS safety compliance logs and ISO certificates.", "type": "announcement", "plant_id": None},
    ]

    for notif in notifications_data:
        db.add(Notification(**notif))
        
    for plant in plants[:3]:
        db.add(Notification(
            title=f"EHS Plant Audit Scheduled - {plant.name}",
            message="Internal audit team will visit next week. Please keep calibration schedules ready.",
            type="info",
            plant_id=plant.id
        ))

    db.commit()
    print("Seeded plant notifications.")

    # 7. Create Audit Logs
    audit_actions = [
        ("Login", "User logged in successfully"),
        ("View Dashboard", "Accessed main enterprise dashboard panel"),
        ("Export Data", "Downloaded aggregated Excel spreadsheet operations data"),
    ]
    
    for action, details in audit_actions:
        db.add(AuditLog(
            user_id=admin_user.id,
            action=action,
            details=details,
            created_at=now_dt - timedelta(hours=random.randint(1, 24))
        ))
        
    db.commit()
    print("Seeded basic audit logs.")
    print("Database seeding completed successfully!")
