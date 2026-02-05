"""API endpoints for Kerala real-time market prices."""
from fastapi import APIRouter, Depends, Query
from typing import Optional
import logging

from services.market_prices import (
    fetch_kerala_market_prices,
    get_kerala_districts,
    get_commodities
)

router = APIRouter()
logger = logging.getLogger(__name__)


@router.get("/market-prices")
def get_market_prices(
    district: Optional[str] = Query(None, description="Kerala district name"),
    commodity: Optional[str] = Query(None, description="Commodity/product name")
):
    """
    Get real-time agricultural market prices for Kerala from government data sources.
    No authentication required - public market data.
    
    Query Parameters:
    - district: Filter by Kerala district (optional)
    - commodity: Filter by commodity/product (optional)
    
    Returns:
    - prices: List of price records with district, commodity, min/max/modal prices
    - districts: List of available Kerala districts
    - commodities: List of common commodities
    """
    try:
        prices = fetch_kerala_market_prices(district=district, commodity=commodity)
        
        return {
            "prices": prices,
            "districts": get_kerala_districts(),
            "commodities": get_commodities(),
            "count": len(prices),
            "filters": {
                "district": district,
                "commodity": commodity
            }
        }
    except Exception as e:
        logger.error(f"Error in get_market_prices: {e}", exc_info=True)
        # Return empty data structure on error
        return {
            "prices": [],
            "districts": get_kerala_districts(),
            "commodities": get_commodities(),
            "count": 0,
            "filters": {
                "district": district,
                "commodity": commodity
            },
            "error": str(e)
        }
