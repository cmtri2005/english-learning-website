from fastapi import FastAPI, HTTPException, UploadFile, File, Form
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import Response
from contextlib import asynccontextmanager
from typing import Optional

from api.models import (
    SpeakingTopicRequest, SpeakingTopicResponse,
    SpeakingEvaluateRequest, SpeakingEvaluateResponse,
    SpeakingFullEvaluateResponse, TranscribeResponse,
    PronunciationRequest, PronunciationResponse,
    PronunciationTipsResponse, RelatedWordsResponse, AutocompleteResponse,
    WritingTopicRequest, WritingTopicResponse,
    WritingEvaluateRequest, WritingEvaluateResponse,
    CustomTopicRequest, CustomTopicResponse,
    TopicListResponse, HealthResponse,
    YouTubeRecommendationsRequest, YouTubeRecommendationsResponse, YouTubeVideo
)

# Import modularized services
from api.services import (
    init_all_services, check_minio_connected, check_data_loaded,
    get_speaking_topic, get_writing_topic, generate_topic,
    evaluate_speaking, evaluate_writing, get_pronunciation,
    get_all_topics, generate_pronunciation_audio, speaking_data,
    transcribe_audio, evaluate_speaking_full, evaluate_speaking_from_transcript,
    get_pronunciation_tips, get_related_words, search_words,
    get_recommended_videos, extract_weaknesses_from_speaking, extract_weaknesses_from_writing,
    search_youtube_videos
)

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup - Initialize modular services
    print("🚀 English Learning API starting...")
    success = init_all_services()
    if success:
        print("✅ All services ready!")
    else:
        print("⚠️ Some services failed to initialize")
    yield
    # Shutdown
    print("👋 English Learning API shutting down...")

app = FastAPI(
    title="English Learning API",
    description="API for English speaking and writing practice with AI evaluation",
    version="1.0.0",
    lifespan=lifespan
)

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ========== HEALTH ==========
@app.get("/health", response_model=HealthResponse, tags=["Health"])
async def health_check():
    return HealthResponse(
        status="ok",
        minio_connected=check_minio_connected(),
        data_loaded=check_data_loaded()
    )

# ========== SPEAKING ==========
@app.post("/speaking/topic", response_model=SpeakingTopicResponse, tags=["Speaking"])
async def get_speaking_topic_endpoint(request: SpeakingTopicRequest):
    """Get a speaking topic (Express Opinion type from exam data)"""
    topic = get_speaking_topic(request.topic_id)
    if not topic:
        raise HTTPException(status_code=404, detail="No speaking topic found")
    return SpeakingTopicResponse(**topic)

@app.post("/speaking/evaluate", response_model=SpeakingEvaluateResponse, tags=["Speaking"])
async def evaluate_speaking_endpoint(request: SpeakingEvaluateRequest):
    """Evaluate speaking response (from speech-to-text transcript)"""
    # Get topic context
    topic = get_speaking_topic(request.topic_id)
    if not topic:
        raise HTTPException(status_code=404, detail="Topic not found")
    
    result = evaluate_speaking(request.topic_id, topic["context"], request.transcript)
    if not result:
        raise HTTPException(status_code=500, detail="Evaluation failed - check LLM configuration")
    return SpeakingEvaluateResponse(**result)

@app.post("/speaking/transcribe", response_model=TranscribeResponse, tags=["Speaking"])
async def transcribe_audio_endpoint(audio: UploadFile = File(...)):
    """
    Layer 1: Speech Recognition (ASR) - Transcribe audio to text using Groq Whisper
    Supports: wav, mp3, m4a, webm, ogg formats
    """
    # Validate file type
    allowed_types = ["audio/wav", "audio/mpeg", "audio/mp3", "audio/m4a", "audio/webm", "audio/ogg", "audio/x-wav"]
    if audio.content_type not in allowed_types:
        raise HTTPException(status_code=400, detail=f"Unsupported audio format: {audio.content_type}")
    
    # Read audio data
    audio_data = await audio.read()
    if len(audio_data) > 25 * 1024 * 1024:  # 25MB limit
        raise HTTPException(status_code=400, detail="Audio file too large (max 25MB)")
    
    # Transcribe
    transcript, metadata = transcribe_audio(audio_data, audio.filename or "audio.wav")
    
    if transcript:
        return TranscribeResponse(
            success=True,
            transcript=transcript,
            duration=metadata.get("duration"),
            language=metadata.get("language", "en")
        )
    else:
        return TranscribeResponse(
            success=False,
            error=metadata.get("error", "Transcription failed")
        )

