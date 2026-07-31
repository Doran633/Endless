import { Typography, Button, Divider, Space, Tag, message } from 'antd';
import {
  MessageOutlined,
  FileTextOutlined,
  PlusOutlined,
  DeleteOutlined,
  LogoutOutlined,
  CompassOutlined,
} from '@ant-design/icons';
import { useChatStore } from '../stores/chatStore';
import { useAuthStore } from '../stores/authStore';
import { clearAccessPassword } from '../api/http';

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

function getSessionTone(mode: 'general' | 'file') {
  if (mode === 'file') {
    return {
      icon: <FileTextOutlined />,
      label: '文件',
      color: '#13c2c2',
      background: 'rgba(19, 194, 194, 0.12)',
      border: 'rgba(19, 194, 194, 0.32)',
    };
  }

  return {
    icon: <MessageOutlined />,
    label: '对话',
    color: '#7c8cff',
    background: 'rgba(124, 140, 255, 0.12)',
    border: 'rgba(124, 140, 255, 0.30)',
  };
}

export default function Sidebar({ activeNav, onNavChange }: SidebarProps) {
  const { sessions, currentSessionId, selectSession, createSession, deleteSession } =
    useChatStore();
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);
  const handleLogout = () => {
    clearAccessPassword();
    logout();
    message.success('访问口令已清除');
  };

  const handleNewChat = async () => {
    try {
      const id = await createSession('general');
      await selectSession(id);
      onNavChange('chat');
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '新建会话失败';
      message.error(errorMessage);
    }
  };

  const handleSessionClick = async (id: string) => {
    try {
      await selectSession(id);
      onNavChange('chat');
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '会话切换失败';
      message.error(errorMessage);
    }
  };

  return (
    <div
      style={{
        width: 300,
        minWidth: 300,
        height: '100vh',
        background:
          'linear-gradient(180deg, #15172a 0%, #191b30 54%, #111423 100%)',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
        userSelect: 'none',
      }}
    >
      {/* Logo Area */}
      <div
        style={{
          padding: '22px 16px 18px',
          borderBottom: '1px solid rgba(255,255,255,0.08)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div
            style={{
              width: 46,
              height: 46,
              borderRadius: 14,
              background:
                'linear-gradient(135deg, #5b8cff 0%, #1677ff 48%, #13c2c2 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 12px 24px rgba(22, 119, 255, 0.28)',
              position: 'relative',
            }}
          >
            <CompassOutlined style={{ color: '#fff', fontSize: 24 }} />
            <span
              style={{
                position: 'absolute',
                right: -3,
                bottom: -3,
                width: 14,
                height: 14,
                borderRadius: 5,
                background: '#21d6a2',
                border: '2px solid #15172a',
              }}
            />
          </div>
          <div>
            <Space size={6} align="center">
              <Text strong style={{ color: '#fff', fontSize: 19, display: 'block' }}>
                北辰
              </Text>
              <Text
                style={{
                  color: '#9db7ff',
                  fontSize: 12,
                  fontWeight: 700,
                  letterSpacing: 0,
                }}
              >
                agent
              </Text>
            </Space>
            <Text style={{ color: 'rgba(255,255,255,0.46)', fontSize: 12, display: 'block' }}>
              面向知识文件的 AI 工作台
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
                  ? 'rgba(91,140,255,0.18)'
                  : 'transparent',
              border:
                activeNav === item.key
                  ? '1px solid rgba(124, 140, 255, 0.22)'
                  : '1px solid transparent',
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
                color: activeNav === item.key ? '#8fb1ff' : 'rgba(255,255,255,0.58)',
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

        {sessions.map((session) => {
          const tone = getSessionTone(session.mode);
          const active = currentSessionId === session.id && activeNav === 'chat';

          return (
            <div
              key={session.id}
              onClick={() => handleSessionClick(session.id)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 10,
                padding: '10px 10px',
                marginBottom: 6,
                borderRadius: 8,
                cursor: 'pointer',
                background: active ? 'rgba(255,255,255,0.08)' : 'rgba(255,255,255,0.025)',
                border: active ? `1px solid ${tone.border}` : '1px solid rgba(255,255,255,0.04)',
                borderLeft: `3px solid ${active ? tone.color : 'rgba(255,255,255,0.12)'}`,
                transition: 'all 0.15s',
              }}
              onMouseEnter={(e) => {
                if (!active) {
                  (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.06)';
                  (e.currentTarget as HTMLElement).style.borderLeftColor = tone.color;
                }
              }}
              onMouseLeave={(e) => {
                if (!active) {
                  (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.025)';
                  (e.currentTarget as HTMLElement).style.borderLeftColor =
                    'rgba(255,255,255,0.12)';
                }
              }}
            >
              <span
                style={{
                  width: 28,
                  height: 28,
                  borderRadius: 8,
                  flexShrink: 0,
                  color: tone.color,
                  background: tone.background,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: 14,
                }}
              >
                {tone.icon}
              </span>
              <div style={{ flex: 1, minWidth: 0 }}>
                <Text
                  style={{
                    color: active ? '#fff' : 'rgba(255,255,255,0.82)',
                    fontSize: 13,
                    fontWeight: active ? 600 : 500,
                    display: 'block',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {session.title}
                </Text>
                <Tag
                  bordered={false}
                  color={session.mode === 'file' ? 'cyan' : 'geekblue'}
                  style={{
                    marginTop: 5,
                    marginInlineEnd: 0,
                    fontSize: 10,
                    lineHeight: '16px',
                    borderRadius: 4,
                  }}
                >
                  {tone.label}
                </Tag>
              </div>
              {active && (
                <DeleteOutlined
                  style={{ color: 'rgba(255,255,255,0.35)', fontSize: 12 }}
                  onClick={(e) => {
                    e.stopPropagation();
                    deleteSession(session.id).catch((error) => {
                      const errorMessage = error instanceof Error ? error.message : '会话删除失败';
                      message.error(errorMessage);
                    });
                  }}
                />
              )}
            </div>
          );
        })}

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
            onClick={handleLogout}
          />
        </div>
      )}
    </div>
  );
}
