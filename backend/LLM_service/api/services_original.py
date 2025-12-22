import os
import json
import random
import base64
import time
from typing import Optional, Tuple, List
from minio import Minio
from openai import OpenAI

# ========== CONFIG ==========
MINIO_ENDPOINT = os.getenv("MINIO_ENDPOINT", "localhost:9003")
MINIO_ACCESS_KEY = os.getenv("MINIO_ACCESS_KEY", "minioadmin")
MINIO_SECRET_KEY = os.getenv("MINIO_SECRET_KEY", "minioadmin")
MINIO_BUCKET = os.getenv("MINIO_BUCKET", "english-learning")

# Multiple Groq API Keys for quota management
GROQ_API_KEYS = os.getenv("GROQ_API_KEYS", os.getenv("GROQ_API_KEY", "")).split(",")
GROQ_API_KEYS = [key.strip() for key in GROQ_API_KEYS if key.strip()]

GROQ_BASE_URL = os.getenv("GROQ_BASE_URL", "https://api.groq.com/openai/v1")
LLM_MODEL = os.getenv("LLM_MODEL", "llama-3.1-8b-instant")
WHISPER_MODEL = os.getenv("WHISPER_MODEL", "whisper-large-v3-turbo")  # Groq Whisper

# ========== CLIENTS ==========
minio_client: Optional[Minio] = None
groq_clients: List[OpenAI] = []
current_groq_index = 0

# ========== DATA CACHE ==========
speaking_data = {}
writing_data = {}
custom_topics = []
pronunciation_data = {}

def init_minio():
    global minio_client
    try:
        minio_client = Minio(
            MINIO_ENDPOINT,
            access_key=MINIO_ACCESS_KEY,
            secret_key=MINIO_SECRET_KEY,
            secure=False
        )
        return True
    except Exception as e:
        print(f"MinIO init error: {e}")
        return False

def init_groq():
    global groq_clients, current_groq_index
    groq_clients = []
    
    if not GROQ_API_KEYS:
        print("No Groq API keys provided")
        return False
    
    for i, api_key in enumerate(GROQ_API_KEYS):
        if api_key:
            try:
                client = OpenAI(api_key=api_key, base_url=GROQ_BASE_URL)
                groq_clients.append(client)
                print(f"Initialized Groq client {i+1}/{len(GROQ_API_KEYS)}")
            except Exception as e:
                print(f"Failed to initialize Groq client {i+1}: {e}")
    
    current_groq_index = 0
    print(f"Total Groq clients: {len(groq_clients)}")
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
        print(f"Rotated to Groq client {current_groq_index + 1}/{len(groq_clients)}")

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
            print(f"Groq API error (attempt {attempt + 1}/{max_retries}): {str(e)[:100]}")
            
            if is_quota_error(e):
                print(f"Quota error detected, rotating to next API key...")
                rotate_groq_client()
                if attempt < max_retries - 1:  # Don't sleep on last attempt
                    time.sleep(1)  # Brief pause before retry
                continue
            else:
                # Non-quota error, don't retry
                raise e
    
    # All retries failed
    raise Exception(f"All Groq API keys failed. Last error: {last_error}")

def load_data_from_minio():
    """Load all data from MinIO bucket"""
    global speaking_data, writing_data, custom_topics
    
    if not minio_client:
        return False
    
    try:
        # Load speaking data
        objects = minio_client.list_objects(MINIO_BUCKET, prefix="speaking/", recursive=True)
        for obj in objects:
            if obj.object_name.endswith(".json"):
                response = minio_client.get_object(MINIO_BUCKET, obj.object_name)
                data = json.loads(response.read().decode('utf-8'))
                topic_id = obj.object_name.split("/")[1]
                speaking_data[topic_id] = data
                response.close()
                response.release_conn()
        
        # Load writing data
        objects = minio_client.list_objects(MINIO_BUCKET, prefix="writing/", recursive=True)
        for obj in objects:
            if obj.object_name.endswith(".json"):
                response = minio_client.get_object(MINIO_BUCKET, obj.object_name)
                data = json.loads(response.read().decode('utf-8'))
                topic_id = obj.object_name.split("/")[1]
                writing_data[topic_id] = data
                response.close()
                response.release_conn()
        
        # Load custom topics
        try:
            response = minio_client.get_object(MINIO_BUCKET, "topics/topics.json")
            custom_topics = json.loads(response.read().decode('utf-8'))
            response.close()
            response.release_conn()
        except:
            custom_topics = []
        
        print(f"Loaded {len(speaking_data)} speaking topics, {len(writing_data)} writing topics, {len(custom_topics)} custom topics")
        return True
    except Exception as e:
        print(f"Load data error: {e}")
        return False

