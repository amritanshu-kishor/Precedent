"""Unit tests for Role-Based Memory Tagging."""

from __future__ import annotations

import pytest

from app.memory.tagging import (
    InvalidRoleTagError,
    can_access_event,
    filter_events_by_role,
    tag_event,
    validate_role_tag,
)


def test_validate_role_tag_valid():
    assert validate_role_tag("INVESTIGATOR") == "INVESTIGATOR"
    assert validate_role_tag("SKEPTIC") == "SKEPTIC"
    assert validate_role_tag("AUDITOR") == "AUDITOR"
    assert validate_role_tag(None) is None


def test_validate_role_tag_invalid():
    with pytest.raises(InvalidRoleTagError, match="Invalid role_tag"):
        validate_role_tag("INVALID_ROLE")
    with pytest.raises(InvalidRoleTagError, match="Invalid role_tag"):
        validate_role_tag("MANAGER")


def test_can_access_event_untagged_visible_to_all():
    assert can_access_event(None, None) is True
    assert can_access_event("INVESTIGATOR", None) is True
    assert can_access_event("SKEPTIC", None) is True
    assert can_access_event("AUDITOR", None) is True


def test_can_access_event_same_role():
    assert can_access_event("INVESTIGATOR", "INVESTIGATOR") is True
    assert can_access_event("SKEPTIC", "SKEPTIC") is True
    assert can_access_event("AUDITOR", "AUDITOR") is True


def test_can_access_event_cross_role_blocked():
    assert can_access_event("INVESTIGATOR", "SKEPTIC") is False
    assert can_access_event("INVESTIGATOR", "AUDITOR") is False
    assert can_access_event("SKEPTIC", "INVESTIGATOR") is False
    assert can_access_event("SKEPTIC", "AUDITOR") is False
    assert can_access_event("AUDITOR", "INVESTIGATOR") is False
    assert can_access_event("AUDITOR", "SKEPTIC") is False


def test_can_access_event_untagged_caller_cant_see_tagged():
    assert can_access_event(None, "INVESTIGATOR") is False
    assert can_access_event(None, "SKEPTIC") is False
    assert can_access_event(None, "AUDITOR") is False


def test_filter_events_by_role_no_leakage():
    events = [
        {"source_record_id": "e1", "role_tag": "INVESTIGATOR"},
        {"source_record_id": "e2", "role_tag": "SKEPTIC"},
        {"source_record_id": "e3", "role_tag": "AUDITOR"},
        {"source_record_id": "e4", "role_tag": None},
    ]
    result = filter_events_by_role(events, "INVESTIGATOR")
    ids = {e["source_record_id"] for e in result}
    assert ids == {"e1", "e4"}  # INVESTIGATOR sees own + untagged

    result = filter_events_by_role(events, "SKEPTIC")
    ids = {e["source_record_id"] for e in result}
    assert ids == {"e2", "e4"}  # SKEPTIC sees own + untagged

    result = filter_events_by_role(events, "AUDITOR")
    ids = {e["source_record_id"] for e in result}
    assert ids == {"e3", "e4"}  # AUDITOR sees own + untagged


def test_filter_events_by_role_untagged_caller_sees_only_untagged():
    events = [
        {"source_record_id": "e1", "role_tag": "INVESTIGATOR"},
        {"source_record_id": "e2", "role_tag": None},
    ]
    result = filter_events_by_role(events, None)
    ids = {e["source_record_id"] for e in result}
    assert ids == {"e2"}  # Untagged caller sees only untagged


def test_filter_events_by_role_invalid_role():
    events = [{"source_record_id": "e1", "role_tag": None}]
    with pytest.raises(InvalidRoleTagError):
        filter_events_by_role(events, "INVALID_ROLE")


def test_tag_event():
    event = {"source_record_id": "e1"}
    tagged = tag_event(event, "INVESTIGATOR")
    assert tagged["role_tag"] == "INVESTIGATOR"
    assert tagged is event  # In-place modification


def test_tag_event_none():
    event = {"source_record_id": "e1"}
    tagged = tag_event(event, None)
    assert tagged["role_tag"] is None
    assert tagged is event


def test_tag_event_invalid():
    event = {"source_record_id": "e1"}
    with pytest.raises(InvalidRoleTagError):
        tag_event(event, "INVALID")
