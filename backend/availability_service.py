from datetime import datetime
from typing import List, Dict, Any, Optional

from fastapi import FastAPI, HTTPException, Query
from pydantic import BaseModel

from camply.containers import SearchWindow
from camply.search.search_recreationdotgov import SearchRecreationDotGov
from camply.search.search_usedirect import (
    SearchReserveCalifornia,
    SearchAlabamaStateParks,
    SearchArizonaStateParks,
    SearchFloridaStateParks,
    SearchMinnesotaStateParks,
    SearchMissouriStateParks,
    SearchOhioStateParks,
    SearchVirginiaStateParks,
    SearchNorthernTerritory,
    SearchFairfaxCountyParks,
    SearchMaricopaCountyParks,
    SearchOregonMetro,
)

app = FastAPI(title="LastMinuteCamps Availability API")


# ---------------------------------------------------------------------------
# Response / schema models
# ---------------------------------------------------------------------------

class AvailabilityResponse(BaseModel):
    provider: str
    provider_label: str
    campground_id: str
    available_sites: List[Dict[str, Any]]
    total_available: int
    search_window: Dict[str, str]


class ProviderInfo(BaseModel):
    key: str
    label: str
    family: str
    description: Optional[str] = None


# ---------------------------------------------------------------------------
# Provider registry
#  - Single place to add / manage supported providers
# ---------------------------------------------------------------------------

class _ProviderConfig(BaseModel):
    key: str
    label: str
    family: str  # "recreationdotgov" or "usedirect"
    search_class: Any
    aliases: List[str] = []
    description: Optional[str] = None


PROVIDERS: Dict[str, _ProviderConfig] = {
    # Recreation.gov (federal)
    "recreation.gov": _ProviderConfig(
        key="recreation.gov",
        label="Recreation.gov (US Federal)",
        family="recreationdotgov",
        search_class=SearchRecreationDotGov,
        aliases=["recdotgov", "recreationdotgov", "rec.gov", "recreation"],
        description="US federal campgrounds via Recreation.gov",
    ),
    # UseDirect family – state & local parks
    "reservecalifornia": _ProviderConfig(
        key="reservecalifornia",
        label="ReserveCalifornia (CA State Parks)",
        family="usedirect",
        search_class=SearchReserveCalifornia,
        aliases=["reserve_california", "reserve california", "rc"],
        description="California State Parks via ReserveCalifornia",
    ),
    "alabama_state_parks": _ProviderConfig(
        key="alabama_state_parks",
        label="Alabama State Parks",
        family="usedirect",
        search_class=SearchAlabamaStateParks,
        aliases=["alabama", "alabama parks", "alabamastateparks"],
        description="Alabama State Parks via ReserveAlaPark.com",
    ),
    "arizona_state_parks": _ProviderConfig(
        key="arizona_state_parks",
        label="Arizona State Parks",
        family="usedirect",
        search_class=SearchArizonaStateParks,
        aliases=["arizona", "az", "azstateparks", "arizonastateparks"],
        description="Arizona State Parks via AZStateParks.com",
    ),
    "florida_state_parks": _ProviderConfig(
        key="florida_state_parks",
        label="Florida State Parks",
        family="usedirect",
        search_class=SearchFloridaStateParks,
        aliases=["florida", "fl", "floridastateparks"],
        description="Florida State Parks",
    ),
    "minnesota_state_parks": _ProviderConfig(
        key="minnesota_state_parks",
        label="Minnesota State Parks",
        family="usedirect",
        search_class=SearchMinnesotaStateParks,
        aliases=["minnesota", "mn", "minnesotastateparks"],
        description="Minnesota State Parks",
    ),
    "missouri_state_parks": _ProviderConfig(
        key="missouri_state_parks",
        label="Missouri State Parks",
        family="usedirect",
        search_class=SearchMissouriStateParks,
        aliases=["missouri", "mo", "missouristateparks"],
        description="Missouri State Parks",
    ),
    "ohio_state_parks": _ProviderConfig(
        key="ohio_state_parks",
        label="Ohio State Parks",
        family="usedirect",
        search_class=SearchOhioStateParks,
        aliases=["ohio", "oh", "ohiostateparks"],
        description="Ohio State Parks",
    ),
    "virginia_state_parks": _ProviderConfig(
        key="virginia_state_parks",
        label="Virginia State Parks",
        family="usedirect",
        search_class=SearchVirginiaStateParks,
        aliases=["virginia", "va", "virginiastateparks"],
        description="Virginia State Parks",
    ),
    "northern_territory": _ProviderConfig(
        key="northern_territory",
        label="Northern Territory (AU)",
        family="usedirect",
        search_class=SearchNorthernTerritory,
        aliases=["nt", "australia_nt", "northernterritory"],
        description="Australian Northern Territory parks",
    ),
    "fairfax_county_parks": _ProviderConfig(
        key="fairfax_county_parks",
        label="Fairfax County Parks (VA)",
        family="usedirect",
        search_class=SearchFairfaxCountyParks,
        aliases=["fairfax", "fairfaxcounty", "fairfaxparks"],
        description="Fairfax County Parks, Virginia",
    ),
    "maricopa_county_parks": _ProviderConfig(
        key="maricopa_county_parks",
        label="Maricopa County Parks (AZ)",
        family="usedirect",
        search_class=SearchMaricopaCountyParks,
        aliases=["maricopa", "maricopacounty", "maricopaparks"],
        description="Maricopa County Parks, Arizona",
    ),
    "oregon_metro": _ProviderConfig(
        key="oregon_metro",
        label="Oregon Metro (Portland area)",
        family="usedirect",
        search_class=SearchOregonMetro,
        aliases=["oregonmetro", "portland", "portland_metro"],
        description="Oregon Metro parks (Portland Metro region)",
    ),
}

