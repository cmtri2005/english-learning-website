"""
Speaking Evaluation Module
Implements 4-layer speaking evaluation system for Vietnamese learners:
1. ASR (Automatic Speech Recognition)
2. Pronunciation & Fluency Analysis  
3. Grammar, Content & Topic Matching
4. Overall Assessment & Feedback
"""

import json
import io
from typing import Optional, Tuple, Dict
from .clients import groq_clients, groq_api_call_with_retry, LLM_MODEL, WHISPER_MODEL

# ========== EVALUATION PROMPTS ==========

# Layer 2: Pronunciation & Fluency (Vietnamese learner specialized)
PRONUNCIATION_FLUENCY_PROMPT = """Bạn là chuyên gia đánh giá phát âm và độ trôi chảy tiếng Anh, chuyên hỗ trợ người học Việt Nam.

Phân tích transcript từ nhận dạng giọng nói. Lưu ý các lỗi NGHIÊM TRỌNG của người Việt:
- Phát âm SAI rõ ràng làm thay đổi nghĩa từ
- Thiếu phụ âm cuối quan trọng (-s, -ed) ảnh hưởng ngữ pháp
- Trọng âm sai hoàn toàn

QUY TẮC QUAN TRỌNG:
1. **Chỉ chỉ ra 1-3 lỗi RÕ RÀNG nhất** (không bắt lỗi nhỏ hoặc chủ quan)
2. **Đưa ra 1-2 mẹo thực tế** cho người Việt
3. **Khuyến khích và xây dựng** - không quá khắt khe

Đánh giá các tiêu chí:

1. **Điểm Phát âm (0-10)**: Ước tính chất lượng phát âm từ transcript
   - Chỉ trừ điểm nếu có lỗi RÕ RÀNG và NGHIÊM TRỌNG
   - Không trừ điểm cho lỗi nhỏ hoặc có thể chấp nhận được

2. **Điểm Độ trôi chảy (0-10)**: Đánh giá dòng chảy lời nói
   - Câu hoàn chỉnh và có ý nghĩa
   - Độ dài phù hợp với câu hỏi
   - Không quá ngập ngừng (um, uh...)

QUAN TRỌNG: 
- Phản hồi, nhận xét, gợi ý phải bằng TIẾNG VIỆT
- Giữ nguyên các từ/câu tiếng Anh cụ thể khi chỉ ra lỗi
- Tối đa 3 pronunciation_issues và 2 fluency_issues
- Tối đa 2 vietnamese_specific_tips

Trả về JSON format:
{
    "pronunciation_score": 7.5,
    "pronunciation_feedback": "Phát âm tốt, rõ ràng",
    "pronunciation_issues": [{"word": "technology", "issue": "Trọng âm sai", "suggestion": "Nhấn mạnh âm tiết thứ 2: tech-NO-lo-gy"}],
    "fluency_score": 8.0,
    "fluency_feedback": "Nói khá trôi chảy, câu hoàn chỉnh",
    "fluency_issues": ["Có thể nói thêm 1-2 câu để phát triển ý"],
    "vietnamese_specific_tips": ["Chú ý phát âm phụ âm cuối để rõ nghĩa"]
}"""

