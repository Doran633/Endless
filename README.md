# v1.5.1 最小访问保护

公网部署时，建议在 `backend/.env` 中配置共享访问口令，避免陌生人直接调用后端并消耗你的 LLM / Embedding API Key。

```env
APP_ACCESS_PASSWORD=请填写一个足够长的随机口令
APP_ACCESS_HEADER=X-Beichen-Access
```

本地开发可以保持 `APP_ACCESS_PASSWORD=` 为空，此时后端不会启用访问保护。部署时如果设置了口令，前端入口页需要输入相同口令，之后浏览器会把口令保存在 `localStorage`，并在调用 `/api/v1/*` 接口时自动携带请求头。

这只是 MVP 阶段的最小访问保护，不是正式用户系统。它不支持注册、账号、角色、权限隔离、多用户审计或 JWT refresh token。

# v1.5.3 部署入口

如果准备部署到小型 Ubuntu VPS，可以先阅读：

- `docs/deployment_guide.md`
- `deploy/nginx/beichen-agent.conf.example`
- `deploy/systemd/beichen-agent.service.example`

部署模板中的域名、路径、API Key 和访问口令都使用占位符。不要把真实生产环境变量、真实访问口令、上传文件、SQLite 数据库或 vector_store 索引提交到 GitHub。
# 鍖楄景agent

鍖楄景agent 鏄竴涓嫭绔嬬綉椤电増 AI 鍔╂墜 MVP锛屽綋鍓嶈仛鐒︿釜浜烘湰鍦拌瘯杩愯鍜屽崟鏂囦欢 RAG 闂瓟銆?
褰撳墠宸叉敮鎸侊細

- AI 鑱婂ぉ
- 鐪熷疄 LLM API 璋冪敤
- 鏂囦欢涓婁紶
- TXT / DOCX / 鍙鍒舵枃鏈瀷 PDF 瑙ｆ瀽
- 鏂囨湰鍒囧潡
- Mock / OpenAI-compatible Embedding
- 鏈湴 JSON VectorStore
- 鍗曟枃浠?Retrieval 妫€绱?- 鍗曟枃浠?RAG 闂瓟
- 鑱婂ぉ渚т笂浼犳枃浠跺悗鐩存帴鍩轰簬鏂囦欢鎻愰棶
- 鏅€氳亰澶╃煭涓婁笅鏂?- RAG 鏂囦欢闂瓟杩炵画杩介棶
- SQLite + SQLAlchemy 鏂囦欢銆佷細璇濆拰娑堟伅鎸佷箙鍖?- Windows 鏈湴妫€鏌ャ€佸惎鍔ㄥ拰鍋滄鑴氭湰

褰撳墠涓嶅寘鍚細

- 浼佷笟鐧诲綍
- 浼佷笟鏉冮檺
- 澶氱鎴?- 澶氭枃浠?RAG
- Agent Workflow
- PPT 鐢熸垚
- 姝ｅ紡绾夸笂閮ㄧ讲鏂规
- 鐢熶骇绾у悜閲忔暟鎹簱

## 鎶€鏈爤

Frontend:

- React 18
- TypeScript
- Vite
- Ant Design 5
- Zustand

Backend:

- Python
- FastAPI
- Pydantic
- SQLite
- SQLAlchemy
- python-dotenv
- python-multipart
- python-docx
- pypdf

Storage:

- `backend/uploads/` 淇濆瓨鍘熷涓婁紶鏂囦欢
- `backend/vector_store/` 淇濆瓨鏈湴 JSON 鍚戦噺绱㈠紩
- `backend/data/` 淇濆瓨 SQLite 鏁版嵁搴?
杩欎簺杩愯鏁版嵁榛樿涓嶄細鎻愪氦鍒?Git銆?
## Windows 鎺ㄨ崘鍚姩鏂瑰紡

绗竴娆¤繍琛屽墠锛岃鍏堝畨瑁咃細

- Python
- Node.js / npm

鐒跺悗瀹夎渚濊禆锛?
```powershell
cd backend
pip install -r requirements.txt
```

```powershell
cd frontend
npm install
```

澶嶅埗鍚庣閰嶇疆锛?
```powershell
copy backend\.env.example backend\.env
```

妫€鏌ョ幆澧冿細

```powershell
scripts\check-local.ps1
```

鍚姩椤圭洰锛?
```powershell
scripts\start-local.ps1
```

璁块棶锛?
```text
http://127.0.0.1:5173/
```

鍋滄椤圭洰锛?
```powershell
scripts\stop-local.ps1
```

## 鎵嬪姩鍚姩鏂瑰紡

鍚庣锛?
```powershell
cd backend
python -m uvicorn app.main:app --host 127.0.0.1 --port 8000 --reload
```

鍓嶇锛?
```powershell
cd frontend
npm run dev -- --host 127.0.0.1 --port 5173 --strictPort
```

璁块棶锛?
```text
http://127.0.0.1:5173/
```

## Mock 妯″紡

濡傛灉娌℃湁 API Key锛屽彲浠ュ厛浣跨敤 Mock 妯″紡銆?
`backend/.env`:

```env
LLM_PROVIDER=mock
LLM_MODEL=mock-chat

EMBEDDING_PROVIDER=mock
EMBEDDING_MODEL=mock-embedding
EMBEDDING_DIMENSION=16
```

