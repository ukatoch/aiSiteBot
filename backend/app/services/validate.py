from fastapi import HTTPException
from app.models import Domain
from sqlalchemy.orm import Session

class ValidationService:
    def __init__(self):
        pass  # Add any initialization logic here if needed

def validate_bot(bot_id: str, hostname: str, db: Session):
    """
    Validates the bot ID and hostname against the database.
    """
    if not bot_id or not hostname:
        raise HTTPException(status_code=400, detail="Bot ID and hostname are required")

    # Check if this bot_id is registered for this hostname
    # We allow variations like 'localhost' and '127.0.0.1' for development
    # In production, this would be an exact match
    domain = db.query(Domain).filter(
        Domain.bot_id == bot_id,
        Domain.hostname == hostname
    ).first()

    if not domain:
        # Development override: allow certain test hostnames for any valid bot-xxx ID
        if hostname in ['localhost', '127.0.0.1'] and bot_id.startswith('bot-'):
            return True
            
        raise HTTPException(status_code=403, detail=f"Unauthorized hostname '{hostname}' for this bot")
    
    return True
    


validation = ValidationService()