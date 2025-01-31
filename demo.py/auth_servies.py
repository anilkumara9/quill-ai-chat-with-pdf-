from app.models.user import User
from passlib.context import CryptContext
import jwt
from datetime import datetime, timedelta

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

class AuthService:
    def __init__(self, db_session):
        self.db = db_session
        
    def create_user(self, email, password, username):
        hashed_password = pwd_context.hash(password)
        user = User(email=email, password_hash=hashed_password, username=username)
        self.db.add(user)
        self.db.commit()
        return user
        
    def authenticate_user(self, email, password):
        user = self.db.query(User).filter(User.email == email).first()
        if not user or not pwd_context.verify(password, user.password_hash):
            return None
        return user