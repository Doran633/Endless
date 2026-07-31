# v1.5.1 状态更新

当前阶段：Minimal Access Protection 最小访问保护。

本阶段新增：

- 后端支持通过 `backend/.env` 配置 `APP_ACCESS_PASSWORD` 和 `APP_ACCESS_HEADER`。
- 当 `APP_ACCESS_PASSWORD` 为空时，本地开发不启用访问保护。
- 当 `APP_ACCESS_PASSWORD` 非空时，后端会保护 `/api/v1/*`，请求必须携带正确访问口令请求头。
- `GET /health` 不受访问保护影响，便于部署健康检查。
- 前端入口页支持输入访问口令并保存到 `localStorage`。
- 前端聊天、会话、文件、RAG 相关 API 请求会自动携带访问口令。
- 侧边栏退出会清除本地访问口令，便于重新输入。

当前限制：

- 这不是正式登录系统，不支持注册、账号、角色、权限隔离、多用户审计或 JWT refresh token。
- 访问口令只适合个人 MVP 或可信任小范围试运行，用于降低公网 API Key 被随意消耗的风险。
- 未来正式部署如果面向更多用户，仍需要设计真正的 Auth 模块。
# 椤圭洰鐘舵€?
> 鏈枃妗ｈ褰曞綋鍓嶄唬鐮佺湡瀹炵姸鎬侊紝涓嶈褰曞巻鍙茶鍒掞紝涓嶅寘鍚湭鏉ヤ紒涓氬姛鑳借寖鍥淬€?
## 1. 褰撳墠鐗堟湰