# alias → canonical key index for autocomplete
_ALIAS_INDEX: Dict[str, str] = {}
for slug, cfg in PROVIDERS.items():
    all_aliases = {slug, *cfg.aliases}
    for alias in all_aliases:
        _ALIAS_INDEX[alias.lower()] = slug


# ---------------------------------------------------------------------------
# Helpers: parsing, provider resolution, and shared search logic
# ---------------------------------------------------------------------------

def _parse_date(value: str, name: str) -> datetime:
    try:
        return datetime.strptime(value, "%Y-%m-%d")
    except ValueError:
        raise HTTPException(
            status_code=400,
            detail=f"Invalid {name} format: {value!r}. Expected YYYY-MM-DD.",
        )


def _resolve_provider(provider: Optional[str]) -> _ProviderConfig:
    """
    Resolve a user-supplied provider string to a known provider config.

    Supports:
    - exact matches (e.g. "recreation.gov", "reservecalifornia")
    - alias matches (e.g. "recgov", "rc")
    - prefix / substring autocomplete (e.g. "recrea", "virginia")
    """
    if provider is None:
        return PROVIDERS["recreation.gov"]

    query = provider.strip().lower()
    if not query:
        return PROVIDERS["recreation.gov"]

    # Exact / alias match first
    if query in _ALIAS_INDEX:
        return PROVIDERS[_ALIAS_INDEX[query]]

    # Autocomplete by prefix or substring
    matches: List[str] = []
    for alias, slug in _ALIAS_INDEX.items():
        if alias.startswith(query) or query in alias:
            if slug not in matches:
                matches.append(slug)

    if len(matches) == 1:
        return PROVIDERS[matches[0]]

    # Validation errors with helpful messages
    if not matches:
        suggestions = sorted({cfg.key for cfg in PROVIDERS.values()})
        raise HTTPException(
            status_code=400,
            detail={
                "error": f"Unknown provider: {provider!r}",
                "message": "Supported providers are listed in the 'providers' field.",
                "providers": suggestions,
            },
        )

    ambiguous = sorted(matches)
    raise HTTPException(
        status_code=400,
        detail={
            "error": f"Ambiguous provider: {provider!r}",
            "message": "Your provider matched multiple options. Please be more specific.",
            "matches": ambiguous,
        },
    )


