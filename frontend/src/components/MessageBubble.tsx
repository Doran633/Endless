import { useState, useCallback } from 'react';
import { Typography, Space, Tooltip, message, Tag } from 'antd';
import {
  UserOutlined,
  RobotOutlined,
  CopyOutlined,
  CheckOutlined,
  FileTextOutlined,
  FilePptOutlined,
  CheckCircleFilled,
  LoadingOutlined,
  CloseCircleFilled,
} from '@ant-design/icons';
import type { Message, MessageCard } from '../types';

const { Text } = Typography;

interface MessageBubbleProps {
  message: Message;
}

function confidenceText(confidence?: string): string {
  switch (confidence) {
    case 'high':
      return '高';
    case 'medium':
      return '中';
    case 'low':
      return '低';
    default:
      return '未知';
  }
}

function answerPolicyText(policy?: string): string {
  if (policy === 'grounded_answer') return 'Grounded';
  if (policy === 'low_confidence_answer') return 'Low confidence';
  if (policy === 'no_answer') return 'No answer';
  return policy || 'Unknown';
}

function formatScore(score?: number | null): string {
  return typeof score === 'number' ? score.toFixed(4) : '-';
}

function relevanceColor(level?: string): string {
  if (level === 'high') return 'green';
  if (level === 'medium') return 'blue';
  if (level === 'weak') return 'orange';
  return 'default';
}

function relevanceText(level?: string): string {
  if (level === 'high') return 'High';
  if (level === 'medium') return 'Medium';
  if (level === 'weak') return 'Weak';
  return 'Unknown';
}

// ============================
// Card renderers
// ============================

function FileRefCard({ card }: { card: MessageCard }) {
  return (
    <div
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 10,
        padding: '8px 14px',
        margin: '8px 0',
        borderRadius: 8,
        background: '#f0f5ff',
        border: '1px solid #d6e4ff',
      }}
    >
      <FileTextOutlined style={{ color: '#1677ff', fontSize: 18 }} />
      <div>
        <Text style={{ fontSize: 13, fontWeight: 500, color: '#262626', display: 'block' }}>
          {card.title}
        </Text>
        {card.subtitle && (
          <Text style={{ fontSize: 11, color: '#8c8c8c' }}>{card.subtitle}</Text>
        )}
      </div>
      <CheckCircleFilled style={{ color: '#52c41a', fontSize: 16, marginLeft: 4 }} />
    </div>
  );
}

function PptResultCard({ card }: { card: MessageCard }) {
  const isRunning = card.status === 'running' || card.status === 'pending';
  const isSuccess = card.status === 'succeeded';
  const isFailed = card.status === 'failed';

  return (
    <div
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 10,
        padding: '8px 14px',
        margin: '8px 0',
        borderRadius: 8,
        background: isRunning ? '#fff7e6' : isSuccess ? '#f6ffed' : '#fff2f0',
        border: `1px solid ${
          isRunning ? '#ffd591' : isSuccess ? '#b7eb8f' : '#ffccc7'
        }`,
      }}
    >
      <FilePptOutlined
        style={{
          fontSize: 18,
          color: isRunning ? '#fa8c16' : isSuccess ? '#52c41a' : '#ff4d4f',
        }}
      />
      <div>
        <Text style={{ fontSize: 13, fontWeight: 500, color: '#262626', display: 'block' }}>
          {card.title}
        </Text>
        {card.subtitle && (
          <Text style={{ fontSize: 11, color: '#8c8c8c' }}>{card.subtitle}</Text>
        )}
      </div>
      {isRunning && <LoadingOutlined style={{ color: '#fa8c16', fontSize: 16 }} />}
      {isSuccess && <CheckCircleFilled style={{ color: '#52c41a', fontSize: 16 }} />}
      {isFailed && <CloseCircleFilled style={{ color: '#ff4d4f', fontSize: 16 }} />}
    </div>
  );
}

function renderCard(card: MessageCard, idx: number) {
  if (card.type === 'file_ref') return <FileRefCard key={`card-${idx}`} card={card} />;
  if (card.type === 'ppt_result') return <PptResultCard key={`card-${idx}`} card={card} />;
  return null;
}

