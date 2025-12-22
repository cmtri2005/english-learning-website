"""
Topics Management Module
Handles topic retrieval, generation, and pronunciation services
"""

import json
import random
from typing import Optional, Dict

# Import clients (these are initialized)
from .clients import groq_api_call_with_retry, LLM_MODEL

# Lazy import to avoid circular dependency and ensure data is loaded
def _get_data():
    """Get data modules after they're loaded"""
    from .data_loader import speaking_data, writing_data, custom_topics, get_pronunciation_data
    return speaking_data, writing_data, custom_topics, get_pronunciation_data

def _get_clients():
    """Get client modules"""
    from .clients import groq_clients, minio_client, MINIO_BUCKET
    return groq_clients, minio_client, MINIO_BUCKET

# ========== TOPIC GENERATION PROMPT ==========
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

# ========== SPEAKING TOPICS ==========
def get_speaking_topic(topic_id: Optional[str] = None) -> Optional[dict]:
    """Get a speaking topic (question 7 - Express Opinion)"""
    speaking_data, _, _, _ = _get_data()
    
    if not speaking_data:
        print("❌ No speaking data loaded")
        return None
    
    if topic_id and topic_id in speaking_data:
        data = speaking_data[topic_id]
        print(f"📝 Retrieved specific speaking topic: {topic_id}")
    else:
        topic_id = random.choice(list(speaking_data.keys()))
        data = speaking_data[topic_id]
        print(f"🎲 Generated random speaking topic: {topic_id}")
    
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
    
    print(f"⚠️ No question 7 found in topic {topic_id}")
    return None

# ========== WRITING TOPICS ==========
def get_writing_topic(topic_type: str, topic_id: Optional[str] = None, category: Optional[str] = None) -> Optional[dict]:
    """Get a writing topic based on type (exam/custom/generated)"""
    print(f"🔍 Getting writing topic: type={topic_type}, id={topic_id}, category={category}")
    
    if topic_type == "exam":
        return _get_exam_writing_topic(topic_id)
    elif topic_type == "custom":
        return _get_custom_writing_topic(category)
    elif topic_type == "generated":
        return generate_topic(category or "general")
    else:
        print(f"❌ Unknown topic type: {topic_type}")
        return None

def _get_exam_writing_topic(topic_id: Optional[str] = None) -> Optional[dict]:
    """Get exam writing topic (question 8 - Opinion Essay)"""
    _, writing_data, _, _ = _get_data()
    
    if not writing_data:
        print("❌ No writing exam data loaded")
        return None
    
    if topic_id and topic_id in writing_data:
        data = writing_data[topic_id]
        print(f"📝 Retrieved specific writing topic: {topic_id}")
    else:
        topic_id = random.choice(list(writing_data.keys()))
        data = writing_data[topic_id]
        print(f"🎲 Generated random writing topic: {topic_id}")
    
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
    
    print(f"⚠️ No question 8 found in topic {topic_id}")
    return None

def _get_custom_writing_topic(category: Optional[str] = None) -> Optional[dict]:
    """Get custom writing topic"""
    _, _, custom_topics, _ = _get_data()
    
    if not custom_topics:
        print("❌ No custom topics loaded")
        return None
    
    if category:
        filtered = [t for t in custom_topics if t.get("category", "").lower() == category.lower()]
        if filtered:
            topic = random.choice(filtered)
            print(f"📝 Retrieved custom topic for category: {category}")
        else:
            topic = random.choice(custom_topics)
            print(f"⚠️ No topics for category '{category}', using random")
    else:
        topic = random.choice(custom_topics)
        print("🎲 Generated random custom topic")
    
    return {
        "topic_id": f"custom_{custom_topics.index(topic)}",
        "topic_type": "custom",
        "question_type": topic.get("type", ""),
        "context": topic.get("prompt", ""),
        "category": topic.get("category", ""),
        "prompt_type": topic.get("type", "")
    }