# ========== SYSTEM PROMPTS ==========

# Prompt cho Layer 2: Chấm phát âm và độ trôi chảy (dành cho người Việt)
PRONUNCIATION_FLUENCY_PROMPT = """You are an expert English pronunciation and fluency evaluator, specialized in helping Vietnamese learners.

Analyze the transcript from speech recognition. Consider common Vietnamese speaker challenges:
- Difficulty with ending consonants (especially -s, -ed, -th)
- Confusion between /l/ and /n/, /r/ sounds
- Vowel length distinctions
- Word stress and intonation patterns
- Linking between words

Based on the transcript, evaluate:

1. **Pronunciation Score (0-10)**: Estimate pronunciation quality from the transcript
   - Look for words that might be mispronounced (reflected in unusual transcription)
   - Common Vietnamese pronunciation errors patterns

2. **Fluency Score (0-10)**: Assess speech flow
   - Sentence completeness and structure
   - Natural phrasing (look for fragmented or incomplete thoughts)
   - Filler words or hesitations (um, uh, etc.)
   - Response length and development

Respond in JSON format:
{
    "pronunciation_score": float,
    "pronunciation_feedback": "detailed feedback on pronunciation with specific examples",
    "pronunciation_issues": [{"word": "word", "issue": "description", "suggestion": "how to improve"}],
    "fluency_score": float,
    "fluency_feedback": "detailed feedback on fluency",
    "fluency_issues": ["issue 1", "issue 2"],
    "vietnamese_specific_tips": ["tip for Vietnamese learners"]
}"""

# Prompt cho Layer 3: Kiểm tra ngữ pháp & đánh giá nội dung + matching
GRAMMAR_CONTENT_PROMPT = """You are an expert English grammar and content evaluator for speaking tests.

Analyze the speaker's response transcript and evaluate:

1. **Grammar Score (0-10)**: 
   - Sentence structure correctness
   - Verb tense consistency
   - Subject-verb agreement
   - Article usage (a, an, the)
   - Preposition usage

2. **Vocabulary Score (0-10)**:
   - Range and variety of vocabulary
   - Appropriateness for the topic
   - Word choice accuracy

3. **Content/Coherence Score (0-10)**:
   - How well the response addresses the topic
   - Logical organization of ideas
   - Use of examples and supporting details
   - Conclusion or summary

4. **Topic Matching Score (0-10)**:
   - How relevant is the response to the given topic
   - Does it answer what was asked
   - Completeness of response

Respond in JSON format:
{
    "grammar_score": float,
    "grammar_feedback": "detailed grammar feedback",
    "grammar_errors": [{"error": "error text", "correction": "corrected text", "rule": "grammar rule explanation"}],
    "vocabulary_score": float,
    "vocabulary_feedback": "vocabulary feedback",
    "vocabulary_suggestions": ["better word choices"],
    "content_score": float,
    "content_feedback": "content organization feedback",
    "topic_matching_score": float,
    "matching_analysis": "how well the response matches the topic",
    "improvement_suggestions": ["suggestion 1", "suggestion 2"]
}"""