褰撳墠鐗堟湰锛歚v1.4.2`

褰撳墠闃舵锛歊elease Readiness / Documentation Sync 鏈湴璇曡繍琛屾枃妗ｅ悓姝ラ樁娈点€?
褰撳墠鐘舵€佸垽鏂細

- 宸插畬鎴愬墠绔?Mock 鍘熷瀷銆?- 宸插畬鎴愬悗绔熀纭€鑱婂ぉ妯″潡銆?- 宸插畬鎴愬墠鍚庣鐪熷疄鑱婂ぉ鑱旇皟銆?- 宸插畬鎴?Mock Provider 鍜?OpenAI-compatible Provider 鐨勫熀纭€閰嶇疆涓庨敊璇鐞嗐€?- 宸插畬鎴?`backend/.env` 瀹夊叏閰嶇疆璇诲彇銆?- 宸插畬鎴?`backend/.env.example` 绀轰緥閰嶇疆銆?- 宸查€氳繃 DeepSeek OpenAI-compatible API 鑱旇皟 `deepseek-v4-flash`銆?- 宸插畬鎴愭渶灏忔枃浠朵笂浼犻棴鐜細鍓嶇閫夋嫨鏂囦欢銆佸悗绔繚瀛樺埌 `backend/uploads/`銆佸墠绔睍绀虹湡瀹炰笂浼犵粨鏋溿€?- 宸插畬鎴愭渶灏忔枃妗ｈВ鏋愰棴鐜細鍚庣璇诲彇 `backend/uploads/` 涓殑鏂囦欢锛岃В鏋?TXT / DOCX / 鍙鍒舵枃鏈瀷 PDF锛屽墠绔睍绀鸿В鏋愮姸鎬佸拰鏂囨湰棰勮銆?- 宸插寮?DOCX 琛ㄦ牸瑙ｆ瀽锛氫繚鐣欒鍒楀垎闅旓紝鏀寔琛ㄦ牸鍗曞厓鏍间腑鐨勬钀藉拰宓屽琛ㄦ牸鏂囨湰銆?- 宸插畬鎴愭枃鏈垏鍧楅棴鐜細鍚庣灏嗚В鏋愬叏鏂囧垏鎴?chunks锛屽墠绔睍绀?chunk 鏁伴噺鍜岄瑙堛€?- 宸插畬鎴?mock embedding 鍚戦噺鍖栭棴鐜細鍚庣涓?chunks 鐢熸垚绋冲畾 mock vectors锛屽墠绔睍绀?embedding 鏁伴噺銆佺淮搴﹀拰鍚戦噺棰勮銆?- 宸插畬鎴愮湡瀹?embedding provider 鎺ュ叆锛氬悗绔敮鎸?OpenAI-compatible Embedding Provider锛屽苟鍙€氳繃 `.env` 鍦?`mock` 涓?`openai` 闂村垏鎹€?- 宸插畬鎴愯亰澶╀晶鏂囦欢鎺ュ叆浣撻獙浼樺寲锛氳亰澶╄緭鍏ュ尯鍙互涓婁紶鏂囦欢锛屽苟鑷姩涓茶仈涓婁紶銆佽В鏋愩€佸垏鍧楀拰鍚戦噺鍖栨祦绋嬨€?- 宸插畬鎴愭湰鍦?VectorStore 闂幆锛氬悗绔皢 chunks 鍜?embeddings 淇濆瓨鍒?`backend/vector_store/` 鐨?JSON 绱㈠紩鏂囦欢锛屽墠绔睍绀?indexed 鐘舵€佸拰绱㈠紩鎽樿銆?- 宸插畬鎴愭渶灏?Retrieval 妫€绱㈤棴鐜細鍚庣鍩轰簬鏈湴 VectorStore 鍜?query embedding 璁＄畻 cosine similarity锛屽墠绔枃浠朵腑蹇冨睍绀?top_k chunks 鍜?score銆?- 宸插畬鎴愭渶灏?RAG 鍗曟枃浠堕棶绛旈棴鐜細鍚庣鍩轰簬 RetrievalService 杩斿洖鐨?top_k chunks 缁勮 RAG prompt锛岃皟鐢ㄧ幇鏈?LLMProvider 鐢熸垚绛旀锛屽墠绔枃浠朵腑蹇冨睍绀哄洖绛斿拰寮曠敤 chunks銆?- 宸插畬鎴愯亰澶╀晶 RAG 闂瓟浣撻獙浼樺寲锛氳亰澶╂涓婁紶鏂囦欢骞跺畬鎴?indexed 鍚庯紝褰撳墠瀵硅瘽浼氱粦瀹氭渶杩戜竴涓枃浠讹紝鐢ㄦ埛缁х画鎻愰棶鏃惰皟鐢?`/api/v1/files/{file_id}/ask`锛屽洖绛斾綔涓鸿亰澶╂秷鎭睍绀猴紝骞堕檮甯﹀紩鐢?chunks 鎽樿銆?- 宸插畬鎴?GitHub 鍒嗕韩鍓嶅熀纭€鏁寸悊锛氭柊澧?`README.md`锛屾洿鏂?`backend/.env.example` 鍜?`.gitignore`锛屾槑纭?API Key銆佷笂浼犳枃浠跺拰鏈湴鍚戦噺绱㈠紩涓嶅簲鎻愪氦銆?- 宸插畬鎴?v1.0.1 鍙戝竷鍓嶆鏌ワ細鍚庣缂栬瘧妫€鏌ャ€佸墠绔被鍨嬫鏌ャ€佹晱鎰熸枃浠跺拷鐣ユ鏌ュ拰鍩虹瀵嗛挜鎵弿鍧囧凡閫氳繃銆?- 宸插畬鎴愬寳杈癮gent UI 绠€鍖栦紭鍖栵細缁熶竴浜у搧鍛藉悕锛岃仛鐒︹€滃璇?+ 鏂囦欢涓績鈥濓紝闅愯棌褰撳墠鏆備笉瀹炵幇鐨?PPT 鍏ュ彛銆?- 宸插畬鎴?SQLite + SQLAlchemy 鏁版嵁搴撳熀纭€鎺ュ叆銆?- 宸叉柊澧?`files` 琛紝鐢ㄤ簬淇濆瓨鏂囦欢鍏冩暟鎹拰鍩虹澶勭悊鐘舵€併€?- 宸插畬鎴愪笂浼犳枃浠跺厓鏁版嵁鎸佷箙鍖栵細鏂囦欢淇濆瓨鍒?`backend/uploads/` 鍚庯紝浼氬悓姝ュ啓鍏?SQLite銆?- 宸叉柊澧?`GET /api/v1/files`锛岀敤浜庝粠鍚庣鎭㈠鏂囦欢鍒楄〃銆?- 宸插畬鎴愭枃浠朵腑蹇冨埛鏂版仮澶嶏細鍓嶇鏂囦欢涓績鎵撳紑鏃朵細浠庡悗绔鍙栫湡瀹炴枃浠跺垪琛ㄣ€?- 宸插畬鎴愭枃浠跺鐞嗙姸鎬佹寔涔呭寲锛氳В鏋愩€佸垏鍧椼€佸悜閲忓寲鍜屾湰鍦扮储寮曚繚瀛樻垚鍔熷悗锛屼細鏇存柊 SQLite 涓殑鏂囦欢澶勭悊鐘舵€併€?- 宸插畬鎴愭枃浠跺鐞嗗け璐ョ姸鎬佽褰曪細澶勭悊澶辫触鏃朵細灏介噺鍐欏叆 `failed` 鍜?`error_message`锛屽悓鏃朵繚鐣欏師濮嬮敊璇户缁繑鍥炵粰璋冪敤鏂广€?- 宸插畬鎴愯交閲?UI 涓板瘜锛氭枃浠朵腑蹇冩柊澧炵姸鎬佹瑙堬紝涓婁紶鍖恒€佺姸鎬佹爣绛俱€佺┖鐘舵€佸拰 RAG 寮曠敤鐗囨灞曠ず鏇撮潰鍚戠敤鎴枫€?- 宸插畬鎴愭枃浠朵腑蹇冭嚜鍔ㄥ鐞嗭細涓婁紶鍚庤嚜鍔ㄦ墽琛岃В鏋愩€佸垏鍧椼€乪mbedding 鍜屾湰鍦扮储寮曚繚瀛橈紝骞跺睍绀哄綋鍓嶅鐞嗛樁娈点€?- 宸叉柊澧?`DELETE /api/v1/files/{file_id}`锛氬垹闄ゅ搴斿師濮嬫枃浠躲€佹湰鍦?JSON 绱㈠紩鍜?SQLite 鏂囦欢璁板綍銆?- 宸插畬鎴愬墠绔湡瀹炲垹闄ら棴鐜細鍒犻櫎鍓嶇‘璁わ紝鎴愬姛鍚庡悓姝ユ枃浠跺垪琛紱鍒犻櫎褰撳墠浼氳瘽缁戝畾鏂囦欢鏃朵細瑙ｉ櫎 RAG 缁戝畾銆?- 宸叉柊澧?`chat_sessions` 琛紝鐢ㄤ簬淇濆瓨鑱婂ぉ浼氳瘽鍩虹淇℃伅鍜屽綋鍓嶄細璇濈粦瀹氭枃浠跺瓧娈点€?- 宸叉柊澧?`chat_messages` 琛紝鐢ㄤ簬淇濆瓨浼氳瘽娑堟伅姝ｆ枃鍜?RAG 寮曠敤绛夋秷鎭?metadata銆?- 宸叉柊澧?`ChatRepository`锛屾敮鎸佸垱寤轰細璇濄€佹煡璇細璇濆垪琛ㄣ€佹煡璇㈠崟涓細璇濄€佸垹闄や細璇濄€佸垱寤烘秷鎭拰鏌ヨ浼氳瘽娑堟伅銆?- 宸插畬鎴愬垹闄や細璇濇椂鍚屾鍒犻櫎鍏舵秷鎭殑 Repository 灞傚熀纭€鑳藉姏銆?- 宸叉柊澧?`ConversationService`锛岀敤浜庣紪鎺掍細璇濆垱寤恒€佸垪琛ㄦ煡璇€佹秷鎭煡璇€佷細璇濆垹闄ゅ拰鏂囦欢缁戝畾鏍￠獙銆?- 宸叉柊澧炰細璇?API锛歚GET /api/v1/chat/sessions`銆乣POST /api/v1/chat/sessions`銆乣DELETE /api/v1/chat/sessions/{session_id}`銆乣GET /api/v1/chat/sessions/{session_id}/messages`銆乣PATCH /api/v1/chat/sessions/{session_id}/file`銆?- 宸叉敮鎸佷細璇濈粦瀹氭垨瑙ｉ櫎鍗曚釜鏂囦欢锛岀粦瀹氭椂浼氭牎楠屾枃浠跺瓨鍦ㄤ笖鐘舵€佷负 `indexed`銆?- 宸叉敮鎸佸垹闄ゆ枃浠舵椂娓呴櫎鏁版嵁搴撲腑缁戝畾璇ユ枃浠剁殑浼氳瘽瀛楁銆?- 宸叉敮鎸?`POST /api/v1/chat` 鎼哄甫鍙€?`session_id` 鏃讹紝灏嗘櫘閫氳亰澶╃殑 user 鍜?assistant 娑堟伅鍐欏叆 `chat_messages`銆?- 宸叉敮鎸?`POST /api/v1/files/{file_id}/ask` 鎼哄甫鍙€?`session_id` 鏃讹紝灏?RAG 闂瓟鐨?user 鍜?assistant 娑堟伅鍐欏叆 `chat_messages`銆?- 宸叉敮鎸佸湪 RAG assistant 娑堟伅 `metadata_json` 涓繚瀛?`rag_file_id`銆乣rag_file_name`銆乣used_chunks` 鍜?`token_count`銆?- 宸插畬鎴愬墠绔細璇濇仮澶嶏細搴旂敤鍚姩鏃跺姞杞藉悗绔細璇濆垪琛紝鏃犱細璇濇椂鑷姩鍒涘缓榛樿鈥滄柊瀵硅瘽鈥濄€?- 宸插畬鎴愬墠绔巻鍙叉秷鎭仮澶嶏細鍒囨崲浼氳瘽鏃惰皟鐢ㄥ悗绔秷鎭?API锛屽苟灏嗘秷鎭仮澶嶅埌鑱婂ぉ绐楀彛銆?- 宸插畬鎴愬墠绔彂閫佹櫘閫氳亰澶╂惡甯﹀綋鍓?`session_id`锛屾秷鎭敱鍚庣鍐欏叆 `chat_messages`銆?- 宸插畬鎴愯亰澶╀晶 RAG 闂瓟鎼哄甫褰撳墠 `session_id`锛孯AG 鍥炵瓟鍜屽紩鐢ㄧ墖娈电敱鍚庣鍐欏叆娑堟伅 metadata銆?- 宸插畬鎴愯亰澶╀晶鏂囦欢 indexed 鍚庣粦瀹氬綋鍓嶄細璇濇枃浠讹紝鍒锋柊鍚庡彲鏍规嵁 `bound_file_id` 鎭㈠褰撳墠 RAG 鏂囦欢鎻愮ず銆?- 宸插畬鎴愬墠绔垹闄や細璇濊皟鐢ㄥ悗绔?API锛屽苟鍚屾绉婚櫎鏈湴浼氳瘽鍜屾秷鎭紦瀛樸€?- 宸插畬鎴愯嚜鍔ㄤ細璇濇爣棰橈細褰撴爣棰樹粛涓洪粯璁も€滄柊瀵硅瘽鈥濇椂锛屾櫘閫氳亰澶╂垨 RAG 闂瓟鎴愬姛鍚庝細浣跨敤鐢ㄦ埛绗竴鏉℃秷鎭敓鎴愮畝鐭爣棰樸€?- 鑷姩鏍囬涓嶈皟鐢ㄩ澶?LLM锛屼粎浣跨敤鏈湴瑙勫垯锛氬幓闄ゆ崲琛屽拰澶氫綑绌烘牸锛屾渶闀?24 涓瓧绗︼紝瓒呭嚭杩藉姞 `...`銆?- 宸蹭慨姝ｆ櫘閫氳亰澶╃郴缁熸彁绀猴細AI 韬唤缁熶竴涓衡€滃寳杈癮gent鈥濓紝涓嶅啀鑷О WorkBuddy锛屼篃涓嶅０鏄庢湭瀹炵幇鐨勪紒涓氱郴缁熻兘鍔涖€?- 宸插鍔犲墠绔爣棰樹箰瑙傛洿鏂帮細鍙戦€佹秷鎭悗渚ц竟鏍忎細绔嬪嵆鏄剧ず鏈湴鐢熸垚鏍囬锛屽悗绔粛璐熻矗鏈€缁堟寔涔呭寲銆?- 宸插畬鎴愭櫘閫氳亰澶╁熀纭€涓婁笅鏂囩獥鍙ｏ細`POST /api/v1/chat` 鎼哄甫 `session_id` 鏃讹紝鍚庣浼氳鍙栧綋鍓嶄細璇濇渶杩?6 鏉″巻鍙叉秷鎭苟浼犲叆 LLM銆?- 宸插鍔犱笂涓嬫枃鎴柇绛栫暐锛氭瘡鏉″巻鍙叉秷鎭渶澶氫繚鐣?1200 涓瓧绗︼紝瓒呭嚭鍚庤拷鍔?`...`銆?- 宸插畬鎴?RAG 鏂囦欢闂瓟杩炵画杩介棶鍩虹鑳藉姏锛歚POST /api/v1/files/{file_id}/ask` 鎼哄甫 `session_id` 鏃讹紝鍚庣浼氳鍙栧綋鍓嶄細璇濇渶杩?6 鏉″巻鍙叉秷鎭紝骞朵綔涓衡€滄渶杩戝璇濅笂涓嬫枃鈥濆姞鍏?RAG prompt銆?- RAG 妫€绱粛鍩轰簬褰撳墠鐢ㄦ埛闂鎵ц锛屼笉鏀瑰彉 Retrieval銆乂ectorStore 鍜?Embedding 涓婚摼璺€?- 鏃?`session_id` 鐨勬櫘閫氳亰澶╁拰 RAG 闂瓟浠嶄繚鎸佸崟杞皟鐢ㄣ€?- 宸插畬鎴?GitHub Safety Check锛氱‘璁?`backend/.env`銆乣backend/uploads/`銆乣backend/vector_store/`銆乣backend/data/`銆乣.claude/` 绛夋晱鎰熻矾寰勬湭琚?Git 璺熻釜锛屽苟琛ュ厖鍙戝竷鍖呫€佸帇缂╁寘鍜?SQLite 鏂囦欢蹇界暐瑙勫垯銆?- 宸叉柊澧?Windows 鏈湴璇曡繍琛岃剼鏈細
  - `scripts/check-local.ps1`
  - `scripts/start-local.ps1`
  - `scripts/stop-local.ps1`
- 鏈湴鑴氭湰鍥哄畾浣跨敤鍚庣绔彛 `8000` 鍜屽墠绔鍙?`5173`锛屽仠姝㈣剼鏈彧澶勭悊鐩戝惉鍥哄畾绔彛鐨勮繘绋嬶紝涓嶆寜杩涚▼鍚嶆壒閲忕粨鏉?Python 鎴?Node銆?- 宸插悓姝?README锛氬綋鍓嶅姛鑳姐€丼QLite 鎸佷箙鍖栥€佹湰鍦拌剼鏈€丮ock / 鐪熷疄 API 閰嶇疆銆佹枃浠堕棶绛旀祦绋嬪拰瀹夊叏杈圭晫宸蹭笌褰撳墠浠ｇ爜鐘舵€佸榻愩€?- 宸蹭慨姝?`backend/.env.example` 涓殑鏃у懡鍚嶏紝`APP_NAME` 涓嶅啀浣跨敤 WorkBuddy銆?- 宸叉柊澧?`docs/local_trial_guide.md`锛岀敤浜庢寚瀵煎彲淇′换璇曠敤鑰呭湪 Windows 鏈湴杩愯椤圭洰銆?- 宸叉柊澧?`docs/troubleshooting.md`锛岃鐩栫鍙ｅ崰鐢ㄣ€佸墠绔墦涓嶅紑銆佸悗绔笉鍙敤銆乣Failed to fetch`銆丄PI Key銆丒mbedding銆佹枃浠堕棶绛斿拰涓存椂鍏綉鍦板潃绛夊父瑙侀棶棰樸€?
## 2. 褰撳墠 v1.0 鐩爣

