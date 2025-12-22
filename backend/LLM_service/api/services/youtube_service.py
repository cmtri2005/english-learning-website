"""
YouTube Service - Search for English learning videos for Vietnamese learners
Uses YouTube Data API v3 to find relevant educational content
"""

import os
from typing import Optional

# Get API key from environment
YOUTUBE_API_KEY = os.getenv("YOUTUBE_API_KEY", "")
LLM_MODEL = os.getenv("LLM_MODEL", "llama-3.1-8b-instant")

# LLM Prompt for generating search keywords
SEARCH_KEYWORDS_PROMPT = """You are an English learning assistant for Vietnamese learners.

Based on the evaluation feedback below, generate 2-3 YouTube search queries in English that would help the learner improve their weak areas.

The queries should:
1. Be specific to the weakness identified
2. Target "English learning" or "English for Vietnamese" content
3. Be practical and actionable
4. Focus on the most critical improvement area

Evaluation feedback:
{feedback}

Weaknesses identified:
{weaknesses}

Output only the search queries, one per line. No numbering, no explanations.
Example output:
English pronunciation tips for Vietnamese speakers
How to improve English fluency speaking
Grammar tenses for beginners
"""


def generate_search_queries(feedback: str, weaknesses: list[str]) -> list[str]:
    """Use LLM to generate relevant YouTube search queries based on feedback"""
    try:
        # Import here to avoid circular dependency
        from .clients import get_groq_client
        
        client = get_groq_client()
        if not client:
            # Fallback to generic queries
            return ["English learning for Vietnamese speakers"]
        
        prompt = SEARCH_KEYWORDS_PROMPT.format(
            feedback=feedback[:500],  # Limit to prevent token overflow
            weaknesses=", ".join(weaknesses[:5]) if weaknesses else "general improvement"
        )
        
        response = client.chat.completions.create(
            model=LLM_MODEL,
            messages=[{"role": "user", "content": prompt}],
            temperature=0.7,
            max_tokens=200
        )
        
        queries = response.choices[0].message.content.strip().split("\n")
        return [q.strip() for q in queries if q.strip()][:3]  # Max 3 queries
        
    except Exception as e:
        print(f"⚠️ Failed to generate search queries: {e}")
        return ["English learning for Vietnamese speakers"]


def search_youtube_videos(query: str, max_results: int = 3) -> list[dict]:
    """
    Search YouTube for videos matching the query
    Returns list of video info dicts
    """
    if not YOUTUBE_API_KEY:
        print("⚠️ YOUTUBE_API_KEY not configured")
        return []
    
    try:
        import urllib.request
        import urllib.parse
        import json
        
        # Add Vietnamese English learning context to query
        enhanced_query = f"{query} học tiếng anh"
        
        params = urllib.parse.urlencode({
            "part": "snippet",
            "q": enhanced_query,
            "type": "video",
            "maxResults": max_results,
            "relevanceLanguage": "vi",  # Prefer Vietnamese content
            "videoEmbeddable": "true",
            "key": YOUTUBE_API_KEY
        })
        
        url = f"https://www.googleapis.com/youtube/v3/search?{params}"
        
        with urllib.request.urlopen(url, timeout=10) as response:
            data = json.loads(response.read().decode())
        
        videos = []
        for item in data.get("items", []):
            snippet = item.get("snippet", {})
            video_id = item.get("id", {}).get("videoId")
            
            if video_id:
                videos.append({
                    "video_id": video_id,
                    "title": snippet.get("title", ""),
                    "description": snippet.get("description", "")[:200],
                    "thumbnail": snippet.get("thumbnails", {}).get("medium", {}).get("url", ""),
                    "channel": snippet.get("channelTitle", ""),
                    "url": f"https://www.youtube.com/watch?v={video_id}",
                    "embed_url": f"https://www.youtube.com/embed/{video_id}"
                })
        
        return videos
        
    except Exception as e:
        print(f"⚠️ YouTube search failed: {e}")
        return []


def get_recommended_videos(
    feedback: str,
    weaknesses: list[str],
    skill_type: str = "speaking",
    max_videos: int = 3
) -> list[dict]:
    """
    Get recommended YouTube videos based on evaluation feedback
    
    Args:
        feedback: The evaluation feedback text
        weaknesses: List of weak areas identified
        skill_type: "speaking" or "writing"
        max_videos: Maximum number of videos to return
    
    Returns:
        List of video recommendations with metadata
    """
    # Generate search queries based on feedback
    queries = generate_search_queries(feedback, weaknesses)
    
    # Add skill-specific context
    if skill_type == "speaking":
        default_query = "English speaking practice for Vietnamese"
    else:
        default_query = "English writing tips for Vietnamese learners"
    
    if not queries:
        queries = [default_query]
    
    # Collect videos from all queries
    all_videos = []
    seen_ids = set()
    
    for query in queries:
        videos = search_youtube_videos(query, max_results=2)
        for video in videos:
            if video["video_id"] not in seen_ids:
                seen_ids.add(video["video_id"])
                video["search_query"] = query  # Track which query found this
                all_videos.append(video)
    
    # Return top videos
    return all_videos[:max_videos]


def extract_weaknesses_from_speaking(evaluation: dict) -> tuple[str, list[str]]:
    """Extract feedback summary and weakness list from speaking evaluation"""
    feedback = ""
    weaknesses = []
    
    # Get feedback object
    fb = evaluation.get("feedback", {})
    if isinstance(fb, dict):
        feedback = fb.get("summary", "")
        improvements = fb.get("improvements", [])
        if improvements:
            weaknesses.extend(improvements[:3])
    
    # Check scores for weak areas
    scores = evaluation.get("scores", {})
    if scores:
        weak_areas = []
        if scores.get("pronunciation", 10) < 6:
            weak_areas.append("pronunciation")
        if scores.get("grammar", 10) < 6:
            weak_areas.append("grammar")
        if scores.get("vocabulary", 10) < 6:
            weak_areas.append("vocabulary")
        if scores.get("fluency", 10) < 6:
            weak_areas.append("fluency")
        if scores.get("content", 10) < 6:
            weak_areas.append("content relevance")
        
        # Map to improvement suggestions
        for area in weak_areas:
            if area == "pronunciation":
                weaknesses.append("Improve English pronunciation")
            elif area == "grammar":
                weaknesses.append("Practice English grammar rules")
            elif area == "vocabulary":
                weaknesses.append("Expand English vocabulary")
            elif area == "fluency":
                weaknesses.append("Improve speaking fluency")
            elif area == "content relevance":
                weaknesses.append("Stay on topic when speaking")
    
    return feedback, list(set(weaknesses))[:5]


def extract_weaknesses_from_writing(evaluation: dict) -> tuple[str, list[str]]:
    """Extract feedback summary and weakness list from writing evaluation"""
    feedback = evaluation.get("feedback", "")
    weaknesses = []
    
    # Check scores for weak areas
    if evaluation.get("task_achievement_score", 10) < 6:
        weaknesses.append("Task achievement in writing")
    if evaluation.get("coherence_cohesion_score", 10) < 6:
        weaknesses.append("Writing coherence and cohesion")
    if evaluation.get("lexical_resource_score", 10) < 6:
        weaknesses.append("Vocabulary in writing")
    if evaluation.get("grammar_accuracy_score", 10) < 6:
        weaknesses.append("Grammar accuracy in writing")
    
    # Get suggestions
    suggestions = evaluation.get("suggestions", [])
    if suggestions:
        weaknesses.extend(suggestions[:2])
    
    return feedback, list(set(weaknesses))[:5]
