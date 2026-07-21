import type { Session, Message, FileItem } from '../types';

// ========== 预置会话 ==========

export const mockSessions: Session[] = [
  {
    id: 'session-1',
    title: 'Q2销售数据分析',
    mode: 'file',
    fileId: 'file-1',
    createdAt: '2026-07-21T09:30:00Z',
  },
  {
    id: 'session-2',
    title: '产品需求讨论',
    mode: 'file',
    fileId: 'file-2',
    createdAt: '2026-07-20T14:00:00Z',
  },
  {
    id: 'session-3',
    title: '写一个Python脚本分析CSV',
    mode: 'general',
    createdAt: '2026-07-19T10:00:00Z',
  },
  {
    id: 'session-4',
    title: 'API接口设计评审',
    mode: 'general',
    createdAt: '2026-07-18T16:30:00Z',
  },
  {
    id: 'session-5',
    title: '会议纪要生成PPT',
    mode: 'file',
    fileId: 'file-3',
    createdAt: '2026-07-19T15:30:00Z',
  },
];

// ========== 预置消息 ==========

export const mockMessages: Record<string, Message[]> = {
  'session-1': [
    {
      id: 'm1',
      role: 'user',
      content: '帮我分析一下这个季度的销售数据，看看哪些产品线增长最快？',
      createdAt: '2026-07-21T09:30:05Z',
    },
    {
      id: 'm2',
      role: 'assistant',
      content: `根据上传的 **《2026年Q2销售报告》** 分析，以下是本季度核心发现：

## 📊 整体表现

| 指标 | 数值 | 环比 | 同比 |
|------|------|------|------|
| 总销售额 | ¥12,847,000 | +18.3% | +32.5% |
| 达成率 | 108.7% | +4.2pp | +6.1pp |
| 毛利率 | 62.3% | +1.8pp | +3.2pp |
| 新增客户 | 47 家 | +21% | +45% |

## 🚀 增长最快产品线

| 排名 | 产品线 | 销售额 | 环比增长 | 趋势 |
|------|--------|--------|---------|------|
| 🥇 | AI 助手 | ¥2,680,000 | **+41.2%** | 📈 |
| 🥈 | 企业版 SaaS | ¥4,280,000 | +32.1% | 📈 |
| 🥉 | 数据中台 | ¥3,150,000 | +24.6% | 📈 |
| 4 | 基础云服务 | ¥1,920,000 | +8.4% | ➡️ |

> **关键发现**：AI 助手产品线连续两个季度增速超过 40%，建议重点投入。

## 📌 建议行动

1. **加大 AI 助手研发投入** — 市场窗口期有限，竞品正在跟进
2. **企业版 SaaS 考虑海外市场** — 国内增速趋于稳定，海外需求旺盛
3. **基础云服务评估定价策略** — 增速放缓，建议推出新套餐`,
      createdAt: '2026-07-21T09:30:12Z',
      metadata: {
        chunk_ids: ['c1', 'c3', 'c5'],
        token_count: 420,
        cards: [
          {
            type: 'file_ref',
            title: '2026年Q2销售报告.pdf',
            subtitle: '已分析 · 847 KB',
            status: 'ready',
            action_label: '查看文件',
          },
        ],
      },
    },
    {
      id: 'm3',
      role: 'user',
      content: '能帮我基于这个报告生成一份PPT吗？我想在管理层会议上展示。',
      createdAt: '2026-07-21T09:31:00Z',
    },
    {
      id: 'm4',
      role: 'assistant',
      content: `好的！已根据 Q2 销售报告生成 PPT 大纲，涵盖以下内容：

## 📑 PPT 结构

| 页码 | 章节 | 内容要点 |
|------|------|---------|
| 1 | 封面 | Q2 业绩汇报 · 2026 |
| 2 | 核心指标 | 总销售额、达成率、毛利率 |
| 3 | 产品线增长分析 | 四象限对比 + 趋势 |
| 4 | 区域分布 | 华东/华南/华北/西部 |
| 5 | Top 10 客户动态 | 续费、增购、流失 |
| 6 | Q3 策略建议 | 基于数据的行动计划 |

PPT 正在生成中，完成后会通知你下载。`,
      createdAt: '2026-07-21T09:31:08Z',
      metadata: {
        token_count: 310,
        cards: [
          {
            type: 'ppt_result',
            title: 'Q2销售业绩汇报',
            subtitle: '基于 2026年Q2销售报告.pdf',
            status: 'pending',
            action_label: '生成进度',
          },
        ],
      },
    },
  ],
  'session-2': [
    {
      id: 'm5',
      role: 'user',
      content: '这个PRD里的用户权限设计，有没有安全漏洞？',
      createdAt: '2026-07-20T14:00:05Z',
    },
    {
      id: 'm6',
      role: 'assistant',
      content: `我审查了 **《产品需求文档》** 中的权限设计章节，发现以下潜在问题：

## ⚠️ 中等风险

### 1. 角色继承未定义优先级（第 3.2 节）
当用户属于多个角色组时，冲突权限的裁决规则未明确。

\`\`\`python
# 当前设计 — 冲突时行为未定义
class User(Base):
    roles: list[Role]  # 用户可以有多个角色

# 建议 — 引入"拒绝优先"原则
class PermissionResolver:
    """权限解析器：拒绝优先（DENY > ALLOW）"""

    def check_permission(self, user: User, resource: str, action: str) -> bool:
        # 1. 检查是否有显式拒绝
        for role in user.roles:
            if role.has_deny(resource, action):
                return False
        # 2. 检查是否有显式允许
        for role in user.roles:
            if role.has_allow(resource, action):
                return True
        # 3. 默认拒绝
        return False
\`\`\`

### 2. API 层缺少鉴权说明（第 5.1 节）
前端路由守卫提到了，但后端 API 鉴权并未覆盖。

\`\`\`python
# 建议：使用 FastAPI 依赖注入统一鉴权
from fastapi import Depends, HTTPException, status

async def require_permission(
    resource: str,
    action: str,
    user: User = Depends(get_current_user),
    resolver: PermissionResolver = Depends(get_resolver),
):
    if not resolver.check_permission(user, resource, action):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=f"无权执行 {action} 操作"
        )

# 路由中使用
@app.get("/api/v1/files/{file_id}")
async def get_file(
    file_id: str,
    _=Depends(require_permission("file", "read")),
):
    ...
\`\`\`

## ℹ️ 低风险
3. 超管角色的权限范围描述过宽（"所有操作"），建议列出具体可操作范围

## ✅ 框架整体评价
权限设计框架合理，建议在进入开发前与安全团队对齐以上三点。`,
      createdAt: '2026-07-20T14:00:15Z',
      metadata: {
        chunk_ids: ['c8', 'c10', 'c12'],
        token_count: 560,
        cards: [
          {
            type: 'file_ref',
            title: '产品需求文档.docx',
            subtitle: '已分析 · 1.5 MB',
            status: 'ready',
          },
        ],
      },
    },
  ],
  'session-3': [
    {
      id: 'm7',
      role: 'user',
      content: '帮我写一个Python脚本，读取CSV文件，统计每列的缺失值和基本统计信息',
      createdAt: '2026-07-19T10:00:05Z',
    },
    {
      id: 'm8',
      role: 'assistant',
      content: `下面是一个完整的 Python 脚本，使用 \`pandas\` 和 \`argparse\` 实现：

\`\`\`python
#!/usr/bin/env python3
"""CSV 数据质量报告工具"""

import argparse
import pandas as pd
from pathlib import Path


def analyze_csv(file_path: str, output: str | None = None) -> dict:
    """
    读取 CSV 并返回统计分析结果。

    Args:
        file_path: CSV 文件路径
        output: 可选，输出报告路径

    Returns:
        dict: 包含各列的统计信息
    """
    # 读取文件
    df = pd.read_csv(file_path)

    result = {
        "文件名": Path(file_path).name,
        "行数": len(df),
        "列数": len(df.columns),
        "列详情": {},
    }

    for col in df.columns:
        col_info = {
            "类型": str(df[col].dtype),
            "非空值": int(df[col].notna().sum()),
            "缺失值": int(df[col].isna().sum()),
            "缺失率(%)": round(df[col].isna().sum() / len(df) * 100, 2),
        }

        # 数值列增加统计信息
        if pd.api.types.is_numeric_dtype(df[col]):
            col_info.update({
                "均值": round(df[col].mean(), 2),
                "标准差": round(df[col].std(), 2),
                "最小值": round(df[col].min(), 2),
                "25%分位": round(df[col].quantile(0.25), 2),
                "50%分位": round(df[col].median(), 2),
                "75%分位": round(df[col].quantile(0.75), 2),
                "最大值": round(df[col].max(), 2),
            })

        result["列详情"][col] = col_info

    return result


def print_report(result: dict) -> None:
    """打印格式化的分析报告"""
    sep = "=" * 60
    print(f"\\n{sep}")
    print(f"📊 CSV 数据质量报告")
    print(f"{sep}")
    print(f"文件: {result['文件名']}")
    print(f"维度: {result['行数']} 行 × {result['列数']} 列")
    print(f"{sep}\\n")

    for col, info in result["列详情"].items():
        print(f"▶ {col} ({info['类型']})")
        print(f"  有效: {info['非空值']} / 缺失: {info['缺失值']} ({info['缺失率(%)']}%)")

        if "均值" in info:
            print(f"  均值: {info['均值']}  |  标准差: {info['标准差']}")
            print(f"  范围: [{info['最小值']} ~ {info['最大值']}]")
            print(f"  分位: P25={info['25%分位']}  P50={info['50%分位']}  P75={info['75%分位']}")
        print()


def main():
    parser = argparse.ArgumentParser(description="CSV 数据质量分析工具")
    parser.add_argument("file", help="CSV 文件路径")
    parser.add_argument("-o", "--output", help="输出报告文件路径")
    args = parser.parse_args()

    if not Path(args.file).exists():
        print(f"❌ 文件不存在: {args.file}")
        return 1

    result = analyze_csv(args.file)
    print_report(result)
    return 0


if __name__ == "__main__":
    exit(main())
\`\`\`

## 使用方式

\`\`\`bash
# 基本用法
python analyze_csv.py data.csv

# 保存到文件需要自己重定向
python analyze_csv.py data.csv > report.txt
\`\`\`

## 依赖安装

\`\`\`bash
pip install pandas
\`\`\`

这个脚本会输出每个列的数据类型、缺失值统计，对数值列还会计算均值、标准差、分位数等信息。可以直接复制保存为 \`analyze_csv.py\` 使用。`,
      createdAt: '2026-07-19T10:00:20Z',
      metadata: { token_count: 680 },
    },
  ],
  'session-4': [
    {
      id: 'm9',
      role: 'user',
      content: '帮我审查这个API设计，关注RESTful规范和数据安全',
      createdAt: '2026-07-18T16:30:05Z',
    },
    {
      id: 'm10',
      role: 'assistant',
      content: `以下是 API 设计审查结果，覆盖 **RESTful 规范** 和 **数据安全** 两个维度。

---

## 一、RESTful 规范问题

### ❌ 问题 1：操作使用动词路径

\`\`\`diff
- POST /api/uploadFile
- POST /api/deleteFile
+ POST /api/files              # 上传
+ DELETE /api/files/{id}       # 删除
\`\`\`

### ❌ 问题 2：响应格式不统一

\`\`\`diff
# 当前 — 不同接口返回不同结构
{ "status": "ok", "result": { ... } }
{ "code": 200, "data": { ... } }

# 建议 — 统一封装
+ {
+   "code": 0,
+   "message": "ok",
+   "data": { ... }
+ }
\`\`\`

### ✅ 符合规范的设计

\`\`\`http
### 文件管理
GET    /api/v1/files            # 列表
POST   /api/v1/files            # 上传
GET    /api/v1/files/{id}       # 详情
DELETE /api/v1/files/{id}       # 删除

### 会话管理
GET    /api/v1/chat/sessions             # 会话列表
POST   /api/v1/chat/sessions             # 创建会话
POST   /api/v1/chat/sessions/{id}/messages  # 发送消息

### PPT 任务
POST   /api/v1/ppt/jobs                  # 创建任务
GET    /api/v1/ppt/jobs/{id}             # 查询状态
GET    /api/v1/ppt/jobs/{id}/download    # 下载结果
\`\`\`

---

## 二、数据安全问题

| 风险 | 严重程度 | 建议 |
|------|---------|------|
| 接口未标注认证要求 | 🔴 高 | 所有业务接口默认需 JWT |
| 响应中暴露内部路径 | 🟡 中 | 返回文件 ID，不返回 \`/app/uploads/...\` |
| 无数据隔离说明 | 🟡 中 | 后端必须按 \`user_id\` 过滤数据 |

---

## 三、建议

1. 统一使用 \`/api/v1\` 前缀，方便版本管理
2. 所有接口默认需要 JWT Bearer Token
3. 分页响应统一格式：\`{ items, total, page, page_size }\``,
      createdAt: '2026-07-18T16:30:12Z',
      metadata: { token_count: 580 },
    },
  ],
  'session-5': [
    {
      id: 'm11',
      role: 'user',
      content: '基于这份会议纪要，帮我生成一份项目进度汇报PPT',
      createdAt: '2026-07-19T15:30:05Z',
    },
    {
      id: 'm12',
      role: 'assistant',
      content: `已分析会议纪要，提取了以下关键信息用于 PPT 生成：

## 📋 会议核心要点

| 项目 | 状态 | 负责人 |
|------|------|--------|
| AI 助手 V2.0 开发 | 已完成 80% | 王工 |
| 数据中台迁移 | 进行中 | 李工 |
| 客户 POC 交付 | 延期 2 周 | 赵工 |

## 🎯 关键决策
> Q3 重点攻关 AI 助手 V2.0，目标 8 月底上线；数据中台迁移优先级下调。

## 📊 PPT 大纲已生成

| 页码 | 内容 |
|------|------|
| 1 | 项目整体进度概览 |
| 2 | AI 助手 V2.0 — 里程碑 & 剩余工作 |
| 3 | 数据中台迁移计划调整 |
| 4 | 风险 & 应对措施 |
| 5 | Q3 目标和资源需求 |

PPT 正在生成，完成后可下载。`,
      createdAt: '2026-07-19T15:30:15Z',
      metadata: {
        token_count: 340,
        cards: [
          {
            type: 'file_ref',
            title: '会议纪要-20260719.txt',
            subtitle: '已分析 · 12 KB',
            status: 'ready',
          },
          {
            type: 'ppt_result',
            title: '项目进度汇报',
            subtitle: '基于 会议纪要-20260719.txt',
            status: 'running',
            action_label: '生成中 60%',
          },
        ],
      },
    },
  ],
};

