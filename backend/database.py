"""
Database connection and shared state for all routes.
"""
from motor.motor_asyncio import AsyncIOMotorClient
from pathlib import Path
from dotenv import load_dotenv
import os
import time
import logging

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

logger = logging.getLogger(__name__)

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(
    mongo_url,
    maxPoolSize=15,
    minPoolSize=2,
    maxIdleTimeMS=30000,
    serverSelectionTimeoutMS=5000,
    socketTimeoutMS=20000,
    connectTimeoutMS=10000,
    retryWrites=True
)
db = client[os.environ['DB_NAME']]

# Simple in-memory cache
_cache = {}
_cache_ttl = {}
CACHE_DURATION = 60


def get_cached(key):
    if key in _cache and key in _cache_ttl:
        if time.time() < _cache_ttl[key]:
            return _cache[key]
        else:
            del _cache[key]
            del _cache_ttl[key]
    return None


def set_cached(key, value, ttl=CACHE_DURATION):
    _cache[key] = value
    _cache_ttl[key] = time.time() + ttl


def clear_cache(prefix=None):
    global _cache, _cache_ttl
    if prefix:
        keys_to_delete = [k for k in _cache.keys() if k.startswith(prefix)]
        for k in keys_to_delete:
            _cache.pop(k, None)
            _cache_ttl.pop(k, None)
    else:
        _cache = {}
        _cache_ttl = {}
