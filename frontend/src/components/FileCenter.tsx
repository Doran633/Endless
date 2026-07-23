import { useState } from 'react';
import {
  Typography,
  Upload,
  Table,
  Tag,
  Button,
  Space,
  message,
  Progress,
  Modal,
  Input,
  Empty,
} from 'antd';
import {
  UploadOutlined,
  DeleteOutlined,
  FileTextOutlined,
  FilePdfOutlined,
  FileWordOutlined,
  FilePptOutlined,
  DownloadOutlined,
  LoadingOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
} from '@ant-design/icons';
import { useFileStore } from '../stores/fileStore';
import { useChatStore } from '../stores/chatStore';
import { usePptStore } from '../stores/pptStore';
import type { FileItem } from '../types';

const { Title, Text } = Typography;

const statusMap: Record<FileItem['status'], { color: string; text: string }> = {
  uploaded: { color: 'default', text: '已上传' },
  processing: { color: 'processing', text: '解析中' },
  ready: { color: 'success', text: '已就绪' },
  failed: { color: 'error', text: '解析失败' },
};

function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function FileIcon({ ext }: { ext: string }) {
  const style = { fontSize: 22 };
  switch (ext.toLowerCase()) {
    case 'pdf':
      return <FilePdfOutlined style={{ ...style, color: '#f5222d' }} />;
    case 'docx':
    case 'doc':
      return <FileWordOutlined style={{ ...style, color: '#1677ff' }} />;
    default:
      return <FileTextOutlined style={{ ...style, color: '#8c8c8c' }} />;
  }
}

