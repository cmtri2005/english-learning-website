"""
Writing Evaluation Module
Implements multi-step writing evaluation system:
1. Scoring - Evaluate scores for each criteria
2. Error Analysis - Find and analyze all errors
3. Strengths Analysis - Identify good points (for good essays)
4. Suggestions - Generate improvement suggestions
5. Improved Version - Rewrite with fixes
"""

import json
from typing import Optional, List, Dict

# Import at function level to avoid issues
def _get_clients():
    from .clients import groq_clients, groq_api_call_with_retry, LLM_MODEL
    return groq_clients, groq_api_call_with_retry, LLM_MODEL

# ========== STEP 1: SCORING PROMPT ==========
SCORING_PROMPT = """You are an expert English writing evaluator for TOEIC Writing and IELTS exams.
Task: Score the essay based on 4 criteria.

Evaluate each criterion (score 0-10):
1. Task Achievement: How well does the essay address the topic requirements?
2. Coherence & Cohesion: How well organized is the essay with appropriate linking?
3. Lexical Resource: How diverse and appropriate is the vocabulary?
4. Grammar Accuracy: How correctly is grammar used?

Calculate overall_score as the average of the 4 scores.
Determine level based on overall_score: weak (<5), average (5-7), good (>7).

Return JSON format (all scores must be numbers, not expressions):
{
    "task_achievement_score": 6.5,
    "coherence_cohesion_score": 5.0,
    "lexical_resource_score": 4.5,
    "grammar_accuracy_score": 4.0,
    "overall_score": 5.0,
    "level": "average",
    "brief_assessment": "Brief assessment in Vietnamese (1-2 sentences)"
}"""

# ========== STEP 2: ERROR ANALYSIS PROMPT ==========
ERROR_ANALYSIS_PROMPT = """You are an expert English writing error analyst for Vietnamese learners.
Task: Identify ONLY the 2-5 MOST IMPORTANT and CLEAR errors in the essay.

CRITICAL RULES - READ CAREFULLY:
1. **ONLY flag OBVIOUS and SERIOUS errors that are 100% WRONG**
2. **Maximum 5 errors total** - prioritize the most impactful ones
3. **NEVER flag correct usage as errors** - if in doubt, DON'T flag it
4. **DO NOT suggest alternative wording for sentences that are already correct**
5. **DO NOT flag stylistic preferences - only actual mistakes**

What TO flag (ONLY if very serious):
- grammar: MAJOR mistakes (wrong verb tense, missing verb, subject-verb completely wrong)
  Example: "He go" (WRONG - clear error)
- vocabulary: Words used with COMPLETELY wrong meaning
  Example: "I cook a book" (WRONG - makes no sense)
- task: COMPLETELY off-topic (talking about sports when topic is technology)

What NEVER to flag:
- Correct linking words (Moreover, Furthermore, However, etc. - ALL are correct in proper context!)
- Word choice variations ("big" vs "large", "help" vs "assist" - BOTH correct)
- Suggestions to add words when sentence is already complete and correct
- Stylistic preferences (sentence length, word order if both are grammatically correct)
- Minor improvements that don't fix actual errors

EXAMPLES OF INCORRECT FLAGGING (DO NOT DO THIS):
❌ BAD: Flagging "Moreover, reading is fun" and suggesting "However, reading is fun"
   → REASON: "Moreover" is CORRECT for adding supporting ideas. This is NOT an error!
❌ BAD: Flagging "technology is useful" and suggesting "technology is extremely useful"
   → REASON: Original sentence is CORRECT. This is style preference, not an error!
❌ BAD: Flagging "continuous learning" and suggesting "continuous personal learning"
   → REASON: Original is CORRECT and complete. Adding "personal" is optional, not a fix!

CORRECT FLAGGING (DO THIS):
✅ GOOD: Flagging "He go to school" → "He goes to school"
   → REASON: Clear grammatical error (subject-verb agreement)

IMPORTANT:
- Keep original English text in "text" and "correction" fields
- Write explanations in VIETNAMESE with proper diacritics (có dấu tiếng Việt)
- Only include errors you are CERTAIN about

Return JSON format (total_errors must match array length, max 5):
{
    "errors": [
        {
            "type": "grammar",
            "text": "When teacher make joke",
            "correction": "When teachers make jokes",
            "explanation": "Lỗi ngữ pháp nghiêm trọng: danh từ số ít/nhiều và chia động từ không đúng"
        }
    ],
    "total_errors": 2,
    "error_summary": "Bài viết có một số lỗi ngữ pháp cơ bản cần sửa"
}"""

