from app.services.chunk_service import ChunkService


def test_chunk_service_keeps_section_metadata_for_structured_text() -> None:
    text = "\n".join(
        [
            "一、项目背景",
            "北辰agent 是一个独立网页版 AI 助手 MVP。",
            "二、当前已完成功能",
            "1. 文件上传与自动处理",
            "用户可以上传 TXT、DOCX、文本型 PDF 文件。",
            "单个上传文件大小上限为 20MB。",
            "2. 单文件 RAG 问答",
            "系统支持基于一个已索引文件进行问答。",
        ]
    )

    chunks = ChunkService(chunk_size=200, chunk_overlap=20).create_chunks("file-1", text)

    file_chunk = next(
        chunk
        for chunk in chunks
        if chunk.chunk_type == "normal" and "TXT、DOCX" in chunk.content
    )

    assert file_chunk.section_title == "文件上传与自动处理"
    assert file_chunk.section_path == "当前已完成功能 > 文件上传与自动处理"


def test_chunk_service_falls_back_to_fixed_length_without_headings() -> None:
    text = "这是一段没有明显标题的普通文本。" * 30

    chunks = ChunkService(chunk_size=80, chunk_overlap=10).create_chunks("file-2", text)

    assert len(chunks) > 1
    assert all(chunk.section_title is None for chunk in chunks)
    assert all(chunk.section_path is None for chunk in chunks)


def test_chunk_service_creates_section_summary_chunks_for_structured_text() -> None:
    text = "\n".join(
        [
            "二、当前已完成功能",
            "1. 普通 AI 聊天",
            "用户可以进行基础连续追问。",
            "2. 文件上传与自动处理",
            "用户可以上传 TXT、DOCX、文本型 PDF 文件。",
            "3. 单文件 RAG 问答",
            "系统支持基于一个已索引文件进行问答。",
        ]
    )

    chunks = ChunkService(chunk_size=200, chunk_overlap=20).create_chunks("file-3", text)
    summary_chunks = [chunk for chunk in chunks if chunk.chunk_type == "section_summary"]

    assert summary_chunks
    assert summary_chunks[0].section_title == "当前已完成功能"
    assert "普通 AI 聊天" in summary_chunks[0].content
    assert "文件上传与自动处理" in summary_chunks[0].content
