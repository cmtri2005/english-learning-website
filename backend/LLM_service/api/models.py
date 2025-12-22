from pydantic import BaseModel
from typing import Optional, List, Dict, Any, Union
from enum import Enum

# ========== SPEAKING ==========
class SpeakingTopicRequest(BaseModel):
    topic_id: Optional[str] = None  # If None, random topic

class SpeakingTopicResponse(BaseModel):
    topic_id: str
    test_name: str
    question_type: str
    context: str
    image_urls: List[str] = []

class SpeakingEvaluateRequest(BaseModel):
    topic_id: str
    transcript: str  # Text from speech-to-text
    topic_context: Optional[str] = None  # Optional: provide custom topic context instead of loading from database

class SpeakingEvaluateResponse(BaseModel):
    topic_id: str
    transcript: str
    pronunciation_score: float
    fluency_score: float
    grammar_score: float
    vocabulary_score: float
    coherence_score: float
    overall_score: float
    feedback: str
    errors: List[dict]
    suggestions: List[str]

# New 4-layer speaking evaluation models
class SpeakingFullEvaluateResponse(BaseModel):
    topic_id: str
    success: bool
    transcript: Optional[str] = None
    error: Optional[str] = None
    layers: Dict[str, Any] = {}
    scores: Optional[Dict[str, float]] = None
    feedback: Optional[Dict[str, Any]] = None

class TranscribeResponse(BaseModel):
    success: bool
    transcript: Optional[str] = None
    error: Optional[str] = None
    duration: Optional[float] = None
    language: Optional[str] = None

# ========== PRONUNCIATION ==========
class PronunciationRequest(BaseModel):
    word: str

class WordMeaning(BaseModel):
    type: str  # noun, verb, adjective, etc.
    meaning: str

class PronunciationResponse(BaseModel):
    word: str
    ipa: Optional[str] = None
    audio_url: Optional[str] = None
    found: bool = True
    meanings: List[WordMeaning] = []
    generated: bool = False  # True if LLM generated (not from dictionary)

class PronunciationTipsResponse(BaseModel):
    word: str
    ipa: Optional[str] = None
    tips: str  # LLM generated tips for this specific word
    common_mistakes: List[str] = []  # Common mistakes Vietnamese learners make
    similar_sounds: List[str] = []  # Words with similar sounds for practice

class RelatedWordsResponse(BaseModel):
    word: str
    related_words: List[Dict[str, Any]] = []  # Different word forms (noun, verb, adj...)
    synonyms: List[str] = []
    antonyms: List[str] = []

class WordSuggestion(BaseModel):
    word: str
    ipa: Optional[str] = None

class AutocompleteResponse(BaseModel):
    query: str
    suggestions: List[WordSuggestion] = []

# ========== WRITING ==========
class WritingTopicType(str, Enum):
    EXAM = "exam"
    CUSTOM = "custom"
    GENERATED = "generated"

class WritingTopicRequest(BaseModel):
    topic_type: WritingTopicType = WritingTopicType.EXAM
    topic_id: Optional[str] = None  # For exam type
    category: Optional[str] = None  # For generated topics

class WritingTopicResponse(BaseModel):
    topic_id: str
    topic_type: str
    test_name: Optional[str] = None
    question_type: str
    context: str
    category: Optional[str] = None
    prompt_type: Optional[str] = None

class WritingEvaluateRequest(BaseModel):
    topic_id: str
    topic_context: str
    essay: str

class WritingEvaluateResponse(BaseModel):
    topic_id: str
    essay: str
    task_achievement_score: float
    coherence_cohesion_score: float
    lexical_resource_score: float
    grammar_accuracy_score: float
    overall_score: float
    feedback: str
    errors: List[dict]
    suggestions: List[str]
    improved_version: Optional[str] = None

# ========== TOPICS ==========
class CustomTopicRequest(BaseModel):
    category: str
    description: Optional[str] = None

class CustomTopicResponse(BaseModel):
    topic_id: str
    category: str
    prompt_type: str
    prompt: str

# ========== GENERAL ==========
class TopicListResponse(BaseModel):
    speaking_topics: List[dict]
    writing_exam_topics: List[dict]
    writing_custom_topics: List[dict]

class HealthResponse(BaseModel):
    status: str
    minio_connected: bool
    data_loaded: bool

# ========== YOUTUBE ==========
class YouTubeVideo(BaseModel):
    video_id: str
    title: str
    description: str
    thumbnail: str
    channel: str
    url: str
    embed_url: str
    search_query: Optional[str] = None

class YouTubeRecommendationsRequest(BaseModel):
    feedback: str
    weaknesses: List[str] = []
    skill_type: str = "speaking"  # "speaking" or "writing"
    max_videos: int = 3

class YouTubeRecommendationsResponse(BaseModel):
    videos: List[YouTubeVideo]
    queries_used: List[str] = []
