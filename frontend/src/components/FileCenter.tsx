import { useEffect, useState } from 'react';
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
  InputNumber,
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
  MessageOutlined,
  InboxOutlined,
} from '@ant-design/icons';
import { useFileStore } from '../stores/fileStore';
import { useChatStore } from '../stores/chatStore';
import { askFile, retrieveFileChunks } from '../api/fileApi';
import type { AskFileResponse, FileItem, RetrieveFileResponse } from '../types';

const { Title, Text } = Typography;

const ingestionText = {
  idle: '',
  uploading: '正在上传文件',
  parsing: '正在解析文档',
  chunking: '正在切分文本',
  embedding: '正在生成向量',
  indexing: '正在保存索引',
  completed: '文件已完成处理，可以开始问答',
  failed: '自动处理失败，可使用列表中的手动操作重试',
};

const statusMap: Record<FileItem['status'], { color: string; text: string; help: string }> = {
  uploaded: { color: 'default', text: '待解析', help: '文件已保存，等待解析' },
  processing: { color: 'processing', text: '处理中', help: '正在执行文件处理流程' },
  ready: { color: 'success', text: '可预览', help: '文档已解析，可查看文本预览' },
  chunked: { color: 'blue', text: '已切块', help: '文本已切分为检索片段' },
  embedded: { color: 'purple', text: '已向量化', help: '片段已生成向量，等待保存索引' },
  indexed: { color: 'cyan', text: '可问答', help: '索引已保存，可进行文件问答' },
  failed: { color: 'error', text: '处理失败', help: '处理失败，请查看原因并重试' },
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

function MetricTile({
  label,
  value,
  tone,
}: {
  label: string;
  value: number;
  tone: 'neutral' | 'success' | 'warning' | 'danger';
}) {
  const toneMap = {
    neutral: { background: '#f7f9fc', border: '#edf1f7', color: '#394150' },
    success: { background: '#f6ffed', border: '#d9f7be', color: '#237804' },
    warning: { background: '#fff7e6', border: '#ffe7ba', color: '#ad6800' },
    danger: { background: '#fff2f0', border: '#ffccc7', color: '#a8071a' },
  }[tone];

  return (
    <div
      style={{
        minHeight: 82,
        padding: '14px 16px',
        borderRadius: 8,
        border: `1px solid ${toneMap.border}`,
        background: toneMap.background,
      }}
    >
      <Text type="secondary" style={{ display: 'block', fontSize: 12 }}>
        {label}
      </Text>
      <Text strong style={{ display: 'block', marginTop: 8, fontSize: 28, color: toneMap.color }}>
        {value}
      </Text>
    </div>
  );
}

export default function FileCenter() {
  const {
    files,
    loadFiles,
    ingestFile,
    parseFile,
    chunkFile,
    embedFile,
    storeVectors,
    deleteFile,
    uploading,
    ingestion,
  } =
    useFileStore();
  const { currentSessionId, sessionRagFiles, clearCurrentSessionRagFile } = useChatStore();
  const [previewFile, setPreviewFile] = useState<FileItem | null>(null);
  const [chunkPreviewFile, setChunkPreviewFile] = useState<FileItem | null>(null);
  const [embeddingPreviewFile, setEmbeddingPreviewFile] = useState<FileItem | null>(null);
  const [retrievalFile, setRetrievalFile] = useState<FileItem | null>(null);
  const [retrievalQuery, setRetrievalQuery] = useState('');
  const [retrievalTopK, setRetrievalTopK] = useState(3);
  const [retrieving, setRetrieving] = useState(false);
  const [retrievalResult, setRetrievalResult] = useState<RetrieveFileResponse | null>(null);
  const [qaFile, setQaFile] = useState<FileItem | null>(null);
  const [qaQuery, setQaQuery] = useState('');
  const [qaTopK, setQaTopK] = useState(3);
  const [asking, setAsking] = useState(false);
  const [qaResult, setQaResult] = useState<AskFileResponse | null>(null);
  const totalFiles = files.length;
  const indexedFiles = files.filter((file) => file.status === 'indexed').length;
  const processingFiles = files.filter((file) => file.status === 'processing').length;
  const failedFiles = files.filter((file) => file.status === 'failed').length;
  const ragReadyFiles = indexedFiles;

  useEffect(() => {
    loadFiles().catch((error) => {
      const errorMessage = error instanceof Error ? error.message : '文件列表读取失败';
      message.error(errorMessage);
    });
  }, [loadFiles]);

  const handleUpload = async (file: File) => {
    try {
      await ingestFile(file);
      message.success(`"${file.name}" 已完成处理，可以开始问答`);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '文件自动处理失败';
      message.error(errorMessage);
    }
    return false;
  };

  const handleDelete = (file: FileItem) => {
    Modal.confirm({
      title: '删除文件？',
      content: `将同时删除“${file.original_name}”的原始文件、本地索引和数据库记录，此操作无法撤销。`,
      okText: '删除',
      okButtonProps: { danger: true },
      cancelText: '取消',
      async onOk() {
        try {
          await deleteFile(file.id);
          const currentRagFile = currentSessionId ? sessionRagFiles[currentSessionId] : undefined;
          if (currentRagFile?.fileId === file.id) {
            clearCurrentSessionRagFile();
          }
          message.success(`"${file.original_name}" 已删除`);
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : '文件删除失败';
          message.error(errorMessage);
          throw error;
        }
      },
    });
  };

  const handleStartQa = (file: FileItem) => {
    if (file.status !== 'indexed') {
      message.warning('请先完成文件索引保存，再进行 RAG 问答');
      return;
    }
    setQaFile(file);
    setQaQuery('');
    setQaResult(null);
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

  const handleRetrieve = async () => {
    if (!retrievalFile) return;
    const query = retrievalQuery.trim();
    if (!query) {
      message.warning('请输入检索问题');
      return;
    }

    setRetrieving(true);
    try {
      const result = await retrieveFileChunks(retrievalFile.id, query, retrievalTopK);
      setRetrievalResult(result);
      message.success(`已返回 ${result.result_count} 条检索结果`);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '检索失败';
      message.error(errorMessage);
    } finally {
      setRetrieving(false);
    }
  };

  const handleAskFile = async () => {
    if (!qaFile) return;
    const query = qaQuery.trim();
    if (!query) {
      message.warning('请输入文件问答问题');
      return;
    }

    setAsking(true);
    try {
      const result = await askFile(qaFile.id, query, qaTopK);
      setQaResult(result);
      message.success('RAG 问答完成');
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'RAG 问答失败';
      message.error(errorMessage);
    } finally {
      setAsking(false);
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
      width: 132,
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
        return (
          <div>
            <Tag icon={icon} color={st.color} style={{ marginInlineEnd: 0 }}>
              {st.text}
            </Tag>
            <Text type="secondary" style={{ display: 'block', marginTop: 4, fontSize: 11 }}>
              {st.help}
            </Text>
          </div>
        );
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
            {record.status === 'indexed' && (
              <Button
                size="small"
                type="link"
                icon={<SearchOutlined />}
                onClick={() => {
                  setRetrievalFile(record);
                  setRetrievalQuery('');
                  setRetrievalResult(null);
                }}
              >
                检索
              </Button>
            )}
            <Button
              size="small"
              type="link"
              icon={<MessageOutlined />}
              disabled={record.status !== 'indexed'}
              onClick={() => handleStartQa(record)}
            >
              💬 问答
            </Button>
            <Button
              size="small"
              type="link"
              danger
              icon={<DeleteOutlined />}
              onClick={() => handleDelete(record)}
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
      className="beichen-surface beichen-subtle-grid"
      style={{
        flex: 1,
        overflow: 'auto',
        padding: 32,
      }}
    >
      <div style={{ maxWidth: 960, margin: '0 auto' }}>
        {/* Header */}
        <div style={{ marginBottom: 24 }}>
          <Title level={3} style={{ margin: 0, color: '#1a1a2e' }}>
            文件中心
          </Title>
          <Text type="secondary" style={{ fontSize: 14, marginTop: 4, display: 'block' }}>
            管理用于解析、索引和单文件问答的知识文件。
          </Text>
        </div>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(4, minmax(0, 1fr))',
            gap: 12,
            marginBottom: 20,
          }}
        >
          <MetricTile label="文件总数" value={totalFiles} tone="neutral" />
          <MetricTile label="可问答文件" value={ragReadyFiles} tone="success" />
          <MetricTile label="处理中" value={processingFiles} tone="warning" />
          <MetricTile label="失败文件" value={failedFiles} tone="danger" />
        </div>

        {/* Upload Area */}
        <div
          style={{
            background: '#fff',
            borderRadius: 8,
            padding: 24,
            marginBottom: 24,
            border: '1px solid #e6ebf2',
            cursor: uploading ? 'wait' : 'pointer',
            transition: 'border-color 0.2s, box-shadow 0.2s',
            boxShadow: '0 8px 24px rgba(25, 35, 60, 0.04)',
          }}
          onDragOver={(e) => {
            e.currentTarget.style.borderColor = '#1677ff';
            e.currentTarget.style.boxShadow = '0 10px 28px rgba(22, 119, 255, 0.10)';
          }}
          onDragLeave={(e) => {
            e.currentTarget.style.borderColor = '#e6ebf2';
            e.currentTarget.style.boxShadow = '0 8px 24px rgba(25, 35, 60, 0.04)';
          }}
        >
          <Upload.Dragger
            beforeUpload={handleUpload}
            showUploadList={false}
            accept=".txt,.pdf,.docx"
            disabled={uploading}
            style={{ background: 'transparent', border: 'none' }}
          >
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: 24,
                textAlign: 'left',
              }}
            >
              <Space size={16}>
                <div
                  style={{
                    width: 48,
                    height: 48,
                    borderRadius: 8,
                    background: '#eef4ff',
                    color: '#1677ff',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: 24,
                  }}
                >
                  {uploading ? <LoadingOutlined /> : <InboxOutlined />}
                </div>
                <div>
                  <Title level={5} style={{ margin: 0 }}>
                    {uploading ? '正在自动处理文件' : '上传知识文件'}
                  </Title>
                  <Text type="secondary" style={{ display: 'block', marginTop: 4, fontSize: 13 }}>
                    支持 TXT / PDF / DOCX，单文件最大 20MB。上传后将自动解析、切块、向量化并保存索引。
                  </Text>
                </div>
              </Space>
              <Button type="primary" icon={<UploadOutlined />} loading={uploading}>
                选择文件
              </Button>
            </div>
          </Upload.Dragger>
        </div>

        {ingestion.status !== 'idle' && (
          <div
            style={{
              marginTop: -12,
              marginBottom: 24,
              padding: '10px 14px',
              borderRadius: 8,
              border: ingestion.status === 'failed' ? '1px solid #ffccc7' : '1px solid #d6e4ff',
              background: ingestion.status === 'failed' ? '#fff2f0' : '#f0f5ff',
            }}
          >
            <Space>
              {uploading ? (
                <LoadingOutlined style={{ color: '#1677ff' }} />
              ) : ingestion.status === 'failed' ? (
                <CloseCircleOutlined style={{ color: '#cf1322' }} />
              ) : (
                <CheckCircleOutlined style={{ color: '#389e0d' }} />
              )}
              <Text>{ingestionText[ingestion.status]}</Text>
              {ingestion.fileName && <Text type="secondary">{ingestion.fileName}</Text>}
              {ingestion.errorMessage && <Text type="danger">{ingestion.errorMessage}</Text>}
            </Space>
          </div>
        )}

        {/* File List */}
        {files.length === 0 ? (
          <div
            style={{
              padding: '56px 24px',
              background: '#fff',
              border: '1px solid #edf1f7',
              borderRadius: 8,
              textAlign: 'center',
            }}
          >
            <Empty
              image={Empty.PRESENTED_IMAGE_SIMPLE}
              description={
                <span>
                  暂无文件。上传 TXT / PDF / DOCX 后，可以逐步完成解析、切块、向量化和问答准备。
                </span>
              }
            />
          </div>
        ) : (
          <Table
            dataSource={files}
            columns={columns}
            rowKey="id"
            pagination={false}
            style={{ background: '#fff', borderRadius: 8, overflow: 'hidden' }}
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
                当前支持文档解析、文本切块、向量化、本地索引保存和单文件问答。文件达到“可问答”状态后即可生成回答。
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
            已解析 {previewFile?.char_count ?? 0} 个字符。完成索引后即可基于该文件问答。
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
            已生成 {chunkPreviewFile?.chunk_count ?? 0} 个片段。当前仅展示前几个预览。
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
            维度 {embeddingPreviewFile?.embedding_dimension ?? 0}。当前仅展示向量前几位。
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

      <Modal
        title={retrievalFile?.original_name ? `${retrievalFile.original_name} · 检索测试` : '检索测试'}
        open={!!retrievalFile}
        onCancel={() => {
          setRetrievalFile(null);
          setRetrievalResult(null);
        }}
        footer={null}
        width={820}
      >
        <Space direction="vertical" style={{ width: '100%' }} size={12}>
          <Text type="secondary">
            查看本地索引命中的相关片段，用于判断文件问答的依据质量。
          </Text>
          <Input.TextArea
            value={retrievalQuery}
            onChange={(event) => setRetrievalQuery(event.target.value)}
            placeholder="输入检索问题，例如：这个文档主要讲了什么？"
            autoSize={{ minRows: 2, maxRows: 4 }}
          />
          <Space>
            <Text type="secondary">Top K</Text>
            <InputNumber
              min={1}
              max={10}
              value={retrievalTopK}
              onChange={(value) => setRetrievalTopK(value ?? 3)}
            />
            <Button type="primary" loading={retrieving} onClick={handleRetrieve}>
              检索
            </Button>
          </Space>

          {retrievalResult && (
            <Space direction="vertical" style={{ width: '100%' }} size={12}>
              <Text type="secondary">
                Query: {retrievalResult.query} · 返回 {retrievalResult.result_count} 条
              </Text>
              {retrievalResult.results.map((result, index) => (
                <div
                  key={result.chunk_id}
                  style={{
                    border: '1px solid #f0f0f0',
                    borderRadius: 8,
                    padding: 12,
                    background: '#fafafa',
                  }}
                >
                  <Text strong style={{ fontSize: 13 }}>
                    Top {index + 1} · Chunk {result.chunk_index + 1} · score{' '}
                    {result.score.toFixed(6)} · {result.char_count} 字符
                  </Text>
                  <Input.TextArea
                    value={result.content}
                    readOnly
                    autoSize={{ minRows: 3, maxRows: 8 }}
                    style={{ marginTop: 8 }}
                  />
                </div>
              ))}
            </Space>
          )}
        </Space>
      </Modal>

      <Modal
        title={qaFile?.original_name ? `${qaFile.original_name} · RAG 问答` : 'RAG 问答'}
        open={!!qaFile}
        onCancel={() => {
          setQaFile(null);
          setQaResult(null);
        }}
        footer={null}
        width={860}
      >
        <Space direction="vertical" style={{ width: '100%' }} size={12}>
          <Text type="secondary">
            基于该文件的相关片段生成回答，并展示参考来源。
          </Text>
          <Input.TextArea
            value={qaQuery}
            onChange={(event) => setQaQuery(event.target.value)}
            placeholder="输入文件问题，例如：这个文档主要讲了什么？"
            autoSize={{ minRows: 2, maxRows: 4 }}
          />
          <Space>
            <Text type="secondary">Top K</Text>
            <InputNumber
              min={1}
              max={8}
              value={qaTopK}
              onChange={(value) => setQaTopK(value ?? 3)}
            />
            <Button type="primary" loading={asking} onClick={handleAskFile}>
              生成回答
            </Button>
          </Space>

          {qaResult && (
            <Space direction="vertical" style={{ width: '100%' }} size={12}>
              <div
                style={{
                  border: '1px solid #d9f7be',
                  borderRadius: 8,
                  padding: 12,
                  background: '#f6ffed',
                }}
              >
                <Text strong style={{ fontSize: 13 }}>
                  AI 回答 · {qaResult.model}
                </Text>
                <Input.TextArea
                  value={qaResult.answer}
                  readOnly
                  autoSize={{ minRows: 5, maxRows: 12 }}
                  style={{ marginTop: 8 }}
                />
              </div>

              <Text type="secondary">
                参考片段：{qaResult.used_chunk_count} · Provider: {qaResult.provider}
              </Text>
              {qaResult.used_chunks.map((chunk, index) => (
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
                    参考片段 {index + 1} · Chunk {chunk.chunk_index + 1} · 相关度{' '}
                    {chunk.score.toFixed(4)}
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
          )}
        </Space>
      </Modal>
    </div>
  );
}