// ========== 预置文件 ==========

export const mockFiles: FileItem[] = [
  {
    id: 'file-1',
    original_name: '2026年Q2销售报告.pdf',
    status: 'ready',
    size_bytes: 847_000,
    created_at: '2026-07-21T09:28:00Z',
    extension: 'pdf',
  },
  {
    id: 'file-2',
    original_name: '产品需求文档.docx',
    status: 'ready',
    size_bytes: 1_520_000,
    created_at: '2026-07-20T13:55:00Z',
    extension: 'docx',
  },
  {
    id: 'file-3',
    original_name: '会议纪要-20260719.txt',
    status: 'ready',
    size_bytes: 12_400,
    created_at: '2026-07-19T15:00:00Z',
    extension: 'txt',
  },
];

// ========== AI 响应模拟 ==========

const responseTemplates: Record<string, string[]> = {
  general: [
    `这是一个很好的问题！让我从几个角度来分析：

## 📌 核心观点

首先，我们需要理解这个问题的背景。从目前的行业趋势来看，以下几个方向值得关注：

| 方向 | 趋势 | 影响 |
|------|------|------|
| AI 在企业服务渗透 | 🚀 加速 | 竞争加剧 |
| 降本增效需求 | 📈 增长 | 市场扩大 |
| 头部厂商整合生态 | 🔗 加深 | 格局变化 |

## 💡 具体建议

> 基于以上分析，我建议分三步推进：

1. **短期（1-2月）** — 聚焦核心场景，快速验证价值
2. **中期（3-4月）** — 建立数据飞轮，沉淀能力
3. **长期（H2）** — 构建平台能力，形成壁垒

如果需要更深入的分析，请告诉我！`,
    `我来谈谈我的看法。

## ✅ 优势分析

- **市场需求明确** — 客户付费意愿强，ROI 清晰
- **技术方案成熟** — 落地风险可控
- **协同效应** — 与现有产品线有互补

## ⚠️ 需要关注

| 风险 | 等级 | 应对 |
|------|------|------|
| 竞品跟进速度 | 🟡 中 | 快速上线抢占先机 |
| 团队交付能力 | 🟡 中 | 评估后分阶段投入 |
| 技术选型锁定 | 🟢 低 | 保持接口抽象 |

## 📊 数据支撑

根据行业报告，同类产品市场渗透率预计在 **18 个月** 内从 **23%** 提升到 **47%**。

什么方面想深入讨论？`,
  ],
  file: [
    `根据你上传的文件，我整理出以下关键信息：

## 📄 文档摘要

这份文档主要包含以下几个方面内容：

### 1. 核心数据

| 指标 | 数值 | 同比 |
|------|------|------|
| 营收 | ¥18.2M | +23.5% |
| 用户数 | 12,400 | +41% |
| 转化率 | 3.8% | +0.6pp |

### 2. 重点发现

- **华东区域** 增长最快（+35%）
- 企业客户 **续费率高达 92%**
- 新客获取成本 **同比下降 18%**

### 3. 分析结论

> 当前策略有效，建议持续加大在高增长区域的投入。

可以为你生成 PPT 或深入分析某个数据维度。`,
  ],
};

export async function generateAIResponse(
  content: string,
  mode?: 'general' | 'file',
  fileId?: string
): Promise<string> {
  const pool = mode === 'file' && fileId ? responseTemplates.file : responseTemplates.general;
  const template = pool[Math.floor(Math.random() * pool.length)];

  await new Promise((r) => setTimeout(r, 1000 + Math.random() * 1200));

  return `关于 "${content}" 的问题：\n\n${template}`;
}
