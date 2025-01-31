from fastapi import FastAPI, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database import SessionLocal
from services.auth_service import AuthService
from services.document_service import DocumentService
from services.ai_service import AIService

app = FastAPI()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

@app.post("/users/")
def create_user(email: str, password: str, username: str, db: Session = Depends(get_db)):
    auth_service = AuthService(db)
    return auth_service.create_user(email, password, username)

@app.post("/documents/")
def create_document(user_id: str, title: str, content: str, db: Session = Depends(get_db)):
    doc_service = DocumentService(db)
    return doc_service.create_document(user_id, title, content)

@app.get("/documents/{user_id}")
def get_user_documents(user_id: str, db: Session = Depends(get_db)):
    doc_service = DocumentService(db)
    return doc_service.get_user_documents(user_id)

@app.post("/analyze/")
async def analyze_document(content: str):
    ai_service = AIService()
    return await ai_service.analyze_document(content)