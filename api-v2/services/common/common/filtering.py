from typing import Dict, Any


def build_filters(params: Dict[str, Any], allowed: list[str]) -> Dict[str, Any]:
    query: Dict[str, Any] = {}
    for key in allowed:
        value = params.get(key)
        if value is None or value == "":
            continue
        query[key] = value

    # common range helpers
    price_min = params.get("price_min")
    price_max = params.get("price_max")
    if price_min is not None or price_max is not None:
        price_cond: Dict[str, Any] = {}
        if price_min is not None:
            try:
                price_cond["$gte"] = float(price_min)
            except Exception:
                pass
        if price_max is not None:
            try:
                price_cond["$lte"] = float(price_max)
            except Exception:
                pass
        if price_cond:
            query["price"] = price_cond

    return query