# Layer 3: Grammar, Content & Topic Matching
GRAMMAR_CONTENT_PROMPT = """Bạn là chuyên gia đánh giá ngữ pháp và nội dung tiếng Anh cho bài thi nói.

QUY TẮC ĐÁNH GIÁ - QUAN TRỌNG:
1. **Chỉ chỉ ra 1-3 lỗi NGHIÊM TRỌNG nhất** (không bắt lỗi nhỏ)
2. **Chỉ bắt lỗi RÕ RÀNG 100%** - không bắt lỗi chủ quan hoặc mơ hồ
3. **Khuyến khích và xây dựng** - tập trung vào điểm mạnh
4. **Tối đa 2-3 suggestions thực tế**

Đánh giá các tiêu chí:

1. **grammar_score (0-10)**: Ngữ pháp
   - Chỉ trừ điểm cho lỗi NGHIÊM TRỌNG (sai thì, thiếu động từ, chủ-vị không hòa hợp)
   - KHÔNG trừ điểm cho lỗi nhỏ (giới từ, mạo từ đơn giản)

2. **vocabulary_score (0-10)**: Từ vựng
   - Chỉ trừ điểm nếu dùng SAI từ làm thay đổi nghĩa
   - KHÔNG trừ điểm vì từ đơn giản

3. **content_score (0-10)**: Nội dung
   - Có ý tưởng rõ ràng và trả lời câu hỏi → điểm cao
   - KHÔNG yêu cầu phải hoàn hảo

Phản hồi bằng TIẾNG VIỆT. Giữ nguyên câu tiếng Anh khi chỉ lỗi.
Tối đa: 3 grammar_errors, 2 vocabulary_suggestions, 3 improvement_suggestions

JSON format:
{
    "grammar_score": 8.0,
    "grammar_feedback": "Ngữ pháp tốt, câu rõ ràng",
    "grammar_errors": [{"error": "I goes", "correction": "I go", "rule": "Chủ ngữ I/you/we/they + động từ nguyên thể"}],
    "vocabulary_score": 7.5,
    "vocabulary_feedback": "Từ vựng phù hợp với chủ đề",
    "vocabulary_suggestions": ["Có thể dùng thêm từ 'beneficial' thay vì 'good'"],
    "content_score": 8.0,
    "content_feedback": "Ý tưởng rõ ràng và liên quan đến chủ đề",
    "improvement_suggestions": ["Có thể thêm 1 ví dụ cụ thể", "Nói thêm 1-2 câu để phát triển ý"]
}"""

# Layer 3b: Topic Matching - Đánh giá riêng việc trả lời có đúng chủ đề không
TOPIC_MATCHING_PROMPT = """Bạn là chuyên gia đánh giá bài thi nói tiếng Anh. Nhiệm vụ của bạn là SO SÁNH câu trả lời của thí sinh với đề bài để xác định:
1. Câu trả lời có ĐÚNG CHỦ ĐỀ được yêu cầu không?
2. Mức độ liên quan giữa câu trả lời và đề bài như thế nào?

TIÊU CHÍ ĐÁNH GIÁ:
- **Đúng chủ đề hoàn toàn (8-10 điểm)**: Trả lời chính xác những gì đề bài yêu cầu
- **Liên quan một phần (5-7 điểm)**: Có nhắc đến chủ đề nhưng không đầy đủ hoặc lạc hướng một chút
- **Lạc đề (0-4 điểm)**: Trả lời về chủ đề khác hoàn toàn, không liên quan đến đề bài

QUAN TRỌNG:
- Phân tích chi tiết đề bài yêu cầu gì
- Phân tích câu trả lời nói về gì  
- So sánh và đưa ra kết luận rõ ràng
- Tất cả phản hồi bằng TIẾNG VIỆT

JSON format:
{
    "topic_matching_score": 8.5,
    "is_off_topic": false,
    "topic_analysis": "Đề bài yêu cầu: [tóm tắt ngắn gọn đề bài yêu cầu gì]",
    "response_analysis": "Thí sinh trả lời: [tóm tắt ngắn gọn thí sinh nói về gì]",
    "matching_explanation": "Phân tích: [giải thích tại sao đúng/sai chủ đề, mức độ liên quan]",
    "off_topic_warning": "",
    "suggestions": ["Gợi ý cải thiện nếu cần"]
}

Ví dụ LẠC ĐỀ:
- Đề bài hỏi về "sở thích đọc sách" nhưng thí sinh nói về "xem phim" → is_off_topic: true
- Đề bài hỏi "mô tả công việc mơ ước" nhưng thí sinh nói về "kỳ nghỉ hè" → is_off_topic: true"""