v1.0 鐩爣鏄瀯寤轰竴涓嫭绔嬬綉椤电増 AI 鍔╂墜銆?
鏍稿績鑳藉姏锛?
- AI 鑱婂ぉ銆?- 鏂囦欢涓婁紶銆?- RAG 鐭ヨ瘑闂瓟銆?- AI 鏁版嵁鍒嗘瀽瑙勫垝鑳藉姏銆?
鏀拺鑳藉姏锛?
- LLM API 璋冪敤銆?- 鏂囨。瑙ｆ瀽銆?- Embedding銆?- 鍚戦噺妫€绱€?
褰撳墠 v1.0 涓嶅寘鍚細

- 閽夐拤銆?- 浼佷笟鐧诲綍銆?- 浼佷笟鏉冮檺銆?- PPT 鐢熸垚銆?- 澶氱鎴枫€?- 寰湇鍔°€?- 澶嶆潅浠诲姟闃熷垪銆?
## 3. 宸插畬鎴愭ā鍧?
### 3.1 鍓嶇鍩虹鍘熷瀷

鐩綍锛歚frontend/`

宸插畬鎴愶細

- React + Vite 鍓嶇宸ョ▼銆?- 鍩虹椤甸潰甯冨眬銆?- 鐧诲綍椤?Mock銆?- 渚ц竟鏍忋€?- 鑱婂ぉ鍖恒€?- 娑堟伅杈撳叆妗嗐€?- 娑堟伅娓叉煋缁勪欢銆?- 鏂囦欢涓績 UI銆?- 鏂囦欢涓績鐘舵€佹瑙堝尯銆?- 鏂囦欢涓績涓婁紶宸ヤ綔鍙板紡缁勪欢銆?- 鏂囦欢涓績涓婁紶鍚庤嚜鍔ㄨВ鏋愩€佸垏鍧椼€佸悜閲忓寲鍜屼繚瀛樼储寮曘€?- 鏂囦欢鑷姩澶勭悊闃舵涓庡け璐ュ師鍥犲睍绀恒€?- 鏂囦欢鐪熷疄鍒犻櫎涓庡垹闄ょ‘璁ゃ€?- 鏂囦欢瑙ｆ瀽瑙﹀彂鍏ュ彛銆?- 鏂囦欢瑙ｆ瀽缁撴灉棰勮銆?- 鏂囦欢鍒囧潡瑙﹀彂鍏ュ彛銆?- chunk 鏁伴噺鍜?chunk 棰勮灞曠ず銆?- 鏂囦欢鍚戦噺鍖栬Е鍙戝叆鍙ｃ€?- embedding 鏁伴噺銆佺淮搴﹀拰鍚戦噺棰勮灞曠ず銆?- 鑱婂ぉ杈撳叆鍖烘枃浠朵笂浼犲叆鍙ｃ€?- 鑱婂ぉ渚ф枃浠惰嚜鍔ㄥ鐞嗙姸鎬佸睍绀恒€?- 鑱婂ぉ渚ф枃浠惰嚜鍔ㄦ湰鍦扮储寮曚繚瀛樸€?- 鑱婂ぉ渚ф渶杩?indexed 鏂囦欢缁戝畾銆?- 鑱婂ぉ娑堟伅娴佷腑鐨?RAG 鍥炵瓟灞曠ず銆?- RAG 鍥炵瓟寮曠敤 chunks 鎽樿灞曠ず銆?- RAG 鍥炵瓟鍙傝€冪墖娈靛睍绀轰紭鍖栥€?- 鏂囦欢涓績鏈湴绱㈠紩淇濆瓨瑙﹀彂鍏ュ彛銆?- indexed 鐘舵€佸拰鏈湴绱㈠紩璺緞鎽樿灞曠ず銆?- 鏂囦欢涓績妫€绱㈡祴璇曞叆鍙ｃ€?- query銆乻core 鍜?top_k chunk 鍐呭灞曠ず銆?- 鍖楄景agent 鍝佺墝鐣岄潰銆?- Zustand 鐘舵€佺鐞嗐€?- 鏈湴 Mock API锛歚frontend/src/api/mock.ts`銆?- 鑱婂ぉ API Client锛歚frontend/src/api/chatApi.ts`銆?- 鏂囦欢涓婁紶 API Client锛歚frontend/src/api/fileApi.ts`銆?
褰撳墠闄愬埗锛?
- 鍓嶇鑱婂ぉ宸茬粡璋冪敤鍚庣 `/api/v1/chat`銆?- 鍓嶇鏂囦欢涓婁紶宸茬粡璋冪敤鍚庣 `/api/v1/files`銆?- 鏂囦欢涓績涓庤亰澶╀晶涓婁紶鍧囦細鑷姩涓茶仈瀹屾暣鏂囦欢澶勭悊 API銆?- 鍓嶇鏂囦欢瑙ｆ瀽宸茬粡璋冪敤鍚庣 `/api/v1/files/{file_id}/parse`銆?- 鍓嶇鏂囦欢鍒囧潡宸茬粡璋冪敤鍚庣 `/api/v1/files/{file_id}/chunks`銆?- 鍓嶇鏂囦欢鍚戦噺鍖栧凡缁忚皟鐢ㄥ悗绔?`/api/v1/files/{file_id}/embeddings`銆?- 鍓嶇鏂囦欢鏈湴绱㈠紩淇濆瓨宸茬粡璋冪敤鍚庣 `/api/v1/files/{file_id}/vector-store`銆?- 鍓嶇鏂囦欢妫€绱㈡祴璇曞凡缁忚皟鐢ㄥ悗绔?`/api/v1/files/{file_id}/retrieve`銆?- 鑱婂ぉ渚ф枃浠朵笂浼犱細鑷姩涓茶仈 `/api/v1/files`銆乣/api/v1/files/{file_id}/parse`銆乣/api/v1/files/{file_id}/chunks`銆乣/api/v1/files/{file_id}/embeddings` 鍜?`/api/v1/files/{file_id}/vector-store`銆?- 鑱婂ぉ渚у瓨鍦ㄦ渶杩?indexed 鏂囦欢鏃讹紝鐢ㄦ埛鍙戦€佹秷鎭細璋冪敤 `/api/v1/files/{file_id}/ask`锛涙病鏈夊綋鍓嶆枃浠舵椂浠嶈皟鐢?`/api/v1/chat`銆?- 鍓嶇浼氳瘽鍜屽巻鍙叉秷鎭粛浣跨敤 Mock / 鍓嶇鍐呭瓨鐘舵€併€?- 鏂囦欢涓績鍒濆鏂囦欢鍒楄〃宸插紑濮嬩粠鍚庣 `GET /api/v1/files` 鎭㈠銆?- 鍓嶇鏂囦欢鍒犻櫎宸茬粡璋冪敤鍚庣 `DELETE /api/v1/files/{file_id}`銆?- 瑙ｆ瀽鏂囨湰棰勮銆佸瓧绗︽暟鍜屽悇澶勭悊闃舵鎽樿鍙粠 SQLite 鎭㈠锛沜hunk 涓?embedding 鐨勮缁嗛瑙堜粛鍙瓨鍦ㄤ簬褰撳墠鍓嶇鐘舵€佹垨鏈湴 JSON 绱㈠紩涓€?- chunk 涓?embedding 鍐呭宸茬粡鍙互鍐欏叆鏈湴 JSON 绱㈠紩锛岃В鏋愩€佸垏鍧椼€乪mbedding 鍜?indexed 鐘舵€佷篃鍙互浠?SQLite 鎭㈠銆?
### 3.2 鍚庣鍩虹鑱婂ぉ妯″潡

鐩綍锛歚backend/`

