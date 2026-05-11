from fastapi.responses import JSONResponse


class ApiError(Exception):
    def __init__(
        self,
        code: str,
        message: str,
        details: dict | None = None,
        status_code: int = 400,
    ) -> None:
        super().__init__(message)
        self.code = code
        self.message = message
        self.details = details or {}
        self.status_code = status_code


def success_response(data):
    return {"ok": True, "data": data}


def error_response(code: str, message: str, details: dict | None = None, status_code: int = 400) -> JSONResponse:
    return JSONResponse(
        status_code=status_code,
        content={
            "ok": False,
            "error": {
                "code": code,
                "message": message,
                "details": details or {},
            },
        },
    )


def api_error_response(error: ApiError) -> JSONResponse:
    return error_response(error.code, error.message, error.details, error.status_code)