# ========== STEP 3: STRENGTHS ANALYSIS PROMPT ==========
STRENGTHS_PROMPT = """You are an encouraging English writing evaluator.
Task: Find and highlight 1-3 GENUINE STRENGTHS in the essay (even simple ones).

IMPORTANT GUIDELINES:
- **Always find at least 1 positive aspect** (even in weak essays)
- **Be encouraging but honest** - praise real strengths, no matter how basic
- **Maximum 3 strengths** - focus on the most notable positive points
- **For weaker essays**: praise effort, basic sentence structure, or any correct usage
- **For stronger essays**: highlight advanced techniques

Possible strengths:
- Good use of linking words (Furthermore, Moreover, However...)
- Clear sentence structures
- Appropriate vocabulary choices
- Logical organization
- Relevant examples
- Good topic coverage

IMPORTANT:
- Keep original English text when pointing out strengths
- Write explanations in VIETNAMESE with proper diacritics (có dấu tiếng Việt)
- Be specific about what makes it good

Return JSON format (1-3 strengths):
{
    "strengths": [
        {
            "type": "coherence",
            "text": "Humor also helps students remember lessons",
            "explanation": "Ý tưởng tốt và có liên quan đến chủ đề"
        }
    ],
    "total_strengths": 1,
    "strengths_summary": "Bài viết có ý tưởng rõ ràng và liên quan đến chủ đề"
}"""

# ========== STEP 4: FEEDBACK & SUGGESTIONS PROMPT ==========
FEEDBACK_PROMPT = """You are an encouraging English writing consultant for Vietnamese learners.
Task: Provide balanced feedback with 2-3 practical suggestions.

CRITICAL GUIDELINES:
1. **Be encouraging and constructive** - start with positives
2. **Provide exactly 2-3 suggestions** (not more, not less)
3. **Focus on the most impactful improvements**
4. **Be specific and actionable** - students should know exactly what to do
5. **Balance criticism with encouragement**

Feedback structure:
- Start with a positive note (even for weak essays)
- Mention 1-2 key areas to improve
- End with encouragement

Suggestion priorities:
1. If major errors exist → suggest fixing those first
2. If structure is weak → suggest organization improvements
3. If vocabulary is limited → suggest expanding vocabulary
4. Always make suggestions practical and achievable

IMPORTANT:
- Write feedback and suggestions in VIETNAMESE (proper Vietnamese with diacritics)
- Suggestions must be SPECIFIC and ACTIONABLE
- Keep suggestions to 2-3 items maximum

Return JSON format (exactly 2-3 suggestions):
{
    "feedback": "Bài viết có ý tưởng tốt và trả lời đúng chủ đề. Tuy nhiên, cần cải thiện thêm về ngữ pháp và cách diễn đạt để bài viết rõ ràng hơn.",
    "suggestions": ["Chú ý chia động từ đúng với chủ ngữ (he/she → verb + s)", "Sử dụng thêm từ nối để liên kết ý (however, therefore, moreover)", "Mở rộng ý tưởng bằng cách đưa thêm ví dụ cụ thể"]
}"""

# ========== STEP 5: IMPROVED VERSION PROMPT ==========
IMPROVED_VERSION_PROMPT = """You are an expert English essay editor.
Task: Rewrite the student's essay with all errors fixed.

Requirements:
1. MUST write in ENGLISH only
2. Keep the same ideas and structure as the original
3. Fix all grammar, vocabulary, and coherence errors
4. Improve sentence variety and word choice
5. Maintain the original meaning and intent

Return JSON format:
{
    "improved_version": "The complete rewritten essay in English"
}"""


# ========== HELPER FUNCTIONS ==========
def _extract_json_from_error(error):
    """Extract JSON from Groq's failed_generation error response"""
    error_str = str(error)
    if "failed_generation" in error_str:
        try:
            import re
            match = re.search(r"'failed_generation':\s*'(.+?)'\}\}", error_str, re.DOTALL)
            if match:
                json_str = match.group(1)
                json_str = json_str.replace("\\'", "'")
                return json.loads(json_str)
        except:
            pass
    return None


