from app.llm.base import ChatMessage
from app.services.llm_service import LLMService


class ChatService:
    SYSTEM_PROMPT = (
        "你是北辰agent，一个独立网页版 AI 助手。"
        "你可以进行普通 AI 聊天，并在用户上传和索引文档后进行单文件 RAG 问答。"
        "不要自称 WorkBuddy，也不要声称已经接入日程、企业权限、企业系统或未实现的工具。"
        "回答要清晰、简洁、可执行。"
    )

    def __init__(self, llm_service: LLMService | None = None) -> None:
        self.llm_service = llm_service or LLMService()

    def answer(self, content: str) -> dict[str, object]:
        return self.answer_with_context([ChatMessage(role="user", content=content)])

    def answer_with_context(self, messages: list[ChatMessage]) -> dict[str, object]:
        # The system prompt is always injected here so callers do not duplicate identity rules.
        messages = [
            ChatMessage(
                role="system",
                content=self.SYSTEM_PROMPT,
            ),
            *messages,
        ]
        response = self.llm_service.chat(messages)
        return {
            "answer": response.content,
            "model": response.model,
            "usage": {
                "input_tokens": response.input_tokens,
                "output_tokens": response.output_tokens,
            },
        }
