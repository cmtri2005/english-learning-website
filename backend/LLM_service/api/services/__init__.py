"""
English Learning API Services
Modularized service layer for better organization
"""

# Import modules without auto-initialization
from .clients import (
    init_minio, init_groq, check_minio_connected,
    minio_client, groq_clients, get_groq_client
)

from .data_loader import (
    load_data_from_minio, check_data_loaded, get_pronunciation_data,
    speaking_data, writing_data, custom_topics, pronunciation_data
)

from .topics import (
    get_speaking_topic, get_writing_topic, generate_topic,
    get_all_topics, get_pronunciation, generate_pronunciation_audio,
    get_pronunciation_tips, get_related_words, search_words
)

from .speaking_evaluation import (
    transcribe_audio, evaluate_pronunciation_fluency, evaluate_grammar_content,
    evaluate_speaking_full, evaluate_speaking_from_transcript, evaluate_speaking
)

from .writing_evaluation import (
    evaluate_writing
)

# Initialize services manually when needed
def init_all_services():
    """Initialize all services in correct order"""
    print("Initializing services...")
    
    # 1. Initialize MinIO client
    if not init_minio():
        print("Failed to initialize MinIO")
        return False
    print("MinIO initialized")
    
    # 2. Initialize Groq clients with multi-key support
    if not init_groq():
        print("Groq clients not initialized (LLM features disabled)")
    else:
        print("Groq clients initialized")
    
    # 3. Load data from MinIO
    if not load_data_from_minio():
        print("Failed to load data from MinIO")
        return False
    print("Data loaded from MinIO")
    
    print("All services initialized successfully!")
    return True
# Test hot reload
