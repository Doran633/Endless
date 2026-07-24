import { useState, useRef, useEffect } from 'react';
import { Button, Input, Space, Tooltip, Typography, message } from 'antd';
import {
  CheckCircleOutlined,
  CloseCircleOutlined,
  LoadingOutlined,
  PaperClipOutlined,
  SendOutlined,
  StopOutlined,
} from '@ant-design/icons';
import { useChatStore } from '../stores/chatStore';
import { useFileStore } from '../stores/fileStore';

const { Text } = Typography;

export default function ChatInput() {
  const [value, setValue] = useState('');
  const { sendMessage, isStreaming, currentSessionId } = useChatStore();
  const { ingestFile, ingestion } = useFileStore();
  const textRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Auto-focus on mount and when session changes
  useEffect(() => {
    textRef.current?.focus();
  }, [currentSessionId]);

  const handleSend = async () => {
    const trimmed = value.trim();
    if (!trimmed || isStreaming) return;
    setValue('');
    await sendMessage(trimmed);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const isIngesting = ['uploading', 'parsing', 'chunking', 'embedding'].includes(
    ingestion.status
  );

  const ingestionStatusText: Record<typeof ingestion.status, string> = {
    idle: '',
    uploading: '正在上传文件...',
    parsing: '正在解析文档...',
    chunking: '正在切分文本...',
    embedding: '正在生成 mock 向量...',
    completed: '文件已准备，后续 RAG 阶段可用于问答',
    failed: ingestion.errorMessage || '文件处理失败',
  };

  const handlePickFile = () => {
    if (isIngesting) return;
    fileInputRef.current?.click();
  };

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = '';

    if (!file) return;

    try {
      await ingestFile(file);
      message.success(`"${file.name}" 已完成解析、切块和向量化`);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '文件处理失败';
      message.error(errorMessage);
    }
  };

  return (
    <div
      style={{
        padding: '16px 24px 24px',
        background: '#fff',
        borderTop: '1px solid #ececf1',
      }}
    >
      <div
        style={{
          maxWidth: 768,
          margin: '0 auto',
          position: 'relative',
        }}
      >
        <div
          style={{
            display: 'flex',
            gap: 8,
            alignItems: 'flex-end',
            border: '1px solid #e5e5e5',
            borderRadius: 12,
            padding: '8px 8px 8px 16px',
            background: '#fff',
            boxShadow: '0 2px 6px rgba(0,0,0,0.04)',
            transition: 'border-color 0.15s, box-shadow 0.15s',
          }}
          onFocusCapture={(e) => {
            const el = e.currentTarget;
            el.style.borderColor = '#1677ff';
            el.style.boxShadow = '0 2px 8px rgba(22,119,255,0.12)';
          }}
          onBlurCapture={(e) => {
            const el = e.currentTarget;
            el.style.borderColor = '#e5e5e5';
            el.style.boxShadow = '0 2px 6px rgba(0,0,0,0.04)';
          }}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept=".txt,.pdf,.docx"
            style={{ display: 'none' }}
            onChange={handleFileChange}
          />
          <Tooltip title="上传文件并自动准备">
            <Button
              shape="circle"
              icon={isIngesting ? <LoadingOutlined /> : <PaperClipOutlined />}
              onClick={handlePickFile}
              disabled={isIngesting}
              style={{
                flexShrink: 0,
                width: 36,
                height: 36,
              }}
            />
          </Tooltip>
          <Input.TextArea
            ref={textRef as any}
            value={value}
            onChange={(e) => setValue(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="输入消息，Enter 发送，Shift+Enter 换行"
            autoSize={{ minRows: 1, maxRows: 6 }}
            variant="borderless"
            style={{ fontSize: 14, padding: 0, resize: 'none' }}
            disabled={isStreaming}
          />
          <Button
            type="primary"
            shape="circle"
            icon={isStreaming ? <StopOutlined /> : <SendOutlined />}
            onClick={isStreaming ? undefined : handleSend}
            disabled={!value.trim() && !isStreaming}
            style={{
              flexShrink: 0,
              width: 36,
              height: 36,
            }}
          />
        </div>

        {ingestion.status !== 'idle' && (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              marginTop: 8,
              padding: '8px 12px',
              borderRadius: 8,
              background: ingestion.status === 'failed' ? '#fff2f0' : '#f6ffed',
              border:
                ingestion.status === 'failed' ? '1px solid #ffccc7' : '1px solid #b7eb8f',
            }}
          >
            {isIngesting ? (
              <LoadingOutlined style={{ color: '#1677ff' }} />
            ) : ingestion.status === 'failed' ? (
              <CloseCircleOutlined style={{ color: '#ff4d4f' }} />
            ) : (
              <CheckCircleOutlined style={{ color: '#52c41a' }} />
            )}
            <Text
              style={{
                flex: 1,
                fontSize: 12,
                color: ingestion.status === 'failed' ? '#a8071a' : '#237804',
              }}
            >
              {ingestion.fileName ? `${ingestion.fileName} · ` : ''}
              {ingestionStatusText[ingestion.status]}
              {ingestion.status === 'completed' &&
                typeof ingestion.embeddingCount === 'number' &&
                ` · ${ingestion.embeddingCount} embeddings / ${ingestion.embeddingDimension} 维`}
            </Text>
          </div>
        )}

        <Text
          type="secondary"
          style={{
            display: 'block',
            textAlign: 'center',
            fontSize: 11,
            marginTop: 8,
            color: '#bbb',
          }}
        >
          北辰agent 使用 AI 生成内容，请核实关键信息
        </Text>
      </div>
    </div>
  );
}