@app.post("/speaking/evaluate-audio", response_model=SpeakingFullEvaluateResponse, tags=["Speaking"])
async def evaluate_speaking_audio_endpoint(
    audio: UploadFile = File(...),
    topic_id: str = Form(...),
    topic_context: Optional[str] = Form(None)
):
    """
    Full speaking evaluation with 4 layers:
    1. ASR (Speech Recognition) - using Groq Whisper
    2. Pronunciation & Fluency scoring - specialized for Vietnamese learners
    3. Grammar, Content & Topic Matching
    4. Overall assessment with detailed feedback
    
    Upload audio file (wav/mp3/m4a/webm) and get comprehensive evaluation.
    """
    # Validate file type
    allowed_types = ["audio/wav", "audio/mpeg", "audio/mp3", "audio/m4a", "audio/webm", "audio/ogg", "audio/x-wav"]
    if audio.content_type not in allowed_types:
        raise HTTPException(status_code=400, detail=f"Unsupported audio format: {audio.content_type}")
    
    # Get topic context if not provided
    if not topic_context:
        topic = get_speaking_topic(topic_id)
        if not topic:
            raise HTTPException(status_code=404, detail="Topic not found")
        topic_context = topic["context"]
    
    # Read audio data
    audio_data = await audio.read()
    if len(audio_data) > 25 * 1024 * 1024:  # 25MB limit
        raise HTTPException(status_code=400, detail="Audio file too large (max 25MB)")
    
    # Full evaluation with all layers
    result = evaluate_speaking_full(audio_data, topic_context, topic_id, audio.filename or "audio.wav")
    
    return SpeakingFullEvaluateResponse(**result)

@app.post("/speaking/evaluate-full", response_model=SpeakingFullEvaluateResponse, tags=["Speaking"])
async def evaluate_speaking_full_endpoint(request: SpeakingEvaluateRequest):
    """
    Full speaking evaluation from transcript (no audio) with detailed layers:
    2. Pronunciation & Fluency scoring (estimated from transcript)
    3. Grammar, Content & Topic Matching
    4. Overall assessment with Vietnamese learner tips
    
    Use this if you already have the transcript from another ASR service.
    """
    # Use provided topic_context or load from database
    if request.topic_context:
        topic_context = request.topic_context
    else:
        topic = get_speaking_topic(request.topic_id)
        if not topic:
            raise HTTPException(status_code=404, detail="Topic not found")
        topic_context = topic["context"]
    
    result = evaluate_speaking_from_transcript(request.topic_id, topic_context, request.transcript)
    if not result:
        raise HTTPException(status_code=500, detail="Evaluation failed - check LLM configuration")
    
    return SpeakingFullEvaluateResponse(**result)

# ========== PRONUNCIATION ==========
@app.post("/pronunciation", response_model=PronunciationResponse, tags=["Pronunciation"])
async def get_pronunciation_endpoint(request: PronunciationRequest):
    """Get pronunciation info for a word (IPA and audio URL)
    If word not found in dictionary, LLM will generate IPA and meanings.
    """
    result = get_pronunciation(request.word, generate_if_not_found=True)
    return PronunciationResponse(**result)

@app.get("/pronunciation/{word}", response_model=PronunciationResponse, tags=["Pronunciation"])
async def get_pronunciation_by_word(word: str, generate: bool = True):
    """Get pronunciation info for a word (IPA and audio URL)
    
    - **word**: The English word to look up
    - **generate**: If True and word not found, LLM will generate pronunciation (default: True)
    """
    result = get_pronunciation(word, generate_if_not_found=generate)
    return PronunciationResponse(**result)

@app.get("/pronunciation/{word}/tips", response_model=PronunciationTipsResponse, tags=["Pronunciation"])
async def get_pronunciation_tips_endpoint(word: str):
    """Get AI-generated pronunciation tips for a specific word
    
    Returns personalized tips for Vietnamese learners including:
    - Specific pronunciation tips for this word
    - Common mistakes Vietnamese speakers make
    - Similar sounding words for practice
    """
    # First get the IPA if available
    pron_result = get_pronunciation(word, generate_if_not_found=True)
    ipa = pron_result.get("ipa")
    
    # Generate tips
    result = get_pronunciation_tips(word, ipa)
    return PronunciationTipsResponse(**result)

