# v1.5.1 最小访问保护补充

如果只是本机试运行，可以让 `backend/.env` 中的 `APP_ACCESS_PASSWORD` 保持为空：

```env
APP_ACCESS_PASSWORD=
APP_ACCESS_HEADER=X-Beichen-Access
```

如果你要把服务临时开放给可信任的人，建议设置一个访问口令：

```env
APP_ACCESS_PASSWORD=请填写一个足够长的随机口令
APP_ACCESS_HEADER=X-Beichen-Access
```

设置后，访问网页时在入口页输入同一个口令即可。这个口令只用于阻止陌生人直接调用 `/api/v1/*` 接口，不能替代正式登录系统，也不能提供多用户权限隔离。
# 鍖楄景agent 鏈湴璇曡繍琛屾寚鍗?
鏈枃妗ｉ潰鍚戝彲淇′换鐨勬湰鍦拌瘯鐢ㄨ€呫€?
鐩爣鏄浣犲湪 Windows 鐢佃剳涓婂敖閲忛『鍒╁惎鍔ㄥ寳杈癮gent銆?
## 1. 浣犻渶瑕佸噯澶囦粈涔?
闇€瑕佸畨瑁咃細

- Python
- Node.js / npm

闇€瑕佸噯澶囷細

- 涓€涓彲鐢ㄧ殑 LLM API Key锛屾垨鑰呬娇鐢?Mock 妯″紡
- 涓€涓彲鐢ㄧ殑 Embedding API Key锛屾垨鑰呬娇鐢?Mock 妯″紡

濡傛灉浣犲彧鏄兂鍏堢湅鐪嬮〉闈㈠拰娴佺▼锛屽彲浠ヤ娇鐢?Mock 妯″紡锛屼笉闇€瑕?API Key銆?
## 2. 瑙ｅ帇椤圭洰鍚庡厛涓嶈鍋氫粈涔?
涓嶈鍒犻櫎杩欎簺鐩綍锛?
- `backend/`
- `frontend/`
- `docs/`
- `scripts/`

涓嶈鎶婅繖浜涙枃浠朵笂浼犲埌 GitHub 鎴栧叕寮€缃戠洏锛?
- `backend/.env`
- `backend/uploads/`
- `backend/vector_store/`
- `backend/data/`
- `.claude/`
- `.git/`

## 3. 瀹夎渚濊禆

鍚庣渚濊禆锛?
```powershell
cd backend
pip install -r requirements.txt
```

鍓嶇渚濊禆锛?
```powershell
cd frontend
npm install
```

## 4. 鍒涘缓鍚庣閰嶇疆鏂囦欢

鍦ㄩ」鐩牴鐩綍鎵ц锛?
```powershell
copy backend\.env.example backend\.env
```

鐒跺悗鎵撳紑锛?
```text
backend/.env
```

## 5. Mock 妯″紡

濡傛灉娌℃湁 API Key锛屽彲浠ュ厛浣跨敤锛?
```env
LLM_PROVIDER=mock
LLM_MODEL=mock-chat

EMBEDDING_PROVIDER=mock
EMBEDDING_MODEL=mock-embedding
EMBEDDING_DIMENSION=16
```

Mock 妯″紡鑳介獙璇侀〉闈€佷笂浼犮€佽В鏋愬拰娴佺▼锛屼絾鍥炵瓟璐ㄩ噺鍜屾绱㈣川閲忎笉浠ｈ〃鐪熷疄 AI 鏁堟灉銆?
## 6. 鐪熷疄 API 妯″紡

濡傛灉浣跨敤 OpenAI-compatible LLM锛?
```env
LLM_PROVIDER=openai
LLM_MODEL=浣犵殑妯″瀷鍚?LLM_TIMEOUT_SECONDS=60
OPENAI_API_KEY=浣犵殑 API Key
OPENAI_BASE_URL=浣犵殑鏈嶅姟鍟?base url
```

濡傛灉浣跨敤 OpenAI-compatible Embedding锛?
```env
EMBEDDING_PROVIDER=openai
EMBEDDING_MODEL=浣犵殑 embedding 妯″瀷鍚?EMBEDDING_DIMENSION=妯″瀷缁村害
EMBEDDING_TIMEOUT_SECONDS=60
EMBEDDING_API_KEY=浣犵殑 Embedding API Key
EMBEDDING_BASE_URL=浣犵殑 Embedding base url
```

涓嶈鎶婄湡瀹?API Key 鍙戠粰涓嶅彲淇＄殑浜恒€?
涓嶈鎶?`.env` 涓婁紶鍒?GitHub銆?
## 7. 妫€鏌ョ幆澧?
鍦ㄩ」鐩牴鐩綍鎵ц锛?
```powershell
scripts\check-local.ps1
```

濡傛灉鐪嬪埌 `[OK]`锛岃鏄庡搴旈」鐩甯搞€?
濡傛灉鐪嬪埌 `[WARN] Port 8000 is already in use` 鎴?`[WARN] Port 5173 is already in use`锛屽彲浠ュ厛杩愯锛?
```powershell
scripts\stop-local.ps1
```

## 8. 鍚姩椤圭洰

鍦ㄩ」鐩牴鐩綍鎵ц锛?
```powershell
scripts\start-local.ps1
```

鍚姩鍚庢墦寮€锛?
```text
http://127.0.0.1:5173/
```

## 9. 鍋滄椤圭洰

鍦ㄩ」鐩牴鐩綍鎵ц锛?
```powershell
scripts\stop-local.ps1
```

鍋滄鑴氭湰鍙細鍋滄鐩戝惉鍥哄畾绔彛鐨勮繘绋嬶細

- `8000`
- `5173`

瀹冧笉浼氬垹闄や笂浼犳枃浠躲€佹暟鎹簱鎴栧悜閲忕储寮曘€?
## 10. 浣跨敤鏂囦欢闂瓟

鎺ㄨ崘娴佺▼锛?
1. 鎵撳紑缃戦〉銆?2. 鍦ㄨ亰澶╄緭鍏ュ尯涓婁紶 TXT / DOCX / PDF銆?3. 绛夊緟鏂囦欢澶勭悊瀹屾垚銆?4. 鐩存帴鍦ㄨ亰澶╂鎻愰棶銆?5. 鍙互缁х画杩介棶锛屼緥濡傗€滅户缁В閲婄浜岀偣鈥濄€?
娉ㄦ剰锛?
- PDF 浠呮敮鎸佸彲澶嶅埗鏂囨湰鍨?PDF銆?- 鎵弿浠?PDF 鏆備笉鏀寔 OCR銆?- 褰撳墠鍙敮鎸佹渶杩戜竴涓?indexed 鏂囦欢鐨勫崟鏂囦欢闂瓟銆?
## 11. 濡傛灉杩愯澶辫触

鍏堟煡鐪嬶細

```text
docs/troubleshooting.md
```

鏈€甯歌澶勭悊鏂瑰紡锛?
```powershell
scripts\stop-local.ps1
scripts\check-local.ps1
scripts\start-local.ps1
```

