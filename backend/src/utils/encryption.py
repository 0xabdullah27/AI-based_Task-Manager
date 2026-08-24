from cryptography.fernet import Fernet
from typing import Optional
from src.core.config import settings

_cipher_suite: Optional[Fernet] = None

def _get_cipher() -> Optional[Fernet]:
    global _cipher_suite
    if _cipher_suite is None and settings.encryption_key:
        try:
            _cipher_suite = Fernet(settings.encryption_key.encode('utf-8'))
        except Exception:
            # If the key is invalid, we return None and fallback to unencrypted (or fail)
            pass
    return _cipher_suite

def encrypt_value(value: Optional[str]) -> Optional[str]:
    """Encrypt a string value using Fernet."""
    if not value:
        return value
    cipher = _get_cipher()
    if not cipher:
        return value # Fallback to plain text if no encryption key is set
    return cipher.encrypt(value.encode('utf-8')).decode('utf-8')

def decrypt_value(encrypted_value: Optional[str]) -> Optional[str]:
    """Decrypt a Fernet encrypted string."""
    if not encrypted_value:
        return encrypted_value
    cipher = _get_cipher()
    if not cipher:
        return encrypted_value
    
    try:
        return cipher.decrypt(encrypted_value.encode('utf-8')).decode('utf-8')
    except Exception:
        # If decryption fails (e.g. it was plain text or key changed), return the original
        return encrypted_value