# Combined evaluation prompt (legacy support)
SPEAKING_EVAL_PROMPT = """You are an expert English speaking evaluator for TOEIC Speaking tests.
Your task is to evaluate the speaker's response based on the given topic.

Evaluate the following criteria (score 0-10 for each):
1. Pronunciation: How clear and accurate is the pronunciation?
2. Fluency: How smooth and natural is the speech flow?
3. Grammar: How correct is the grammar usage?
4. Vocabulary: How appropriate and varied is the vocabulary?
5. Coherence: How well-organized and logical is the response?

Provide specific feedback on:
- Errors found (grammar, vocabulary, pronunciation hints based on common mistakes)
- Suggestions for improvement
- Overall assessment

Respond in JSON format:
{
    "pronunciation_score": float,
    "fluency_score": float,
    "grammar_score": float,
    "vocabulary_score": float,
    "coherence_score": float,
    "overall_score": float,
    "feedback": "detailed feedback string",
    "errors": [{"type": "grammar|vocabulary|coherence", "text": "error text", "correction": "corrected text", "explanation": "why"}],
    "suggestions": ["suggestion 1", "suggestion 2"]
}"""

WRITING_EVAL_PROMPT = """You are an expert English writing evaluator for TOEIC Writing tests and IELTS essays.
Your task is to evaluate the essay based on the given topic/prompt.

Evaluate the following criteria (score 0-10 for each):
1. Task Achievement: How well does the essay address the topic requirements?
2. Coherence & Cohesion: How well-organized is the essay with proper linking?
3. Lexical Resource: How varied and appropriate is the vocabulary?
4. Grammar Accuracy: How correct is the grammar usage?

Analyze how well the essay matches the topic requirements (matching analysis).

Provide:
- Detailed feedback
- Specific errors found
- Suggestions for improvement
- An improved version of key sentences (optional)

Respond in JSON format:
{
    "task_achievement_score": float,
    "coherence_cohesion_score": float,
    "lexical_resource_score": float,
    "grammar_accuracy_score": float,
    "overall_score": float,
    "matching_analysis": "how well the essay matches topic requirements",
    "feedback": "detailed feedback string",
    "errors": [{"type": "grammar|vocabulary|coherence|task", "text": "error text", "correction": "corrected text", "explanation": "why"}],
    "suggestions": ["suggestion 1", "suggestion 2"],
    "improved_version": "optional improved essay or key sentences"
}"""

TOPIC_GEN_PROMPT = """You are an expert IELTS/TOEIC essay topic generator.
Generate a writing topic for the given category.

The topic should:
1. Be appropriate for IELTS Task 2 or TOEIC essay writing
2. Be clear and specific
3. Include a discussion point or opinion request
4. Be challenging but achievable

Available topic types: agree/disagree, problem/solution, advantages/disadvantages, two-part, opinion, discuss both views, causes/solutions, priorities

Respond in JSON format:
{
    "prompt_type": "type of prompt",
    "prompt": "the full topic prompt"
}"""

# ========== SERVICE FUNCTIONS ==========
def get_speaking_topic(topic_id: Optional[str] = None) -> Optional[dict]:
    """Get a speaking topic (question 7 - Express Opinion)"""
    if not speaking_data:
        return None
    
    if topic_id and topic_id in speaking_data:
        data = speaking_data[topic_id]
    else:
        topic_id = random.choice(list(speaking_data.keys()))
        data = speaking_data[topic_id]
    
    # Find question 7 (Express Opinion)
    for q in data.get("questions", []):
        if str(q.get("questionNumber")) == "7":
            return {
                "topic_id": topic_id,
                "test_name": data.get("testName", ""),
                "question_type": q.get("questionType", "Express Opinion"),
                "context": q.get("context", ""),
                "image_urls": q.get("imageUrls", [])
            }
    return None

