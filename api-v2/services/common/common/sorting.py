from pydantic import BaseModel
from typing import List, Tuple


class SortParams(BaseModel):
    sort: str | None = None  # e.g. "-created_at,name"

    def mongo_sort(self) -> List[Tuple[str, int]]:
        if not self.sort:
            return []
        fields = [s.strip() for s in self.sort.split(",") if s.strip()]
        pairs: List[Tuple[str, int]] = []
        for f in fields:
            if f.startswith("-"):
                pairs.append((f[1:], -1))
            else:
                pairs.append((f, 1))
        return pairs


def apply_sort(cursor, params: SortParams):
    spec = params.mongo_sort()
    if spec:
        return cursor.sort(spec)
    return cursor


