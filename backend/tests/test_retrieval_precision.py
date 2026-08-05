from app.schemas.file import RetrievalResult, VectorStoreItem
from app.services.retrieval_service import RetrievalService


def test_keyword_bonus_uses_chunk_content_and_section_metadata() -> None:
    service = RetrievalService()
    item = VectorStoreItem(
        chunk_id="file-1-0",
        file_id="file-1",
        chunk_index=0,
        content="用户可以上传 TXT、DOCX、文本型 PDF 文件。",
        char_count=28,
        section_title="文件上传与自动处理",
        section_path="当前已完成功能 > 文件上传与自动处理",
        embedding=[1.0, 0.0],
    )
    keywords = service._extract_keywords("支持上传什么文件类型")

    bonus = service._keyword_bonus(item, keywords)

    assert bonus > 0


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
