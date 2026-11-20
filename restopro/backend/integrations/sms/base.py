from abc import ABC, abstractmethod


class SmsProvider(ABC):
    @abstractmethod
    def send(self, phone: str, text: str) -> None:
        """SMS yuboradi. Xatolikda SmsError ko'taradi."""


class SmsError(Exception):
    pass
