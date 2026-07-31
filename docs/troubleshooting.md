# v1.5.1 访问口令常见问题

## 进入页面后接口返回 401

原因通常是后端 `backend/.env` 设置了 `APP_ACCESS_PASSWORD`，但前端入口页没有输入口令，或输入的口令和后端不一致。

处理方式：

1. 点击侧边栏底部退出图标，清除本地保存的访问口令。
2. 回到入口页后重新输入正确口令。
3. 如果是本地开发且不需要访问保护，可以把 `backend/.env` 中的 `APP_ACCESS_PASSWORD` 留空，然后重启后端。

## 修改 APP_ACCESS_HEADER 后前端仍然失败

默认请求头是 `X-Beichen-Access`。如果后端修改了 `APP_ACCESS_HEADER`，前端也需要通过 `VITE_ACCESS_HEADER` 使用同一个请求头名。MVP 阶段建议保持默认值，减少部署变量不一致的风险。
# 鍖楄景agent 甯歌闂

## 1. PowerShell 涓嶅厑璁歌繍琛岃剼鏈?
鐜拌薄锛?
```text
running scripts is disabled on this system
```

澶勭悊锛?
```powershell
powershell -ExecutionPolicy Bypass -File scripts\check-local.ps1
```

鍚姩鑴氭湰涔熷彲浠ヨ繖鏍疯繍琛岋細

```powershell
powershell -ExecutionPolicy Bypass -File scripts\start-local.ps1
```

## 2. 绔彛琚崰鐢?
鐜拌薄锛?
```text
Port 5173 is already in use
```

鎴栵細

```text
Port 8000 is already in use
```

澶勭悊锛?
```powershell
scripts\stop-local.ps1
scripts\start-local.ps1
```

璇存槑锛?
- `8000` 鏄悗绔鍙ｃ€?- `5173` 鏄墠绔鍙ｃ€?- 鍋滄鑴氭湰鍙鐞嗙洃鍚繖涓や釜绔彛鐨勮繘绋嬶紝涓嶄細鎵归噺缁撴潫鎵€鏈?Python 鎴?Node銆?
## 3. 鍓嶇鎵撲笉寮€

璇风‘璁ゆ墦寮€鐨勬槸锛?
```text
http://127.0.0.1:5173/
```

濡傛灉鎵撲笉寮€锛?
1. 杩愯 `scripts\check-local.ps1`銆?2. 纭 `5173` 鏄惁琚崰鐢ㄣ€?3. 杩愯 `scripts\stop-local.ps1`銆?4. 鍐嶈繍琛?`scripts\start-local.ps1`銆?
## 4. 鍚庣涓嶅彲鐢?
妫€鏌ワ細

```text
http://127.0.0.1:8000/health
```

姝ｅ父缁撴灉搴旇鍖呭惈锛?
```text
ok
```

濡傛灉涓嶆甯革細

- 鍚庣鍙兘娌″惎鍔ㄣ€?- Python 渚濊禆鍙兘娌″畨瑁呫€?- `backend/.env` 鍙兘涓嶅瓨鍦ㄣ€?- 鍚庣鍚姩绐楀彛閲屽彲鑳芥湁閿欒鏃ュ織銆?
## 5. 椤甸潰鏄剧ず Failed to fetch

甯歌鍘熷洜锛?
- 鍚庣娌″惎鍔ㄣ€?- 鍓嶇鎵撳紑浜嗛敊璇鍙ｃ€?- 鍚庣绔彛涓嶆槸 `8000`銆?- 鍓嶇 Vite proxy 娌℃湁杞彂鍒板悗绔€?
澶勭悊锛?
```powershell
scripts\stop-local.ps1
scripts\check-local.ps1
scripts\start-local.ps1
```

鐒跺悗閲嶆柊鎵撳紑锛?
```text
http://127.0.0.1:5173/
```

## 6. API Key 閰嶇疆閿欒

鐜拌薄锛?
- AI 鍥炲澶辫触銆?- 鍚庣绐楀彛鏄剧ず provider request failed銆?- 鍚庣鎻愮ず `OPENAI_API_KEY is not configured`銆?
妫€鏌ワ細

```text
backend/.env
```

鐪熷疄 LLM 妯″紡鑷冲皯闇€瑕侊細

```env
LLM_PROVIDER=openai
LLM_MODEL=浣犵殑妯″瀷鍚?OPENAI_API_KEY=浣犵殑 API Key
OPENAI_BASE_URL=浣犵殑鏈嶅姟鍟?base url
```

