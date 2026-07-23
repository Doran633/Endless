import { Typography, Button, Badge, Divider } from 'antd';
import {
  MessageOutlined,
  FileTextOutlined,
  PlusOutlined,
  ThunderboltOutlined,
  DeleteOutlined,
  LogoutOutlined,
} from '@ant-design/icons';
import { useChatStore } from '../stores/chatStore';
import { useAuthStore } from '../stores/authStore';

const { Text } = Typography;

export type NavView = 'chat' | 'files';

interface SidebarProps {
  activeNav: NavView;
  onNavChange: (view: NavView) => void;
}

const navItems = [
  { key: 'chat' as NavView, icon: <MessageOutlined />, label: '对话', badge: 0 },
  { key: 'files' as NavView, icon: <FileTextOutlined />, label: '文件中心', badge: 0 },
];

export default function Sidebar({ activeNav, onNavChange }: SidebarProps) {
  const { sessions, currentSessionId, selectSession, createSession, deleteSession } =
    useChatStore();
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);

  const handleNewChat = () => {
    const id = createSession('general');
    selectSession(id);
    onNavChange('chat');
  };

  const handleSessionClick = (id: string) => {
    selectSession(id);
    onNavChange('chat');
  };

  return (
    <div
      style={{
        width: 300,
        minWidth: 300,
        height: '100vh',
        background: '#1a1a2e',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
        userSelect: 'none',
      }}
    >
      {/* Logo Area */}
      <div
        style={{
          padding: '20px 16px 16px',
          borderBottom: '1px solid rgba(255,255,255,0.06)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div
            style={{
              width: 36,
              height: 36,
              borderRadius: 10,
              background: 'linear-gradient(135deg, #1677ff, #0958d9)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <ThunderboltOutlined style={{ color: '#fff', fontSize: 20 }} />
          </div>
          <div>
            <Text strong style={{ color: '#fff', fontSize: 17, display: 'block' }}>
              北辰agent
            </Text>
            <Text style={{ color: 'rgba(255,255,255,0.35)', fontSize: 11 }}>
              AI 文档助手
            </Text>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <div style={{ padding: '12px 12px 8px' }}>
        {navItems.map((item) => (
          <div
            key={item.key}
            onClick={() => onNavChange(item.key)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 10,
              padding: '10px 14px',
              marginBottom: 2,
              borderRadius: 8,
              cursor: 'pointer',
              background:
                activeNav === item.key
                  ? 'rgba(22,119,255,0.2)'
                  : 'transparent',
              transition: 'all 0.15s',
            }}
            onMouseEnter={(e) => {
              if (activeNav !== item.key) {
                (e.currentTarget as HTMLElement).style.background =
                  'rgba(255,255,255,0.06)';
              }
            }}
            onMouseLeave={(e) => {
              if (activeNav !== item.key) {
                (e.currentTarget as HTMLElement).style.background = 'transparent';
              }
            }}
          >
            <span
              style={{
                color: activeNav === item.key ? '#1677ff' : 'rgba(255,255,255,0.65)',
                fontSize: 18,
                display: 'flex',
              }}
            >
              {item.icon}
            </span>
            <Text
              style={{
                flex: 1,
                color: activeNav === item.key ? '#fff' : 'rgba(255,255,255,0.65)',
                fontSize: 14,
                fontWeight: activeNav === item.key ? 500 : 400,
              }}
            >
              {item.label}
            </Text>
          </div>
        ))}
      </div>

      {/* New Chat Button */}
      <div style={{ padding: '4px 12px 12px' }}>
        <Button
          type="primary"
          icon={<PlusOutlined />}
          onClick={handleNewChat}
          style={{
            width: '100%',
            borderRadius: 8,
            background: '#1677ff',
            borderColor: '#1677ff',
            color: '#fff',
            fontSize: 13,
            fontWeight: 600,
          }}
        >
          开启新对话
        </Button>
      </div>

      <Divider style={{ margin: '0 12px', borderColor: 'rgba(255,255,255,0.06)' }} />

      {/* Section: Recent Sessions */}
      <div style={{ flex: 1, overflow: 'auto', padding: '8px 12px' }}>
        <Text
          style={{
            color: 'rgba(255,255,255,0.3)',
            fontSize: 11,
            display: 'block',
            padding: '4px 8px 8px',
            textTransform: 'uppercase',
            letterSpacing: '0.5px',
          }}
        >
          最近对话
        </Text>

        {sessions.map((session) => (
          <div
            key={session.id}
            onClick={() => handleSessionClick(session.id)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 10,
              padding: '10px 10px',
              marginBottom: 2,
              borderRadius: 8,
              cursor: 'pointer',
              background:
                currentSessionId === session.id && activeNav === 'chat'
                  ? 'rgba(22,119,255,0.2)'
                  : 'transparent',
              transition: 'all 0.15s',
            }}
            onMouseEnter={(e) => {
              if (!(currentSessionId === session.id && activeNav === 'chat')) {
                (e.currentTarget as HTMLElement).style.background =
                  'rgba(255,255,255,0.06)';
              }
            }}
            onMouseLeave={(e) => {
              if (!(currentSessionId === session.id && activeNav === 'chat')) {
                (e.currentTarget as HTMLElement).style.background = 'transparent';
              }
            }}
          >
            <span style={{ fontSize: 16, flexShrink: 0 }}>
              {session.mode === 'file' ? '📄' : '💬'}
            </span>
            <div style={{ flex: 1, minWidth: 0 }}>
              <Text
                style={{
                  color: '#fff',
                  fontSize: 13,
                  display: 'block',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                }}
              >
                {session.title}
              </Text>
            </div>
            {currentSessionId === session.id && activeNav === 'chat' && (
              <DeleteOutlined
                style={{ color: 'rgba(255,255,255,0.25)', fontSize: 12 }}
                onClick={(e) => {
                  e.stopPropagation();
                  deleteSession(session.id);
                }}
              />
            )}
          </div>
        ))}

        {sessions.length === 0 && (
          <Text
            style={{
              color: 'rgba(255,255,255,0.2)',
              fontSize: 12,
              display: 'block',
              textAlign: 'center',
              padding: '24px 0',
            }}
          >
            暂无对话，点击上方“开启新对话”开始
          </Text>
        )}
      </div>

      {/* User Area */}
      {user && (
        <div
          style={{
            padding: '12px 16px',
            borderTop: '1px solid rgba(255,255,255,0.06)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div
              style={{
                width: 30,
                height: 30,
                borderRadius: 8,
                background: 'linear-gradient(135deg, #1677ff, #4096ff)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#fff',
                fontWeight: 600,
                fontSize: 13,
              }}
            >
              {user.name[0]}
            </div>
            <Text style={{ color: 'rgba(255,255,255,0.8)', fontSize: 13 }}>
              {user.name}
            </Text>
          </div>
          <LogoutOutlined
            style={{ color: 'rgba(255,255,255,0.3)', fontSize: 14, cursor: 'pointer' }}
            onClick={logout}
          />
        </div>
      )}
    </div>
  );
}
