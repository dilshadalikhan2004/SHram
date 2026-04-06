from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime
import uuid


class EscrowAccount(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    job_id: str
    employer_id: str
    amount_paise: int
    platform_fee_paise: int
    net_to_worker_paise: int
    currency: str = "INR"
    # PENDING_DEPOSIT, ESCROWED, RELEASE_REQUESTED, PARTIALLY_RELEASED, RELEASED, DISPUTED, REFUNDED, CANCELLED
    status: str = "PENDING_DEPOSIT"
    razorpay_order_id: Optional[str] = None
    razorpay_payment_id: Optional[str] = None
    deposited_at: Optional[datetime] = None
    release_requested_at: Optional[datetime] = None
    released_at: Optional[datetime] = None
    auto_release_at: Optional[datetime] = None
    refunded_at: Optional[datetime] = None
    refund_reason: Optional[str] = None
    partial_release_pct: Optional[int] = None
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)


class TargetEscrowRelease(BaseModel):
    jobId: str
    action: str  # FULL_RELEASE, PARTIAL_PROPOSE
    partialPct: Optional[int] = None
    message: Optional[str] = None


class CreateEscrowRequest(BaseModel):
    jobId: str
    grossAmountPaise: int


class NoShowConfirmRequest(BaseModel):
    jobId: str
