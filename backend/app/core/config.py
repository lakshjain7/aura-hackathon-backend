from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    TWILIO_ACCOUNT_SID: str = "placeholder_twilio_sid"
    TWILIO_AUTH_TOKEN: str = "placeholder_twilio_auth_token"
    TWILIO_WHATSAPP_NUMBER: str = "whatsapp:+14155238886"
    DISCORD_BOT_TOKEN: str = "placeholder_discord_token"
    
    # LangGraph or AI settings
    OPENAI_API_KEY: str = "placeholder_openai_key"
    SARVAM_API_KEY: str = "placeholder_sarvam_key"
    
    # Infrastructure & Maps
    DATABASE_URL: str = "sqlite+aiosqlite:///./aura.db"
    REDIS_URL: str = "redis://localhost:6379"
    GOOGLE_MAPS_API_KEY: str = "placeholder_gmaps_key"

    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"

settings = Settings()