// ============================
// Code block component
// ============================

function CodeBlock({ language, code }: { language: string; code: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = useCallback(() => {
    navigator.clipboard.writeText(code).then(() => {
      setCopied(true);
      message.success('已复制');
      setTimeout(() => setCopied(false), 2000);
    });
  }, [code]);

  return (
    <div
      style={{
        margin: '12px 0',
        borderRadius: 10,
        overflow: 'hidden',
        border: '1px solid #e8e8e8',
      }}
    >
      {/* Header */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '6px 14px',
          background: '#fafafa',
          borderBottom: '1px solid #e8e8e8',
        }}
      >
        <Text style={{ fontSize: 11, color: '#8c8c8c', fontFamily: 'monospace' }}>
          {language || 'text'}
        </Text>
        <Tooltip title={copied ? '已复制' : '复制代码'}>
          <span
            onClick={handleCopy}
            style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4 }}
          >
            {copied ? (
              <CheckOutlined style={{ color: '#52c41a', fontSize: 13 }} />
            ) : (
              <CopyOutlined style={{ color: '#8c8c8c', fontSize: 13 }} />
            )}
            <Text style={{ fontSize: 11, color: '#8c8c8c' }}>
              {copied ? '已复制' : '复制'}
            </Text>
          </span>
        </Tooltip>
      </div>
      {/* Code */}
      <pre
        style={{
          margin: 0,
          padding: '14px 16px',
          background: '#1e1e2e',
          color: '#cdd6f4',
          fontSize: 13,
          lineHeight: 1.6,
          overflow: 'auto',
          fontFamily: "'JetBrains Mono', 'Fira Code', 'Consolas', monospace",
        }}
      >
        <code>{code}</code>
      </pre>
    </div>
  );
}

// ============================
// Inline text rendering
// ============================

function renderInline(text: string) {
  const parts: React.ReactNode[] = [];
  let rest = text;

  // **bold**
  const boldRegex = /\*\*(.+?)\*\*/g;
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = boldRegex.exec(rest)) !== null) {
    if (match.index > lastIndex) {
      parts.push(<span key={`t${lastIndex}`}>{rest.slice(lastIndex, match.index)}</span>);
    }
    parts.push(
      <strong key={`b${match.index}`} style={{ fontWeight: 600 }}>
        {match[1]}
      </strong>
    );
    lastIndex = boldRegex.lastIndex;
  }

  if (lastIndex < rest.length) {
    parts.push(<span key={`end${lastIndex}`}>{rest.slice(lastIndex)}</span>);
  }

  return parts.length > 0 ? parts : text;
}

// ============================
// Block parser
// ============================

interface Block {
  type: 'code' | 'table' | 'heading1' | 'heading2' | 'heading3' | 'ol' | 'ul' | 'blockquote' | 'divider' | 'paragraph' | 'empty' | 'cards';
  content?: string;
  language?: string;
  items?: string[];
  cells?: string[][];
  cards?: MessageCard[];
}

function parseBlocks(content: string, messageCards?: MessageCard[]): Block[] {
  const blocks: Block[] = [];
  let cardRendered = false;

  // Extract code blocks first (multi-line)
  const codeBlockRegex = /```(\w*)\n([\s\S]*?)```/g;
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = codeBlockRegex.exec(content)) !== null) {
    // Text before code block
    if (match.index > lastIndex) {
      const text = content.slice(lastIndex, match.index);
      blocks.push(...parseTextBlocks(text));
    }
    blocks.push({ type: 'code', language: match[1] || 'text', content: match[2] });
    lastIndex = match.index + match[0].length;
  }

  // Remaining text
  if (lastIndex < content.length) {
    blocks.push(...parseTextBlocks(content.slice(lastIndex)));
  }

  // Attach message cards at the end of content (or after last block)
  if (messageCards && messageCards.length > 0) {
    blocks.push({ type: 'cards', cards: messageCards });
  }

  return blocks;
}