def get_writing_topic(topic_type: str, topic_id: Optional[str] = None, category: Optional[str] = None) -> Optional[dict]:
    """Get a writing topic based on type"""
    if topic_type == "exam":
        if not writing_data:
            return None
        
        if topic_id and topic_id in writing_data:
            data = writing_data[topic_id]
        else:
            topic_id = random.choice(list(writing_data.keys()))
            data = writing_data[topic_id]
        
        # Find question 8 (Opinion Essay)
        for q in data.get("questions", []):
            if str(q.get("questionNumber")) == "8":
                return {
                    "topic_id": topic_id,
                    "topic_type": "exam",
                    "test_name": data.get("testName", ""),
                    "question_type": q.get("questionType", "Opinion Essay"),
                    "context": q.get("context", "")
                }
        return None
    
    elif topic_type == "custom":
        if not custom_topics:
            return None
        
        if category:
            filtered = [t for t in custom_topics if t.get("category", "").lower() == category.lower()]
            if filtered:
                topic = random.choice(filtered)
            else:
                topic = random.choice(custom_topics)
        else:
            topic = random.choice(custom_topics)
        
        return {
            "topic_id": f"custom_{custom_topics.index(topic)}",
            "topic_type": "custom",
            "question_type": topic.get("type", ""),
            "context": topic.get("prompt", ""),
            "category": topic.get("category", ""),
            "prompt_type": topic.get("type", "")
        }
    
    elif topic_type == "generated":
        # Generate using LLM
        return generate_topic(category or "general")
    
    return None

def generate_topic(category: str) -> Optional[dict]:
    """Generate a new topic using LLM"""
    if not groq_clients:
        return None
    
    try:
        def api_call(client):
            return client.chat.completions.create(
                model=LLM_MODEL,
                messages=[
                    {"role": "system", "content": TOPIC_GEN_PROMPT},
                    {"role": "user", "content": f"Generate a writing topic for category: {category}"}
                ],
                response_format={"type": "json_object"}
            )
        
        response = groq_api_call_with_retry(api_call)
        result = json.loads(response.choices[0].message.content)
        topic_id = f"gen_{random.randint(10000, 99999)}"
        return {
            "topic_id": topic_id,
            "topic_type": "generated",
            "question_type": result.get("prompt_type", "opinion"),
            "context": result.get("prompt", ""),
            "category": category,
            "prompt_type": result.get("prompt_type", "")
        }
    except Exception as e:
        print(f"Topic generation error: {e}")
        return None

# ========== SPEAKING EVALUATION - 4 LAYERS ==========

def transcribe_audio(audio_data: bytes, filename: str = "audio.wav") -> Tuple[Optional[str], Optional[dict]]:
    """
    Layer 1: Speech Recognition (ASR) using Groq Whisper
    Returns: (transcript, metadata)
    """
    if not groq_clients:
        return None, {"error": "Groq clients not initialized"}
    
    try:
        # Create a file-like object for the audio
        import io
        
        def api_call(client):
            audio_file = io.BytesIO(audio_data)
            audio_file.name = filename
            
            # Use Groq Whisper for transcription
            transcription = client.audio.transcriptions.create(
                model=WHISPER_MODEL,
                file=audio_file,
                language="en",  # Force English transcription
                response_format="verbose_json"
            )
            return transcription
        
        # Use retry mechanism
        transcription = groq_api_call_with_retry(api_call)
        
        metadata = {
            "language": getattr(transcription, 'language', 'en'),
            "duration": getattr(transcription, 'duration', None),
            "segments": getattr(transcription, 'segments', []),
        }
        
        return transcription.text, metadata
    except Exception as e:
        print(f"Transcription error: {e}")
        return None, {"error": str(e)}

def evaluate_pronunciation_fluency(transcript: str) -> Optional[dict]:
    """
    Layer 2: Evaluate Pronunciation & Fluency
    Specialized for Vietnamese learners
    """
    if not groq_clients:
        return None
    
    try:
        def api_call(client):
            return client.chat.completions.create(
                model=LLM_MODEL,
                messages=[
                    {"role": "system", "content": PRONUNCIATION_FLUENCY_PROMPT},
                    {"role": "user", "content": f"Transcript to evaluate:\n\n{transcript}"}
                ],
                response_format={"type": "json_object"}
            )
        
        response = groq_api_call_with_retry(api_call)
        return json.loads(response.choices[0].message.content)
    except Exception as e:
        print(f"Pronunciation/Fluency evaluation error: {e}")
        return None

