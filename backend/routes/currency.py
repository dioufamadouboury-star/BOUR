"""
Currency conversion module for YAMA+
Supports: XOF (FCFA), EUR, USD
"""
from fastapi import APIRouter, Query
from pydantic import BaseModel
from typing import Optional
import httpx
import asyncio
from datetime import datetime, timedelta

router = APIRouter(prefix="/api/currency", tags=["Currency"])

# Cache for exchange rates (refresh every 6 hours)
RATES_CACHE = {
    "rates": None,
    "last_updated": None
}

# Fallback rates (if API fails)
FALLBACK_RATES = {
    "XOF": 1,
    "EUR": 0.00152,  # 1 XOF = 0.00152 EUR
    "USD": 0.00165,  # 1 XOF = 0.00165 USD
}

# Base currency is XOF (FCFA)
BASE_CURRENCY = "XOF"

class ConversionRequest(BaseModel):
    amount: float
    from_currency: str = "XOF"
    to_currency: str = "EUR"

class ConversionResponse(BaseModel):
    original_amount: float
    converted_amount: float
    from_currency: str
    to_currency: str
    rate: float
    timestamp: str

async def fetch_exchange_rates():
    """Fetch latest exchange rates from API"""
    try:
        # Using exchangerate-api (free tier)
        async with httpx.AsyncClient() as client:
            response = await client.get(
                "https://api.exchangerate-api.com/v4/latest/XOF",
                timeout=10.0
            )
            if response.status_code == 200:
                data = response.json()
                return {
                    "XOF": 1,
                    "EUR": data["rates"].get("EUR", FALLBACK_RATES["EUR"]),
                    "USD": data["rates"].get("USD", FALLBACK_RATES["USD"]),
                }
    except Exception as e:
        print(f"Exchange rate fetch error: {e}")
    
    return FALLBACK_RATES

async def get_rates():
    """Get cached rates or fetch new ones"""
    now = datetime.now()
    
    # Check if cache is valid (less than 6 hours old)
    if RATES_CACHE["rates"] and RATES_CACHE["last_updated"]:
        if now - RATES_CACHE["last_updated"] < timedelta(hours=6):
            return RATES_CACHE["rates"]
    
    # Fetch new rates
    rates = await fetch_exchange_rates()
    RATES_CACHE["rates"] = rates
    RATES_CACHE["last_updated"] = now
    
    return rates

@router.get("/rates")
async def get_exchange_rates():
    """Get current exchange rates"""
    rates = await get_rates()
    return {
        "base": BASE_CURRENCY,
        "rates": rates,
        "currencies": [
            {"code": "XOF", "name": "Franc CFA", "symbol": "FCFA", "flag": "🇸🇳"},
            {"code": "EUR", "name": "Euro", "symbol": "€", "flag": "🇪🇺"},
            {"code": "USD", "name": "Dollar US", "symbol": "$", "flag": "🇺🇸"},
        ],
        "last_updated": RATES_CACHE["last_updated"].isoformat() if RATES_CACHE["last_updated"] else None
    }

@router.post("/convert")
async def convert_currency(request: ConversionRequest):
    """Convert amount between currencies"""
    rates = await get_rates()
    
    from_rate = rates.get(request.from_currency.upper(), 1)
    to_rate = rates.get(request.to_currency.upper(), 1)
    
    # Convert to XOF first, then to target currency
    if request.from_currency.upper() == "XOF":
        converted = request.amount * to_rate
    else:
        # Convert to XOF then to target
        xof_amount = request.amount / from_rate
        converted = xof_amount * to_rate
    
    return ConversionResponse(
        original_amount=request.amount,
        converted_amount=round(converted, 2),
        from_currency=request.from_currency.upper(),
        to_currency=request.to_currency.upper(),
        rate=round(to_rate / from_rate, 6) if from_rate else 0,
        timestamp=datetime.now().isoformat()
    )

@router.get("/format/{amount}")
async def format_price(
    amount: float,
    currency: str = Query("XOF", description="Currency code")
):
    """Format price in specified currency"""
    rates = await get_rates()
    
    currency = currency.upper()
    rate = rates.get(currency, 1)
    
    if currency == "XOF":
        converted = amount
        formatted = f"{int(converted):,}".replace(",", " ") + " FCFA"
    elif currency == "EUR":
        converted = amount * rate
        formatted = f"{converted:,.2f}".replace(",", " ") + " €"
    elif currency == "USD":
        converted = amount * rate
        formatted = f"${converted:,.2f}".replace(",", " ")
    else:
        converted = amount
        formatted = f"{int(converted):,} {currency}"
    
    return {
        "original": amount,
        "converted": round(converted, 2),
        "formatted": formatted,
        "currency": currency
    }
