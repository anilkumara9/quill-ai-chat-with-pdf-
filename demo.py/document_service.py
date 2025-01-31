from app.models.document import Document

class DocumentService:
    def __init__(self, db_session):
        self.db = db_session
    
    def create_document(self, user_id, title, content):
        document = Document(user_id=user_id, title=title, content=content)
        self.db.add(document)
        self.db.commit()
        return document
    
    def get_user_documents(self, user_id):
        return self.db.query(Document).filter(Document.user_id == user_id).all()