function parseTextBlocks(text: string): Block[] {
  const blocks: Block[] = [];
  const lines = text.split('\n');
  let i = 0;

  while (i < lines.length) {
    const line = lines[i];

    // Empty line
    if (!line.trim()) {
      i++;
      continue;
    }

    // Divider
    if (/^---/.test(line.trim())) {
      blocks.push({ type: 'divider' });
      i++;
      continue;
    }

    // Heading
    if (line.startsWith('### ')) {
      blocks.push({ type: 'heading3', content: line.slice(4) });
      i++;
      continue;
    }
    if (line.startsWith('## ')) {
      blocks.push({ type: 'heading2', content: line.slice(3) });
      i++;
      continue;
    }
    if (line.startsWith('# ')) {
      blocks.push({ type: 'heading1', content: line.slice(2) });
      i++;
      continue;
    }

    // Blockquote
    if (line.startsWith('> ')) {
      const quoteLines: string[] = [];
      while (i < lines.length && lines[i].startsWith('> ')) {
        quoteLines.push(lines[i].slice(2));
        i++;
      }
      blocks.push({ type: 'blockquote', content: quoteLines.join('\n') });
      continue;
    }

    // Unordered list
    if (/^[-*]\s/.test(line)) {
      const items: string[] = [];
      while (i < lines.length && /^[-*]\s/.test(lines[i])) {
        items.push(lines[i].replace(/^[-*]\s/, ''));
        i++;
      }
      blocks.push({ type: 'ul', items });
      continue;
    }

    // Ordered list
    if (/^\d+\.\s/.test(line)) {
      const items: string[] = [];
      while (i < lines.length && /^\d+\.\s/.test(lines[i])) {
        items.push(lines[i].replace(/^\d+\.\s/, ''));
        i++;
      }
      blocks.push({ type: 'ol', items });
      continue;
    }

    // Table
    if (line.startsWith('|')) {
      const rows: string[][] = [];
      while (i < lines.length && lines[i].startsWith('|')) {
        const cells = lines[i]
          .split('|')
          .filter((c) => c.trim())
          .map((c) => c.trim());
        // Skip separator row
        if (!cells.every((c) => /^[-:]+$/.test(c))) {
          rows.push(cells);
        }
        i++;
      }
      if (rows.length > 0) {
        blocks.push({ type: 'table', cells: rows });
      }
      continue;
    }

    // Regular paragraph (collect consecutive non-empty lines)
    const paraLines: string[] = [];
    while (
      i < lines.length &&
      lines[i].trim() &&
      !lines[i].startsWith('#') &&
      !lines[i].startsWith('> ') &&
      !/^[-*]\s/.test(lines[i]) &&
      !/^\d+\.\s/.test(lines[i]) &&
      !lines[i].startsWith('|') &&
      !/^---/.test(lines[i].trim())
    ) {
      paraLines.push(lines[i]);
      i++;
    }
    if (paraLines.length > 0) {
      blocks.push({ type: 'paragraph', content: paraLines.join('\n') });
    }
  }

  return blocks;
}

// ============================
// Block renderers
// ============================

