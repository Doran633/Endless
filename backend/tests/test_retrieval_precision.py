from app.schemas.file import RetrievalResult, VectorStoreItem
from app.services.retrieval_service import RetrievalService


def test_keyword_bonus_uses_chunk_content_and_section_metadata() -> None:
    service = RetrievalService()
    item = VectorStoreItem(
        chunk_id="file-1-0",
        file_id="file-1",
        chunk_index=0,
        content="\u7528\u6237\u53ef\u4ee5\u4e0a\u4f20 TXT\u3001DOCX\u3001\u6587\u672c\u578b PDF \u6587\u4ef6\u3002",
        char_count=28,
        section_title="\u6587\u4ef6\u4e0a\u4f20\u4e0e\u81ea\u52a8\u5904\u7406",
        section_path="\u5f53\u524d\u5df2\u5b8c\u6210\u529f\u80fd > \u6587\u4ef6\u4e0a\u4f20\u4e0e\u81ea\u52a8\u5904\u7406",
        embedding=[1.0, 0.0],
    )
    keywords = service._extract_keywords("\u652f\u6301\u4e0a\u4f20\u4ec0\u4e48\u6587\u4ef6\u7c7b\u578b")

    bonus = service._keyword_bonus(item, keywords)

    assert bonus > 0


def test_capability_intent_boosts_capability_sections() -> None:
    service = RetrievalService()
    item = VectorStoreItem(
        chunk_id="file-1-0",
        file_id="file-1",
        chunk_index=0,
        content="\u6587\u4ef6\u4e0a\u4f20\u4e0e\u81ea\u52a8\u5904\u7406",
        char_count=120,
        section_title="\u6587\u4ef6\u4e0a\u4f20\u4e0e\u81ea\u52a8\u5904\u7406",
        section_path="\u5f53\u524d\u5df2\u5b8c\u6210\u529f\u80fd > \u6587\u4ef6\u4e0a\u4f20\u4e0e\u81ea\u52a8\u5904\u7406",
        embedding=[1.0, 0.0],
    )

    boost, penalty, reason = service._section_adjustment(item, "capability")

    assert boost > 0
    assert penalty == 0
    assert "section_boost:capability" in reason


def test_overview_intent_boosts_section_summary_chunks() -> None:
    service = RetrievalService()
    item = VectorStoreItem(
        chunk_id="file-1-0",
        file_id="file-1",
        chunk_index=0,
        content="Section Summary: 当前已完成功能",
        char_count=120,
        section_title="当前已完成功能",
        section_path="当前已完成功能",
        chunk_type="section_summary",
        embedding=[1.0, 0.0],
    )

    assert service._classify_query_intent("目前完成了哪些核心能力") == "overview"
    boost, penalty, reason = service._section_adjustment(item, "overview")

    assert boost > 0
    assert penalty == 0
    assert "section_boost:overview_summary" in reason


def test_quantity_intent_rewards_chunks_with_numbers_or_units() -> None:
    service = RetrievalService()
    item = VectorStoreItem(
        chunk_id="file-1-0",
        file_id="file-1",
        chunk_index=0,
        content="\u8bd5\u8fd0\u884c\u4eba\u6570\u4e0a\u9650\u4e3a 5 \u4eba\u3002",
        char_count=16,
        section_title="\u8bd5\u8fd0\u884c\u8303\u56f4",
        section_path="\u8bd5\u8fd0\u884c\u8303\u56f4",
        embedding=[1.0, 0.0],
    )

    bonus, reason = service._answerability_bonus(item, "quantity")

    assert bonus > 0
    assert reason == "answerability_bonus:number_or_unit"


def test_short_title_like_chunks_receive_length_penalty() -> None:
    service = RetrievalService()
    item = VectorStoreItem(
        chunk_id="file-1-0",
        file_id="file-1",
        chunk_index=0,
        content="\u5317\u8fb0agent \u5c0f\u8303\u56f4\u4e0a\u7ebf\u8bd5\u8fd0\u884c\u8ba1\u5212",
        char_count=24,
        section_title=None,
        section_path=None,
        embedding=[1.0, 0.0],
    )

    penalty, reason = service._length_penalty(item)

    assert penalty > 0
    assert reason == "length_penalty:short_title_like"


def test_relative_score_gap_filters_weak_tail_results() -> None:
    service = RetrievalService()
    results = [
        RetrievalResult(
            chunk_id="file-1-0",
            chunk_index=0,
            content="strong",
            char_count=6,
            score=0.80,
            final_score=0.80,
            relevance_level="high",
        ),
        RetrievalResult(
            chunk_id="file-1-1",
            chunk_index=1,
            content="medium",
            char_count=6,
            score=0.66,
            final_score=0.66,
            relevance_level="high",
        ),
        RetrievalResult(
            chunk_id="file-1-2",
            chunk_index=2,
            content="weak",
            char_count=4,
            score=0.52,
            final_score=0.52,
            relevance_level="medium",
        ),
    ]

    filtered = service._filter_results(results)

    assert [result.chunk_id for result in filtered] == ["file-1-0", "file-1-1"]
