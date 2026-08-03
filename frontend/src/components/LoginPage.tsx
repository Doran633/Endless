import { useState } from 'react';
import { Button, Typography, Space, Card, Input } from 'antd';
import { RobotOutlined, SafetyCertificateOutlined } from '@ant-design/icons';
import { useAuthStore } from '../stores/authStore';
import { getAccessPassword, setAccessPassword } from '../api/http';

const { Title, Text } = Typography;

export default function LoginPage() {
  const login = useAuthStore((s) => s.login);
  const [loading, setLoading] = useState(false);
  const [inviteCode, setInviteCode] = useState(getAccessPassword());

  const handleLogin = async () => {
    setLoading(true);
    setAccessPassword(inviteCode);
    await login();
  };

  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      }}
    >
      <Card
        style={{
          width: 420,
          borderRadius: 16,
          boxShadow: '0 8px 40px rgba(0,0,0,0.12)',
        }}
        bodyStyle={{ padding: '48px 40px' }}
      >
        <Space
          direction="vertical"
          size="large"
          style={{ width: '100%', textAlign: 'center' }}
        >
          <div>
            <RobotOutlined
              style={{ fontSize: 64, color: '#1677ff', marginBottom: 16 }}
            />
            <Title level={2} style={{ margin: 0 }}>
              北辰agent
            </Title>
            <Text type="secondary" style={{ fontSize: 16 }}>
              独立网页版 AI 助手
            </Text>
          </div>

          <Input.Password
            prefix={<SafetyCertificateOutlined />}
            placeholder="邀请码，本地开发可留空"
            value={inviteCode}
            onChange={(event) => setInviteCode(event.target.value)}
            size="large"
          />

          <Button
            type="primary"
            size="large"
            icon={<RobotOutlined />}
            loading={loading}
            onClick={handleLogin}
            style={{
              width: '100%',
              height: 48,
              borderRadius: 8,
              fontSize: 16,
            }}
          >
            进入北辰agent
          </Button>

          <Text type="secondary" style={{ fontSize: 12 }}>
            MVP 试用版本，当前使用邀请码保护 API 调用
          </Text>
        </Space>
      </Card>
    </div>
  );
}
