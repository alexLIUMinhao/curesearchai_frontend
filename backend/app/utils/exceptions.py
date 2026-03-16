class AppException(Exception):
    def __init__(self, message: str, code: int = 400) -> None:
        self.message = message
        self.code = code
        super().__init__(message)


class NotFoundException(AppException):
    def __init__(self, message: str = "resource not found") -> None:
        super().__init__(message=message, code=404)

