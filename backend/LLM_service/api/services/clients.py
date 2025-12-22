"""
Client Management Module
Handles MinIO, Groq API clients, and multi-key retry mechanism
"""

import os
import time
from typing import Optional, List
from minio import Minio
from openai import OpenAI

# ========== CONFIGURATION ==========
# MinIO Configuration (shared with PHP API and other services)
MINIO_ENDPOINT = os.getenv("MINIO_ENDPOINT", "minioalt:9000")
MINIO_ACCESS_KEY = os.getenv("MINIO_ACCESS_KEY", "minioadmin")
MINIO_SECRET_KEY = os.getenv("MINIO_SECRET_KEY", "minioadmin123")
MINIO_BUCKET = os.getenv("MINIO_BUCKET", "my-bucket")

# Multiple Groq API Keys for quota management
GROQ_API_KEYS = os.getenv("GROQ_API_KEYS", os.getenv("GROQ_API_KEY", "")).split(",")
GROQ_API_KEYS = [key.strip() for key in GROQ_API_KEYS if key.strip()]

GROQ_BASE_URL = os.getenv("GROQ_BASE_URL", "https://api.groq.com/openai/v1")
LLM_MODEL = os.getenv("LLM_MODEL", "llama-3.1-8b-instant")
WHISPER_MODEL = os.getenv("WHISPER_MODEL", "whisper-large-v3-turbo")

# ========== GLOBAL CLIENTS ==========
minio_client: Optional[Minio] = None
groq_clients: List[OpenAI] = []
current_groq_index = 0

# ========== MINIO CLIENT ==========
def init_minio() -> bool:
    """Initialize MinIO client"""
    global minio_client
    try:
        # Remove protocol prefix if present
        endpoint = MINIO_ENDPOINT.replace("http://", "").replace("https://", "")
        
        minio_client = Minio(
            endpoint,
            access_key=MINIO_ACCESS_KEY,
            secret_key=MINIO_SECRET_KEY,
            secure=False
        )
        
        # Wait for MinIO to be ready (with retry)
        max_retries = 10
        for i in range(max_retries):
            try:
                minio_client.bucket_exists(MINIO_BUCKET)
                print(f"✅ MinIO connected at {endpoint}")
                return True
            except Exception as e:
                if i < max_retries - 1:
                    print(f"⏳ Waiting for MinIO... ({i+1}/{max_retries})")
                    time.sleep(3)
                else:
                    print(f"❌ MinIO connection failed after {max_retries} attempts: {e}")
                    return False
        return True
    except Exception as e:
        print(f"MinIO init error: {e}")
        return False

def check_minio_connected() -> bool:
    """Check if MinIO is connected"""
    if not minio_client:
        return False
    try:
        minio_client.bucket_exists(MINIO_BUCKET)
        return True
    except:
        return False

# ========== GROQ CLIENTS WITH MULTI-KEY SUPPORT ==========
def init_groq() -> bool:
    """Initialize multiple Groq clients for quota management"""
    global groq_clients, current_groq_index
    groq_clients.clear()  # Clear instead of reassign to keep reference
    
    if not GROQ_API_KEYS:
        print("⚠️ No Groq API keys provided - LLM features will be disabled")
        return False
    
    for i, api_key in enumerate(GROQ_API_KEYS):
        if api_key:
            try:
                client = OpenAI(api_key=api_key, base_url=GROQ_BASE_URL)
                groq_clients.append(client)
                print(f"✅ Initialized Groq client {i+1}/{len(GROQ_API_KEYS)}")
            except Exception as e:
                print(f"❌ Failed to initialize Groq client {i+1}: {e}")
    
    current_groq_index = 0
    print(f"📊 Total Groq clients: {len(groq_clients)}")
    return len(groq_clients) > 0

def get_groq_client() -> Optional[OpenAI]:
    """Get current Groq client"""
    if not groq_clients:
        return None
    return groq_clients[current_groq_index % len(groq_clients)]

def rotate_groq_client():
    """Switch to next Groq client"""
    global current_groq_index
    if groq_clients:
        current_groq_index = (current_groq_index + 1) % len(groq_clients)
        print(f"🔄 Rotated to Groq client {current_groq_index + 1}/{len(groq_clients)}")

def is_quota_error(error: Exception) -> bool:
    """Check if error is due to quota/rate limit"""
    error_str = str(error).lower()
    quota_indicators = [
        'quota', 'rate limit', 'too many requests', 'usage limit',
        'daily limit', 'monthly limit', 'exceeded', '429', 'rate_limit'
    ]
    return any(indicator in error_str for indicator in quota_indicators)

def groq_api_call_with_retry(api_call_func, max_retries: int = None):
    """
    Execute Groq API call with automatic retry on quota errors
    Will try all available API keys before giving up
    """
    if not groq_clients:
        raise Exception("No Groq clients available")
    
    if max_retries is None:
        max_retries = len(groq_clients)
    
    last_error = None
    
    for attempt in range(max_retries):
        client = get_groq_client()
        if not client:
            break
            
        try:
            result = api_call_func(client)
            return result
        except Exception as e:
            last_error = e
            print(f"⚠️ Groq API error (attempt {attempt + 1}/{max_retries}): {str(e)[:100]}")
            
            if is_quota_error(e):
                print(f"🔄 Quota error detected, rotating to next API key...")
                rotate_groq_client()
                if attempt < max_retries - 1:  # Don't sleep on last attempt
                    time.sleep(1)  # Brief pause before retry
                continue
            else:
                # Non-quota error, don't retry
                raise e
    
    # All retries failed
    raise Exception(f"All Groq API keys failed. Last error: {last_error}")

# Export configuration for other modules
__all__ = [
    'MINIO_ENDPOINT', 'MINIO_ACCESS_KEY', 'MINIO_SECRET_KEY', 'MINIO_BUCKET',
    'GROQ_API_KEYS', 'GROQ_BASE_URL', 'LLM_MODEL', 'WHISPER_MODEL',
    'minio_client', 'groq_clients', 'current_groq_index',
    'init_minio', 'init_groq', 'check_minio_connected',
    'get_groq_client', 'rotate_groq_client', 'is_quota_error', 'groq_api_call_with_retry'
]
