# RAG 人工测评工作表

本文档用于 v1.8 阶段的 RAG 质量测评。目标不是自动评分，而是用固定测试集、统一指标和 debug trace，把“感觉准不准”变成可比较的工程数据。

## 1. 测评目标

每次 RAG 调参前后，都用同一份文档和同一批问题测试，比较：

- 检索有没有找到正确片段。
- 正确片段是否排在前面。
- 回答是否有文档依据。
- 文档没有答案时是否能拒答。
- 引用片段是否真的支撑答案。
- token 和响应成本是否变高。

## 2. 准备测试文档

建议选择 1-2 份代表性文档：

- 一份普通段落文档，例如项目方案、产品说明、会议纪要。
- 一份包含表格或数字信息的 DOCX / PDF。

测试文档应覆盖：

```text
普通事实
跨段综合
表格或数字
文档中不存在的信息
```

上传后固定使用同一份文件完成：

```text
上传 -> 解析 -> 切块 -> embedding -> vector-store 索引
```

调参对比时，不要频繁更换测试文件。

## 3. 设计 10-20 个测试问题

问题类型建议：

| 类型 | 说明 | 示例 |
| --- | --- | --- |
| fact | 文档中有明确答案 | 文档中的项目预算是多少？ |
| summary | 需要总结多个片段 | 这个方案主要解决哪些问题？ |
| table | 表格、数字、列表相关 | 表格中 Q2 的增长率是多少？ |
| no_answer | 文档中没有答案 | 文档有没有提到 2028 年海外计划？ |

每个测试问题需要人工填写：

- `expected_answer`：期望答案。
- `expected_evidence`：答案依据原文或摘要。
- `expected_chunk_index`：如果已知，填写应命中的 chunk 序号。
- `has_answer`：文档中是否有答案，填 `yes` 或 `no`。

模板文件：

```text
docs/rag_test_cases_template.csv
```

## 4. 记录 debug_trace 指标

每次在文件中心或聊天侧完成 RAG 问答后，记录：

- `actual_answer`
- `retrieved_chunk_indexes`
- `retrieved_chunk_ids`
- `max_score`
- `average_score`
- `confidence`
- `no_answer`
- `input_tokens`
- `output_tokens`

这些值来自前端展示的 RAG 质量摘要和引用片段。

## 5. 人工评分规则

### 5.1 Retrieval Score

判断正确依据有没有被检索出来。

```text
2 = 正确依据排在 Top 1
1 = 正确依据出现在 top_k，但不是 Top 1
0 = 没有找到正确依据
```

如果 `expected_chunk_index` 不明确，可以根据引用片段内容和 `expected_evidence` 人工判断。

### 5.2 Groundedness Score

判断回答是否基于文档。

```text
2 = 回答完全有文档依据
1 = 回答大体有依据，但有遗漏、概括过度或轻微不精确
0 = 答非所问、编造、或明显没有文档依据
```

### 5.3 Citation Score

判断引用片段是否支撑答案。

```text
2 = 引用片段直接支撑答案
1 = 引用片段相关，但支撑不充分
0 = 引用片段无关
```

### 5.4 No-answer Score

只对 `has_answer = no` 的问题评分。

```text
1 = 正确回答“根据当前文档内容无法确认”
0 = 编造或强行回答
```

如果 `has_answer = yes`，这一列可以留空。

## 6. 指标计算方式

假设总问题数为 `N`。

### Hit Rate@K

```text
retrieval_score >= 1 的问题数 / N
```

含义：正确依据是否进入 top_k。

### Top-1 Accuracy

```text
retrieval_score = 2 的问题数 / N
```

含义：正确依据是否排第一。

### Groundedness Rate

```text
groundedness_score >= 1 的问题数 / N
```

含义：回答是否至少大体有文档依据。

### High-quality Answer Rate

```text
groundedness_score = 2 的问题数 / N
```

含义：回答是否完全有文档依据。

### Citation Precision

```text
citation_score >= 1 的问题数 / N
```

含义：引用是否至少相关。

### No-answer Accuracy

只统计 `has_answer = no` 的问题：

```text
no_answer_score = 1 的问题数 / no_answer 问题总数
```

含义：文档没有答案时是否能拒答。

### Average Token Usage

```text
平均 input_tokens
平均 output_tokens
```

含义：衡量成本和上下文长度压力。

## 7. 参数配置

后端 `.env` 中可调整：

```env
CHUNK_SIZE=800
CHUNK_OVERLAP=120
RAG_DEFAULT_TOP_K=3
```

默认值保持当前行为。

聊天侧前端默认 top_k 可选配置：

```env
VITE_RAG_DEFAULT_TOP_K=3
```

如果不配置，前端默认仍为 3。

## 8. 如何比较不同参数组合

原则：一次只改一个变量。

推荐基线：

```text
CHUNK_SIZE=800
CHUNK_OVERLAP=120
RAG_DEFAULT_TOP_K=3
```

可测试组合：

```text
chunk_size: 600 / 800 / 1000 / 1200
chunk_overlap: 80 / 120 / 160 / 200
top_k: 3 / 5 / 8
```

每次测试流程：

1. 修改 `.env` 参数。
2. 重启后端。
3. 删除旧文件索引或重新上传同一份测试文档。
4. 等待重新解析、切块、embedding 和索引完成。
5. 用同一组问题测试。
6. 记录 debug_trace 和人工评分。
7. 比较指标变化。

不要同时修改多个参数，否则无法判断哪一个参数带来了变化。

## 9. 判断参数是否更好

更好的参数组合不只是回答更长或更顺。

推荐判断标准：

- Hit Rate@K 提升。
- Top-1 Accuracy 提升。
- Groundedness Rate 提升。
- No-answer Accuracy 不下降。
- Citation Precision 提升。
- Average input tokens 没有明显暴涨。
- 响应速度没有明显变慢。

如果准确率小幅提升，但 token 和延迟大幅增加，需要谨慎采用。

## 10. 当前不做的事情

v1.8.2 不做：

- 自动评分。
- 自动批量跑测试。
- 持久化完整 trace。
- LLM-as-judge。
- pgvector。
- rerank。
- 多文件 RAG。
- 登录系统。

当前阶段先建立人工评测基线。自动化评测可以等测试集稳定后再做。