# Legacy prompt for backward compatibility
SPEAKING_EVAL_PROMPT = """Bạn là chuyên gia đánh giá kỹ năng nói tiếng Anh cho bài thi TOEIC Speaking.
Nhiệm vụ: Đánh giá câu trả lời của người nói dựa trên chủ đề cho trước.

QUY TẮC ĐÁNH GIÁ:
1. **Chỉ chỉ ra 2-5 lỗi/gợi ý QUAN TRỌNG nhất**
2. **Chỉ bắt lỗi RÕ RÀNG và NGHIÊM TRỌNG**
3. **Khuyến khích và xây dựng** - không quá khắt khe
4. **Cân bằng giữa ưu điểm và khuyết điểm**

Đánh giá các tiêu chí (điểm 0-10 cho mỗi tiêu chí):
1. Phát âm: Rõ ràng, không sai nghiêm trọng
2. Độ trôi chảy: Nói mượt, câu hoàn chỉnh
3. Ngữ pháp: Không có lỗi nghiêm trọng (sai thì, thiếu động từ)
4. Từ vựng: Phù hợp với chủ đề, không dùng sai nghĩa
5. Mạch lạc: Có tổ chức, trả lời đúng câu hỏi

Cung cấp phản hồi cụ thể về:
- **Tối đa 2-5 lỗi NGHIÊM TRỌNG nhất** (không bắt lỗi nhỏ)
- **Tối đa 2-3 gợi ý THỰC TẾ** để cải thiện
- Đánh giá tổng thể CÂN BẰNG (có ưu điểm và khuyết điểm)

QUAN TRỌNG:
- Tất cả phản hồi, nhận xét phải bằng TIẾNG VIỆT
- Giữ nguyên câu/từ tiếng Anh khi chỉ ra lỗi cụ thể
- Ví dụ lỗi: "text": "He go to school" (giữ nguyên tiếng Anh)
- **Chỉ bắt lỗi nếu 100% chắc chắn là sai**
- **Không bắt lỗi nhỏ hoặc chủ quan**

Trả về JSON format (errors: max 5 items, suggestions: max 3 items):
{
    "pronunciation_score": 7.5,
    "fluency_score": 8.0,
    "grammar_score": 8.0,
    "vocabulary_score": 7.0,
    "coherence_score": 8.5,
    "overall_score": 7.8,
    "feedback": "Bài nói tốt, ý rõ ràng. Cần chú ý một số lỗi ngữ pháp nhỏ.",
    "errors": [{"type": "grammar", "text": "He go to school", "correction": "He goes to school", "explanation": "Lỗi chia động từ nghiêm trọng"}],
    "suggestions": ["Chú ý chia động từ đúng với chủ ngữ", "Nói thêm 1-2 câu để phát triển ý"]
}"""

# ========== LAYER 1: SPEECH RECOGNITION ==========

def transcribe_audio(audio_data: bytes, filename: str = "audio.wav") -> Tuple[Optional[str], Optional[dict]]:
    """
    Layer 1: Speech Recognition (ASR) using Groq Whisper
    Returns: (transcript, metadata)
    """
    if not groq_clients:
        return None, {"error": "Groq clients not initialized"}
    
    try:
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

# ========== LAYER 2: PRONUNCIATION & FLUENCY ==========

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

# ========== LAYER 3: GRAMMAR & CONTENT ==========

def evaluate_grammar_content(transcript: str, topic_context: str) -> Optional[dict]:
    """
    Layer 3: Evaluate Grammar, Content & Topic Matching
    """
    if not groq_clients:
        return None
    
    try:
        # Build system prompt with embedded topic
        system_prompt = f"""Bạn là chuyên gia đánh giá bài thi nói tiếng Anh.

CHỦ ĐỀ BÀI THI: "{topic_context}"

Đánh giá câu trả lời của thí sinh theo các tiêu chí (0-10):
1. grammar_score: Ngữ pháp
2. vocabulary_score: Từ vựng  
3. content_score: Nội dung, tổ chức ý
4. topic_matching_score: Câu trả lời có đúng CHỦ ĐỀ trên không?
   - Đúng chủ đề → 8-10, is_off_topic=false
   - Lạc đề → 0-2, is_off_topic=true

Phản hồi bằng TIẾNG VIỆT. JSON format:
{{"grammar_score":8.0,"grammar_feedback":"...","grammar_errors":[],"vocabulary_score":7.0,"vocabulary_feedback":"...","vocabulary_suggestions":[],"content_score":6.0,"content_feedback":"...","topic_matching_score":9.0,"is_off_topic":false,"matching_analysis":"...","off_topic_warning":"","improvement_suggestions":[]}}"""

        def api_call(client):
            return client.chat.completions.create(
                model=LLM_MODEL,
                messages=[
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": f"Câu trả lời của thí sinh:\n{transcript}"}
                ],
                response_format={"type": "json_object"}
            )
        
        response = groq_api_call_with_retry(api_call)
        return json.loads(response.choices[0].message.content)
    except Exception as e:
        print(f"Grammar/Content evaluation error: {e}")
        return None

# ========== LAYER 3b: TOPIC MATCHING (DEDICATED) ==========

