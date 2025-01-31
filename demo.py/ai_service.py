import openai
from app.config import AI_API_KEY

class AIService:
    def __init__(self):
        openai.api_key = AI_API_KEY
    
    async def analyze_document(self, content):
        response = await openai.ChatCompletion.create(
            model="gpt-3.5-turbo",
            messages=[
                {"role": "system", "content": "Analyze the following document:"},
                {"role": "user", "content": content}
            ]
        )
        return response.choices[0].message.content