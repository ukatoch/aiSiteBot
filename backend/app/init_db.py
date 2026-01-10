from app.core.database import engine, SessionLocal
from app.models import Base, User, Domain, Metric
from app.core.security import get_password_hash

def init_db():
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()
    
    # Check if admin user exists
    admin = db.query(User).filter(User.email == "admin@example.com").first()
    if not admin:
        hashed_password = get_password_hash("admin123")
        admin = User(
            email="admin@example.com", 
            username="admin",
            hashed_password=hashed_password,
            is_superuser=True
        )
        db.add(admin)
        db.commit()
        db.refresh(admin)
        
        # Add a default domain for the admin
        domain = Domain(hostname="localhost", bot_id="bot-default", owner_id=admin.id)
        db.add(domain)
        db.commit()
        db.refresh(domain)
        
        # Add metrics for the domain
        metric = Metric(domain_id=domain.id, chats_count=10, sources_count=5)
        db.add(metric)
        db.commit()
        
        print("Database initialized and default admin user created.")
    else:
        print("Database already initialized.")
    db.close()

if __name__ == "__main__":
    init_db()