娉ㄦ剰锛?
- 涓嶈鎶婄湡瀹?API Key 鎻愪氦鍒?GitHub銆?- 涓嶈鎶?`.env` 鏀捐繘鍏紑鍘嬬缉鍖呫€?
## 7. Embedding 閰嶇疆閿欒

鐜拌薄锛?
- 鏂囦欢鍙互涓婁紶锛屼絾鍚戦噺鍖栧け璐ャ€?- 鏂囦欢鏃犳硶鍙樻垚 indexed 鐘舵€併€?
妫€鏌ワ細

```env
EMBEDDING_PROVIDER=openai
EMBEDDING_MODEL=浣犵殑 embedding 妯″瀷鍚?EMBEDDING_DIMENSION=妯″瀷缁村害
EMBEDDING_API_KEY=浣犵殑 Embedding API Key
EMBEDDING_BASE_URL=浣犵殑 Embedding base url
```

濡傛灉鍙槸鏈湴璇曟祦绋嬶紝鍙互鍏堟敼涓猴細

```env
EMBEDDING_PROVIDER=mock
EMBEDDING_MODEL=mock-embedding
EMBEDDING_DIMENSION=16
```

## 8. 涓婁紶鏂囦欢鍚庝笉鑳介棶绛?
璇锋鏌ワ細

- 鏂囦欢绫诲瀷鏄惁涓?TXT / DOCX / PDF銆?- PDF 鏄惁涓哄彲澶嶅埗鏂囨湰鍨?PDF銆?- 鏂囦欢鏄惁瀹屾垚 indexed銆?- Embedding 閰嶇疆鏄惁姝ｇ‘銆?- 鏄惁鍒囨崲浜?embedding provider 鍚庢病鏈夐噸鏂扮储寮曘€?
寤鸿锛?
1. 閲嶆柊涓婁紶鏂囦欢銆?2. 绛夊緟鑷姩澶勭悊瀹屾垚銆?3. 鍐嶅熀浜庤鏂囦欢鎻愰棶銆?
## 9. 鍥炵瓟璐ㄩ噺涓嶇ǔ瀹?
鍙兘鍘熷洜锛?
- 浣跨敤浜?Mock LLM銆?- 浣跨敤浜?Mock Embedding銆?- 鏂囨。 chunk 涓嶅鐩稿叧銆?- 褰撳墠 query 澶渷鐣ャ€?- 鏂囨。鏈韩娌℃湁鍖呭惈绛旀銆?
寤鸿锛?
- 浣跨敤鐪熷疄 LLM銆?- 浣跨敤鐪熷疄 Embedding銆?- 灏濊瘯鏇存槑纭殑闂銆?- 濡傛灉鍒囨崲 embedding 妯″瀷锛岄噸鏂颁笂浼犳垨閲嶆柊绱㈠紩鏂囦欢銆?
## 10. 涓存椂鍏綉缃戝潃鎵撲笉寮€

涓存椂鍏綉闅ч亾涓嶅睘浜庡綋鍓嶇ǔ瀹氳繍琛屾柟妗堛€?
瀹冨彲鑳藉嚭鐜帮細

- 鍦板潃鍙樺寲銆?- HTTPS 鍏煎闂銆?- 鏈嶅姟绔繛鎺ヤ腑鏂€?- 鏈満鍙繍琛屼絾鍏綉鍦板潃鎵撲笉寮€銆?
褰撳墠鎺ㄨ崘锛?
- 鏈湴浣跨敤 `http://127.0.0.1:5173/`銆?- 鍏堝畬鎴愭湰鍦拌瘯杩愯鏁寸悊銆?- 鍚庣画鍐嶈鍒掓寮忛儴缃层€?
## 11. 浠€涔堟枃浠朵笉鑳藉彂缁欏埆浜?
榛樿涓嶈鍙戦€侊細

- `backend/.env`
- `backend/uploads/`
- `backend/vector_store/`
- `backend/data/`
- `.claude/`
- `.git/`
- `frontend/node_modules/`

鍘熷洜锛?
- `.env` 鍙兘鍖呭惈 API Key銆?- uploads 淇濆瓨鍘熷涓婁紶鏂囦欢銆?- vector_store 淇濆瓨鏂囨。 chunk 鍘熸枃銆?- SQLite 鏁版嵁搴撲繚瀛樹細璇濆拰娑堟伅銆?