export default function FileCenter() {
  const { files, uploadFile, removeFile } = useFileStore();
  const createSession = useChatStore((s) => s.createSession);
  const selectSession = useChatStore((s) => s.selectSession);
  const { jobs, createJob } = usePptStore();
  const [uploading, setUploading] = useState(false);
  const [pptModalOpen, setPptModalOpen] = useState(false);
  const [pptTitle, setPptTitle] = useState('');
  const [selectedFileId, setSelectedFileId] = useState<string | null>(null);

  const handleUpload = async (file: File) => {
    setUploading(true);
    try {
      await uploadFile(file);
      message.success(`"${file.name}" 上传成功`);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '上传失败';
      message.error(errorMessage);
    } finally {
      setUploading(false);
    }
    return false;
  };

  const handleStartQa = (file: FileItem) => {
    if (file.status !== 'ready') {
      message.warning('文件解析功能将在下一阶段开放');
      return;
    }
    const sessionId = createSession('file', file.id);
    selectSession(sessionId);
    message.success(`已创建"${file.original_name}"的问答会话`);
  };

  const handleGeneratePpt = (file: FileItem) => {
    if (file.status !== 'ready') {
      message.warning('PPT 生成暂不属于当前 v0.3 范围');
      return;
    }
    setSelectedFileId(file.id);
    setPptTitle('');
    setPptModalOpen(true);
  };

  const handlePptConfirm = async () => {
    if (!pptTitle.trim() || !selectedFileId) return;
    const file = files.find((f) => f.id === selectedFileId);
    setPptModalOpen(false);
    await createJob(selectedFileId, file?.original_name || '', pptTitle.trim());
    message.success('PPT 生成任务已创建');
  };

  const columns = [
    {
      title: '文件名',
      dataIndex: 'original_name',
      key: 'name',
      render: (_: string, record: FileItem) => (
        <Space>
          <FileIcon ext={record.extension} />
          <div>
            <Text strong style={{ fontSize: 13 }}>
              {record.original_name}
            </Text>
            <br />
            <Text type="secondary" style={{ fontSize: 11 }}>
              {formatSize(record.size_bytes)} · 上传于{' '}
              {new Date(record.created_at).toLocaleString('zh-CN')}
            </Text>
          </div>
        </Space>
      ),
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 100,
      render: (status: FileItem['status']) => {
        const st = statusMap[status];
        const icon =
          status === 'processing' ? (
            <LoadingOutlined />
          ) : status === 'ready' ? (
            <CheckCircleOutlined />
          ) : status === 'failed' ? (
            <CloseCircleOutlined />
          ) : null;
        return <Tag icon={icon} color={st.color}>{st.text}</Tag>;
      },
    },
    {
      title: '操作',
      key: 'actions',
      width: 280,
      render: (_: unknown, record: FileItem) => {
        const job = jobs.find((j) => j.fileId === record.id);
        return (
          <Space size={4} wrap>
            <Button
              size="small"
              type="link"
              disabled={record.status !== 'ready'}
              onClick={() => handleStartQa(record)}
            >
              💬 问答
            </Button>
            <Button
              size="small"
              type="link"
              disabled={record.status !== 'ready'}
              onClick={() => handleGeneratePpt(record)}
            >
              📊 PPT
            </Button>
            {job?.status === 'succeeded' && (
              <Button
                size="small"
                type="link"
                icon={<DownloadOutlined />}
                onClick={() => message.success('模拟下载')}
              >
                下载PPT
              </Button>
            )}
            <Button
              size="small"
              type="link"
              danger
              icon={<DeleteOutlined />}
              onClick={() => removeFile(record.id)}
            >
              删除
            </Button>
          </Space>
        );
      },
    },
  ];

  return (
    <div
      style={{
        flex: 1,
        overflow: 'auto',
        background: '#f5f7fa',
        padding: 32,
      }}
    >
      <div style={{ maxWidth: 960, margin: '0 auto' }}>
        {/* Header */}
        <div style={{ marginBottom: 24 }}>
          <Title level={3} style={{ margin: 0, color: '#1a1a2e' }}>
            📁 文件中心
          </Title>
          <Text type="secondary" style={{ fontSize: 14, marginTop: 4, display: 'block' }}>
            上传和管理文件，支持 TXT / PDF / DOCX，单文件最大 20MB
          </Text>
        </div>

        {/* Upload Area */}
        <div
          style={{
            background: '#fff',
            borderRadius: 12,
            padding: 32,
            marginBottom: 24,
            border: '2px dashed #d9d9d9',
            textAlign: 'center',
            cursor: uploading ? 'wait' : 'pointer',
            transition: 'border-color 0.2s',
          }}
          onDragOver={(e) => {
            e.currentTarget.style.borderColor = '#1677ff';
            e.currentTarget.style.background = '#f0f5ff';
          }}
          onDragLeave={(e) => {
            e.currentTarget.style.borderColor = '#d9d9d9';
            e.currentTarget.style.background = '#fff';
          }}
        >
          <Upload.Dragger
            beforeUpload={handleUpload}
            showUploadList={false}
            accept=".txt,.pdf,.docx"
            disabled={uploading}
            style={{ background: 'transparent', border: 'none' }}
          >
            <UploadOutlined style={{ fontSize: 40, color: '#1677ff' }} />
            <Title level={5} style={{ margin: '12px 0 4px' }}>
              {uploading ? '上传中...' : '点击或拖拽文件到此处上传'}
            </Title>
            <Text type="secondary">支持 TXT、PDF、DOCX 格式，单文件最大 20MB</Text>
          </Upload.Dragger>
        </div>

        {/* File List */}
        {files.length === 0 ? (
          <Empty description="暂无文件" style={{ margin: '60px 0' }} />
        ) : (
          <Table
            dataSource={files}
            columns={columns}
            rowKey="id"
            pagination={false}
            style={{ background: '#fff', borderRadius: 12 }}
          />
        )}

        {/* v0.3 only uploads files; parsing starts in the next milestone. */}
        {files.some((f) => f.status === 'uploaded') && (
          <div
            style={{
              marginTop: 16,
              padding: '12px 16px',
              background: '#fff7e6',
              borderRadius: 8,
              border: '1px solid #ffd591',
            }}
          >
            <Space>
              <LoadingOutlined style={{ color: '#fa8c16' }} />
              <Text style={{ color: '#d46b08', fontSize: 13 }}>
                文件已上传。文档解析和问答将在下一阶段开放。
              </Text>
            </Space>
          </div>
        )}
      </div>

      {/* PPT Generation Modal */}
      <Modal
        title="生成 PPT"
        open={pptModalOpen}
        onOk={handlePptConfirm}
        onCancel={() => setPptModalOpen(false)}
        okText="开始生成"
        cancelText="取消"
        okButtonProps={{ disabled: !pptTitle.trim() }}
      >
        <Space direction="vertical" style={{ width: '100%' }}>
          <Text>
            基于文档：
            <Text strong>
              {files.find((f) => f.id === selectedFileId)?.original_name}
            </Text>
          </Text>
          <Input
            placeholder="请输入 PPT 标题（必填）"
            value={pptTitle}
            onChange={(e) => setPptTitle(e.target.value)}
            onPressEnter={handlePptConfirm}
          />
        </Space>
      </Modal>
    </div>
  );
}