def evaluate_topic_matching(topic_context: str, transcript: str) -> Optional[dict]:
    """
    Layer 3b: Dedicated Topic Matching Evaluation
    Phân tích chi tiết xem câu trả lời có đúng chủ đề không
    
    Returns:
        - topic_matching_score: 0-10
        - is_off_topic: bool
        - topic_analysis: Đề bài yêu cầu gì
        - response_analysis: Thí sinh trả lời gì
        - matching_explanation: Giải thích chi tiết
        - off_topic_warning: Cảnh báo nếu lạc đề
        - suggestions: Gợi ý cải thiện
    """
    if not groq_clients:
        return None
    
    if not transcript or not transcript.strip():
        return {
            "topic_matching_score": 0,
            "is_off_topic": True,
            "topic_analysis": f"Đề bài: {topic_context[:100]}...",
            "response_analysis": "Không có câu trả lời",
            "matching_explanation": "Thí sinh chưa trả lời câu hỏi",
            "off_topic_warning": "⚠️ Vui lòng trả lời câu hỏi",
            "suggestions": ["Hãy trả lời theo chủ đề được yêu cầu"]
        }
    
    try:
        user_message = f"""ĐỀ BÀI (TOPIC):
{topic_context}

CÂU TRẢ LỜI CỦA THÍ SINH:
{transcript}

Hãy phân tích xem câu trả lời có đúng chủ đề không."""

        def api_call(client):
            return client.chat.completions.create(
                model=LLM_MODEL,
                messages=[
                    {"role": "system", "content": TOPIC_MATCHING_PROMPT},
                    {"role": "user", "content": user_message}
                ],
                response_format={"type": "json_object"}
            )
        
        response = groq_api_call_with_retry(api_call)
        result = json.loads(response.choices[0].message.content)
        
        # Ensure required fields exist
        if "topic_matching_score" not in result:
            result["topic_matching_score"] = 5.0
        if "is_off_topic" not in result:
            result["is_off_topic"] = result["topic_matching_score"] <= 4
        
        return result
    except Exception as e:
        print(f"Topic matching evaluation error: {e}")
        return None

# ========== LAYER 4: OVERALL ASSESSMENT ==========

def calculate_overall_scores(pron_fluency: Optional[dict], grammar_content: Optional[dict], topic_matching: Optional[dict] = None) -> dict:
    """Calculate overall scores from all layers"""
    scores = {
        "pronunciation": 0,
        "fluency": 0,
        "grammar": 0,
        "vocabulary": 0,
        "content": 0,
        "topic_matching": 0,
        "overall": 0,
        "is_off_topic": False
    }
    
    if pron_fluency:
        scores["pronunciation"] = pron_fluency.get("pronunciation_score", 0)
        scores["fluency"] = pron_fluency.get("fluency_score", 0)
    
    if grammar_content:
        scores["grammar"] = grammar_content.get("grammar_score", 0)
        scores["vocabulary"] = grammar_content.get("vocabulary_score", 0)
        scores["content"] = grammar_content.get("content_score", 0)
        
        # Use grammar_content's topic matching as fallback if no dedicated matching
        if not topic_matching:
            scores["topic_matching"] = grammar_content.get("topic_matching_score", 0)
            scores["is_off_topic"] = grammar_content.get("is_off_topic", False)
    
    # Use dedicated topic matching if available (takes priority)
    if topic_matching:
        scores["topic_matching"] = topic_matching.get("topic_matching_score", 0)
        scores["is_off_topic"] = topic_matching.get("is_off_topic", False)
    
    # Also detect off-topic by very low score
    if scores["topic_matching"] <= 2:
        scores["is_off_topic"] = True
    
    # Calculate overall score (weighted average)
    weights = {
        "pronunciation": 0.20,
        "fluency": 0.15,
        "grammar": 0.20,
        "vocabulary": 0.15,
        "content": 0.15,
        "topic_matching": 0.15
    }
    
    total_score = sum(scores[k] * weights.get(k, 0) for k in weights.keys() if k not in ["overall", "is_off_topic"])
    
    # Penalize heavily if off-topic (max 4.0 overall regardless of other scores)
    if scores["is_off_topic"]:
        total_score = min(total_score, 4.0)
    
    scores["overall"] = round(total_score, 1)
    
    return scores

