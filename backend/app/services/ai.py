from app.config import settings
import json
from typing import Optional, List

try:
    import google.generativeai as genai
    GENAI_AVAILABLE = bool(settings.GEMINI_API_KEY)
    if GENAI_AVAILABLE:
        genai.configure(api_key=settings.GEMINI_API_KEY)
except Exception:
    GENAI_AVAILABLE = False

try:
    from openai import OpenAI
    OPENROUTER_AVAILABLE = bool(settings.OPENROUTER_API_KEY)
    if OPENROUTER_AVAILABLE:
        openrouter_client = OpenAI(
            api_key=settings.OPENROUTER_API_KEY,
            base_url=settings.OPENROUTER_BASE_URL,
        )
except Exception:
    OPENROUTER_AVAILABLE = False


def _call_gemini(prompt: str) -> str:
    if not GENAI_AVAILABLE:
        return _fallback_response(prompt)
    try:
        model = genai.GenerativeModel("gemini-1.5-flash")
        response = model.generate_content(prompt)
        return response.text
    except Exception as e:
        return _fallback_response(prompt)


def _call_openrouter(prompt: str) -> str:
    if not OPENROUTER_AVAILABLE:
        return _call_gemini(prompt)
    try:
        response = openrouter_client.chat.completions.create(
            model="gryphe/mythomax-l2-13b",
            messages=[{"role": "user", "content": prompt}],
        )
        return response.choices[0].message.content
    except Exception:
        return _call_gemini(prompt)


def _fallback_response(prompt: str) -> str:
    return json.dumps({
        "error": "AI service unavailable. Please configure GEMINI_API_KEY or OPENROUTER_API_KEY.",
        "suggestion": "In the meantime, create your quiz manually."
    })


SYSTEM_PROMPT = """You are ThinkArena AI, an expert quiz generator. 
Generate engaging, educational, and accurate quiz content.
Respond ONLY with valid JSON. No markdown, no code blocks."""


def generate_quiz(topic: str, difficulty: str = "medium", num_questions: int = 5, question_types: List[str] = ["multiple_choice"]) -> str:
    prompt = f"""{SYSTEM_PROMPT}

Generate a quiz about "{topic}" at {difficulty} difficulty with {num_questions} questions.
Question types: {', '.join(question_types)}.

Return JSON:
{{
  "title": "Quiz title",
  "description": "Brief description",
  "difficulty": "{difficulty}",
  "questions": [
    {{
      "question_text": "...",
      "question_type": "multiple_choice",
      "explanation": "Why this answer is correct",
      "choices": [
        {{"choice_text": "...", "is_correct": true}},
        {{"choice_text": "...", "is_correct": false}},
        {{"choice_text": "...", "is_correct": false}},
        {{"choice_text": "...", "is_correct": false}}
      ]
    }}
  ]
}}

CRITICAL: Every question MUST have EXACTLY 4 choices. Exactly one choice must have is_correct: true, the other three must be false.
For true_false: provide exactly 2 choices: "True" (is_correct: true/false) and "False" (is_correct: the opposite).
For fill_in_blank: provide the answer as choice_text with is_correct: true plus 3 distractor choices.
For short_answer: provide the expected answer as choice_text with is_correct: true plus 3 distractor choices.
"""
    return _call_openrouter(prompt)


def generate_questions(topic: str, count: int = 3, question_type: str = "multiple_choice") -> str:
    prompt = f"""{SYSTEM_PROMPT}

Generate {count} {question_type} questions about "{topic}".

Return JSON:
{{
  "questions": [
    {{
      "question_text": "...",
      "question_type": "{question_type}",
      "explanation": "...",
      "choices": [
        {{"choice_text": "...", "is_correct": true}},
        {{"choice_text": "...", "is_correct": false}},
        {{"choice_text": "...", "is_correct": false}},
        {{"choice_text": "...", "is_correct": false}}
      ]
    }}
  ]
}}

CRITICAL: For multiple_choice, every question MUST have EXACTLY 4 choices with exactly one correct.
"""
    return _call_openrouter(prompt)


def generate_explanation(question: str, correct_answer: str) -> str:
    prompt = f"""{SYSTEM_PROMPT}

Explain why "{correct_answer}" is the correct answer to: "{question}"
Provide a clear, educational explanation in 2-3 sentences.

Return JSON:
{{
  "explanation": "Your explanation here"
}}
"""
    return _call_openrouter(prompt)


def summarize_quiz(quiz_title: str, questions: List[dict]) -> str:
    prompt = f"""{SYSTEM_PROMPT}

Summarize this quiz titled "{quiz_title}" with {len(questions)} questions.
Provide a brief overview of topics covered and difficulty assessment.

Return JSON:
{{
  "summary": "Brief summary",
  "topics_covered": ["topic1", "topic2"],
  "difficulty_assessment": "easy/medium/hard",
  "estimated_time_minutes": 5
}}
"""
    return _call_openrouter(prompt)


def recommend_difficulty(topic: str) -> str:
    prompt = f"""{SYSTEM_PROMPT}

Based on the topic "{topic}", recommend an appropriate difficulty level
and suggest what knowledge prerequisites might be needed.

Return JSON:
{{
  "recommended_difficulty": "beginner/easy/medium/hard/expert",
  "reasoning": "Why this difficulty is recommended",
  "prerequisites": ["prereq1", "prereq2"]
}}
"""
    return _call_openrouter(prompt)


def ai_tutor(question: str, user_answer: str, correct_answer: str) -> str:
    prompt = f"""{SYSTEM_PROMPT}

Act as an AI tutor. The user answered "{user_answer}" to the question "{question}".
The correct answer was "{correct_answer}".
Provide helpful feedback and explain the concept.

Return JSON:
{{
  "feedback": "Your personalized feedback",
  "explanation": "Concept explanation",
  "tip": "Study tip or mnemonic"
}}
"""
    return _call_openrouter(prompt)


def ai_study_assistant(topic: str, user_level: str = "intermediate") -> str:
    prompt = f"""{SYSTEM_PROMPT}

Act as an AI study assistant for a {user_level} level student studying "{topic}".
Generate study tips, key concepts to focus on, and practice suggestions.

Return JSON:
{{
  "key_concepts": ["concept1", "concept2"],
  "study_tips": ["tip1", "tip2"],
  "practice_suggestions": ["suggestion1"],
  "recommended_resources": ["resource1"]
}}
"""
    return _call_openrouter(prompt)
