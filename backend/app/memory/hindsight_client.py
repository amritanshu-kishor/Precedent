"""Hindsight service client: auth, config, health, retries, error classification, structured logging.

No credentials in logs. No insecure fallback. No fake client responses.
If Hindsight credentials or service are unavailable, raise ConfigurationError — do not fabricate.
"""

from __future__ import annotations

import logging
import time
import uuid
from typing import Any

import httpx

logger = logging.getLogger(__name__)


class HindsightConfigurationError(RuntimeError):
    """Raised when Hindsight credentials or endpoint are missing."""


class HindsightTimeoutError(RuntimeError):
    """Raised when a Hindsight request times out."""


class HindsightRateLimitError(RuntimeError):
    """Raised when Hindsight returns HTTP 429."""


class HindsightAuthError(RuntimeError):
    """Raised when Hindsight returns HTTP 401/403."""


class HindsightServerError(RuntimeError):
    """Raised when Hindsight returns HTTP 5xx."""


class HindsightNetworkError(RuntimeError):
    """Raised when the Hindsight endpoint is unreachable."""


class HindsightJSONParseError(RuntimeError):
    """Raised when Hindsight returns malformed JSON."""


# Retryable errors: transient failures that may succeed on retry.
RETRYABLE_ERRORS = (HindsightTimeoutError, HindsightRateLimitError, HindsightServerError, HindsightNetworkError)


def _redact_api_key(api_key: str | None) -> str:
    """Return a log-safe representation of an API key (never the full value)."""
    if not api_key:
        return "<unset>"
    if len(api_key) <= 8:
        return "***"
    return f"***{api_key[-4:]}"


class HindsightClient:
    """Thin synchronous HTTP client for the Hindsight memory service.

    Auth: Bearer token from HINDSIGHT_API_KEY.
    Endpoint: HINDSIGHT_ENDPOINT.
    All methods raise on error — never fall back to mock or fabricate responses.
    """

    def __init__(
        self,
        api_key: str | None = None,
        endpoint: str | None = None,
        timeout: float = 30.0,
        max_retries: int = 3,
    ) -> None:
        self.api_key = api_key
        self.endpoint = endpoint.rstrip("/") if endpoint else None
        self.timeout = timeout
        self.max_retries = max_retries
        self._client = httpx.Client(timeout=httpx.Timeout(timeout))

        if not self.api_key:
            raise HindsightConfigurationError("HINDSIGHT_API_KEY is not set")
        if not self.endpoint:
            raise HindsightConfigurationError("HINDSIGHT_ENDPOINT is not set")

        logger.info(
            "hindsight_client initialized endpoint=%s timeout=%s max_retries=%s",
            self.endpoint,
            self.timeout,
            self.max_retries,
        )

    def _headers(self) -> dict[str, str]:
        return {
            "Authorization": f"Bearer {self.api_key}",
            "Content-Type": "application/json",
            "X-Request-ID": str(uuid.uuid4()),
        }

    @staticmethod
    def _new_request_id() -> str:
        return str(uuid.uuid4())

    def _classify_error(self, response: httpx.Response) -> RuntimeError:
        status = response.status_code
        if status == 429:
            return HindsightRateLimitError("Hindsight rate limited (HTTP 429)")
        if status in (401, 403):
            return HindsightAuthError(f"Hindsight authentication failed (HTTP {status})")
        if 500 <= status < 600:
            return HindsightServerError(f"Hindsight server error (HTTP {status})")
        return HindsightNetworkError(f"Hindsight unexpected response (HTTP {status})")

    def _request_with_retry(
        self,
        method: str,
        path: str,
        json: dict[str, Any] | None = None,
        params: dict[str, Any] | None = None,
    ) -> httpx.Response:
        last_error: RuntimeError | None = None
        for attempt in range(1, self.max_retries + 1):
            start = time.monotonic()
            try:
                response = self._client.request(
                    method,
                    f"{self.endpoint}{path}",
                    headers=self._headers(),
                    json=json,
                    params=params,
                )
            except httpx.TimeoutException as exc:
                last_error = HindsightTimeoutError(f"Hindsight request timed out: {exc}")
            except httpx.NetworkError as exc:
                last_error = HindsightNetworkError(f"Hindsight network error: {exc}")
            except httpx.HTTPError as exc:
                last_error = HindsightNetworkError(f"Hindsight HTTP error: {exc}")
            else:
                if response.is_success:
                    duration = (time.monotonic() - start) * 1000
                    logger.info(
                        "hindsight request method=%s path=%s status=%s duration_ms=%.1f outcome=success",
                        method,
                        path,
                        response.status_code,
                        duration,
                    )
                    return response
                last_error = self._classify_error(response)
                duration = (time.monotonic() - start) * 1000
                logger.warning(
                    "hindsight request method=%s path=%s status=%s duration_ms=%.1f outcome=error error=%s",
                    method,
                    path,
                    response.status_code,
                    duration,
                    last_error,
                )

            if not isinstance(last_error, RETRYABLE_ERRORS):
                raise last_error

            if attempt < self.max_retries:
                backoff = 2 ** attempt
                logger.warning(
                    "hindsight request failed attempt=%s/%s error=%s backoff=%ss",
                    attempt,
                    self.max_retries,
                    last_error,
                    backoff,
                )
                time.sleep(backoff)

        raise last_error or HindsightNetworkError("Hindsight request failed after all retries")

    def health(self) -> dict[str, Any]:
        """Check Hindsight service health. Raises on failure."""
        response = self._request_with_retry("GET", "/health")
        try:
            return response.json()
        except ValueError as exc:
            raise HindsightJSONParseError(f"Hindsight health returned invalid JSON: {exc}") from exc

    def write_event(self, event: dict[str, Any]) -> dict[str, Any]:
        """Write a memory event to Hindsight. Raises on failure."""
        response = self._request_with_retry("POST", "/events", json=event)
        try:
            return response.json()
        except ValueError as exc:
            raise HindsightJSONParseError(f"Hindsight write returned invalid JSON: {exc}") from exc

    def read_events(
        self,
        plant_id: str,
        deviation_id: str | None = None,
        limit: int = 50,
    ) -> list[dict[str, Any]]:
        """Read memory events from Hindsight, filtered by plant_id and optionally deviation_id."""
        params: dict[str, Any] = {"plant_id": plant_id, "limit": limit}
        if deviation_id:
            params["deviation_id"] = deviation_id
        response = self._request_with_retry("GET", "/events", params=params)
        try:
            data = response.json()
        except ValueError as exc:
            raise HindsightJSONParseError(f"Hindsight read returned invalid JSON: {exc}") from exc
        if isinstance(data, list):
            return data
        if isinstance(data, dict) and isinstance(data.get("events"), list):
            return data["events"]
        return []

    def close(self) -> None:
        """Close the underlying HTTP connection pool."""
        self._client.close()