宸插畬鎴愶細

- FastAPI 鍚庣宸ョ▼楠ㄦ灦銆?- 鍋ュ悍妫€鏌ユ帴鍙ｏ細`GET /health`銆?- 鍩虹鑱婂ぉ鎺ュ彛锛?  - `POST /chat`
  - `POST /api/v1/chat`
- 鑱婂ぉ璇锋眰鍜屽搷搴?Schema銆?- `ChatService` 鑱婂ぉ涓氬姟缂栨帓銆?- `LLMService` LLM Provider 閫夋嫨銆?- `LLMProvider` 鎶借薄鎺ュ彛銆?- `MockLLMProvider` 鏈湴寮€鍙戞ā鍨嬨€?- `OpenAIProvider` OpenAI-compatible 璋冪敤瀹炵幇銆?- 缁熶竴鎴愬姛鍝嶅簲宸ュ叿銆?- 搴旂敤绾ч敊璇被鍨嬨€?- LLM 閰嶇疆閿欒鍜岃皟鐢ㄩ敊璇殑缁熶竴 JSON 鍝嶅簲銆?- `backend/.env` 鏈湴鏁忔劅閰嶇疆璇诲彇銆?- `backend/.env.example` 绀轰緥閰嶇疆銆?
褰撳墠闄愬埗锛?
- `/chat` 鏄复鏃跺吋瀹硅矾寰勶紝姝ｅ紡涓氬姟璺緞搴斾紭鍏堜娇鐢?`/api/v1/chat`銆?- LLM 閿欒澶勭悊宸茶鐩?v0.2 鐨勯厤缃敊璇拰 Provider 璋冪敤閿欒锛屼絾灏氭湭瑕嗙洊鍏ㄥ眬鏈煡寮傚父銆?- API 灞傚綋鍓嶇洿鎺ュ疄渚嬪寲 Service锛屽悗缁渶瑕佸紩鍏ヤ緷璧栨敞鍏ャ€?- 鐩墠浠ユ墜鍔ㄩ獙璇佸拰绫诲瀷妫€鏌ヤ负涓伙紝灏氭湭寤虹珛鑷姩鍖栨祴璇曠洰褰曘€?
### 3.3 鍚庣鍩虹鏂囦欢妯″潡

