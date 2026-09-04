# services/ai-scope-service/models.py
# Pydantic request / response models — mirror of shared-types AIScopeEstimate

from typing import Literal, Optional
from pydantic import BaseModel, Field, field_validator


class ScopeRequest(BaseModel):
    description: str = Field(
        ...,
        min_length=10,
        max_length=1000,
        description="Customer's description of the household issue",
    )
    image_base64: Optional[str] = Field(
        None,
        description="Base64-encoded image of the problem (optional)",
    )
    service_category: Optional[str] = Field(
        None,
        description="Hint category — Plumbing, Electrical, etc.",
    )

    @field_validator("image_base64")
    @classmethod
    def strip_data_prefix(cls, v: Optional[str]) -> Optional[str]:
        """Strip 'data:image/...;base64,' prefix if present."""
        if v and v.startswith("data:"):
            v = v.split(",", 1)[-1]
        return v


class ScopeEstimate(BaseModel):
    standard_hours: float = Field(..., gt=0, description="Estimated job duration in hours")
    difficulty_tier: Literal["Standard", "Complex", "Emergency"]
    parts_estimate_inr: float = Field(..., ge=0, description="Estimated cost of parts/materials")
    recommended_base_price: float = Field(..., gt=0, description="Recommended total price in INR")
    confidence_score: float = Field(..., ge=0.0, le=1.0)
    notes: Optional[str] = Field(None, description="Brief explanation of the estimate")
    detected_category: Optional[str] = Field(None, description="Category inferred from description/image")


class HealthResponse(BaseModel):
    status: str
    model: str
    vision_enabled: bool
