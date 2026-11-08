"""Unit tests for HindsightClient.

Uses mocked httpx.Client — no real Hindsight service required.
All error classes verified: no credentials logged, no insecure fallback, no fake responses.
"""

from __future__ import annotations

import logging
from unittest.mock import MagicMock, patch

import httpx
import pytest

from app.memory.hindsight_client import (
    HindsightAuthError,
    HindsightClient,
    HindsightConfigurationError,
    HindsightJSONParseError,
    HindsightNetworkError,
    HindsightRateLimitError,
    HindsightServerError,
    HindsightTimeoutError,
    RETRYABLE_ERRORS,
)


def make_mock_response(status_code: int, json_data=None, text=""):
    response = MagicMock(spec=httpx.Response)
    response.status_code = status_code
    response.is_success = 200 <= status_code < 300
    if json_data is not None:
        response.json.return_value = json_data
    else:
        response.json.side_effect = ValueError("invalid JSON")
    response.text = text
    return response


def test_constructor_missing_api_key_raises():
    with pytest.raises(HindsightConfigurationError, match="HINDSIGHT_API_KEY"):
        HindsightClient(api_key=None, endpoint="https://hindsight.example.com")


def test_constructor_missing_endpoint_raises():
    with pytest.raises(HindsightConfigurationError, match="HINDSIGHT_ENDPOINT"):
        HindsightClient(api_key="test-key", endpoint=None)


def test_constructor_accepts_valid_config():
    client = HindsightClient(api_key="test-key", endpoint="https://hindsight.example.com")
    assert client.api_key == "test-key"
    assert client.endpoint == "https://hindsight.example.com"
    client.close()


def test_health_success(monkeypatch):
    client = HindsightClient(api_key="test-key", endpoint="https://hindsight.example.com")
    mock_response = make_mock_response(200, {"status": "healthy"})
    with patch.object(client._client, "request", return_value=mock_response) as mock_request:
        result = client.health()
    assert result == {"status": "healthy"}
    mock_request.assert_called_once()
    args, kwargs = mock_request.call_args
    assert args[0] == "GET"
    assert args[1] == "https://hindsight.example.com/health"
    assert "Authorization" in kwargs["headers"]
    assert kwargs["headers"]["Authorization"] == "Bearer test-key"
    client.close()


def test_health_invalid_json_raises(monkeypatch):
    client = HindsightClient(api_key="test-key", endpoint="https://hindsight.example.com")
    mock_response = make_mock_response(200, json_data=None)
    with patch.object(client._client, "request", return_value=mock_response):
        with pytest.raises(HindsightJSONParseError):
            client.health()
    client.close()


def test_write_event_success(monkeypatch):
    client = HindsightClient(api_key="test-key", endpoint="https://hindsight.example.com")
    mock_response = make_mock_response(201, {"status": "retained", "source_record_id": "rec-123"})
    with patch.object(client._client, "request", return_value=mock_response) as mock_request:
        result = client.write_event({"deviation_id": "dev-1", "event_type": "RETAIN"})
    assert result == {"status": "retained", "source_record_id": "rec-123"}
    args, kwargs = mock_request.call_args
    assert args[0] == "POST"
    assert args[1] == "https://hindsight.example.com/events"
    assert kwargs["json"] == {"deviation_id": "dev-1", "event_type": "RETAIN"}
    client.close()


def test_read_events_returns_list(monkeypatch):
    client = HindsightClient(api_key="test-key", endpoint="https://hindsight.example.com")
    mock_response = make_mock_response(200, [{"source_record_id": "rec-1"}, {"source_record_id": "rec-2"}])
    with patch.object(client._client, "request", return_value=mock_response) as mock_request:
        result = client.read_events(plant_id="PLANT-001", deviation_id="dev-1", limit=10)
    assert len(result) == 2
    args, kwargs = mock_request.call_args
    assert args[0] == "GET"
    assert kwargs["params"] == {"plant_id": "PLANT-001", "deviation_id": "dev-1", "limit": 10}
    client.close()


def test_read_events_wrapped_in_events_key(monkeypatch):
    client = HindsightClient(api_key="test-key", endpoint="https://hindsight.example.com")
    mock_response = make_mock_response(200, {"events": [{"source_record_id": "rec-1"}]})
    with patch.object(client._client, "request", return_value=mock_response):
        result = client.read_events(plant_id="PLANT-001")
    assert len(result) == 1
    client.close()


