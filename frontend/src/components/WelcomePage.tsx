import { Typography, Card, Row, Col, Space, Button } from 'antd';
import {
  FileTextOutlined,
  MessageOutlined,
  FilePptOutlined,
  RightCircleOutlined,
  ThunderboltOutlined,
} from '@ant-design/icons';
import { useChatStore } from '../stores/chatStore';

const { Title, Text, Paragraph } = Typography;

const capabilities = [
  {
    icon: <FileTextOutlined style={{ fontSize: 32, color: '#1677ff' }} />,
    title: '文件分析',
    desc: '上传 PDF、DOCX、TXT 文件，自动解析内容，支持基于文件的深度问答',
    gradient: 'linear-gradient(135deg, #e6f4ff, #f0f5ff)',
    border: '1px solid #91caff',
  },
  {
    icon: <MessageOutlined style={{ fontSize: 32, color: '#52c41a' }} />,
    title: '智能问答',
    desc: '围绕文件内容进行多轮对话，快速定位关键信息，辅助决策',
    gradient: 'linear-gradient(135deg, #f6ffed, #f0fff0)',
    border: '1px solid #b7eb8f',
  },
  {
    icon: <FilePptOutlined style={{ fontSize: 32, color: '#fa8c16' }} />,
    title: 'PPT 生成',
    desc: '基于文件内容一键生成结构化 PPT，支持标题定制和段落调整',
    gradient: 'linear-gradient(135deg, #fff7e6, #fffbe6)',
    border: '1px solid #ffd591',
  },
];

const quickStarts = [
  { emoji: '📊', text: '分析我上传的 Q2 销售报告' },
  { emoji: '🔍', text: '审查这份 PRD 的安全设计' },
  { emoji: '📝', text: '基于会议纪要生成汇报 PPT' },
];

export default function WelcomePage() {
  const createSession = useChatStore((s) => s.createSession);
  const selectSession = useChatStore((s) => s.selectSession);

  const handleQuickStart = (text: string) => {
    const sessionId = createSession('general');
    selectSession(sessionId);
    // 通过 chatStore 发送消息
    useChatStore.getState().sendMessage(text);
  };

  return (
    <div
      style={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        overflow: 'auto',
        background: '#f5f7fa',
        padding: '40px 24px',
      }}
    >
      <div style={{ maxWidth: 900, width: '100%' }}>
        {/* Hero */}
        <div style={{ textAlign: 'center', marginBottom: 48, marginTop: 24 }}>
          <div
            style={{
              width: 72,
              height: 72,
              borderRadius: 20,
              background: 'linear-gradient(135deg, #1677ff, #595959)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 20px',
              boxShadow: '0 8px 24px rgba(22,119,255,0.25)',
            }}
          >
            <ThunderboltOutlined style={{ fontSize: 36, color: '#fff' }} />
          </div>
          <Title level={2} style={{ margin: 0, color: '#1a1a2e' }}>
            WorkBuddy
          </Title>
          <Title
            level={4}
            style={{
              margin: '8px 0 16px',
              color: '#8c8c8c',
              fontWeight: 400,
            }}
          >
            企业 AI 助手 — 上传文件、智能问答、一键生成 PPT
          </Title>
          <Paragraph
            style={{
              color: '#bfbfbf',
              fontSize: 14,
              maxWidth: 480,
              margin: '0 auto',
            }}
          >
            上传文档即可开始，AI 自动解析内容，围绕文件深度对话，并可生成结构化汇报 PPT
          </Paragraph>
        </div>

        {/* Capability Cards */}
        <Row gutter={[20, 20]} style={{ marginBottom: 48 }}>
          {capabilities.map((cap) => (
            <Col span={8} key={cap.title}>
              <Card
                hoverable
                style={{
                  borderRadius: 12,
                  background: cap.gradient,
                  border: cap.border,
                  height: '100%',
                }}
                bodyStyle={{ padding: 24 }}
              >
                <Space direction="vertical" size={12}>
                  {cap.icon}
                  <Title level={5} style={{ margin: 0, color: '#262626' }}>
                    {cap.title}
                  </Title>
                  <Text style={{ color: '#595959', fontSize: 13, lineHeight: 1.6 }}>
                    {cap.desc}
                  </Text>
                </Space>
              </Card>
            </Col>
          ))}
        </Row>

        {/* Quick Start */}
        <div>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              marginBottom: 16,
            }}
          >
            <RightCircleOutlined style={{ color: '#1677ff', fontSize: 18 }} />
            <Text strong style={{ fontSize: 15, color: '#262626' }}>
              快速开始
            </Text>
            <Text style={{ color: '#bfbfbf', fontSize: 13 }}>
              选择一个示例，体验 WorkBuddy 的能力
            </Text>
          </div>

          <Row gutter={[12, 12]}>
            {quickStarts.map((qs) => (
              <Col span={8} key={qs.text}>
                <Button
                  type="default"
                  style={{
                    width: '100%',
                    height: 52,
                    borderRadius: 10,
                    textAlign: 'left',
                    padding: '0 16px',
                    border: '1px solid #e8e8e8',
                    background: '#fff',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 10,
                    fontSize: 14,
                    color: '#434343',
                    boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
                  }}
                  onClick={() => handleQuickStart(qs.text)}
                  onMouseEnter={(e) => {
                    (e.currentTarget as HTMLElement).style.borderColor = '#1677ff';
                    (e.currentTarget as HTMLElement).style.boxShadow =
                      '0 2px 8px rgba(22,119,255,0.12)';
                  }}
                  onMouseLeave={(e) => {
                    (e.currentTarget as HTMLElement).style.borderColor = '#e8e8e8';
                    (e.currentTarget as HTMLElement).style.boxShadow =
                      '0 1px 3px rgba(0,0,0,0.04)';
                  }}
                >
                  <span>{qs.emoji}</span>
                  <span>{qs.text}</span>
                </Button>
              </Col>
            ))}
          </Row>
        </div>

        {/* Footer */}
        <div
          style={{
            textAlign: 'center',
            marginTop: 48,
            marginBottom: 24,
            color: '#d9d9d9',
            fontSize: 12,
          }}
        >
          开始使用后，所有对话和文件仅在当前设备保存（演示模式）
        </div>
      </div>
    </div>
  );
}