def _call_llm(prompt, user_content):
    """Helper to call LLM with a prompt"""
    groq_clients, groq_api_call_with_retry, LLM_MODEL = _get_clients()
    
    if not groq_clients:
        return None
    
    try:
        def api_call(client):
            return client.chat.completions.create(
                model=LLM_MODEL,
                messages=[
                    {"role": "system", "content": prompt},
                    {"role": "user", "content": user_content}
                ],
                response_format={"type": "json_object"}
            )
        
        response = groq_api_call_with_retry(api_call)
        return json.loads(response.choices[0].message.content)
    except Exception as e:
        print(f"LLM call error: {e}")
        if "json_validate_failed" in str(e):
            return _extract_json_from_error(e)
        return None


# ========== STEP FUNCTIONS ==========
def step1_scoring(context, essay):
    """Step 1: Score the essay on 4 criteria"""
    print("Step 1: Scoring essay...")
    user_content = f"Topic/Prompt: {context}\n\nEssay: {essay}"
    result = _call_llm(SCORING_PROMPT, user_content)
    if result:
        print(f"   Done - Overall score: {result.get('overall_score', 'N/A')}, Level: {result.get('level', 'N/A')}")
    return result


def _filter_fake_errors(errors):
    """Filter out errors that are actually correct usage (post-processing validation)"""
    if not errors:
        return []
    
    valid_errors = []
    
    # Common false positives to filter out
    false_positive_patterns = [
        # Correct linking words
        ("moreover", "however"),  # LLM suggesting to change Moreover to However
        ("furthermore", "however"),
        ("in addition", "however"),
        # Correct word choices being "corrected"
        ("continuous", "personal"),  # Adding unnecessary adjectives
        ("important", "essential"),  # Synonym suggestions (not errors)
    ]
    
    for error in errors:
        text = error.get("text", "").lower()
        correction = error.get("correction", "").lower()
        
        # Skip if it's a "strength" incorrectly marked as error
        if error.get("type") == "strength":
            continue
        
        # Skip if it's just synonym suggestion (not actual error)
        is_false_positive = False
        for pattern in false_positive_patterns:
            if pattern[0] in text and pattern[1] in correction:
                print(f"   ⚠️ Filtered fake error: suggesting to change correct '{pattern[0]}' to '{pattern[1]}'")
                is_false_positive = True
                break
        
        if not is_false_positive:
            valid_errors.append(error)
        
        # Limit to max 5 errors
        if len(valid_errors) >= 5:
            break
    
    return valid_errors


def step2_error_analysis(context, essay):
    """Step 2: Find and analyze all errors"""
    print("Step 2: Analyzing errors...")
    user_content = f"Topic/Prompt: {context}\n\nEssay: {essay}"
    result = _call_llm(ERROR_ANALYSIS_PROMPT, user_content)
    
    if result and "errors" in result:
        original_count = len(result.get("errors", []))
        # Filter out false positives
        result["errors"] = _filter_fake_errors(result.get("errors", []))
        result["total_errors"] = len(result["errors"])
        
        filtered_count = original_count - result["total_errors"]
        if filtered_count > 0:
            print(f"   Done - Found {result['total_errors']} real errors (filtered out {filtered_count} false positives)")
        else:
            print(f"   Done - Found {result['total_errors']} errors")
    
    return result


def step3_strengths_analysis(context, essay, level):
    """Step 3: Find strengths (mainly for average/good essays)"""
    if level == "weak":
        print("Step 3: Skipping strengths (weak essay)...")
        return {"strengths": [], "total_strengths": 0, "strengths_summary": "Bài viết cần cải thiện nhiều."}
    
    print("Step 3: Analyzing strengths...")
    user_content = f"Topic/Prompt: {context}\n\nEssay: {essay}"
    result = _call_llm(STRENGTHS_PROMPT, user_content)
    if result:
        print(f"   Done - Found {result.get('total_strengths', 0)} strengths")
    return result


