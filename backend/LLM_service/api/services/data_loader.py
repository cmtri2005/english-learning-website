"""
Data Loading Module
Handles loading and caching data from MinIO storage
"""

import json
from typing import Dict, List

# Import at function level to avoid circular imports
def _get_clients():
    from .clients import minio_client, MINIO_BUCKET
    return minio_client, MINIO_BUCKET

# ========== DATA CACHE ==========
speaking_data: Dict = {}
writing_data: Dict = {}
custom_topics: List = []
pronunciation_data: Dict = {}  # Lazy loaded on-demand

def load_data_from_minio() -> bool:
    """Load essential data from MinIO bucket (speaking, writing, topics)
    Note: Pronunciation data is loaded on-demand to speed up startup
    """
    global speaking_data, writing_data, custom_topics
    
    minio_client, MINIO_BUCKET = _get_clients()
    
    if not minio_client:
        print("MinIO client not initialized")
        return False
    
    try:
        # Load speaking data (question 7 - Express Opinion)
        print("📖 Loading speaking data...")
        objects = minio_client.list_objects(MINIO_BUCKET, prefix="speaking/", recursive=True)
        speaking_count = 0
        for obj in objects:
            if obj.object_name.endswith("data.json"):
                response = minio_client.get_object(MINIO_BUCKET, obj.object_name)
                data = json.loads(response.read().decode('utf-8'))
                topic_id = obj.object_name.split("/")[1]
                speaking_data[topic_id] = data
                speaking_count += 1
                response.close()
                response.release_conn()
        print(f"✅ Loaded {speaking_count} speaking topics")
        
        # Load writing data (question 8 - Opinion Essay)
        print("📖 Loading writing data...")
        objects = minio_client.list_objects(MINIO_BUCKET, prefix="writing/", recursive=True)
        writing_count = 0
        for obj in objects:
            if obj.object_name.endswith("data.json"):
                response = minio_client.get_object(MINIO_BUCKET, obj.object_name)
                data = json.loads(response.read().decode('utf-8'))
                topic_id = obj.object_name.split("/")[1]
                writing_data[topic_id] = data
                writing_count += 1
                response.close()
                response.release_conn()
        print(f"✅ Loaded {writing_count} writing topics")
        
        # Load custom topics
        print("📖 Loading custom topics...")
        try:
            response = minio_client.get_object(MINIO_BUCKET, "topics/topics.json")
            custom_topics = json.loads(response.read().decode('utf-8'))
            response.close()
            response.release_conn()
            print(f"✅ Loaded {len(custom_topics)} custom topics")
        except Exception as e:
            print(f"⚠️  Custom topics not found: {e}")
            custom_topics = []
        
        # Skip pre-loading pronunciation data (loaded on-demand)
        # This significantly speeds up startup time
        print("📖 Pronunciation data will be loaded on-demand")
        
        total_topics = len(speaking_data) + len(writing_data) + len(custom_topics)
        print(f"📊 Total data loaded: {total_topics} topics")
        return True
        
    except Exception as e:
        print(f"❌ Data loading error: {e}")
        return False

def check_data_loaded() -> bool:
    """Check if data has been loaded"""
    return len(speaking_data) > 0 or len(writing_data) > 0 or len(custom_topics) > 0

def get_data_stats() -> Dict:
    """Get statistics about loaded data"""
    return {
        "speaking_topics": len(speaking_data),
        "writing_topics": len(writing_data), 
        "custom_topics": len(custom_topics),
        "pronunciation_entries_cached": len(pronunciation_data),
        "total_topics": len(speaking_data) + len(writing_data) + len(custom_topics)
    }

def get_pronunciation_data(word: str) -> Dict:
    """Get pronunciation data for a word (lazy load from MinIO)"""
    global pronunciation_data
    
    word_lower = word.lower().strip()
    
    # Check cache first
    if word_lower in pronunciation_data:
        return pronunciation_data[word_lower]
    
    # Load from MinIO
    minio_client, MINIO_BUCKET = _get_clients()
    if minio_client:
        try:
            response = minio_client.get_object(MINIO_BUCKET, f"pronunciation/{word_lower}.json")
            data = json.loads(response.read().decode('utf-8'))
            pronunciation_data[word_lower] = data  # Cache it
            response.close()
            response.release_conn()
            return data
        except Exception as e:
            pass  # Word not found
    
    return None

# Export data and functions
__all__ = [
    'speaking_data', 'writing_data', 'custom_topics', 'pronunciation_data',
    'load_data_from_minio', 'check_data_loaded', 'get_data_stats', 'get_pronunciation_data'
]
