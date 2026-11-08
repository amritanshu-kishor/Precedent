import json
from app.core.config import settings

class LLMService:
    """Uses Groq when configured; otherwise provides a deterministic demo fallback."""
    def __init__(self):
        self.client = None
        if settings.groq_api_key:
            try:
                from groq import Groq
                self.client = Groq(api_key=settings.groq_api_key)
            except Exception:
                self.client = None

    @property
    def available(self) -> bool:
        return self.client is not None

    def complete_json(self, system_prompt: str, user_payload: dict) -> dict:
        if not self.client:
            return {"_mode": "fallback", "_note": "GROQ_API_KEY is not configured; deterministic fallback used."}
        try:
            response = self.client.chat.completions.create(
                model=settings.groq_model,
                temperature=0.2,
                response_format={"type": "json_object"},
                messages=[{"role": "system", "content": system_prompt}, {"role": "user", "content": json.dumps(user_payload)}],
            )
            return json.loads(response.choices[0].message.content)
        except Exception as exc:
            return {"_mode": "fallback", "_note": f"Groq request failed ({type(exc).__name__}); deterministic fallback used."}
