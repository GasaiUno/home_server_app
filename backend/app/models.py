from pydantic import BaseModel, Field, field_validator


class ServiceItem(BaseModel):
    name: str
    url: str
    description: str


class ServicesResponse(BaseModel):
    services: list[ServiceItem]


class StatusResponse(BaseModel):
    status: str
    app: str
    version: str
    uptime_seconds: int
    server_time: str


class YoutubeRequest(BaseModel):
    url: str = Field(min_length=1)
    quality: str = "best"
    download_type: str = "video"
    format: str = "any"

    @field_validator("url")
    @classmethod
    def validate_http_url(cls, value: str) -> str:
        stripped = value.strip()
        if not stripped.startswith(("http://", "https://")):
            raise ValueError("url must be an http or https link")
        return stripped


class MagnetRequest(BaseModel):
    url: str = Field(min_length=1)

    @field_validator("url")
    @classmethod
    def validate_magnet_url(cls, value: str) -> str:
        stripped = value.strip()
        if not stripped.startswith("magnet:"):
            raise ValueError("url must start with magnet:")
        return stripped


class WebhookResponse(BaseModel):
    status: str
    message: str
