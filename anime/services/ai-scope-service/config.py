# services/ai-scope-service/config.py
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    openai_api_key: str = ""
    model: str = "gpt-4o"
    # Fallback model when vision is not needed
    text_model: str = "gpt-4o-mini"

    # Base hourly rates per category in INR (used for pricing floor)
    base_rates: dict = {
        "Plumbing": 600,
        "Electrical": 500,
        "Carpentry": 500,
        "Caregiving": 400,
        "Cleaning": 450,
        "Appliance Repair": 600,
        "Painting": 550,
        "Other": 500,
    }

    # Difficulty multipliers
    difficulty_multipliers: dict = {
        "Standard": 1.0,
        "Complex": 1.5,
        "Emergency": 2.0,
    }

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore",
    )


settings = Settings()
