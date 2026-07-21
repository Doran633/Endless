import { useState, useRef, useEffect } from 'react';
import { Button, Input, Space, Typography } from 'antd';
import { SendOutlined, StopOutlined } from '@ant-design/icons';
import { useChatStore } from '../stores/chatStore';

const { Text } = Typography;

export default function ChatInput() {
  const [value, setValue] = useState('');
  const { sendMessage, isStreaming, currentSessionId } = useChatStore();
  const textRef = useRef<HTMLTextAreaElement>(null);

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
          WorkBuddy 使用 AI 生成内容，请核实关键信息
        </Text>
      </div>
    </div>
  );
}