@app.get("/pronunciation/{word}/related", response_model=RelatedWordsResponse, tags=["Pronunciation"])
async def get_related_words_endpoint(word: str):
    """Get related word forms (noun, verb, adjective, adverb forms)
    
    For example, "happy" might return: happiness, happily, unhappy, etc.
    Data is sourced from the dictionary in MinIO.
    """
    result = get_related_words(word)
    return RelatedWordsResponse(**result)

@app.get("/pronunciation/search/autocomplete", response_model=AutocompleteResponse, tags=["Pronunciation"])
async def search_autocomplete(q: str, limit: int = 10):
    """Search for words starting with query (autocomplete suggestions)
    
    - **q**: Search query (minimum 1 character)
    - **limit**: Maximum number of suggestions (default: 10, max: 20)
    """
    if not q or len(q) < 1:
        return AutocompleteResponse(query=q, suggestions=[])
    
    limit = min(limit, 20)  # Cap at 20
    suggestions = search_words(q, limit)
    return AutocompleteResponse(query=q, suggestions=suggestions)

@app.get("/pronunciation/{word}/audio", tags=["Pronunciation"])
async def get_pronunciation_audio(word: str):
    """Get pronunciation audio (MP3) for a word
    
    Audio is generated using Text-to-Speech, even for words not in dictionary.
    """
    # Generate audio (works for any word)
    audio_data = generate_pronunciation_audio(word)
    if not audio_data:
        raise HTTPException(status_code=500, detail="Failed to generate audio")
    
    return Response(
        content=audio_data,
        media_type="audio/mpeg",
        headers={"Content-Disposition": f"attachment; filename={word}.mp3"}
    )

# ========== WRITING ==========
@app.post("/writing/topic", response_model=WritingTopicResponse, tags=["Writing"])
async def get_writing_topic_endpoint(request: WritingTopicRequest):
    """Get a writing topic (exam, custom, or AI-generated)"""
    topic = get_writing_topic(request.topic_type.value, request.topic_id, request.category)
    if not topic:
        raise HTTPException(status_code=404, detail="No writing topic found")
    return WritingTopicResponse(**topic)

@app.post("/writing/evaluate", response_model=WritingEvaluateResponse, tags=["Writing"])
async def evaluate_writing_endpoint(request: WritingEvaluateRequest):
    """Evaluate writing essay with AI"""
    result = evaluate_writing(request.topic_id, request.topic_context, request.essay)
    if not result:
        raise HTTPException(status_code=500, detail="Evaluation failed - check LLM configuration")
    return WritingEvaluateResponse(**result)

# ========== TOPICS ==========
@app.get("/topics", response_model=TopicListResponse, tags=["Topics"])
async def list_all_topics():
    """List all available topics"""
    return TopicListResponse(**get_all_topics())

@app.post("/topics/generate", response_model=CustomTopicResponse, tags=["Topics"])
async def generate_custom_topic(request: CustomTopicRequest):
    """Generate a new custom topic using AI"""
    topic = generate_topic(request.category)
    if not topic:
        raise HTTPException(status_code=500, detail="Topic generation failed - check LLM configuration")
    return CustomTopicResponse(
        topic_id=topic["topic_id"],
        category=request.category,
        prompt_type=topic.get("prompt_type", ""),
        prompt=topic["context"]
    )

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8002)

# ========== YOUTUBE ==========
@app.post("/youtube/recommendations", response_model=YouTubeRecommendationsResponse, tags=["YouTube"])
async def get_youtube_recommendations(request: YouTubeRecommendationsRequest):
    """
    Get YouTube video recommendations based on evaluation feedback.
    
    Returns 2-3 relevant English learning videos for Vietnamese learners
    based on the weak areas identified in the evaluation.
    """
    videos = get_recommended_videos(
        feedback=request.feedback,
        weaknesses=request.weaknesses,
        skill_type=request.skill_type,
        max_videos=request.max_videos
    )
    
    # Get queries used for the search
    queries_used = list(set(v.get("search_query", "") for v in videos if v.get("search_query")))
    
    return YouTubeRecommendationsResponse(
        videos=[YouTubeVideo(**v) for v in videos],
        queries_used=queries_used
    )

@app.get("/youtube/search", tags=["YouTube"])
async def search_youtube(q: str, max_results: int = 3):
    """
    Search YouTube for English learning videos.
    
    - **q**: Search query
    - **max_results**: Maximum number of results (default: 3, max: 5)
    """
    from api.services import search_youtube_videos
    
    max_results = min(max_results, 5)
    videos = search_youtube_videos(q, max_results)
    
    return {
        "query": q,
        "videos": videos
    }