Mock 妯″紡閫傚悎妫€鏌ラ〉闈㈠拰娴佺▼锛屼絾涓嶄唬琛ㄧ湡瀹炲洖绛旇川閲忋€?
## 鐪熷疄 API 妯″紡

浣跨敤 OpenAI-compatible LLM锛?
```env
LLM_PROVIDER=openai
LLM_MODEL=deepseek-v4-flash
LLM_TIMEOUT_SECONDS=60
OPENAI_API_KEY=浣犵殑 API Key
OPENAI_BASE_URL=https://api.deepseek.com
```

浣跨敤 OpenAI-compatible Embedding锛?
```env
EMBEDDING_PROVIDER=openai
EMBEDDING_MODEL=text-embedding-3-small
EMBEDDING_DIMENSION=1536
EMBEDDING_TIMEOUT_SECONDS=60
EMBEDDING_API_KEY=浣犵殑 Embedding API Key
EMBEDDING_BASE_URL=https://api.openai.com/v1
```

濡傛灉 `EMBEDDING_API_KEY` 鎴?`EMBEDDING_BASE_URL` 鏈缃紝鍚庣浼氬洖閫€浣跨敤 `OPENAI_API_KEY` 鍜?`OPENAI_BASE_URL`銆?
涓嶈鎶婄湡瀹?API Key 鎻愪氦鍒?Git銆?
## 鏂囦欢闂瓟娴佺▼

鎺ㄨ崘娴佺▼锛?
1. 鍚姩鍚庣鍜屽墠绔€?2. 鎵撳紑 `http://127.0.0.1:5173/`銆?3. 鍦ㄨ亰澶╄緭鍏ュ尯涓婁紶 TXT / DOCX / PDF銆?4. 绛夊緟鏂囦欢鑷姩瀹屾垚瑙ｆ瀽銆佸垏鍧椼€乪mbedding 鍜岀储寮曘€?5. 鍦ㄨ亰澶╂閲屽熀浜庤鏂囦欢鎻愰棶銆?6. 濡傛灉缁х画杩介棶锛屽綋鍓嶄細璇濅細鎼哄甫鏈€杩戜笂涓嬫枃銆?
鍒囨崲 Embedding Provider 鍚庯紝寤鸿閲嶆柊涓婁紶鏂囦欢鎴栭噸鏂扮储寮曟枃浠讹紝鍚﹀垯鏃х储寮曚笉鑳戒唬琛ㄦ柊 embedding 鐨勮涔夋晥鏋溿€?
## 涓嶈鎻愪氦鍒?GitHub 鐨勬枃浠?
浠ヤ笅鍐呭涓嶅簲杩涘叆 Git锛?
- `backend/.env`
- `frontend/.env`
- `.env`
- `backend/uploads/`
- `backend/vector_store/`
- `backend/data/`
- `.claude/`
- `node_modules/`
- `__pycache__/`
- `*.log`
- `*.db`
- `*.sqlite`
- `*.sqlite3`
- `*.zip`
- `release/`
- `local_trial_package/`

## 涓嶈鍙戠粰鍒汉鐨勬枃浠?
濡傛灉瑕佹妸椤圭洰鍙戠粰鍙俊浠荤殑浜鸿瘯杩愯锛岄粯璁や笉瑕佸寘鍚細

- `backend/.env`
- `backend/uploads/`
- `backend/vector_store/`
- `backend/data/`
- `.claude/`
- `frontend/node_modules/`
- `.git/`
- 浠讳綍鍘嬬缉鍖呴噷娣峰叆鐨勬暟鎹簱銆佷笂浼犳枃浠舵垨 API Key

濡傛灉浣犲厑璁稿鏂逛娇鐢ㄤ綘鐨?API Key锛屽缓璁崟鐙鍙?`.env`锛屼笉瑕佹斁杩涙簮鐮佸帇缂╁寘锛屼篃涓嶈涓婁紶 GitHub銆?
## 甯歌闂

鏌ョ湅锛?
```text
docs/troubleshooting.md
```

鏈湴璇曡繍琛岃鏄庯細

```text
docs/local_trial_guide.md
```

## 褰撳墠闄愬埗

- 褰撳墠鍙敮鎸佹渶杩戜竴涓?indexed 鏂囦欢鐨勫崟鏂囦欢 RAG 闂瓟銆?- 褰撳墠鏈湴 JSON VectorStore 涓嶉€傚悎鐢熶骇绾уぇ瑙勬ā鏁版嵁銆?- 褰撳墠 SQLite 閫傚悎鏈湴 MVP锛屼笉閫傚悎浣滀负澶氫汉鐢熶骇鏁版嵁搴撱€?- PDF 瑙ｆ瀽浠呮敮鎸佸彲澶嶅埗鏂囨湰鍨?PDF锛屼笉鏀寔 OCR銆?- 褰撳墠娌℃湁鐢ㄦ埛鐧诲綍鍜屾潈闄愰殧绂汇€?- 褰撳墠娌℃湁姝ｅ紡閮ㄧ讲鏂规銆?- Agent Workflow銆佷紒涓氭潈闄愩€佸绉熸埛鍜?PPT 鐢熸垚鏆傛湭瀹炵幇銆?
