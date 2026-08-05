from app.schemas.file import RetrievalResult
from app.services.rag_service import RagService


def make_result(score: float, relevance_level: str = "medium") -> RetrievalResult:
    return RetrievalResult(
        chunk_id=f"chunk-{score}",
        chunk_index=1,
        content="The uploaded file size limit is 20MB.",
        char_count=35,
        score=score,
        final_score=score,
        relevance_level=relevance_level,
    )


def test_answer_policy_returns_no_answer_for_empty_retrieval() -> None:
    service = RagService()

    policy, reason = service._decide_answer_policy([])

    assert policy == "no_answer"
    assert reason == "empty_retrieval"


def test_answer_policy_returns_no_answer_for_low_score() -> None:
    service = RagService()

    policy, reason = service._decide_answer_policy([make_result(0.44)])

    assert policy == "no_answer"
    assert reason == "low_score"


def test_answer_policy_returns_low_confidence_for_weak_chunks() -> None:
    service = RagService()

    policy, reason = service._decide_answer_policy(
        [make_result(0.60, "weak"), make_result(0.58, "weak")]
    )

    assert policy == "low_confidence_answer"
    assert reason == "weak_chunks"


def test_answer_policy_returns_grounded_answer_for_strong_retrieval() -> None:
    service = RagService()

    policy, reason = service._decide_answer_policy([make_result(0.70, "high")])

    assert policy == "grounded_answer"
    assert reason is None


def test_no_answer_response_does_not_call_llm() -> None:
    service = RagService()

    response = service._no_answer_response(
        file_id="file-1",
        query="unknown question",
        top_k=3,
        chunks=[],
        reason="empty_retrieval",
    )

    assert response.answer == "\u6839\u636e\u5f53\u524d\u6587\u6863\u5185\u5bb9\u65e0\u6cd5\u786e\u8ba4\u3002"
    assert response.answer_policy == "no_answer"
    assert response.no_answer_reason == "empty_retrieval"
    assert response.debug_trace is not None
    assert response.debug_trace.no_answer is True
    assert response.usage["input_tokens"] == 0
    assert response.usage["output_tokens"] == 0
