from app import create_app, db
from app.models import Delivery, Material, Location

app = create_app()

with app.app_context():
    print("\n--- Checking Database ---")
    
    # Check Materials
    materials = Material.query.all()
    print(f"Total Materials found: {len(materials)}")
    for m in materials:
        print(f" - {m.name}")

    # Check Deliveries
    deliveries = Delivery.query.all()
    print(f"\nTotal Deliveries logged: {len(deliveries)}")
    for d in deliveries:
        print(f" - Delivery ID: {d.id} | Date: {d.date} | PO: {d.po_id}")
        
    print("-------------------------\n")