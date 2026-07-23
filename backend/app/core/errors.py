class AppError(Exception):
    """Base application error that can be returned as a stable API response."""

    def __init__(self, message: str, code: int = 40000, status_code: int = 400) -> None:
        super().__init__(message)
        self.message = message
        self.code = code
        self.status_code = status_code


class LLMConfigError(AppError):
    def __init__(self, message: str) -> None:
        super().__init__(message=message, code=43001, status_code=400)


class LLMProviderError(AppError):
    def __init__(self, message: str = "LLM provider request failed") -> None:
        super().__init__(message=message, code=43002, status_code=502)