def test_auth_error_not_retried(monkeypatch):
    """401/403 must NOT be retried — raised immediately."""
    client = HindsightClient(api_key="bad-key", endpoint="https://hindsight.example.com", max_retries=3)
    mock_response = make_mock_response(401)
    with patch.object(client._client, "request", return_value=mock_response) as mock_request:
        with pytest.raises(HindsightAuthError):
            client.health()
    # Should only be called once — no retries on auth failure
    assert mock_request.call_count == 1
    client.close()


def test_forbidden_error_not_retried(monkeypatch):
    client = HindsightClient(api_key="bad-key", endpoint="https://hindsight.example.com", max_retries=3)
    mock_response = make_mock_response(403)
    with patch.object(client._client, "request", return_value=mock_response) as mock_request:
        with pytest.raises(HindsightAuthError):
            client.health()
    assert mock_request.call_count == 1
    client.close()


def test_rate_limit_retried_then_succeeds(monkeypatch):
    client = HindsightClient(api_key="test-key", endpoint="https://hindsight.example.com", max_retries=3)
    rate_limited = make_mock_response(429)
    success = make_mock_response(200, {"status": "healthy"})
    with patch.object(client._client, "request", side_effect=[rate_limited, success]) as mock_request:
        result = client.health()
    assert result == {"status": "healthy"}
    assert mock_request.call_count == 2
    client.close()


def test_server_error_retried_then_fails(monkeypatch):
    """After max_retries, server error is raised."""
    client = HindsightClient(api_key="test-key", endpoint="https://hindsight.example.com", max_retries=2)
    server_error = make_mock_response(500)
    with patch.object(client._client, "request", return_value=server_error) as mock_request:
        with pytest.raises(HindsightServerError):
            client.health()
    assert mock_request.call_count == 2
    client.close()


def test_network_error_retried_then_fails(monkeypatch):
    client = HindsightClient(api_key="test-key", endpoint="https://hindsight.example.com", max_retries=2)
    with patch.object(
        client._client,
        "request",
        side_effect=httpx.ConnectError("connection refused"),
    ) as mock_request:
        with pytest.raises(HindsightNetworkError):
            client.health()
    assert mock_request.call_count == 2
    client.close()


def test_timeout_retried_then_fails(monkeypatch):
    client = HindsightClient(api_key="test-key", endpoint="https://hindsight.example.com", max_retries=2)
    with patch.object(
        client._client,
        "request",
        side_effect=httpx.TimeoutException("timed out"),
    ) as mock_request:
        with pytest.raises(HindsightTimeoutError):
            client.health()
    assert mock_request.call_count == 2
    client.close()


def test_retryable_errors_tuple():
    assert HindsightTimeoutError in RETRYABLE_ERRORS
    assert HindsightRateLimitError in RETRYABLE_ERRORS
    assert HindsightServerError in RETRYABLE_ERRORS
    assert HindsightNetworkError in RETRYABLE_ERRORS
    assert HindsightAuthError not in RETRYABLE_ERRORS
    assert HindsightJSONParseError not in RETRYABLE_ERRORS
    assert HindsightConfigurationError not in RETRYABLE_ERRORS


def test_api_key_not_logged(caplog):
    """API key must never appear in log output."""
    client = HindsightClient(api_key="sk-live-secret-key-12345", endpoint="https://hindsight.example.com")
    mock_response = make_mock_response(200, {"status": "healthy"})
    with patch.object(client._client, "request", return_value=mock_response):
        with caplog.at_level(logging.INFO):
            client.health()
    log_text = caplog.text
    assert "sk-live-secret-key-12345" not in log_text
    assert "sk-live" not in log_text
    # Redacted form is acceptable
    client.close()


def test_json_parse_error_not_retried(monkeypatch):
    """Malformed JSON must NOT be retried — raised immediately."""
    client = HindsightClient(api_key="test-key", endpoint="https://hindsight.example.com", max_retries=3)
    mock_response = make_mock_response(200, json_data=None)  # json() raises ValueError
    with patch.object(client._client, "request", return_value=mock_response) as mock_request:
        with pytest.raises(HindsightJSONParseError):
            client.health()
    assert mock_request.call_count == 1
    client.close()
