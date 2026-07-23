import { useState } from 'react';
import { Button, Typography, Space, Card } from 'antd';
import {
  RobotOutlined,
} from '@ant-design/icons';
import { useAuthStore } from '../stores/authStore';

const { Title, Text } = Typography;

export default function LoginPage() {
  const login = useAuthStore((s) => s.login);
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    setLoading(true);
    await login();
    // login() 会更新 authStore，App.tsx 监听 isLoggedIn 自动跳转
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
            进入演示
          </Button>

          <Text type="secondary" style={{ fontSize: 12 }}>
            演示版本 · 当前不接入企业登录
          </Text>
        </Space>
      </Card>
    </div>
  );
}