def _run_search(
    provider_cfg: _ProviderConfig,
    campground_id: str,
    start_date: str,
    end_date: str,
) -> AvailabilityResponse:
    """
    Shared search logic for all providers.
    """
    start = _parse_date(start_date, "start_date")
    end = _parse_date(end_date, "end_date")

    if end <= start:
        raise HTTPException(
            status_code=400,
            detail="end_date must be after start_date.",
        )

    try:
        rec_area_id = int(campground_id)
    except ValueError:
        raise HTTPException(
            status_code=400,
            detail=(
                "campground_id must be an integer-compatible string "
                f"(recreation area / facility id). Got {campground_id!r}."
            ),
        )

    window = SearchWindow(start_date=start.date(), end_date=end.date())

    # Instantiate the relevant camply search class.
    searcher = provider_cfg.search_class(
        search_window=window,
        recreation_area=[rec_area_id],
    )

    try:
        campsites = list(searcher.get_all_campsites())
    except Exception as exc:  # defensive catch → 502 to caller
        raise HTTPException(
            status_code=502,
            detail=f"Upstream provider error while searching {provider_cfg.label}: {exc}",
        )

    sites_data: List[Dict[str, Any]] = []
    for site in campsites:
        # AvailableCampsite container → dict
        sites_data.append(
            {
                "campsite_id": str(getattr(site, "campsite_id", "")),
                "campsite_name": getattr(site, "campsite_title", None)
                or getattr(site, "campsite_name", ""),
                "facility_name": getattr(site, "facility_name", ""),
                "facility_id": str(getattr(site, "facility_id", "")),
                "campsite_site_type": getattr(site, "campsite_site_type", None),
                "campsite_type": getattr(site, "campsite_type", None),
                "campsite_occupancy": getattr(site, "campsite_occupancy", None),
                "availability_status": getattr(site, "availability_status", None),
                "recreation_area": getattr(site, "recreation_area", None),
                "recreation_area_id": getattr(site, "recreation_area_id", None),
                "loop": getattr(site, "loop", None),
                "booking_url": getattr(site, "booking_url", None),
                "start_date": getattr(site, "start_date", None),
                "end_date": getattr(site, "end_date", None),
            }
        )

    return AvailabilityResponse(
        provider=provider_cfg.key,
        provider_label=provider_cfg.label,
        campground_id=str(campground_id),
        available_sites=sites_data,
        total_available=len(sites_data),
        search_window={
            "start_date": start.strftime("%Y-%m-%d"),
            "end_date": end.strftime("%Y-%m-%d"),
        },
    )


# ---------------------------------------------------------------------------
# FastAPI endpoints
# ---------------------------------------------------------------------------

@app.get("/availability", response_model=AvailabilityResponse)
def availability(
    provider: Optional[str] = Query(
        None,
        description=(
            "Camping provider. Examples: 'recreation.gov', 'reservecalifornia', "
            "'virginia_state_parks', 'maricopa_county_parks'. "
            "Autocomplete and common aliases are supported."
        ),
    ),
    campground_id: str = Query(
        ...,
        description=(
            "Recreation Area ID or Campground ID as used by camply / the upstream provider."
        ),
    ),
    start_date: str = Query(..., description="Start date in YYYY-MM-DD"),
    end_date: str = Query(..., description="End date in YYYY-MM-DD"),
):
    """
    Unified availability endpoint for ALL supported providers.

    Examples:
        /availability?provider=recreation.gov&campground_id=2725&start_date=2025-07-01&end_date=2025-07-04
        /availability?provider=reservecalifornia&campground_id=718&start_date=2025-07-01&end_date=2025-07-04
        /availability?provider=virginia_state_parks&campground_id=123&start_date=2025-07-01&end_date=2025-07-04
    """
    provider_cfg = _resolve_provider(provider)
    return _run_search(
        provider_cfg=provider_cfg,
        campground_id=campground_id,
        start_date=start_date,
        end_date=end_date,
    )


@app.get("/providers", response_model=List[ProviderInfo])
def list_providers(
    q: Optional[str] = Query(None, description="Optional search filter over key/label")
):
    """
    List configured providers (for front-end dropdowns / autocomplete).
    """
    providers = [
        ProviderInfo(
            key=cfg.key,
            label=cfg.label,
            family=cfg.family,
            description=cfg.description,
        )
        for cfg in PROVIDERS.values()
    ]

    if q:
        q_lower = q.lower()
        providers = [
            p
            for p in providers
            if q_lower in p.key.lower() or q_lower in p.label.lower()
        ]

    return providers


if __name__ == "__main__":
    import uvicorn

    uvicorn.run(app, host="0.0.0.0", port=8000)
