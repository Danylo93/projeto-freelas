from pydantic import BaseModel, Field, conint
from typing import Any, Iterable, List, Tuple


class PaginationParams(BaseModel):
    page: conint(ge=1) = Field(default=1)
    page_size: conint(ge=1, le=200) = Field(default=20)

    @property
    def skip_limit(self) -> Tuple[int, int]:
        skip = (self.page - 1) * self.page_size
        return skip, self.page_size


def apply_pagination(cursor, params: PaginationParams):
    skip, limit = params.skip_limit
    return cursor.skip(skip).limit(limit)


