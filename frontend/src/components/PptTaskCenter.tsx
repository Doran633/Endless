import { Typography, List, Tag, Button, Empty, Progress, Space, message } from 'antd';
import {
  FilePptOutlined,
  DownloadOutlined,
  LoadingOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  ClockCircleOutlined,
} from '@ant-design/icons';
import { usePptStore } from '../stores/pptStore';

const { Title, Text } = Typography;

const statusConfig: Record<
  string,
  { color: string; icon: React.ReactNode; text: string }
> = {
  pending: {
    color: 'default',
    icon: <ClockCircleOutlined />,
    text: '等待中',
  },
  running: {
    color: 'processing',
    icon: <LoadingOutlined />,
    text: '生成中',
  },
  succeeded: {
    color: 'success',
    icon: <CheckCircleOutlined />,
    text: '已完成',
  },
  failed: {
    color: 'error',
    icon: <CloseCircleOutlined />,
    text: '失败',
  },
};

export default function PptTaskCenter() {
  const { jobs } = usePptStore();

  return (
    <div
      style={{
        flex: 1,
        overflow: 'auto',
        background: '#f5f7fa',
        padding: 32,
      }}
    >
      <div style={{ maxWidth: 800, margin: '0 auto' }}>
        {/* Header */}
        <div style={{ marginBottom: 24 }}>
          <Title level={3} style={{ margin: 0, color: '#1a1a2e' }}>
            📊 PPT 任务
          </Title>
          <Text type="secondary" style={{ fontSize: 14, marginTop: 4, display: 'block' }}>
            查看所有 PPT 生成任务的状态，完成后可下载
          </Text>
        </div>

        {/* Task List */}
        {jobs.length === 0 ? (
          <div
            style={{
              background: '#fff',
              borderRadius: 12,
              padding: 80,
              textAlign: 'center',
            }}
          >
            <FilePptOutlined style={{ fontSize: 48, color: '#d9d9d9', marginBottom: 16 }} />
            <Title level={5} type="secondary" style={{ fontWeight: 400 }}>
              暂无 PPT 任务
            </Title>
            <Text type="secondary">
              在文件中心选择文件，点击"PPT"按钮即可创建生成任务
            </Text>
          </div>
        ) : (
          <List
            dataSource={jobs}
            renderItem={(job) => {
              const cfg = statusConfig[job.status] || statusConfig.pending;

              return (
                <div
                  style={{
                    background: '#fff',
                    borderRadius: 12,
                    padding: '16px 20px',
                    marginBottom: 12,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 16,
                    border: '1px solid #f0f0f0',
                    transition: 'box-shadow 0.2s',
                  }}
                >
                  {/* Icon */}
                  <div
                    style={{
                      width: 44,
                      height: 44,
                      borderRadius: 10,
                      background:
                        job.status === 'succeeded'
                          ? '#f6ffed'
                          : job.status === 'failed'
                          ? '#fff2f0'
                          : '#fff7e6',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <FilePptOutlined
                      style={{
                        fontSize: 22,
                        color:
                          job.status === 'succeeded'
                            ? '#52c41a'
                            : job.status === 'failed'
                            ? '#ff4d4f'
                            : '#fa8c16',
                      }}
                    />
                  </div>

                  {/* Info */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <Text
                      strong
                      style={{
                        fontSize: 14,
                        color: '#262626',
                        display: 'block',
                        marginBottom: 2,
                      }}
                    >
                      {job.title}
                    </Text>
                    <Space size={12}>
                      <Text type="secondary" style={{ fontSize: 12 }}>
                        基于 {job.fileName}
                      </Text>
                      <Tag icon={cfg.icon} color={cfg.color}>
                        {cfg.text}
                      </Tag>
                    </Space>

                    {/* Progress bar for running tasks */}
                    {job.status === 'running' && (
                      <div style={{ marginTop: 8, maxWidth: 400 }}>
                        <Progress
                          percent={job.progress}
                          size="small"
                          strokeColor="#fa8c16"
                          format={(pct) => `${pct}%`}
                        />
                      </div>
                    )}

                    {/* Error message for failed tasks */}
                    {job.status === 'failed' && job.error_message && (
                      <Text style={{ color: '#ff4d4f', fontSize: 12, display: 'block', marginTop: 4 }}>
                        {job.error_message}
                      </Text>
                    )}
                  </div>

                  {/* Actions */}
                  <div>
                    {job.status === 'succeeded' && (
                      <Button
                        type="primary"
                        icon={<DownloadOutlined />}
                        onClick={() => message.success(`PPT "${job.title}" 下载中（模拟）`)}
                      >
                        下载
                      </Button>
                    )}
                    {job.status === 'running' && (
                      <Text style={{ color: '#fa8c16', fontSize: 13, whiteSpace: 'nowrap' }}>
                        {job.progress}%
                      </Text>
                    )}
                  </div>
                </div>
              );
            }}
          />
        )}
      </div>
    </div>
  );
}