def generate_topic(category: str) -> Optional[dict]:
    """Generate a new topic using AI"""
    groq_clients, _, _ = _get_clients()
    
    if not groq_clients:
        print("❌ No Groq clients available for topic generation")
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
        
        print(f"🤖 Generating AI topic for category: {category}")
        response = groq_api_call_with_retry(api_call)
        result = json.loads(response.choices[0].message.content)
        topic_id = f"gen_{random.randint(10000, 99999)}"
        
        generated_topic = {
            "topic_id": topic_id,
            "topic_type": "generated",
            "question_type": result.get("prompt_type", "opinion"),
            "context": result.get("prompt", ""),
            "category": category,
            "prompt_type": result.get("prompt_type", "")
        }
        
        print(f"✅ Generated topic: {topic_id}")
        return generated_topic
        
    except Exception as e:
        print(f"❌ Topic generation error: {e}")
        return None

# ========== PRONUNCIATION SERVICES ==========

# LLM Prompts for pronunciation features
PRONUNCIATION_TIPS_PROMPT = """Bạn là giáo viên tiếng Anh chuyên dạy phát âm cho người Việt.
Hãy đưa ra mẹo phát âm cụ thể cho từ được cung cấp.

Quy tắc:
1. Mẹo phải ngắn gọn, dễ hiểu (tối đa 2-3 câu)
2. Tập trung vào những âm khó với người Việt
3. Sử dụng so sánh với âm tiếng Việt khi có thể
4. Đề cập đến trọng âm nếu từ có nhiều âm tiết

BẮT BUỘC trả về JSON với ĐẦY ĐỦ 3 fields (không được bỏ trống):
{
    "tips": "Mẹo phát âm cụ thể cho từ này (REQUIRED)",
    "common_mistakes": ["Lỗi 1", "Lỗi 2", "Lỗi 3"],
    "similar_sounds": ["word1", "word2", "word3"]
}

CHÚ Ý:
- "common_mistakes" PHẢI có ít nhất 2 lỗi thường gặp của người Việt
- "similar_sounds" PHẢI có ít nhất 2 từ tiếng Anh có âm tương tự để luyện tập
- Không được trả về mảng rỗng []"""

GENERATE_IPA_PROMPT = """Bạn là chuyên gia ngữ âm học tiếng Anh.
Hãy cung cấp phiên âm IPA và nghĩa tiếng Việt cho từ được yêu cầu.

BẮT BUỘC trả về JSON với ĐẦY ĐỦ fields:
{
    "ipa": "/ˈphiên âm IPA/",
    "meanings": [
        {"type": "noun", "meaning": "nghĩa tiếng Việt"},
        {"type": "verb", "meaning": "nghĩa tiếng Việt"},
        {"type": "adjective", "meaning": "nghĩa tiếng Việt"}
    ]
}

Lưu ý:
- IPA phải chính xác theo chuẩn quốc tế (bao gồm dấu /)
- "meanings" PHẢI có ít nhất 1-3 từ loại phổ biến nhất
- Mỗi meaning phải có "type" và "meaning"
- Nghĩa phải ngắn gọn, rõ ràng, bằng tiếng Việt"""


def get_pronunciation(word: str, generate_if_not_found: bool = True) -> dict:
    """Get pronunciation info for a word, optionally generate with LLM if not found"""
    _, _, _, get_pronunciation_data = _get_data()
    groq_clients, _, _ = _get_clients()
    
    word_lower = word.lower().strip()
    print(f"🔊 Looking up pronunciation for: {word_lower}")
    
    # Get pronunciation data (lazy loaded)
    pron_data = get_pronunciation_data(word_lower)
    
    if pron_data:
        print(f"✅ Found pronunciation for: {word_lower}")
        return {
            "word": word,
            "ipa": pron_data.get("ipa"),
            "audio_url": f"/pronunciation/{word_lower}/audio",
            "found": True,
            "meanings": pron_data.get("meanings", []),
            "generated": False
        }
    
    # If not found and LLM is available, generate pronunciation
    if generate_if_not_found and groq_clients:
        print(f"🤖 Generating pronunciation for: {word_lower}")
        try:
            def api_call(client):
                return client.chat.completions.create(
                    model=LLM_MODEL,
                    messages=[
                        {"role": "system", "content": GENERATE_IPA_PROMPT},
                        {"role": "user", "content": f"Từ: {word}"}
                    ],
                    response_format={"type": "json_object"},
                    temperature=0.3  # Lower temperature for more consistent IPA
                )
            
            response = groq_api_call_with_retry(api_call)
            result = json.loads(response.choices[0].message.content)
            
            # Validate and ensure required fields
            ipa = result.get("ipa", "").strip()
            meanings = result.get("meanings", [])
            
            # Ensure meanings is a valid list with at least one entry
            if not meanings or not isinstance(meanings, list) or len(meanings) == 0:
                meanings = [{"type": "unknown", "meaning": "từ tiếng Anh"}]
            
            # Ensure each meaning has required fields
            validated_meanings = []
            for m in meanings:
                if isinstance(m, dict) and "type" in m and "meaning" in m:
                    validated_meanings.append({
                        "type": m["type"],
                        "meaning": m["meaning"]
                    })
            
            if not validated_meanings:
                validated_meanings = [{"type": "unknown", "meaning": "từ tiếng Anh"}]
            
            print(f"✅ Generated pronunciation for: {word_lower} (meanings: {len(validated_meanings)})")
            return {
                "word": word,
                "ipa": ipa if ipa else None,
                "audio_url": f"/pronunciation/{word_lower}/audio",
                "found": True,
                "meanings": validated_meanings,
                "generated": True
            }
        except Exception as e:
            print(f"❌ Failed to generate pronunciation: {e}")
    
    print(f"❌ Pronunciation not found: {word_lower}")
    return {
        "word": word,
        "ipa": None,
        "audio_url": None,
        "found": False,
        "meanings": [],
        "generated": False
    }


