import time
from typing import Dict, Tuple, Any, Optional


class IdempotencyKey:
    header_name: str = "Idempotency-Key"


_cache: Dict[str, Tuple[float, Any]] = {}


def ensure_idempotency(key: Optional[str], ttl_seconds: int = 600):
    if not key:
        return None
    now = time.time()
    # purge expired
    expired = [k for k, (ts, _) in _cache.items() if now - ts > ttl_seconds]
    for k in expired:
        _cache.pop(k, None)

    if key in _cache:
        return _cache[key][1]

    # marker to indicate in-flight operation; store None for now
    _cache[key] = (now, None)
    return None


def store_idempotent_result(key: Optional[str], result: Any):
    if not key:
        return
    ts = time.time()
    _cache[key] = (ts, result)