鐩綍锛歚backend/`

宸插畬鎴愶細

- 鏂囦欢涓婁紶鎺ュ彛锛歚POST /api/v1/files`銆?- `UploadedFileResponse` 鏂囦欢涓婁紶鍝嶅簲 Schema銆?- `FileService` 鏂囦欢涓婁紶涓氬姟杈圭晫銆?- 涓婁紶鏂囦欢鎵╁睍鍚嶆牎楠屻€?- 涓婁紶鏂囦欢澶у皬闄愬埗銆?- 涓婁紶鏂囦欢淇濆瓨鍒版湰鍦?`backend/uploads/`銆?- 鏂囦欢鐩稿叧閿欒绫诲瀷锛?  - `FileValidationError`
  - `FileStorageError`
- 涓婁紶閰嶇疆锛?  - `UPLOAD_DIR`
  - `MAX_UPLOAD_SIZE_MB`
  - `ALLOWED_UPLOAD_EXTENSIONS`
- 鏂囦欢涓婁紶渚濊禆锛歚python-multipart`銆?- 鏂囦欢瑙ｆ瀽鎺ュ彛锛歚POST /api/v1/files/{file_id}/parse`銆?- `DocumentParserService` 鏂囨。瑙ｆ瀽涓氬姟杈圭晫銆?- TXT 鏂囨湰瑙ｆ瀽銆?- DOCX 娈佃惤鍜屽熀纭€琛ㄦ牸鏂囨湰瑙ｆ瀽銆?- DOCX 琛ㄦ牸琛屽垪缁撴瀯鍖栨枃鏈緭鍑恒€?- DOCX 宓屽琛ㄦ牸鏂囨湰瑙ｆ瀽銆?- 鍙鍒舵枃鏈瀷 PDF 瑙ｆ瀽瀹炵幇銆?- 鏂囦欢鍒囧潡鎺ュ彛锛歚POST /api/v1/files/{file_id}/chunks`銆?- `ChunkService` 鏂囨湰鍒囧潡涓氬姟杈圭晫銆?- 瀛楃鏁板垏鍧楃瓥鐣ワ細`chunk_size=800`锛宍chunk_overlap=120`銆?- chunk 棰勮鍝嶅簲瀛楁锛?  - `chunk_id`
  - `file_id`
  - `chunk_index`
  - `content`
  - `char_count`
