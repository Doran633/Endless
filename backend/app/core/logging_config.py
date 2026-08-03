import logging
from pathlib import Path

from app.core.config import settings


LOG_FORMAT = "%(asctime)s %(levelname)s [%(name)s] %(message)s"


def configure_logging() -> None:
    """Configure console logging and optional local file logging once."""

    root_logger = logging.getLogger()
    if getattr(root_logger, "_beichen_logging_configured", False):
        return

    level = getattr(logging, settings.log_level, logging.INFO)
    formatter = logging.Formatter(LOG_FORMAT)

    console_handler = logging.StreamHandler()
    console_handler.setFormatter(formatter)

    handlers: list[logging.Handler] = [console_handler]
    if settings.log_to_file:
        log_dir = Path(settings.log_dir)
        log_dir.mkdir(parents=True, exist_ok=True)
        file_handler = logging.FileHandler(log_dir / "app.log", encoding="utf-8")
        file_handler.setFormatter(formatter)
        handlers.append(file_handler)

    root_logger.handlers.clear()
    root_logger.setLevel(level)
    for handler in handlers:
        handler.setLevel(level)
        root_logger.addHandler(handler)

    logging.getLogger("httpx").setLevel(logging.WARNING)
    setattr(root_logger, "_beichen_logging_configured", True)
