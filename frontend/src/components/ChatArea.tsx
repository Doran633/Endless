import { useRef, useEffect } from 'react';
import { Typography, Spin } from 'antd';
import { RobotOutlined } from '@ant-design/icons';
import { useChatStore } from '../stores/chatStore';
import MessageBubble from './MessageBubble';
import ChatInput from './ChatInput';
import WelcomePage from './WelcomePage';

const { Text } = Typography;

export default function ChatArea() {
  const { currentSessionId, sessions, messages, isStreaming } = useChatStore();
  const bottomRef = useRef<HTMLDivElement>(null);

  const currentSession = currentSessionId
    ? sessions.find((s) => s.id === currentSessionId)
    : null;
  const currentMessages = currentSessionId
    ? messages[currentSessionId] ?? []
    : [];

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [currentMessages.length]);

  // No session selected → show welcome page
  if (!currentSession) {
    return <WelcomePage />;
  }

  return (
    <div
      style={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        background: '#fff',
        minWidth: 0,
      }}
    >
      {/* Header */}
      <div
        style={{
          padding: '12px 24px',
          borderBottom: '1px solid #ececf1',
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          background: '#fff',
          flexShrink: 0,
        }}
      >
        <span style={{ fontSize: 16 }}>{currentSession.mode === 'file' ? '📄' : '💬'}</span>
        <Text strong style={{ fontSize: 15, color: '#262626', flex: 1 }}>
          {currentSession.title}
        </Text>
        <span
          style={{
            fontSize: 11,
            color: '#999',
            background: '#f5f5f5',
            padding: '2px 10px',
            borderRadius: 4,
          }}
        >
          {currentSession.mode === 'file' ? '文件问答' : '普通对话'}
        </span>
      </div>

      {/* Messages */}
      <div
        style={{
          flex: 1,
          overflow: 'auto',
          background: '#f7f7f8',
        }}
      >
        {currentMessages.map((msg) => (
          <MessageBubble key={msg.id} message={msg} />
        ))}

        {/* Streaming indicator */}
        {isStreaming && (
          <div
            style={{
              padding: '16px 24px',
              borderBottom: '1px solid #ececf1',
              display: 'flex',
              gap: 14,
              background: '#f7f7f8',
            }}
          >
            <div
              style={{
                width: 32,
                height: 32,
                borderRadius: 8,
                background: '#19c37d',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <RobotOutlined style={{ color: '#fff', fontSize: 16 }} />
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <Spin size="small" />
              <Text type="secondary" style={{ fontSize: 13 }}>
                AI 正在思考...
              </Text>
            </div>
          </div>
        )}

        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <ChatInput />
    </div>
  );
}