- 鏂囦欢鍚戦噺鍖栨帴鍙ｏ細`POST /api/v1/files/{file_id}/embeddings`銆?- `EmbeddingService` embedding 涓氬姟杈圭晫銆?- `EmbeddingProvider` 鎶借薄鎺ュ彛銆?- `MockEmbeddingProvider` 绋冲畾 mock embedding 瀹炵幇銆?- mock embedding 榛樿缁村害锛歚16`銆?- embedding 鍝嶅簲瀛楁锛?  - `embedding_count`
  - `embedding_dimension`
  - `embedding_preview`
- 鏈湴鍚戦噺绱㈠紩鎺ュ彛锛?  - `POST /api/v1/files/{file_id}/vector-store`
  - `GET /api/v1/files/{file_id}/vector-store`
- `VectorStoreService` 鏈湴鍚戦噺瀛樺偍涓氬姟杈圭晫銆?- 鏈湴绱㈠紩鐩綍锛歚backend/vector_store/`銆?- 鏈湴绱㈠紩鏂囦欢缁撴瀯鍖呭惈锛?  - `file_id`
  - `chunk_id`
  - `chunk_index`
  - `content`
  - `char_count`
  - `embedding`
  - `embedding_dimension`
  - `embedding_model`
  - `created_at`
- 鏂囦欢妫€绱㈡帴鍙ｏ細`POST /api/v1/files/{file_id}/retrieve`銆?- `RetrievalService` 鏈湴妫€绱笟鍔¤竟鐣屻€?- 妫€绱㈢粨鏋滃搷搴斿瓧娈靛寘鍚細
  - `query`
  - `top_k`
  - `result_count`
  - `results[].chunk_id`
  - `results[].chunk_index`
  - `results[].content`
  - `results[].score`
- 鏂囨。瑙ｆ瀽鍝嶅簲瀛楁锛?  - `file_id`
  - `status`
  - `extension`
  - `text_preview`
  - `char_count`
- 鏂囨。瑙ｆ瀽鐩稿叧閿欒绫诲瀷锛?  - `DocumentNotFoundError`
  - `DocumentParseError`
- 鏂囨。瑙ｆ瀽渚濊禆锛?  - `python-docx`
  - `pypdf`

褰撳墠闄愬埗锛?
- 鏂囦欢鍏冩暟鎹凡鍦ㄤ笂浼犳垚鍔熷悗鍐欏叆 SQLite銆?- 鏈嶅姟閲嶅惎鎴栭〉闈㈠埛鏂板悗锛屽墠绔枃浠朵腑蹇冨彲浠ヤ粠鍚庣鎭㈠鏂囦欢鍩虹鍒楄〃銆?- 鏂囨。瑙ｆ瀽鐘舵€併€佹枃鏈瑙堝拰瀛楃鏁板凡鍐欏叆鏁版嵁搴撱€?- 鏂囨湰鍒囧潡鏁伴噺宸插啓鍏ユ暟鎹簱銆?- embedding 鏁伴噺銆佺淮搴﹀拰妯″瀷宸插啓鍏ユ暟鎹簱銆?- 鏈湴绱㈠紩鐘舵€佸拰绱㈠紩璺緞宸插啓鍏ユ暟鎹簱銆?- 鏆備笉鏀寔鏂囦欢涓嬭浇锛涙枃浠跺垹闄ゅ凡鏀寔鍘熷鏂囦欢銆丣SON 绱㈠紩鍜屾暟鎹簱璁板綍鐨勫悓姝ユ竻鐞嗐€?- 鏆備笉鏀寔 OCR銆佺梾姣掓壂鎻忋€佸璞″瓨鍌ㄣ€?- PDF 瑙ｆ瀽浠呮敮鎸佸彲澶嶅埗鏂囨湰鍨?PDF锛屼笉鏀寔鎵弿浠?OCR銆?- chunk 鍜?embedding 缁撴灉宸茬粡鍙互鍐欏叆鏈湴 JSON VectorStore锛屼絾灏氭湭鍐欏叆鏁版嵁搴撴垨 pgvector銆?- 褰撳墠鍒囧潡绛栫暐鏄瓧绗︽暟鍒囧潡锛屼笉鏄?tokenizer-aware 鎴?semantic chunk銆?- embedding 缁撴灉灏氭湭鍐欏叆鍚戦噺鏁版嵁搴撱€?- 褰撳墠鍙娇鐢?mock 鎴?OpenAI-compatible embedding锛沵ock 妯″紡浠嶄笉浠ｈ〃鐪熷疄璇箟銆?
### 3.4 椤圭洰鏂囨。

