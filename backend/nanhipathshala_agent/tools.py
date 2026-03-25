from typing import List


def generate_quiz(topic: str, class_level: str, subject: str, question_count: int = 3) -> dict:
    """Return a lightweight quiz template for the model to personalize in Hindi."""
    count = max(1, min(question_count, 5))
    questions = [
        {
            "question_number": index + 1,
            "prompt": (
                f"Create a short {subject} question about '{topic}' suitable for {class_level}. "
                "Keep it simple and child-friendly."
            ),
            "expected_answer_style": "one short line",
        }
        for index in range(count)
    ]
    return {
        "topic": topic,
        "class_level": class_level,
        "subject": subject,
        "question_count": count,
        "questions": questions,
    }


def reteach_topic(topic: str, class_level: str, confusion_reason: str = "") -> dict:
    """Return scaffolding hints for a simpler retry explanation."""
    reason = confusion_reason.strip() or "The child said they did not understand."
    return {
        "topic": topic,
        "class_level": class_level,
        "retry_mode": True,
        "guidance": [
            "Use very simple Hindi.",
            "Use one real-life example from home or school.",
            "Break the idea into at most three tiny steps.",
            "End with one confidence-building question.",
        ],
        "confusion_reason": reason,
    }


def generate_parent_summary(
    child_name: str,
    class_level: str,
    topic: str,
    strengths: List[str],
    weak_areas: List[str],
    next_steps: List[str],
) -> dict:
    """Return a structured summary payload for the parent view."""
    return {
        "child_name": child_name,
        "class_level": class_level,
        "topic": topic,
        "strengths": strengths[:3],
        "weak_areas": weak_areas[:3],
        "next_steps": next_steps[:3],
        "tone": "supportive",
    }