def evaluate_grammar_content(transcript: str, topic_context: str) -> Optional[dict]:
    """
    Layer 3: Evaluate Grammar, Content & Topic Matching
    """
    if not groq_clients:
        return None
    
    try:
        def api_call(client):
            return client.chat.completions.create(
                model=LLM_MODEL,
                messages=[
                    {"role": "system", "content": GRAMMAR_CONTENT_PROMPT},
                    {"role": "user", "content": f"Topic/Question: {topic_context}\n\nSpeaker's Response Transcript:\n{transcript}"}
                ],
                response_format={"type": "json_object"}
            )
        
        response = groq_api_call_with_retry(api_call)
        return json.loads(response.choices[0].message.content)
    except Exception as e:
        print(f"Grammar/Content evaluation error: {e}")
        return None

def evaluate_speaking_full(audio_data: bytes, topic_context: str, topic_id: str, filename: str = "audio.wav") -> dict:
    """
    Full speaking evaluation with 4 layers:
    1. ASR (Speech Recognition)
    2. Pronunciation & Fluency
    3. Grammar, Content & Topic Matching
    4. Combined overall assessment
    """
    result = {
        "topic_id": topic_id,
        "success": False,
        "layers": {}
    }
    
    # Layer 1: ASR
    transcript, asr_metadata = transcribe_audio(audio_data, filename)
    if not transcript:
        result["error"] = "Speech recognition failed"
        result["layers"]["asr"] = {"error": asr_metadata.get("error", "Unknown error")}
        return result
    
    result["transcript"] = transcript
    result["layers"]["asr"] = {
        "transcript": transcript,
        "duration": asr_metadata.get("duration"),
        "language": asr_metadata.get("language", "en")
    }
    
    # Layer 2: Pronunciation & Fluency
    pron_fluency = evaluate_pronunciation_fluency(transcript)
    if pron_fluency:
        result["layers"]["pronunciation_fluency"] = pron_fluency
    else:
        result["layers"]["pronunciation_fluency"] = {"error": "Evaluation failed"}
    
    # Layer 3: Grammar, Content & Matching
    grammar_content = evaluate_grammar_content(transcript, topic_context)
    if grammar_content:
        result["layers"]["grammar_content"] = grammar_content
    else:
        result["layers"]["grammar_content"] = {"error": "Evaluation failed"}
    
    # Layer 4: Combined Assessment
    result["success"] = True
    result["scores"] = calculate_overall_scores(pron_fluency, grammar_content)
    result["feedback"] = generate_overall_feedback(pron_fluency, grammar_content, transcript)
    
    return result

def calculate_overall_scores(pron_fluency: Optional[dict], grammar_content: Optional[dict]) -> dict:
    """Calculate overall scores from all layers"""
    scores = {
        "pronunciation": 0,
        "fluency": 0,
        "grammar": 0,
        "vocabulary": 0,
        "content": 0,
        "topic_matching": 0,
        "overall": 0
    }
    
    if pron_fluency:
        scores["pronunciation"] = pron_fluency.get("pronunciation_score", 0)
        scores["fluency"] = pron_fluency.get("fluency_score", 0)
    
    if grammar_content:
        scores["grammar"] = grammar_content.get("grammar_score", 0)
        scores["vocabulary"] = grammar_content.get("vocabulary_score", 0)
        scores["content"] = grammar_content.get("content_score", 0)
        scores["topic_matching"] = grammar_content.get("topic_matching_score", 0)
    
    # Calculate overall score (weighted average)
    weights = {
        "pronunciation": 0.20,
        "fluency": 0.15,
        "grammar": 0.20,
        "vocabulary": 0.15,
        "content": 0.15,
        "topic_matching": 0.15
    }
    
    total_score = sum(scores[k] * weights.get(k, 0) for k in weights.keys())
    scores["overall"] = round(total_score, 1)
    
    return scores