def generate_overall_feedback(pron_fluency: Optional[dict], grammar_content: Optional[dict], transcript: str, topic_matching: Optional[dict] = None) -> dict:
    """Generate combined feedback from all layers"""
    feedback = {
        "summary": "",
        "strengths": [],
        "improvements": [],
        "vietnamese_tips": [],
        "errors": [],
        "suggestions": [],
        "is_off_topic": False,
        "off_topic_warning": "",
        # New fields for detailed topic matching analysis
        "topic_analysis": {
            "topic_question": "",
            "user_response": "",
            "matching_explanation": "",
            "score": 0
        }
    }
    
    # Use dedicated topic matching if available
    if topic_matching:
        is_off_topic = topic_matching.get("is_off_topic", False)
        topic_score = topic_matching.get("topic_matching_score", 10)
        
        # Populate detailed topic analysis
        feedback["topic_analysis"] = {
            "topic_question": topic_matching.get("topic_analysis", ""),
            "user_response": topic_matching.get("response_analysis", ""),
            "matching_explanation": topic_matching.get("matching_explanation", ""),
            "score": topic_score
        }
        
        if topic_score <= 4:
            is_off_topic = True
        
        if is_off_topic:
            feedback["is_off_topic"] = True
            feedback["off_topic_warning"] = topic_matching.get(
                "off_topic_warning", 
                "⚠️ Câu trả lời của bạn không liên quan đến chủ đề được yêu cầu. Vui lòng đọc kỹ đề bài và trả lời đúng chủ đề."
            )
            feedback["improvements"].insert(0, "Cần trả lời đúng chủ đề được yêu cầu")
        
        # Add matching suggestions
        matching_suggestions = topic_matching.get("suggestions", [])
        if matching_suggestions:
            feedback["suggestions"] = matching_suggestions + feedback["suggestions"]
    
    # Fallback to grammar_content for topic matching if no dedicated matching
    elif grammar_content:
        is_off_topic = grammar_content.get("is_off_topic", False)
        topic_score = grammar_content.get("topic_matching_score", 10)
        
        if topic_score <= 2:
            is_off_topic = True
        
        if is_off_topic:
            feedback["is_off_topic"] = True
            feedback["off_topic_warning"] = grammar_content.get(
                "off_topic_warning", 
                "⚠️ Câu trả lời của bạn không liên quan đến chủ đề được yêu cầu. Vui lòng đọc kỹ đề bài và trả lời đúng chủ đề."
            )
            feedback["improvements"].insert(0, "Cần trả lời đúng chủ đề được yêu cầu")
    
    # Collect from pronunciation/fluency
    if pron_fluency:
        if pron_fluency.get("pronunciation_score", 0) >= 7:
            feedback["strengths"].append("Phát âm rõ ràng")
        if pron_fluency.get("fluency_score", 0) >= 7:
            feedback["strengths"].append("Nói trôi chảy tự nhiên")
        
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
            feedback["strengths"].append("Ngữ pháp tốt")
        if grammar_content.get("vocabulary_score", 0) >= 7:
            feedback["strengths"].append("Từ vựng đa dạng")
        if grammar_content.get("topic_matching_score", 0) >= 7:
            feedback["strengths"].append("Trả lời đúng chủ đề")
        
        for error in grammar_content.get("grammar_errors", []):
            # Handle both dict and string format
            if isinstance(error, dict):
                feedback["errors"].append({
                    "type": "grammar",
                    "text": error.get("error", ""),
                    "correction": error.get("correction", ""),
                    "rule": error.get("rule", "")
                })
            elif isinstance(error, str):
                feedback["errors"].append({
                    "type": "grammar",
                    "text": error,
                    "correction": "",
                    "rule": ""
                })
        
        feedback["suggestions"] = grammar_content.get("improvement_suggestions", [])
        vocab_suggestions = grammar_content.get("vocabulary_suggestions", [])
        if isinstance(vocab_suggestions, list):
            feedback["suggestions"].extend(vocab_suggestions)
        
        # Add matching analysis to suggestions if partially off-topic
        matching_analysis = grammar_content.get("matching_analysis", "")
        if matching_analysis and grammar_content.get("topic_matching_score", 10) < 6:
            feedback["suggestions"].insert(0, matching_analysis)
    
    # Generate summary
    if feedback["is_off_topic"]:
        feedback["summary"] = "⚠️ LẠC ĐỀ: Câu trả lời không liên quan đến chủ đề. "
    elif feedback["strengths"]:
        feedback["summary"] = f"Điểm mạnh: {', '.join(feedback['strengths'][:3])}. "
    
    if feedback["improvements"] and not feedback["is_off_topic"]:
        feedback["summary"] += f"Cần cải thiện: {', '.join(feedback['improvements'][:2])}."
    
    return feedback