def get_pronunciation_tips(word: str, ipa: str = None) -> dict:
    """Generate pronunciation tips for a specific word using LLM"""
    groq_clients, _, _ = _get_clients()
    
    default_result = {
        "word": word,
        "ipa": ipa,
        "tips": "Lắng nghe cách phát âm và thử lặp lại. Chú ý đến trọng âm và các âm cuối từ.",
        "common_mistakes": ["Cần luyện tập nhiều hơn để nắm vững cách phát âm"],
        "similar_sounds": []
    }
    
    if not groq_clients:
        print("❌ No Groq clients available for tips generation")
        return default_result
    
    try:
        ipa_info = f" (IPA: {ipa})" if ipa else ""
        
        def api_call(client):
            return client.chat.completions.create(
                model=LLM_MODEL,
                messages=[
                    {"role": "system", "content": PRONUNCIATION_TIPS_PROMPT},
                    {"role": "user", "content": f"Từ: {word}{ipa_info}"}
                ],
                response_format={"type": "json_object"},
                temperature=0.7
            )
        
        print(f"🤖 Generating tips for: {word}")
        response = groq_api_call_with_retry(api_call)
        result = json.loads(response.choices[0].message.content)
        
        # Validate and ensure all required fields are present
        tips = result.get("tips", "").strip()
        common_mistakes = result.get("common_mistakes", [])
        similar_sounds = result.get("similar_sounds", [])
        
        # Ensure arrays are not empty - provide defaults if needed
        if not tips:
            tips = f"Chú ý cách phát âm '{word}' một cách rõ ràng và chính xác."
        
        if not common_mistakes or not isinstance(common_mistakes, list) or len(common_mistakes) == 0:
            common_mistakes = ["Cần luyện tập nhiều hơn để nắm vững cách phát âm"]
        
        if not similar_sounds or not isinstance(similar_sounds, list):
            similar_sounds = []
        
        print(f"✅ Generated tips for: {word} (mistakes: {len(common_mistakes)}, similar: {len(similar_sounds)})")
        
        return {
            "word": word,
            "ipa": ipa,
            "tips": tips,
            "common_mistakes": common_mistakes,
            "similar_sounds": similar_sounds
        }
    except Exception as e:
        print(f"❌ Tips generation error: {e}")
        return default_result


