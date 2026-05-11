from .api_response import ApiError
from .audit import write_audit_event
from .models import ConfirmRequest


def require_confirmation(payload: ConfirmRequest, action: str = "admin.action", service: str | None = None) -> None:
    if payload.confirm is not True:
        write_audit_event(
            action=action,
            service=service,
            result="confirmation_failed",
            details={"code": "CONFIRMATION_REQUIRED"},
        )
        raise ApiError(
            code="CONFIRMATION_REQUIRED",
            message="Explicit confirmation is required",
            status_code=400,
        )