鐩綍锛歚docs/`

宸插畬鎴愶細

- 鏋舵瀯璇勫鏂囨。銆?- 寮€鍙戣鍒掓枃妗ｃ€?- 鍚庣璁捐鏂囨。銆?- 鑱婂ぉ妯″潡璇存槑鏂囨。銆?- v0.2 LLM 鑱婂ぉ闆嗘垚璁″垝銆?- v0.2 鑱婂ぉ闆嗘垚鎶ュ憡銆?- v0.2.1 DeepSeek 閰嶇疆鎶ュ憡銆?- v0.3 鏂囦欢涓婁紶璁″垝銆?- v0.3 鏂囦欢涓婁紶鎶ュ憡銆?- v0.4 鏂囨。瑙ｆ瀽璁″垝銆?- v0.4 鏂囨。瑙ｆ瀽鎶ュ憡銆?- v0.4.1 DOCX 琛ㄦ牸瑙ｆ瀽澧炲己鎶ュ憡銆?- v0.5 鏂囨湰鍒囧潡璁″垝銆?- v0.5 鏂囨湰鍒囧潡鎶ュ憡銆?- v0.6 Embedding 鎶借薄涓庤皟鐢ㄨ鍒掋€?- v0.6 Embedding 鎶借薄涓庤皟鐢ㄦ姤鍛娿€?- v0.6.1 鑱婂ぉ渚ф枃浠舵帴鍏ヤ綋楠屼紭鍖栬鍒掋€?- v0.6.1 鑱婂ぉ渚ф枃浠舵帴鍏ヤ綋楠屼紭鍖栨姤鍛娿€?- v0.7 VectorStore 鍚戦噺瀛樺偍璁″垝銆?- v0.7 VectorStore 鍚戦噺瀛樺偍鎶ュ憡銆?- v0.8 Retrieval 妫€绱㈡湇鍔¤鍒掋€?- v0.8 Retrieval 妫€绱㈡湇鍔℃姤鍛娿€?- v0.4.2 鍖楄景agent UI 绠€鍖栦紭鍖栥€?- v1.0 璺嚎鍥俱€?- v1.1.4 鏂囦欢鐢熷懡鍛ㄦ湡闂幆鎶ュ憡銆?- 鏂囨。鍚屾瀹℃煡鎶ュ憡銆?
褰撳墠闄愬埗锛?
- 閮ㄥ垎鍘嗗彶鏂囨。浠嶆湭鍚屾鍒板綋鍓?v1.0 鑼冨洿銆?- 鍚庣画闇€瑕佺户缁悓姝ユ灦鏋勩€佹ā鍧椼€丄PI 鍜屾暟鎹簱璁捐鏂囨。銆?
## 4. 姝ｅ湪寮€鍙戞ā鍧?
褰撳墠姝ｅ湪鎺ㄨ繘鐨勬ā鍧楋細

- v1.4 Release Readiness 鏈湴璇曡繍琛屾暣鐞嗐€?- README銆乣.env.example`銆佹湰鍦拌瘯杩愯鎸囧崡鍜屽父瑙侀棶棰樻枃妗ｅ悓姝ャ€?
涓嬩竴姝ユ渶閫傚悎鎺ㄨ繘锛?
- 瀵?v1.4 鏂囨。鍜岃剼鏈繘琛屾渶缁堟牳瀵广€?- 鍚庣画杩涘叆 GitHub 鍙戝竷鍓嶆敹灏炬鏌ユ垨姝ｅ紡閮ㄧ讲鍑嗗瑙勫垝銆?
## 5. 鏈紑濮嬫ā鍧?
褰撳墠灏氭湭寮€濮嬪疄鐜帮細

- 浼氳瘽鎽樿銆?- 鍘嗗彶娑堟伅璇箟妫€绱€?- 鏁版嵁搴撹縼绉汇€?- 鍏ㄥ眬寮傚父澶勭悊銆?- 璇锋眰鏃ュ織鍜?request id銆?- AI 鏁版嵁鍒嗘瀽鏈嶅姟銆?- 缁撴瀯鍖栨暟鎹笂浼犮€?- 鑷姩鍥捐〃鐢熸垚銆?- 鏁版嵁鑷劧璇█瑙ｉ噴銆?
## 6. 褰撳墠鎶€鏈爤

### 6.1 宸茶惤鍦版妧鏈爤

鍓嶇锛?
- React 18銆?- TypeScript銆?- Vite銆?- Ant Design 5銆?- Zustand銆?- dayjs銆?
鍚庣锛?
- Python銆?- FastAPI銆?- Pydantic銆?- python-dotenv銆?- python-multipart銆?- python-docx銆?- pypdf銆?- SQLite銆?- SQLAlchemy銆?- OpenAI-compatible HTTP 璋冪敤銆?- 鏈湴 Mock LLM Provider銆?- 鏈湴鏂囦欢瀛樺偍銆?
宸ョ▼锛?
- Git銆?- npm銆?- TypeScript 绫诲瀷妫€鏌ャ€?- Python 缂栬瘧妫€鏌ャ€?
### 6.2 灏氭湭钀藉湴鎶€鏈爤

浠ヤ笅鎶€鏈皻鏈湪褰撳墠浠ｇ爜涓湡姝ｅ疄鐜帮細

