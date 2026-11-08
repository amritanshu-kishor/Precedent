"""Role-Based Memory Tagging: INVESTIGATOR / SKEPTIC / AUDITOR tags with authorization.

Role-specific retrieval without cross-role leakage. An event tagged with a role
is only visible to callers with that same role. Untagged events are visible to all.
"""

from __future__ import annotations

import logging
from typing import Any

VALID_ROLE_TAGS = ("INVESTIGATOR", "SKEPTIC", "AUDITOR")

logger = logging.getLogger(__name__)


class InvalidRoleTagError(ValueError):
    """Raised when a role tag is not one of INVESTIGATOR/SKEPTIC/AUDITOR."""


def validate_role_tag(role_tag: str | None) -> str | None:
    """Validate a role tag. Returns None if untagged, raises if invalid."""
    if role_tag is None:
        return None
    if role_tag not in VALID_ROLE_TAGS:
        raise InvalidRoleTagError(f"Invalid role_tag: {role_tag}. Must be one of {VALID_ROLE_TAGS}")
    return role_tag


def can_access_event(caller_role: str | None, event_role_tag: str | None) -> bool:
    """Check if a caller with caller_role can access an event with event_role_tag.

    Rules:
    - Untagged events (event_role_tag is None) are visible to all callers.
    - A caller can see events tagged with their own role.
    - A caller cannot see events tagged with a different role (no cross-role leakage).
    """
    if event_role_tag is None:
        return True
    if caller_role is None:
        return False  # Untagged caller cannot see tagged events
    return caller_role == event_role_tag


def filter_events_by_role(
    events: list[dict[str, Any]],
    caller_role: str | None,
) -> list[dict[str, Any]]:
    """Filter a list of events to only those visible to the caller's role.

    Prevents cross-role leakage: events tagged with a different role are removed.
    Untagged events are always visible.
    """
    validate_role_tag(caller_role)
    visible = [
        e for e in events
        if can_access_event(caller_role, e.get("role_tag"))
    ]
    logger.debug(
        "tagging filter caller_role=%s total=%d visible=%d",
        caller_role,
        len(events),
        len(visible),
    )
    return visible


def tag_event(event: dict[str, Any], role_tag: str | None) -> dict[str, Any]:
    """Apply a role tag to an event dict (in-place, returns the event)."""
    validate_role_tag(role_tag)
    event["role_tag"] = role_tag
    return event