def generate_overall_feedback(pron_fluency: Optional[dict], grammar_content: Optional[dict], transcript: str) -> dict:
    """Generate combined feedback from all layers"""
    feedback = {
        "summary": "",
        "strengths": [],
        "improvements": [],
        "vietnamese_tips": [],
        "errors": [],
        "suggestions": []
    }
    
    # Collect from pronunciation/fluency
    if pron_fluency:
        if pron_fluency.get("pronunciation_score", 0) >= 7:
            feedback["strengths"].append("Good pronunciation clarity")
        if pron_fluency.get("fluency_score", 0) >= 7:
            feedback["strengths"].append("Natural speech flow")
        
        feedback["improvements"].extend(pron_fluency.get("fluency_issues", []))
        feedback["vietnamese_tips"] = pron_fluency.get("vietnamese_specific_tips", [])
        
        for issue in pron_fluency.get("pronunciation_issues", []):
            feedback["errors"].append({
                "type": "pronunciation",
                "text": issue.get("word", ""),
                "issue": issue.get("issue", ""),
                "suggestion": issue.get("suggestion", "")
            })
    
    # Collect from grammar/content
    if grammar_content:
        if grammar_content.get("grammar_score", 0) >= 7:
            feedback["strengths"].append("Strong grammar usage")
        if grammar_content.get("vocabulary_score", 0) >= 7:
            feedback["strengths"].append("Good vocabulary range")
        if grammar_content.get("topic_matching_score", 0) >= 7:
            feedback["strengths"].append("Excellent topic relevance")
        
        for error in grammar_content.get("grammar_errors", []):
            feedback["errors"].append({
                "type": "grammar",
                "text": error.get("error", ""),
                "correction": error.get("correction", ""),
                "rule": error.get("rule", "")
            })
        
        feedback["suggestions"] = grammar_content.get("improvement_suggestions", [])
        feedback["suggestions"].extend(grammar_content.get("vocabulary_suggestions", []))
    
    # Generate summary
    if feedback["strengths"]:
        feedback["summary"] = f"Strengths: {', '.join(feedback['strengths'][:3])}. "
    if feedback["improvements"]:
        feedback["summary"] += f"Areas to improve: {', '.join(feedback['improvements'][:2])}."
    
    return feedback

def evaluate_speaking_from_transcript(topic_id: str, context: str, transcript: str) -> Optional[dict]:
    """
    Evaluate speaking from text transcript (no audio)
    Uses Layer 2 + Layer 3 only
    """
    result = {
        "topic_id": topic_id,
        "transcript": transcript,
        "success": False,
        "layers": {}
    }
    
    # Layer 2: Pronunciation & Fluency (estimated from transcript)
    pron_fluency = evaluate_pronunciation_fluency(transcript)
    if pron_fluency:
        result["layers"]["pronunciation_fluency"] = pron_fluency
    
    # Layer 3: Grammar, Content & Matching
    grammar_content = evaluate_grammar_content(transcript, context)
    if grammar_content:
        result["layers"]["grammar_content"] = grammar_content
    
    # Calculate scores
    result["success"] = True
    result["scores"] = calculate_overall_scores(pron_fluency, grammar_content)
    result["feedback"] = generate_overall_feedback(pron_fluency, grammar_content, transcript)
    
    return result