# ========== FULL EVALUATION FUNCTIONS ==========

def evaluate_speaking_full(audio_data: bytes, topic_context: str, topic_id: str, filename: str = "audio.wav") -> dict:
    """
    Full speaking evaluation with 4 layers:
    1. ASR (Speech Recognition)
    2. Pronunciation & Fluency
    3. Grammar & Content
    3b. Topic Matching (Dedicated)
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
    
    # Layer 3: Grammar & Content
    grammar_content = evaluate_grammar_content(transcript, topic_context)
    if grammar_content:
        result["layers"]["grammar_content"] = grammar_content
    else:
        result["layers"]["grammar_content"] = {"error": "Evaluation failed"}
    
    # Layer 3b: Dedicated Topic Matching
    topic_matching = evaluate_topic_matching(topic_context, transcript)
    if topic_matching:
        result["layers"]["topic_matching"] = topic_matching
    else:
        result["layers"]["topic_matching"] = {"error": "Evaluation failed"}
    
    # Layer 4: Combined Assessment
    result["success"] = True
    result["scores"] = calculate_overall_scores(pron_fluency, grammar_content, topic_matching)
    result["feedback"] = generate_overall_feedback(pron_fluency, grammar_content, transcript, topic_matching)
    
    return result

def evaluate_speaking_from_transcript(topic_id: str, context: str, transcript: str) -> Optional[dict]:
    """
    Evaluate speaking from text transcript (no audio)
    Uses Layer 2 + Layer 3 + Layer 3b
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
    
    # Layer 3: Grammar & Content
    grammar_content = evaluate_grammar_content(transcript, context)
    if grammar_content:
        result["layers"]["grammar_content"] = grammar_content
    
    # Layer 3b: Dedicated Topic Matching
    topic_matching = evaluate_topic_matching(context, transcript)
    if topic_matching:
        result["layers"]["topic_matching"] = topic_matching
    
    # Calculate scores
    result["success"] = True
    result["scores"] = calculate_overall_scores(pron_fluency, grammar_content, topic_matching)
    result["feedback"] = generate_overall_feedback(pron_fluency, grammar_content, transcript, topic_matching)
    
    return result

def evaluate_speaking(topic_id: str, context: str, transcript: str) -> Optional[dict]:
    """Legacy function - redirects to new evaluation for backward compatibility"""
    result = evaluate_speaking_from_transcript(topic_id, context, transcript)
    if result and result.get("success"):
        # Convert to legacy format with full matching info
        scores = result.get("scores", {})
        feedback = result.get("feedback", {})
        return {
            "topic_id": topic_id,
            "transcript": transcript,
            "scores": {
                "pronunciation": scores.get("pronunciation", 0),
                "fluency": scores.get("fluency", 0),
                "grammar": scores.get("grammar", 0),
                "vocabulary": scores.get("vocabulary", 0),
                "content": scores.get("content", 0),
                "topic_matching": scores.get("topic_matching", 0),
                "overall": scores.get("overall", 0),
            },
            "feedback": {
                "summary": feedback.get("summary", ""),
                "strengths": feedback.get("strengths", []),
                "improvements": feedback.get("improvements", []),
                "vietnamese_tips": feedback.get("vietnamese_tips", []),
                "errors": feedback.get("errors", []),
                "suggestions": feedback.get("suggestions", []),
                "is_off_topic": feedback.get("is_off_topic", False),
                "off_topic_warning": feedback.get("off_topic_warning", ""),
            },
            # Legacy flat fields for backward compatibility
            "pronunciation_score": scores.get("pronunciation", 0),
            "fluency_score": scores.get("fluency", 0),
            "grammar_score": scores.get("grammar", 0),
            "vocabulary_score": scores.get("vocabulary", 0),
            "coherence_score": scores.get("content", 0),
            "topic_matching_score": scores.get("topic_matching", 0),
            "overall_score": scores.get("overall", 0),
            "is_off_topic": scores.get("is_off_topic", False),
        }
    return None

# Export functions
__all__ = [
    'transcribe_audio', 'evaluate_pronunciation_fluency', 'evaluate_grammar_content',
    'evaluate_topic_matching', 'evaluate_speaking_full', 'evaluate_speaking_from_transcript', 
    'evaluate_speaking', 'calculate_overall_scores', 'generate_overall_feedback'
]