def step4_feedback_suggestions(context, essay, errors, strengths):
    """Step 4: Generate feedback and suggestions"""
    print("Step 4: Generating feedback...")
    
    # Limit to top 5 errors and 3 strengths
    error_summary = "\n".join([f"- {e.get('type')}: {e.get('text')} -> {e.get('correction')}" for e in errors[:5]])
    strength_summary = "\n".join([f"- {s.get('type')}: {s.get('text')}" for s in strengths[:3]])
    
    user_content = f"""Topic/Prompt: {context}

Essay: {essay}

Errors found:
{error_summary}

Strengths found:
{strength_summary}"""
    
    result = _call_llm(FEEDBACK_PROMPT, user_content)
    if result:
        print(f"   Done - Generated {len(result.get('suggestions', []))} suggestions")
    return result


def step5_improved_version(context, essay, errors):
    """Step 5: Generate improved version"""
    print("Step 5: Generating improved version...")
    
    error_list = "\n".join([f"- {e.get('text')} -> {e.get('correction')}" for e in errors])
    
    user_content = f"""Topic/Prompt: {context}

Original Essay: {essay}

Errors to fix:
{error_list}

Please rewrite the essay fixing all these errors while keeping the same ideas."""
    
    result = _call_llm(IMPROVED_VERSION_PROMPT, user_content)
    if result:
        print("   Done - Improved version generated")
    return result


# ========== MAIN EVALUATION FUNCTION ==========
def evaluate_writing(topic_id, context, essay):
    """
    Multi-step writing evaluation:
    1. Scoring
    2. Error Analysis  
    3. Strengths Analysis (for average/good essays)
    4. Feedback & Suggestions
    5. Improved Version
    """
    groq_clients, _, _ = _get_clients()
    
    if not groq_clients:
        print("No Groq clients available for writing evaluation")
        return None
    
    print(f"Starting writing evaluation for topic: {topic_id}")
    
    try:
        # Step 1: Scoring
        scoring = step1_scoring(context, essay)
        if not scoring:
            return None
        
        level = scoring.get("level", "average")
        
        # Step 2: Error Analysis
        error_analysis = step2_error_analysis(context, essay)
        errors = error_analysis.get("errors", []) if error_analysis else []
        
        # Step 3: Strengths Analysis
        strengths_analysis = step3_strengths_analysis(context, essay, level)
        strengths = strengths_analysis.get("strengths", []) if strengths_analysis else []
        
        # Step 4: Feedback & Suggestions
        feedback_result = step4_feedback_suggestions(context, essay, errors, strengths)
        
        # Step 5: Improved Version
        improved = step5_improved_version(context, essay, errors)
        
        # Combine all results
        result = {
            "topic_id": topic_id,
            "essay": essay,
            "word_count": len(essay.split()),
            
            # Scores from Step 1
            "task_achievement_score": scoring.get("task_achievement_score", 0),
            "coherence_cohesion_score": scoring.get("coherence_cohesion_score", 0),
            "lexical_resource_score": scoring.get("lexical_resource_score", 0),
            "grammar_accuracy_score": scoring.get("grammar_accuracy_score", 0),
            "overall_score": scoring.get("overall_score", 0),
            
            # Feedback from Step 4
            "feedback": feedback_result.get("feedback", "") if feedback_result else scoring.get("brief_assessment", ""),
            
            # Errors from Step 2 (max 5) + Strengths from Step 3 (max 3) = Total max 8
            "errors": (errors[:5] + [{"type": "strength", "text": s.get("text", ""), "correction": "", "explanation": s.get("explanation", "")} for s in strengths[:3]]),
            
            # Suggestions from Step 4 (max 3)
            "suggestions": (feedback_result.get("suggestions", []) if feedback_result else [])[:3],
            
            # Improved version from Step 5
            "improved_version": improved.get("improved_version", "") if improved else ""
        }
        
        print(f"Writing evaluation completed - Overall score: {result.get('overall_score', 'N/A')}")
        return result
        
    except Exception as e:
        print(f"Writing evaluation error: {e}")
        return None


# Export functions
__all__ = ['evaluate_writing', 'step1_scoring', 'step2_error_analysis', 'step3_strengths_analysis', 'step4_feedback_suggestions', 'step5_improved_version']
