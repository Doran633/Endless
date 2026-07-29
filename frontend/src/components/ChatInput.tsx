import { useEffect, useRef, useState } from 'react';
import { Button, Input, Space, Tooltip, Typography, message } from 'antd';
import {
  CheckCircleOutlined,
  CloseCircleOutlined,
  CloseOutlined,
  LoadingOutlined,
  PaperClipOutlined,
  SendOutlined,
  StopOutlined,
} from '@ant-design/icons';
import { useChatStore } from '../stores/chatStore';
import { useFileStore } from '../stores/fileStore';

const { Text } = Typography;

const ingestionStatusText = {
  idle: '',
  uploading: '正在上传文件...',
  parsing: '正在解析文档...',
  chunking: '正在切分文本...',
  embedding: '正在生成 mock 向量...',
  indexing: '正在保存本地向量索引...',
  completed: '文件已准备好，可以直接在聊天框中基于该文件提问。',
  failed: '文件处理失败',
};

export default function ChatInput() {
  const [value, setValue] = useState('');
  const {
    bindRagFileToCurrentSession,
    clearCurrentSessionRagFile,
    currentSessionId,
    isStreaming,
    sendMessage,
    sessionRagFiles,
  } = useChatStore();
  const { clearActiveRagFile, ingestFile, ingestion } = useFileStore();
  const textRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

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

  const isIngesting = ['uploading', 'parsing', 'chunking', 'embedding', 'indexing'].includes(
    ingestion.status
  );
  const currentRagFile = currentSessionId ? sessionRagFiles[currentSessionId] : undefined;

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
      const fileState = useFileStore.getState();
      if (fileState.activeRagFileId && fileState.activeRagFileName) {
        bindRagFileToCurrentSession(fileState.activeRagFileId, fileState.activeRagFileName);
      }
      message.success(`"${file.name}" 已完成解析、切块、向量化和索引保存`);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '文件处理失败';
      message.error(errorMessage);
    }
  };

  const statusText =
    ingestion.status === 'failed'
      ? ingestion.errorMessage || ingestionStatusText.failed
      : ingestionStatusText[ingestion.status];

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
          <Tooltip title="上传文件并自动准备 RAG 问答">
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
            placeholder={
              currentRagFile
                ? `基于 ${currentRagFile.fileName} 提问，Enter 发送`
                : '输入消息，Enter 发送，Shift+Enter 换行'
            }
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

        {(ingestion.status !== 'idle' || currentRagFile) && (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 10,
              marginTop: 8,
              padding: '10px 12px',
              borderRadius: 8,
              background: ingestion.status === 'failed' ? '#fff2f0' : '#f8fbff',
              border:
                ingestion.status === 'failed' ? '1px solid #ffccc7' : '1px solid #d6e4ff',
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
                color: ingestion.status === 'failed' ? '#a8071a' : '#3150a5',
              }}
            >
              {currentRagFile
                ? `知识文件已连接：${currentRagFile.fileName} · ${statusText || '可以基于该文件提问'}`
                : `${ingestion.fileName ? `${ingestion.fileName} · ` : ''}${statusText}`}
              {ingestion.status === 'completed' &&
                typeof ingestion.embeddingCount === 'number' &&
                ` · ${ingestion.embeddingCount} embeddings / ${ingestion.embeddingDimension} 维`}
            </Text>
            {currentRagFile && !isIngesting && (
              <Tooltip title="清除当前文件，恢复普通聊天">
                <Button
                  size="small"
                  type="text"
                  icon={<CloseOutlined />}
                  onClick={() => {
                    clearCurrentSessionRagFile();
                    clearActiveRagFile();
                  }}
                />
              </Tooltip>
            )}
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