function renderBlock(block: Block, idx: number) {
  switch (block.type) {
    case 'code':
      return <CodeBlock key={idx} language={block.language || 'text'} code={block.content || ''} />;

    case 'heading1':
      return (
        <div
          key={idx}
          style={{
            fontWeight: 700,
            fontSize: 20,
            color: '#1a1a2e',
            marginTop: 20,
            marginBottom: 8,
          }}
        >
          {block.content}
        </div>
      );

    case 'heading2':
      return (
        <div
          key={idx}
          style={{
            fontWeight: 600,
            fontSize: 17,
            color: '#1a1a2e',
            marginTop: 16,
            marginBottom: 6,
          }}
        >
          {block.content}
        </div>
      );

    case 'heading3':
      return (
        <div
          key={idx}
          style={{
            fontWeight: 600,
            fontSize: 15,
            color: '#262626',
            marginTop: 12,
            marginBottom: 4,
          }}
        >
          {block.content}
        </div>
      );

    case 'paragraph':
      return (
        <div
          key={idx}
          style={{
            color: '#434343',
            fontSize: 14,
            lineHeight: 1.7,
            margin: '4px 0',
          }}
        >
          {renderInline(block.content || '')}
        </div>
      );

    case 'blockquote':
      return (
        <div
          key={idx}
          style={{
            margin: '10px 0',
            padding: '8px 16px',
            borderLeft: '3px solid #1677ff',
            background: '#f0f5ff',
            borderRadius: 4,
            color: '#434343',
            fontSize: 14,
            lineHeight: 1.7,
          }}
        >
          {renderInline(block.content || '')}
        </div>
      );

    case 'ul':
      return (
        <div key={idx} style={{ margin: '6px 0' }}>
          {block.items?.map((item, ii) => (
            <div
              key={ii}
              style={{
                display: 'flex',
                gap: 8,
                padding: '2px 0',
                color: '#434343',
                fontSize: 14,
                lineHeight: 1.7,
              }}
            >
              <span style={{ color: '#1677ff', flexShrink: 0, marginTop: 2 }}>•</span>
              <span>{renderInline(item)}</span>
            </div>
          ))}
        </div>
      );

    case 'ol':
      return (
        <div key={idx} style={{ margin: '6px 0' }}>
          {block.items?.map((item, ii) => (
            <div
              key={ii}
              style={{
                display: 'flex',
                gap: 8,
                padding: '2px 0',
                color: '#434343',
                fontSize: 14,
                lineHeight: 1.7,
              }}
            >
              <span style={{ color: '#8c8c8c', minWidth: 20, flexShrink: 0 }}>{ii + 1}.</span>
              <span>{renderInline(item)}</span>
            </div>
          ))}
        </div>
      );

    case 'table':
      if (!block.cells || block.cells.length === 0) return null;
      const headerCells = block.cells[0];
      const bodyCells = block.cells.slice(1);

      return (
        <div
          key={idx}
          style={{
            margin: '12px 0',
            borderRadius: 8,
            overflow: 'hidden',
            border: '1px solid #e8e8e8',
          }}
        >
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
            <thead>
              <tr style={{ background: '#fafafa' }}>
                {headerCells.map((cell, ci) => (
                  <th
                    key={ci}
                    style={{
                      padding: '8px 12px',
                      textAlign: 'left',
                      fontWeight: 600,
                      color: '#262626',
                      borderBottom: '2px solid #e8e8e8',
                    }}
                  >
                    {cell}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {bodyCells.map((row, ri) => (
                <tr
                  key={ri}
                  style={{ borderBottom: '1px solid #f0f0f0' }}
                >
                  {row.map((cell, ci) => (
                    <td
                      key={ci}
                      style={{
                        padding: '7px 12px',
                        color: '#595959',
                      }}
                    >
                      {renderInline(cell)}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      );

    case 'divider':
      return (
        <div
          key={idx}
          style={{
            margin: '16px 0',
            borderTop: '1px solid #e8e8e8',
          }}
        />
      );

    case 'cards':
      return (
        <div key={idx} style={{ margin: '8px 0' }}>
          {block.cards?.map((card, ci) => renderCard(card, ci))}
        </div>
      );

    default:
      return null;
  }
}

// ============================
// Main MessageBubble
// ============================

export default function MessageBubble({ message }: MessageBubbleProps) {
  const isUser = message.role === 'user';
  const blocks = parseBlocks(message.content, message.metadata?.cards);

  return (
    <div
      style={{
        display: 'flex',
        gap: 14,
        padding: '18px 24px',
        background: isUser ? 'rgba(255, 255, 255, 0.92)' : 'rgba(248, 251, 255, 0.78)',
        borderBottom: '1px solid #ececf1',
      }}
    >
      {/* Avatar */}
      <div
        style={{
          width: 32,
          height: 32,
          borderRadius: 8,
          background: isUser ? '#1677ff' : '#19c37d',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0,
          marginTop: 2,
        }}
      >
        {isUser ? (
          <UserOutlined style={{ color: '#fff', fontSize: 16 }} />
        ) : (
          <RobotOutlined style={{ color: '#fff', fontSize: 16 }} />
        )}
      </div>

      {/* Content */}
      <div style={{ flex: 1, minWidth: 0, maxWidth: 740 }}>
        <Text
          strong
          style={{
            fontSize: 13,
            color: isUser ? '#1677ff' : '#19c37d',
            display: 'block',
            marginBottom: 6,
          }}
        >
          {isUser ? '你' : '北辰agent'}
        </Text>
        <div style={{ lineHeight: 1.7 }}>
          {blocks.map((block, i) => renderBlock(block, i))}
        </div>
        {message.metadata?.used_chunks && message.metadata.used_chunks.length > 0 && !isUser && (
          <div
            style={{
              marginTop: 14,
              padding: '12px 14px',
              borderRadius: 8,
              background: '#fbfcff',
              border: '1px solid #e6ebf5',
            }}
          >
            <Text style={{ display: 'block', color: '#1f2a44', fontSize: 12, fontWeight: 600 }}>
              参考片段 · {message.metadata.rag_file_name || '当前文件'}
            </Text>
            {message.metadata.debug_trace && (
              <Text style={{ display: 'block', color: '#697386', fontSize: 11, marginTop: 6 }}>
                检索质量：置信度 {confidenceText(message.metadata.debug_trace.confidence)} ·
                命中 {message.metadata.debug_trace.retrieved_count} 个片段 · 最高相关度{' '}
                {formatScore(message.metadata.debug_trace.max_score)} · Trace{' '}
                {message.metadata.debug_trace.trace_id.slice(0, 8)}
                {' '}· Policy {answerPolicyText(message.metadata.debug_trace.answer_policy)}
              </Text>
            )}
            {message.metadata.used_chunks.map((chunk, index) => (
              <div
                key={chunk.chunk_id}
                style={{
                  marginTop: 10,
                  paddingTop: 10,
                  borderTop: index === 0 ? 'none' : '1px solid #eef1f6',
                }}
              >
                <Text style={{ display: 'block', color: '#697386', fontSize: 11 }}>
                  片段 {index + 1} · Chunk {chunk.chunk_index + 1} · 相关度{' '}
                  {chunk.score.toFixed(4)}
                </Text>
                {chunk.section_path && (
                  <Text style={{ display: 'block', color: '#8c8c8c', fontSize: 11 }}>
                    Section: {chunk.section_path}
                  </Text>
                )}
                <div style={{ marginTop: 4 }}>
                  <Tag color={relevanceColor(chunk.relevance_level)}>
                    {relevanceText(chunk.relevance_level)}
                  </Tag>
                  <Text style={{ color: '#8c8c8c', fontSize: 11 }}>
                    raw {formatScore(chunk.raw_score)} / bonus {formatScore(chunk.keyword_bonus)} /
                    final {formatScore(chunk.final_score)}
                  </Text>
                </div>
                <Text style={{ display: 'block', color: '#8c8c8c', fontSize: 11 }}>
                  type {chunk.chunk_type || 'normal'} / intent {chunk.query_intent || '-'} / section +
                  {formatScore(chunk.section_boost)} -{formatScore(chunk.section_penalty)} / length -
                  {formatScore(chunk.length_penalty)} / answer +
                  {formatScore(chunk.answerability_bonus)}
                </Text>
                {chunk.ranking_reason && chunk.ranking_reason.length > 0 && (
                  <Text style={{ display: 'block', color: '#8c8c8c', fontSize: 11 }}>
                    reason: {chunk.ranking_reason.join(', ')}
                  </Text>
                )}
                <Text style={{ color: '#595959', fontSize: 12, lineHeight: 1.6 }}>
                  {chunk.content_preview}
                </Text>
              </div>
            ))}
          </div>
        )}
        {message.metadata?.token_count && !isUser && (
          <div style={{ marginTop: 12 }}>
            <Text style={{ color: '#bbb', fontSize: 11 }}>⚡ {message.metadata.token_count} tokens</Text>
          </div>
        )}
      </div>
    </div>
  );
}
