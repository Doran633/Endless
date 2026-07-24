import { useState } from 'react';
import {
  Typography,
  Upload,
  Table,
  Tag,
  Button,
  Space,
  message,
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
  LoadingOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  SearchOutlined,
  EyeOutlined,
  SplitCellsOutlined,
  ClusterOutlined,
  DatabaseOutlined,
} from '@ant-design/icons';
import { useFileStore } from '../stores/fileStore';
import type { FileItem } from '../types';

const { Title, Text } = Typography;

const statusMap: Record<FileItem['status'], { color: string; text: string }> = {
  uploaded: { color: 'default', text: '已上传' },
  processing: { color: 'processing', text: '处理中' },
  ready: { color: 'success', text: '已解析' },
  chunked: { color: 'blue', text: '已切块' },
  embedded: { color: 'purple', text: '已向量化' },
  indexed: { color: 'cyan', text: '已索引' },
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
  const { files, uploadFile, parseFile, chunkFile, embedFile, storeVectors, removeFile } =
    useFileStore();
  const [uploading, setUploading] = useState(false);
  const [previewFile, setPreviewFile] = useState<FileItem | null>(null);
  const [chunkPreviewFile, setChunkPreviewFile] = useState<FileItem | null>(null);
  const [embeddingPreviewFile, setEmbeddingPreviewFile] = useState<FileItem | null>(null);

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
    file;
    message.warning('RAG 问答将在下一阶段开放');
  };

  const handleParse = async (file: FileItem) => {
    try {
      await parseFile(file.id);
      message.success(`"${file.original_name}" 解析完成`);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '文档解析失败';
      message.error(errorMessage);
    }
  };

  const handleChunk = async (file: FileItem) => {
    try {
      await chunkFile(file.id);
      message.success(`"${file.original_name}" 切块完成`);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '文本切块失败';
      message.error(errorMessage);
    }
  };

  const handleEmbed = async (file: FileItem) => {
    try {
      await embedFile(file.id);
      message.success(`"${file.original_name}" 向量化完成`);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '向量化失败';
      message.error(errorMessage);
    }
  };

  const handleStoreVectors = async (file: FileItem) => {
    try {
      await storeVectors(file.id);
      message.success(`"${file.original_name}" 向量索引已保存`);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '向量索引保存失败';
      message.error(errorMessage);
    }
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
              {typeof record.char_count === 'number' && ` · ${record.char_count} 字符`}
              {typeof record.chunk_count === 'number' && ` · ${record.chunk_count} chunks`}
              {typeof record.embedding_dimension === 'number' && ` · ${record.embedding_dimension} 维`}
              {record.vector_store_path && ` · ${record.vector_store_path}`}
            </Text>
            {record.error_message && (
              <>
                <br />
                <Text type="danger" style={{ fontSize: 11 }}>
                  {record.error_message}
                </Text>
              </>
            )}
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
          ) : status === 'ready' || status === 'chunked' || status === 'embedded' || status === 'indexed' ? (
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
        return (
          <Space size={4} wrap>
            {(record.status === 'uploaded' || record.status === 'failed') && (
              <Button
                size="small"
                type="link"
                icon={<SearchOutlined />}
                onClick={() => handleParse(record)}
              >
                解析
              </Button>
            )}
            {record.status === 'ready' && (
              <Button
                size="small"
                type="link"
                icon={<SplitCellsOutlined />}
                onClick={() => handleChunk(record)}
              >
                切块
              </Button>
            )}
            {(record.status === 'ready' || record.status === 'chunked' || record.status === 'embedded' || record.status === 'indexed') && (
              <Button
                size="small"
                type="link"
                icon={<EyeOutlined />}
                onClick={() => setPreviewFile(record)}
              >
                预览
              </Button>
            )}
            {record.status === 'chunked' && (
              <Button
                size="small"
                type="link"
                icon={<ClusterOutlined />}
                onClick={() => handleEmbed(record)}
              >
                向量化
              </Button>
            )}
            {record.status === 'embedded' && (
              <Button
                size="small"
                type="link"
                icon={<DatabaseOutlined />}
                onClick={() => handleStoreVectors(record)}
              >
                索引
              </Button>
            )}
            {(record.status === 'chunked' || record.status === 'embedded' || record.status === 'indexed') && (
              <Button
                size="small"
                type="link"
                icon={<SplitCellsOutlined />}
                onClick={() => setChunkPreviewFile(record)}
              >
                chunks
              </Button>
            )}
            {(record.status === 'embedded' || record.status === 'indexed') && (
              <Button
                size="small"
                type="link"
                icon={<ClusterOutlined />}
                onClick={() => setEmbeddingPreviewFile(record)}
              >
                vectors
              </Button>
            )}
            <Button
              size="small"
              type="link"
              onClick={() => handleStartQa(record)}
            >
              💬 问答
            </Button>
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

        {/* v0.5 prepares chunks only; embedding and RAG start in later milestones. */}
        {files.some((f) => ['uploaded', 'ready', 'chunked', 'embedded', 'indexed'].includes(f.status)) && (
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
                当前支持文档解析、文本切块、mock 向量化和本地向量索引保存。RAG 问答将在后续阶段开放。
              </Text>
            </Space>
          </div>
        )}
      </div>

      <Modal
        title={previewFile?.original_name || '文档预览'}
        open={!!previewFile}
        onCancel={() => setPreviewFile(null)}
        footer={null}
        width={720}
      >
        <Space direction="vertical" style={{ width: '100%' }} size={12}>
          <Text type="secondary">
            已解析 {previewFile?.char_count ?? 0} 个字符。当前仅展示文本预览，不代表 RAG 索引已完成。
          </Text>
          <Input.TextArea
            value={previewFile?.text_preview || ''}
            readOnly
            autoSize={{ minRows: 8, maxRows: 16 }}
          />
        </Space>
      </Modal>

      <Modal
        title={chunkPreviewFile?.original_name ? `${chunkPreviewFile.original_name} · chunk 预览` : 'chunk 预览'}
        open={!!chunkPreviewFile}
        onCancel={() => setChunkPreviewFile(null)}
        footer={null}
        width={760}
      >
        <Space direction="vertical" style={{ width: '100%' }} size={12}>
          <Text type="secondary">
            已生成 {chunkPreviewFile?.chunk_count ?? 0} 个 chunk。当前仅展示前几个预览，不代表 Embedding 或 RAG 已完成。
          </Text>
          {(chunkPreviewFile?.chunk_preview || []).map((chunk) => (
            <div
              key={chunk.chunk_id}
              style={{
                border: '1px solid #f0f0f0',
                borderRadius: 8,
                padding: 12,
                background: '#fafafa',
              }}
            >
              <Text strong style={{ fontSize: 13 }}>
                Chunk {chunk.chunk_index + 1} · {chunk.char_count} 字符
              </Text>
              <Input.TextArea
                value={chunk.content}
                readOnly
                autoSize={{ minRows: 3, maxRows: 8 }}
                style={{ marginTop: 8 }}
              />
            </div>
          ))}
        </Space>
      </Modal>

      <Modal
        title={
          embeddingPreviewFile?.original_name
            ? `${embeddingPreviewFile.original_name} · embedding 预览`
            : 'embedding 预览'
        }
        open={!!embeddingPreviewFile}
        onCancel={() => setEmbeddingPreviewFile(null)}
        footer={null}
        width={760}
      >
        <Space direction="vertical" style={{ width: '100%' }} size={12}>
          <Text type="secondary">
            已生成 {embeddingPreviewFile?.embedding_count ?? 0} 个 embedding，
            维度 {embeddingPreviewFile?.embedding_dimension ?? 0}。当前仅展示向量前几位，不代表向量存储或 RAG 已完成。
          </Text>
          {(embeddingPreviewFile?.embedding_preview || []).map((embedding) => (
            <div
              key={embedding.chunk_id}
              style={{
                border: '1px solid #f0f0f0',
                borderRadius: 8,
                padding: 12,
                background: '#fafafa',
              }}
            >
              <Text strong style={{ fontSize: 13 }}>
                Chunk {embedding.chunk_index + 1}
              </Text>
              <Input.TextArea
                value={`[${embedding.vector_preview.join(', ')}]`}
                readOnly
                autoSize={{ minRows: 2, maxRows: 4 }}
                style={{ marginTop: 8 }}
              />
            </div>
          ))}
        </Space>
      </Modal>
    </div>
  );
}