def evaluate_speaking(topic_id: str, context: str, transcript: str) -> Optional[dict]:
    """Legacy function - redirects to new evaluation"""
    result = evaluate_speaking_from_transcript(topic_id, context, transcript)
    if result and result.get("success"):
        # Convert to legacy format for backward compatibility
        scores = result.get("scores", {})
        feedback = result.get("feedback", {})
        return {
            "topic_id": topic_id,
            "transcript": transcript,
            "pronunciation_score": scores.get("pronunciation", 0),
            "fluency_score": scores.get("fluency", 0),
            "grammar_score": scores.get("grammar", 0),
            "vocabulary_score": scores.get("vocabulary", 0),
            "coherence_score": scores.get("content", 0),
            "overall_score": scores.get("overall", 0),
            "feedback": feedback.get("summary", ""),
            "errors": feedback.get("errors", []),
            "suggestions": feedback.get("suggestions", [])
        }
    return None

def evaluate_writing(topic_id: str, context: str, essay: str) -> Optional[dict]:
    """Evaluate writing essay using LLM"""
    if not groq_clients:
        return None
    
    try:
        def api_call(client):
            return client.chat.completions.create(
                model=LLM_MODEL,
                messages=[
                    {"role": "system", "content": WRITING_EVAL_PROMPT},
                    {"role": "user", "content": f"Topic/Prompt: {context}\n\nEssay: {essay}"}
                ],
                response_format={"type": "json_object"}
            )
        
        response = groq_api_call_with_retry(api_call)
        result = json.loads(response.choices[0].message.content)
        result["topic_id"] = topic_id
        result["essay"] = essay
        return result
    except Exception as e:
        print(f"Writing evaluation error: {e}")
        return None

def get_pronunciation(word: str) -> dict:
    """Get pronunciation info for a word"""
    global pronunciation_data
    
    word_lower = word.lower().strip()
    
    # Check cache first
    if word_lower in pronunciation_data:
        return {
            "word": word,
            "ipa": pronunciation_data[word_lower].get("ipa"),
            "audio_url": pronunciation_data[word_lower].get("audio_url"),
            "found": True
        }
    
    # Try to load from MinIO
    if minio_client:
        try:
            response = minio_client.get_object(MINIO_BUCKET, f"pronunciation/{word_lower}.json")
            data = json.loads(response.read().decode('utf-8'))
            pronunciation_data[word_lower] = data
            response.close()
            response.release_conn()
            
            # Generate audio URL if not exists
            audio_url = data.get("audio_url", "")
            if not audio_url:
                audio_url = f"http://localhost:8002/pronunciation/{word_lower}/audio"
            
            return {
                "word": word,
                "ipa": data.get("ipa"),
                "audio_url": audio_url,
                "found": True
            }
        except:
            pass
    
    return {
        "word": word,
        "ipa": None,
        "audio_url": None,
        "found": False
    }

def get_all_topics() -> dict:
    """Get list of all available topics"""
    speaking = [{"id": k, "name": v.get("testName", k)} for k, v in speaking_data.items()]
    writing_exam = [{"id": k, "name": v.get("testName", k)} for k, v in writing_data.items()]
    writing_custom = [{"id": f"custom_{i}", "category": t.get("category"), "type": t.get("type")} 
                      for i, t in enumerate(custom_topics)]
    
    return {
        "speaking_topics": speaking,
        "writing_exam_topics": writing_exam,
        "writing_custom_topics": writing_custom
    }

def check_minio_connected() -> bool:
    if not minio_client:
        return False
    try:
        minio_client.bucket_exists(MINIO_BUCKET)
        return True
    except:
        return False

def check_data_loaded() -> bool:
    return len(speaking_data) > 0 or len(writing_data) > 0 or len(custom_topics) > 0

def generate_pronunciation_audio(word: str) -> Optional[bytes]:
    """Generate pronunciation audio using Text-to-Speech"""
    try:
        from gtts import gTTS
        import io
        
        # Create TTS with slow speech for pronunciation
        tts = gTTS(text=word, lang='en', slow=True)
        audio_buffer = io.BytesIO()
        tts.write_to_fp(audio_buffer)
        audio_buffer.seek(0)
        return audio_buffer.read()
    except Exception as e:
        print(f"Error generating audio for '{word}': {e}")
        return None