def get_related_words(word: str) -> dict:
    """Get related word forms from dictionary using prefix search"""
    _, _, _, get_pronunciation_data = _get_data()
    _, minio_client, MINIO_BUCKET = _get_clients()
    
    word_lower = word.lower().strip()
    related = []
    
    if not minio_client or len(word_lower) < 2:
        return {"word": word, "related_words": [], "synonyms": [], "antonyms": []}
    
    # Get the word stem (first 3-5 characters depending on word length)
    stem_length = min(max(3, len(word_lower) - 2), 5)
    stem = word_lower[:stem_length]
    
    try:
        # Find all words starting with the stem
        objects = minio_client.list_objects(
            MINIO_BUCKET, 
            prefix=f"pronunciation/{stem}",
            recursive=False
        )
        
        for obj in objects:
            if len(related) >= 8:
                break
                
            filename = obj.object_name.split("/")[-1]
            if filename.endswith(".json"):
                related_word = filename[:-5]
                
                # Skip the original word itself
                if related_word == word_lower:
                    continue
                
                # Only include words that share more similarity
                # (start with same prefix or are clearly related)
                if len(related_word) >= len(stem):
                    try:
                        response = minio_client.get_object(MINIO_BUCKET, obj.object_name)
                        data = json.loads(response.read().decode('utf-8'))
                        response.close()
                        response.release_conn()
                        
                        related.append({
                            "word": related_word,
                            "ipa": data.get("ipa"),
                            "meanings": data.get("meanings", [])[:2]  # Limit meanings
                        })
                    except:
                        pass
        
        print(f"📚 Found {len(related)} related words for: {word}")
        
    except Exception as e:
        print(f"❌ Error finding related words: {e}")
    
    return {
        "word": word,
        "related_words": related,
        "synonyms": [],
        "antonyms": []
    }


def search_words(query: str, limit: int = 10) -> list:
    """Search for words starting with query (autocomplete)"""
    _, minio_client, MINIO_BUCKET = _get_clients()
    
    if not minio_client or not query:
        return []
    
    query_lower = query.lower().strip()
    suggestions = []
    
    try:
        # List objects with prefix matching the query
        objects = minio_client.list_objects(
            MINIO_BUCKET, 
            prefix=f"pronunciation/{query_lower}",
            recursive=False
        )
        
        for obj in objects:
            if len(suggestions) >= limit:
                break
            
            # Extract word from path (pronunciation/word.json -> word)
            filename = obj.object_name.split("/")[-1]
            if filename.endswith(".json"):
                word = filename[:-5]  # Remove .json
                
                # Get IPA for this word (quick lookup)
                try:
                    response = minio_client.get_object(MINIO_BUCKET, obj.object_name)
                    data = json.loads(response.read().decode('utf-8'))
                    response.close()
                    response.release_conn()
                    
                    suggestions.append({
                        "word": word,
                        "ipa": data.get("ipa")
                    })
                except:
                    suggestions.append({
                        "word": word,
                        "ipa": None
                    })
        
        print(f"🔍 Found {len(suggestions)} suggestions for: {query}")
        return suggestions
        
    except Exception as e:
        print(f"❌ Search error: {e}")
        return []

def generate_pronunciation_audio(word: str) -> Optional[bytes]:
    """Generate pronunciation audio using Text-to-Speech"""
    try:
        from gtts import gTTS
        import io
        
        print(f"🎵 Generating audio for: {word}")
        # Create TTS with slow speech for pronunciation
        tts = gTTS(text=word, lang='en', slow=True)
        audio_buffer = io.BytesIO()
        tts.write_to_fp(audio_buffer)
        audio_buffer.seek(0)
        
        print(f"✅ Audio generated for: {word}")
        return audio_buffer.read()
        
    except Exception as e:
        print(f"❌ Error generating audio for '{word}': {e}")
        return None

# ========== TOPIC LISTING ==========
def get_all_topics() -> dict:
    """Get list of all available topics"""
    speaking_data, writing_data, custom_topics, _ = _get_data()
    
    speaking = [{"id": k, "name": v.get("testName", k)} for k, v in speaking_data.items()]
    writing_exam = [{"id": k, "name": v.get("testName", k)} for k, v in writing_data.items()]
    writing_custom = [{"id": f"custom_{i}", "category": t.get("category"), "type": t.get("type")} 
                      for i, t in enumerate(custom_topics)]
    
    print(f"📊 Topics available: {len(speaking)} speaking, {len(writing_exam)} writing exam, {len(writing_custom)} custom")
    
    return {
        "speaking_topics": speaking,
        "writing_exam_topics": writing_exam,
        "writing_custom_topics": writing_custom,
        "total": len(speaking) + len(writing_exam) + len(writing_custom)
    }

# Export functions
__all__ = [
    'get_speaking_topic', 'get_writing_topic', 'generate_topic',
    'get_all_topics', 'get_pronunciation', 'generate_pronunciation_audio',
    'get_pronunciation_tips', 'get_related_words', 'search_words'
]
