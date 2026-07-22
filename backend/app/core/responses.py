from typing import Any


def ok(data: Any = None) -> dict[str, Any]:
    return {
        "code": 0,
        "message": "ok",
        "data": data if data is not None else {},
    }