- 鏁版嵁搴撹縼绉汇€?- 鍚戦噺鏁版嵁搴撱€?- 鍚庣鑷姩鍖栨祴璇曟鏋躲€?
## 7. 褰撳墠浠ｇ爜鐘舵€佺粨璁?
褰撳墠椤圭洰涓嶆槸瀹屾暣鍙敤鐨?AI 搴旂敤 MVP锛岃€屾槸锛?
**鍖楄景agent 绠€娲?UI + 鏂囦欢涓績杞婚噺宸ヤ綔鍙颁綋楠?+ 鍚庣鐪熷疄 LLM 鑱婂ぉ闂幆 + 鍚庣鏈湴鏂囦欢涓婁紶闂幆 + 鏂囦欢鍏冩暟鎹?SQLite 鎸佷箙鍖?+ 鏂囦欢澶勭悊鐘舵€佹寔涔呭寲 + 鏂囦欢鍒楄〃鍒锋柊鎭㈠ + 鏈€灏忔枃妗ｈВ鏋愰棴鐜?+ 鏂囨湰鍒囧潡闂幆 + Mock / OpenAI-compatible embedding 闂幆 + 鏈湴 VectorStore 闂幆 + Retrieval 妫€绱㈤棴鐜?+ 鍗曟枃浠?RAG 闂瓟闂幆 + 鑱婂ぉ渚?RAG 闂瓟浣撻獙 + 鏅€氳亰澶╁熀纭€涓婁笅鏂囩獥鍙?+ RAG 鏂囦欢闂瓟杩炵画杩介棶 + GitHub 瀹夊叏妫€鏌?+ Windows 鏈湴璇曡繍琛岃剼鏈?+ 鏈湴璇曡繍琛屾枃妗ｃ€?*

椤圭洰宸茬粡鍏峰缁х画婕旇繘鐨勫熀纭€杈圭晫锛?
- 鍓嶇鏈夎仛鐒﹀璇濆拰鏂囦欢涓績鐨勪富瑕侀〉闈笌鐘舵€佺鐞嗐€?- 鍚庣鏈?API銆丼chema銆丼ervice銆丩LM Provider銆丗ileService 鐨勫熀鏈垎灞傘€?- 鍚庣宸叉柊澧?DB 鍜?Repository 鍒嗗眰锛屽紑濮嬫壙鎺ユ枃浠跺厓鏁版嵁鎸佷箙鍖栥€?- LLM 璋冪敤宸茬粡閫氳繃 Provider 鎶借薄棰勭暀鎵╁睍鐐广€?- 鍓嶇鑱婂ぉ宸茬粡鎺ュ叆鍚庣 `/api/v1/chat`銆?- 鍚庣宸茬粡閫氳繃 `.env` 瀹夊叏璇诲彇 DeepSeek API 閰嶇疆銆?- 鏂囦欢涓婁紶宸茬粡閫氳繃 `FileService` 棰勭暀鍚庣画鏂囨。瑙ｆ瀽銆丷AG 绱㈠紩鍜屾暟鎹簱鎸佷箙鍖栧叆鍙ｃ€?- 鏂囨。瑙ｆ瀽宸茬粡閫氳繃 `DocumentParserService` 棰勭暀鍚庣画 chunk銆乪mbedding 鍜?RAG 鍏ュ彛銆?- 鏂囨湰鍒囧潡宸茬粡閫氳繃 `ChunkService` 棰勭暀鍚庣画 embedding 鍜屽悜閲忔绱㈠叆鍙ｃ€?- Embedding 宸茬粡閫氳繃 `EmbeddingService` 鍜?`EmbeddingProvider` 鏀寔 MockEmbeddingProvider 涓?OpenAI-compatible Embedding Provider 鍒囨崲銆?- VectorStore 宸茬粡閫氳繃 `VectorStoreService` 棰勭暀鍚庣画 RetrievalService 鍜?pgvector 鏇挎崲鍏ュ彛銆?- Retrieval 宸茬粡閫氳繃 `RetrievalService` 棰勭暀鍚庣画 RagService 鍜屾枃浠堕棶绛斿叆鍙ｃ€?- RAG 宸茬粡閫氳繃 `RagService` 澶嶇敤 RetrievalService 鍜?LLMProvider锛屽疄鐜板崟鏂囦欢闂瓟鍏ュ彛銆?- 鑱婂ぉ渚ф枃浠朵笂浼犲凡缁忛€氳繃鍓嶇 `fileStore.ingestFile()` 涓茶仈鐜版湁鏂囦欢澶勭悊 API 骞朵繚瀛樻湰鍦扮储寮曪紱绱㈠紩瀹屾垚鍚庯紝褰撳墠瀵硅瘽鍙洿鎺ュ熀浜庢渶杩戜竴涓?indexed 鏂囦欢鎻愰棶銆?
褰撳墠鏈€澶х己鍙ｆ槸锛?
- RAG 褰撳墠浠呮敮鎸佹渶杩戜竴涓?indexed 鏂囦欢鐨勫崟鏂囦欢闂瓟銆?- 鏂囦欢鐢熷懡鍛ㄦ湡宸茬粡闂幆锛岃亰澶╀細璇濆拰娑堟伅琛ㄥ凡鍒涘缓锛孯epository 灞傚熀纭€璇诲啓鑳藉姏宸插畬鎴愩€?- 鑱婂ぉ浼氳瘽 API銆佹櫘閫氳亰澶?RAG 娑堟伅钀藉簱銆佸墠绔埛鏂版仮澶嶃€佸綋鍓嶆枃浠剁粦瀹氬墠绔帴鍏ャ€佽嚜鍔ㄤ細璇濇爣棰樸€佹櫘閫氳亰澶╁熀纭€涓婁笅鏂囩獥鍙ｃ€丷AG 鏂囦欢闂瓟杩炵画杩介棶銆佹湰鍦拌瘯杩愯鑴氭湰鍜屾湰鍦拌瘯杩愯鏂囨。宸插畬鎴愩€?- AI 鏁版嵁鍒嗘瀽浠嶅彧鏄鍒掕兘鍔涳紝灏氭湭杩涘叆瀹炵幇銆?
鍥犳锛屼笅涓€闃舵搴斿 v1.4 Release Readiness 鍋氭渶缁堟牳瀵瑰拰 GitHub 鍙戝竷鍓嶆敹灏炬鏌ワ紝鍐嶅喅瀹氭槸鍚﹁繘鍏ユ寮忛儴缃插噯澶囥€佷細璇濇憳瑕併€佸巻鍙叉秷鎭涔夋绱㈡垨 AI 鏁版嵁鍒嗘瀽瑙勫垝瀹炵幇銆侫I 鏁版嵁鍒嗘瀽缁х画淇濈暀瑙勫垝杈圭晫锛屼笉鎸ゅ崰褰撳墠涓婚摼璺€?
