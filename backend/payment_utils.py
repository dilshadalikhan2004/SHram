import os
import logging
from datetime import datetime, timedelta
from typing import List, Dict, Any

logger = logging.getLogger(__name__)

def get_env_int(key: str, default: int) -> int:
    val = os.environ.get(key)
    if not val:
        return default
    try:
        return int(val)
    except ValueError:
        logger.warning(f"Environment variable {key} has invalid value '{val}'. Using default: {default}")
        return default

PLATFORM_FEE_PCT = float(os.environ.get("PLATFORM_FEE_PCT", 7.5))
TDS_THRESHOLD_PAISE = get_env_int("TDS_THRESHOLD_PAISE", 10_000_000)
TDS_RATE_WITH_PAN = float(os.environ.get("TDS_RATE_WITH_PAN", 1.0))
TDS_RATE_WITHOUT_PAN = float(os.environ.get("TDS_RATE_WITHOUT_PAN", 20.0))
SOS_CREDIT_PAISE = get_env_int("SOS_CREDIT_AMOUNT_PAISE", 50_000)
AUTO_RELEASE_HOURS = get_env_int("ESCROW_AUTO_RELEASE_HOURS", 48)

def calculate_escrow_breakdown(gross_amount_paise: int) -> Dict[str, int]:
    """All paise calculations — never use floats for money."""
    platform_fee_paise = round(gross_amount_paise * (PLATFORM_FEE_PCT / 100))
    net_to_worker_paise = gross_amount_paise - platform_fee_paise
    return {
        "gross_amount_paise": gross_amount_paise,
        "platform_fee_paise": platform_fee_paise,
        "net_to_worker_paise": net_to_worker_paise
    }

def calculate_tds(
    payment_paise: int,
    cumulative_earned_paise: int,
    has_pan: bool
) -> Dict[str, Any]:
    """Compute TDS for a given worker earning this payment."""
    new_total = cumulative_earned_paise + payment_paise
    crosses_threshold = new_total >= TDS_THRESHOLD_PAISE and cumulative_earned_paise < TDS_THRESHOLD_PAISE
    already_over_threshold = cumulative_earned_paise >= TDS_THRESHOLD_PAISE

    if not crosses_threshold and not already_over_threshold:
        return {"tds_paise": 0, "tds_rate": 0.0, "crosses_threshold": False}

    rate = TDS_RATE_WITH_PAN if has_pan else TDS_RATE_WITHOUT_PAN
    
    # TDS only on the portion above threshold
    taxable_paise = payment_paise if already_over_threshold else (new_total - TDS_THRESHOLD_PAISE)
    tds_paise = round(taxable_paise * (rate / 100))

    return {"tds_paise": tds_paise, "tds_rate": rate, "crosses_threshold": crosses_threshold}

def calculate_squad_splits(
    net_amount_paise: int,
    members: List[Dict[str, Any]]
) -> List[Dict[str, Any]]:
    """Compute squad splits. Remainder (paise) goes to squad leader."""
    splits = []
    distributed = 0
    leader_id = None
    
    for m in members:
        amt = int(net_amount_paise * (m.get("split_pct", 0) / 100))
        distributed += amt
        splits.append({"id": m["id"], "amount_paise": amt})
        if m.get("is_leader"):
            leader_id = m["id"]
            
    remainder = net_amount_paise - distributed
    if leader_id and remainder > 0:
        for s in splits:
            if s["id"] == leader_id:
                s["amount_paise"] += remainder
                break
                
    return splits

def format_inr(paise: int) -> str:
    """Format paise to ₹ string"""
    # Simple formatting in Python
    rupees = paise / 100
    return f"₹{rupees:,.2f}".replace(".00", "")

def auto_release_at(from_time: datetime = None) -> datetime:
    """Auto-release timestamp"""
    if from_time is None:
        from_time = datetime.utcnow()
    return from_time + timedelta(hours=AUTO_RELEASE_HOURS)
