/**
 * 性格色彩測驗題庫 — 100 題
 * type: 'regular' | 'paired' | 'social'
 * pairId: 配對題組 ID (1-10)
 * options[].color: 'red' | 'blue' | 'yellow' | 'green'
 * options[].sd: true = 社會期望選項 (僅 social 題)
 */
const QUESTION_BANK = [
    // ===== 正規題 1-35 =====
    {
        id: 1, type: 'regular', text: '關於人生觀，你內心更傾向：', options: [
            { text: '希望有各式各樣的體驗，想法多元不設限', color: 'yellow' },
            { text: '在合理基礎上謹慎確定目標，堅定執行', color: 'blue' },
            { text: '更在乎取得一切可能的成就', color: 'red' },
            { text: '不喜歡風險，享受穩定的現狀', color: 'green' }
        ]
    },
    {
        id: 2, type: 'regular', text: '如果去爬山旅遊，下山時你最可能選擇：', options: [
            { text: '走新路線，覺得更好玩有趣', color: 'yellow' },
            { text: '走原路線，因為安全穩妥', color: 'blue' },
            { text: '走新路線，因為想挑戰困難', color: 'red' },
            { text: '走原路線，因為方便省心', color: 'green' }
        ]
    },
    {
        id: 3, type: 'regular', text: '說話時你更看重：', options: [
            { text: '感覺效果，有時略顯誇張', color: 'yellow' },
            { text: '描述精確，有時略顯冗長', color: 'blue' },
            { text: '達成結果，有時過於直接', color: 'red' },
            { text: '人際感受，有時不願講真話', color: 'green' }
        ]
    },
    {
        id: 4, type: 'regular', text: '大多數時候，你內心更想要：', options: [
            { text: '刺激，常冒出新點子，喜歡與眾不同', color: 'yellow' },
            { text: '安全，頭腦冷靜，不易衝動', color: 'blue' },
            { text: '挑戰，有強烈的「贏」的慾望', color: 'red' },
            { text: '穩定，滿足所擁有的，很少羨慕別人', color: 'green' }
        ]
    },
    {
        id: 5, type: 'regular', text: '你認為自己在情感上的基本特點是：', options: [
            { text: '情緒多變，經常波動', color: 'yellow' },
            { text: '外表自我抑制強，但內心感情起伏大', color: 'blue' },
            { text: '感情不拖泥帶水，不穩定時容易發怒', color: 'red' },
            { text: '天性情緒四平八穩', color: 'green' }
        ]
    },
    {
        id: 6, type: 'regular', text: '在控制欲方面，你覺得自己：', options: [
            { text: '沒有控制欲，但有感染帶動他人的熱情', color: 'yellow' },
            { text: '用規則來保持對自己和他人的要求', color: 'blue' },
            { text: '內心有控制欲，希望別人配合我', color: 'red' },
            { text: '沒興趣影響別人，也不愿被人控制', color: 'green' }
        ]
    },
    {
        id: 7, type: 'regular', text: '與伴侶交往時，你最希望對方：', options: [
            { text: '經常讚美我，讓我開心又有自由', color: 'yellow' },
            { text: '隨時默契到我的內心所想', color: 'blue' },
            { text: '認可我是對的，並覺得我有價值', color: 'red' },
            { text: '尊重我，相處安靜和諧', color: 'green' }
        ]
    },
    {
        id: 8, type: 'regular', text: '在人際交往中，你通常：', options: [
            { text: '覺得與人交往比獨處更有趣', color: 'yellow' },
            { text: '非常審慎地進入關係，常被認為有距離感', color: 'blue' },
            { text: '希望在人際關係中占主導地位', color: 'red' },
            { text: '順其自然，不溫不火，相對被動', color: 'green' }
        ]
    },
    {
        id: 9, type: 'regular', text: '你做事情經常：', options: [
            { text: '缺少長性，不喜歡長期做相同的事', color: 'yellow' },
            { text: '缺少果斷，總能先看到不利面', color: 'blue' },
            { text: '缺少耐性，有時行事過於草率', color: 'red' },
            { text: '缺少緊迫感，行動遲緩難下決心', color: 'green' }
        ]
    },
    {
        id: 10, type: 'regular', text: '通常你完成任務的方式是：', options: [
            { text: '常趕在最後期限前完成，臨時抱佛腳', color: 'yellow' },
            { text: '有嚴格規定的程序，精確執行', color: 'blue' },
            { text: '先做、快速做，效率優先', color: 'red' },
            { text: '按部就班，需要時從他人處獲得幫助', color: 'green' }
        ]
    },
    {
        id: 11, type: 'regular', text: '在幫助他人的問題上，你的想法是：', options: [
            { text: '自告奮勇，主動提出幫助', color: 'yellow' },
            { text: '值得幫助的人應該幫助', color: 'blue' },
            { text: '很少承諾，但承諾了必定兌現', color: 'red' },
            { text: '別人來找我不太會拒絕', color: 'green' }
        ]
    },
    {
        id: 12, type: 'regular', text: '面對他人的讚美，你內心：', options: [
            { text: '多多益善，讚美總讓人愉悅', color: 'yellow' },
            { text: '只要在乎的人認同就夠了', color: 'blue' },
            { text: '不需無關痛癢的讚美，更希望被認可能力', color: 'red' },
            { text: '有沒有都無所謂', color: 'green' }
        ]
    },
    {
        id: 13, type: 'regular', text: '面對生活，你更像：', options: [
            { text: '無憂派 — 每天開心最重要', color: 'yellow' },
            { text: '分析派 — 問題未發生前就想好所有可能', color: 'blue' },
            { text: '行動派 — 不進步別人就會進步', color: 'red' },
            { text: '隨和派 — 外面的世界與我無關', color: 'green' }
        ]
    },
    {
        id: 14, type: 'regular', text: '對於規則，你的態度是：', options: [
            { text: '不喜歡被束縛，不按規則出牌更新鮮', color: 'yellow' },
            { text: '嚴格遵守，竭盡全力做到最好', color: 'blue' },
            { text: '想打破規則，由自己來制定規則', color: 'red' },
            { text: '不願違反，但可能因鬆散達不到要求', color: 'green' }
        ]
    },
    {
        id: 15, type: 'regular', text: '你的行為基本特點是：', options: [
            { text: '豐富跳躍，不喜制度約束，快速反應', color: 'yellow' },
            { text: '慎重小心，為預防善後盡心操勞', color: 'blue' },
            { text: '目標明確，集中精力抓住核心要點', color: 'red' },
            { text: '慢條斯理，按部就班與周圍協調一致', color: 'green' }
        ]
    },
    {
        id: 16, type: 'regular', text: '如果有人深深惹惱你，你會：', options: [
            { text: '內心受傷，最終多半還是會原諒', color: 'yellow' },
            { text: '深深憤怒，牢記在心，完全避開對方', color: 'blue' },
            { text: '火冒三丈，期望有機會狠狠回應', color: 'red' },
            { text: '避免攤牌，去找新朋友', color: 'green' }
        ]
    },
    {
        id: 17, type: 'regular', text: '在人際關係中，你最在意：', options: [
            { text: '得到讚美和歡迎', color: 'yellow' },
            { text: '得到理解和欣賞', color: 'blue' },
            { text: '得到感激和尊敬', color: 'red' },
            { text: '得到尊重和接納', color: 'green' }
        ]
    },
    {
        id: 18, type: 'regular', text: '工作上你表現出的更多是：', options: [
            { text: '充滿熱忱，很多想法且有靈性', color: 'yellow' },
            { text: '心思細膩，完美精確且為人可靠', color: 'blue' },
            { text: '堅強直截了當且有推動力', color: 'red' },
            { text: '有耐心，適應性強且善於協調', color: 'green' }
        ]
    },
    {
        id: 19, type: 'regular', text: '業餘時間你偏好：', options: [
            { text: '看電影、聽音樂、與朋友聊天', color: 'yellow' },
            { text: '學習新知識、思考問題或提升技能', color: 'blue' },
            { text: '參加有競爭性的活動或組織團隊任務', color: 'red' },
            { text: '獨處或與少數親近的人安靜活動', color: 'green' }
        ]
    },
    {
        id: 20, type: 'regular', text: '朋友們認為你：', options: [
            { text: '開朗活潑，容易相處', color: 'yellow' },
            { text: '深思熟慮，值得信賴', color: 'blue' },
            { text: '有主見，有決斷力', color: 'red' },
            { text: '隨和，不愛計較', color: 'green' }
        ]
    },
    {
        id: 21, type: 'regular', text: '做錯事時你傾向於：', options: [
            { text: '難為情，希望逃避批評', color: 'yellow' },
            { text: '愧疚痛苦，停留在自我壓抑中', color: 'blue' },
            { text: '不承認但內心已明白，會辯駁', color: 'red' },
            { text: '害怕但表面不露聲色', color: 'green' }
        ]
    },
    {
        id: 22, type: 'regular', text: '如果你是領導，你希望部屬覺得你：', options: [
            { text: '被喜歡且富有感召力', color: 'yellow' },
            { text: '公平公正且足以信賴', color: 'blue' },
            { text: '能力很強且富有領導力', color: 'red' },
            { text: '可以親近且善於替他們著想', color: 'green' }
        ]
    },
    {
        id: 23, type: 'regular', text: '你對認同的需求是：', options: [
            { text: '所有人都認同我那就太好了', color: 'yellow' },
            { text: '只要在乎的人認同就夠了', color: 'blue' },
            { text: '精英群體的認同最重要', color: 'red' },
            { text: '別人是否認同，生活都要繼續', color: 'green' }
        ]
    },
    {
        id: 24, type: 'regular', text: '面對壓力時你通常：', options: [
            { text: '轉移注意力找樂子來紓解', color: 'yellow' },
            { text: '獨自沉思分析問題根源', color: 'blue' },
            { text: '把壓力轉化為動力加倍努力', color: 'red' },
            { text: '順其自然等待壓力消散', color: 'green' }
        ]
    },
    {
        id: 25, type: 'regular', text: '在團隊會議中你通常：', options: [
            { text: '活躍氣氛提出創意想法', color: 'yellow' },
            { text: '認真記錄仔細分析每個方案', color: 'blue' },
            { text: '主導討論方向推動決策', color: 'red' },
            { text: '傾聽各方意見協調不同聲音', color: 'green' }
        ]
    },
    {
        id: 26, type: 'regular', text: '學習新技能時你偏好：', options: [
            { text: '邊做邊學，在實踐中摸索', color: 'yellow' },
            { text: '先研讀完整資料再循序漸進', color: 'blue' },
            { text: '快速掌握核心要領直接上手', color: 'red' },
            { text: '跟著有經驗的人慢慢學習', color: 'green' }
        ]
    },
    {
        id: 27, type: 'regular', text: '做決策時你通常：', options: [
            { text: '靠直覺和感覺，相信第一印象', color: 'yellow' },
            { text: '蒐集大量資訊深思熟慮後才決定', color: 'blue' },
            { text: '快速判斷果斷行動', color: 'red' },
            { text: '徵求他人意見，尋求共識', color: 'green' }
        ]
    },
    {
        id: 28, type: 'regular', text: '你如何看待失敗：', options: [
            { text: '很快就忘了，明天又是新的一天', color: 'yellow' },
            { text: '反覆檢討自己哪裡做得不夠好', color: 'blue' },
            { text: '視為暫時挫折，更激發鬥志', color: 'red' },
            { text: '接受結果，認為塞翁失馬焉知非福', color: 'green' }
        ]
    },
    {
        id: 29, type: 'regular', text: '你的辦公桌通常是：', options: [
            { text: '隨性擺放，有創意小物點綴', color: 'yellow' },
            { text: '整齊有序，每樣東西有固定位置', color: 'blue' },
            { text: '簡潔高效，只留必要工具', color: 'red' },
            { text: '乾淨舒適，有溫馨擺設', color: 'green' }
        ]
    },
    {
        id: 30, type: 'regular', text: '面對衝突你的第一反應是：', options: [
            { text: '用幽默化解，避免氣氛太緊張', color: 'yellow' },
            { text: '冷靜下來仔細了解來龍去脈', color: 'blue' },
            { text: '直接表達不滿並尋求解決', color: 'red' },
            { text: '退讓妥協，維持和平', color: 'green' }
        ]
    },
    {
        id: 31, type: 'regular', text: '對於計畫的改變你的反應是：', options: [
            { text: '開心接受，變化才不無聊', color: 'yellow' },
            { text: '擔心變化帶來的不確定性', color: 'blue' },
            { text: '只要方向正確就迅速適應', color: 'red' },
            { text: '雖然不太喜歡但也能配合', color: 'green' }
        ]
    },
    {
        id: 32, type: 'regular', text: '當朋友情緒低落來找你時：', options: [
            { text: '帶他去玩讓他開心起來', color: 'yellow' },
            { text: '耐心傾聽並給予深度建議', color: 'blue' },
            { text: '分析問題幫他找到解決方案', color: 'red' },
            { text: '默默陪伴在身邊', color: 'green' }
        ]
    },
    {
        id: 33, type: 'regular', text: '你理想中的工作環境是：', options: [
            { text: '自由開放，鼓勵創新和社交', color: 'yellow' },
            { text: '制度完善，流程清晰有條理', color: 'blue' },
            { text: '充滿挑戰，績效導向有晉升空間', color: 'red' },
            { text: '氛圍和諧，同事關係融洽穩定', color: 'green' }
        ]
    },
    {
        id: 34, type: 'regular', text: '選擇餐廳時你通常：', options: [
            { text: '想嘗試新開的或異國風情餐廳', color: 'yellow' },
            { text: '先看評價和菜單再做決定', color: 'blue' },
            { text: '知道自己要什麼直接選', color: 'red' },
            { text: '讓別人決定就好都可以', color: 'green' }
        ]
    },
    {
        id: 35, type: 'regular', text: '你覺得人生最重要的是：', options: [
            { text: '活出精彩，不留遺憾', color: 'yellow' },
            { text: '活得有意義有深度', color: 'blue' },
            { text: '活出成就，創造價值', color: 'red' },
            { text: '活得安穩，內心平靜', color: 'green' }
        ]
    },
    // ===== 正規題 36-70 =====
    {
        id: 36, type: 'regular', text: '週末你最可能在做什麼：', options: [
            { text: '和朋友聚會或參加活動', color: 'yellow' },
            { text: '閱讀整理或做個人規劃', color: 'blue' },
            { text: '進修學習或處理工作事務', color: 'red' },
            { text: '在家放鬆或散步發呆', color: 'green' }
        ]
    },
    {
        id: 37, type: 'regular', text: '第一次到陌生城市旅行你會：', options: [
            { text: '隨興走看到什麼玩什麼', color: 'yellow' },
            { text: '事先規劃好路線和景點', color: 'blue' },
            { text: '鎖定幾個必去的地標效率走完', color: 'red' },
            { text: '找個舒服的咖啡廳慢慢感受城市', color: 'green' }
        ]
    },
    {
        id: 38, type: 'regular', text: '你遲到時最可能的原因是：', options: [
            { text: '路上遇到有趣的事被吸引了', color: 'yellow' },
            { text: '出門前反覆確認東西都帶齊了', color: 'blue' },
            { text: '我很少遲到，除非同時在忙其他重要的事', color: 'red' },
            { text: '慢慢準備沒注意到時間', color: 'green' }
        ]
    },
    {
        id: 39, type: 'regular', text: '如果要你在公司做演講，你會：', options: [
            { text: '即興發揮，跟觀眾互動最重要', color: 'yellow' },
            { text: '準備充分，把每個細節都想好', color: 'blue' },
            { text: '聚焦重點，簡潔有力地傳達', color: 'red' },
            { text: '不太想上台但還是會配合', color: 'green' }
        ]
    },
    {
        id: 40, type: 'regular', text: '你在群組聊天中通常是：', options: [
            { text: '貼圖表情包最多的那個人', color: 'yellow' },
            { text: '等到有意義的話題才參與討論', color: 'blue' },
            { text: '直接講重點或發起討論', color: 'red' },
            { text: '安靜看訊息偶爾回覆', color: 'green' }
        ]
    },
    {
        id: 41, type: 'regular', text: '你選擇工作最看重：', options: [
            { text: '氣氛好不好玩，同事是否有趣', color: 'yellow' },
            { text: '制度是否完善，有沒有清晰的發展規劃', color: 'blue' },
            { text: '薪資待遇和晉升速度', color: 'red' },
            { text: '壓力大不大，工作是否穩定', color: 'green' }
        ]
    },
    {
        id: 42, type: 'regular', text: '當你有一個新想法時：', options: [
            { text: '馬上跟身邊的人分享', color: 'yellow' },
            { text: '先仔細評估可行性再說', color: 'blue' },
            { text: '立刻開始執行', color: 'red' },
            { text: '放在心裡慢慢想等時機成熟', color: 'green' }
        ]
    },
    {
        id: 43, type: 'regular', text: '你在排隊等候時通常：', options: [
            { text: '跟旁邊的人聊天或看有趣的東西', color: 'yellow' },
            { text: '心裡默默計算還要等多久', color: 'blue' },
            { text: '覺得浪費時間想找更快的方法', color: 'red' },
            { text: '安靜等待沒什麼特別感覺', color: 'green' }
        ]
    },
    {
        id: 44, type: 'regular', text: '別人請你幫忙你不太想做的事時：', options: [
            { text: '答應了但可能拖延或忘記', color: 'yellow' },
            { text: '找合理的理由婉拒', color: 'blue' },
            { text: '直接說不或提出替代方案', color: 'red' },
            { text: '不好意思拒絕就答應了', color: 'green' }
        ]
    },
    {
        id: 45, type: 'regular', text: '你如何管理自己的財務：', options: [
            { text: '想買就買，享受當下最重要', color: 'yellow' },
            { text: '有詳細的預算和記帳習慣', color: 'blue' },
            { text: '會投資理財讓錢為自己工作', color: 'red' },
            { text: '量入為出，存錢以備不時之需', color: 'green' }
        ]
    },
    {
        id: 46, type: 'regular', text: '參加社交活動時你：', options: [
            { text: '是全場的焦點能跟任何人聊得起來', color: 'yellow' },
            { text: '找幾個能深聊的人認真交流', color: 'blue' },
            { text: '主動結識對自己有幫助的人脈', color: 'red' },
            { text: '待在角落跟認識的人小聊', color: 'green' }
        ]
    },
    {
        id: 47, type: 'regular', text: '當你需要做一個重要簡報時：', options: [
            { text: '加入很多故事和笑點讓觀眾留下印象', color: 'yellow' },
            { text: '用數據圖表確保內容嚴謹完整', color: 'blue' },
            { text: '聚焦關鍵結論和行動方案', color: 'red' },
            { text: '盡量簡短客觀不想引起爭議', color: 'green' }
        ]
    },
    {
        id: 48, type: 'regular', text: '你如何面對不確定的未來：', options: [
            { text: '船到橋頭自然直，想那麼多幹嘛', color: 'yellow' },
            { text: '做好各種可能的準備和預案', color: 'blue' },
            { text: '主動出擊掌握命運的主導權', color: 'red' },
            { text: '隨遇而安接受安排', color: 'green' }
        ]
    },
    {
        id: 49, type: 'regular', text: '你跟朋友起爭執後：', options: [
            { text: '過了就忘下次見面照樣開心', color: 'yellow' },
            { text: '會反覆思考是不是自己說錯了什麼', color: 'blue' },
            { text: '覺得自己有道理不會主動低頭', color: 'red' },
            { text: '主動去緩和關係即使不是自己的錯', color: 'green' }
        ]
    },
    {
        id: 50, type: 'regular', text: '你最不能忍受的同事是：', options: [
            { text: '無趣死板毫無生活情趣的人', color: 'yellow' },
            { text: '做事馬虎不負責任的人', color: 'blue' },
            { text: '能力不足卻推卸責任的人', color: 'red' },
            { text: '愛搞政治製造衝突的人', color: 'green' }
        ]
    },
    {
        id: 51, type: 'regular', text: '有人質疑你的專業能力時：', options: [
            { text: '用輕鬆的方式帶過不太放在心上', color: 'yellow' },
            { text: '用數據和事實證明自己', color: 'blue' },
            { text: '直接反駁並展現實力', color: 'red' },
            { text: '默默做好該做的讓結果說話', color: 'green' }
        ]
    },
    {
        id: 52, type: 'regular', text: '你處理多項任務的方式是：', options: [
            { text: '同時進行好幾件事覺得很刺激', color: 'yellow' },
            { text: '列出優先順序一件一件完成', color: 'blue' },
            { text: '先做最重要最緊急的', color: 'red' },
            { text: '慢慢來都會做到的不著急', color: 'green' }
        ]
    },
    {
        id: 53, type: 'regular', text: '你搬到新住所後最先做的事：', options: [
            { text: '邀請朋友來家裡聚會', color: 'yellow' },
            { text: '把所有東西歸位佈置整齊', color: 'blue' },
            { text: '確保工作區域設置好能馬上投入', color: 'red' },
            { text: '先讓自己適應環境慢慢整理', color: 'green' }
        ]
    },
    {
        id: 54, type: 'regular', text: '你最欣賞的領導風格是：', options: [
            { text: '有魅力有感染力讓團隊充滿活力', color: 'yellow' },
            { text: '公正嚴謹言行一致值得信賴', color: 'blue' },
            { text: '有遠見有魄力帶領團隊創造業績', color: 'red' },
            { text: '包容體貼照顧每個人的感受', color: 'green' }
        ]
    },
    {
        id: 55, type: 'regular', text: '你覺得最浪費時間的事是：', options: [
            { text: '一個人孤獨地待著什麼都不做', color: 'yellow' },
            { text: '做沒有意義沒有品質的事情', color: 'blue' },
            { text: '無止境的會議和反覆的討論', color: 'red' },
            { text: '無謂的爭吵和人際衝突', color: 'green' }
        ]
    },
    {
        id: 56, type: 'regular', text: '你在準備旅行行李時：', options: [
            { text: '到前一天才隨便塞一下就出發', color: 'yellow' },
            { text: '提前幾天按清單一項項準備', color: 'blue' },
            { text: '只帶最必要的東西講求效率', color: 'red' },
            { text: '參考別人的建議慢慢準備', color: 'green' }
        ]
    },
    {
        id: 57, type: 'regular', text: '你對「完美」的看法是：', options: [
            { text: '開心就好不用追求完美', color: 'yellow' },
            { text: '努力追求完美是做人的態度', color: 'blue' },
            { text: '結果比過程重要差不多就行動', color: 'red' },
            { text: '盡力就好不必給自己太大壓力', color: 'green' }
        ]
    },
    {
        id: 58, type: 'regular', text: '當你需要說服別人時你通常：', options: [
            { text: '用熱情和故事打動對方', color: 'yellow' },
            { text: '用邏輯和數據讓對方信服', color: 'blue' },
            { text: '直接展示利弊讓對方做決定', color: 'red' },
            { text: '用溫和的方式慢慢溝通', color: 'green' }
        ]
    },
    {
        id: 59, type: 'regular', text: '你收到負面反饋後：', options: [
            { text: '有點難過但很快轉移注意力', color: 'yellow' },
            { text: '認真反思並制定改善計畫', color: 'blue' },
            { text: '篩選有用的接受沒用的忽略', color: 'red' },
            { text: '表面接受內心需要一段時間消化', color: 'green' }
        ]
    },
    {
        id: 60, type: 'regular', text: '你參與競賽時的態度是：', options: [
            { text: '重在參與過程有趣就好', color: 'yellow' },
            { text: '認真準備力求做到最佳表現', color: 'blue' },
            { text: '全力以赴只想贏', color: 'red' },
            { text: '隨緣不會給自己太大壓力', color: 'green' }
        ]
    },
    {
        id: 61, type: 'regular', text: '你的穿衣風格偏向：', options: [
            { text: '鮮豔時尚喜歡吸引目光', color: 'yellow' },
            { text: '簡約有質感注重搭配細節', color: 'blue' },
            { text: '幹練專業展現自信', color: 'red' },
            { text: '舒適自然不喜歡太張揚', color: 'green' }
        ]
    },
    {
        id: 62, type: 'regular', text: '你加入一個新團隊後通常：', options: [
            { text: '很快跟大家打成一片', color: 'yellow' },
            { text: '先觀察團隊文化和規則再融入', color: 'blue' },
            { text: '主動展現能力爭取表現機會', color: 'red' },
            { text: '安靜融入不急著表現', color: 'green' }
        ]
    },
    {
        id: 63, type: 'regular', text: '你處理文書工作的態度：', options: [
            { text: '盡快搞定不想花太多時間', color: 'yellow' },
            { text: '仔細檢查確保每個細節正確', color: 'blue' },
            { text: '重點完成關鍵項目其他可以省略', color: 'red' },
            { text: '按照要求慢慢做不求最快', color: 'green' }
        ]
    },
    {
        id: 64, type: 'regular', text: '你對於承諾的態度是：', options: [
            { text: '容易答應但有時會忘記或延遲', color: 'yellow' },
            { text: '承諾了就一定做到否則不輕易承諾', color: 'blue' },
            { text: '只承諾我能掌控的事情', color: 'red' },
            { text: '盡量避免承諾太多壓力', color: 'green' }
        ]
    },
    {
        id: 65, type: 'regular', text: '你更喜歡哪種工作節奏：', options: [
            { text: '每天都不一樣充滿新鮮感', color: 'yellow' },
            { text: '有規律有計畫穩定前進', color: 'blue' },
            { text: '快節奏高強度有挑戰性', color: 'red' },
            { text: '慢節奏低壓力舒適愉快', color: 'green' }
        ]
    },
    {
        id: 66, type: 'regular', text: '在一場辯論中你更傾向：', options: [
            { text: '用妙語和故事讓大家笑著接受觀點', color: 'yellow' },
            { text: '用嚴密的邏輯一步步推導結論', color: 'blue' },
            { text: '氣勢強勢直接駁倒對方', color: 'red' },
            { text: '傾聽雙方然後尋找中間地帶', color: 'green' }
        ]
    },
    {
        id: 67, type: 'regular', text: '你最引以為傲的特質是：', options: [
            { text: '樂觀和感染力', color: 'yellow' },
            { text: '可靠和深度', color: 'blue' },
            { text: '決斷力和執行力', color: 'red' },
            { text: '包容性和親和力', color: 'green' }
        ]
    },
    {
        id: 68, type: 'regular', text: '你在團隊中最常擔任的角色是：', options: [
            { text: '氣氛組擔當讓大家保持好心情', color: 'yellow' },
            { text: '細節把關確保品質的人', color: 'blue' },
            { text: '推動進度做最終拍板的人', color: 'red' },
            { text: '協調各方讓大家合作順暢的人', color: 'green' }
        ]
    },
    {
        id: 69, type: 'regular', text: '你對養寵物的態度：', options: [
            { text: '喜歡活潑好動可以一起玩的寵物', color: 'yellow' },
            { text: '會認真研究最適合的品種和養法', color: 'blue' },
            { text: '訓練有素聽從指令的寵物最好', color: 'red' },
            { text: '安靜溫順可以靜靜陪伴的寵物', color: 'green' }
        ]
    },
    {
        id: 70, type: 'regular', text: '接到一個不擅長的新任務時：', options: [
            { text: '覺得很刺激是學新東西的機會', color: 'yellow' },
            { text: '先研究相關資料再開始行動', color: 'blue' },
            { text: '硬上就對了做中學最快', color: 'red' },
            { text: '希望有人帶我一起做', color: 'green' }
        ]
    },
    // ===== 配對一致性題 (pairId 1-10, 每組 2 題) =====
    {
        id: 71, type: 'paired', pairId: 1, text: '在工作中遇到困難時你通常：', options: [
            { text: '找人一起想辦法聊聊就有靈感', color: 'yellow' },
            { text: '獨自研究分析直到找出最佳解法', color: 'blue' },
            { text: '迎難而上把它視為證明實力的機會', color: 'red' },
            { text: '等一等也許事情會自然解決', color: 'green' }
        ]
    },
    {
        id: 72, type: 'paired', pairId: 1, text: '面對棘手的專案挑戰你的反應是：', options: [
            { text: '找同事腦力激盪集思廣益', color: 'yellow' },
            { text: '深入研究問題根源制定完善解決方案', color: 'blue' },
            { text: '視為展現能力的機會全力突破', color: 'red' },
            { text: '保持耐心相信問題終會有出路', color: 'green' }
        ]
    },
    {
        id: 73, type: 'paired', pairId: 2, text: '你對時間的態度是：', options: [
            { text: '時間是用來享受的何必太計較', color: 'yellow' },
            { text: '時間應該被有效規劃和利用', color: 'blue' },
            { text: '時間就是金錢浪費不得', color: 'red' },
            { text: '時間自然流逝不用刻意管理', color: 'green' }
        ]
    },
    {
        id: 74, type: 'paired', pairId: 2, text: '你如何看待行程安排：', options: [
            { text: '不喜歡被行程綁住隨性最好', color: 'yellow' },
            { text: '會提前安排好而且盡量遵守', color: 'blue' },
            { text: '高效安排確保每分鐘有產出', color: 'red' },
            { text: '有大概的計畫但很彈性不強求', color: 'green' }
        ]
    },
    {
        id: 75, type: 'paired', pairId: 3, text: '你覺得什麼樣的人最值得交往：', options: [
            { text: '有趣健談能帶來快樂的人', color: 'yellow' },
            { text: '真誠可靠能深度對話的人', color: 'blue' },
            { text: '有能力有目標能互相激勵的人', color: 'red' },
            { text: '溫和善良不計較得失的人', color: 'green' }
        ]
    },
    {
        id: 76, type: 'paired', pairId: 3, text: '你選擇朋友最重要的標準是：', options: [
            { text: '在一起開心好玩有很多共同話題', color: 'yellow' },
            { text: '能夠理解我且言行一致的人', color: 'blue' },
            { text: '有上進心值得互相學習的人', color: 'red' },
            { text: '性格溫和不會製造壓力的人', color: 'green' }
        ]
    },
    {
        id: 77, type: 'paired', pairId: 4, text: '面對不會使用的新軟體你會：', options: [
            { text: '隨便點點看到處試覺得很好玩', color: 'yellow' },
            { text: '先看完使用手冊再動手操作', color: 'blue' },
            { text: '直接上手摸索找核心功能', color: 'red' },
            { text: '請會用的同事教我', color: 'green' }
        ]
    },
    {
        id: 78, type: 'paired', pairId: 4, text: '需要學習一項全新技能時你傾向：', options: [
            { text: '在實作中摸索邊玩邊學', color: 'yellow' },
            { text: '系統性地從基礎概念學起', color: 'blue' },
            { text: '直攻核心技巧快速上手實戰', color: 'red' },
            { text: '跟著有經驗的人一步步學', color: 'green' }
        ]
    },
    {
        id: 79, type: 'paired', pairId: 5, text: '你在聚會中的狀態通常是：', options: [
            { text: '最活躍的那個人全場都聊得到', color: 'yellow' },
            { text: '跟少數人深聊不太主動社交', color: 'blue' },
            { text: '自然而然成為大家注目的焦點', color: 'red' },
            { text: '安靜待著偶爾參與話題', color: 'green' }
        ]
    },
    {
        id: 80, type: 'paired', pairId: 5, text: '朋友的生日派對上你通常：', options: [
            { text: '是帶動氣氛的靈魂人物', color: 'yellow' },
            { text: '跟比較熟的幾個人聊天', color: 'blue' },
            { text: '掌握場面讓活動順利進行', color: 'red' },
            { text: '低調出席祝賀後安靜享受', color: 'green' }
        ]
    },
    {
        id: 81, type: 'paired', pairId: 6, text: '你如何看待競爭：', options: [
            { text: '不太在意輸贏參與的過程最有趣', color: 'yellow' },
            { text: '會認真準備但更注重公平和品質', color: 'blue' },
            { text: '必須贏競爭讓我充滿動力', color: 'red' },
            { text: '盡量避免競爭不想傷和氣', color: 'green' }
        ]
    },
    {
        id: 82, type: 'paired', pairId: 6, text: '參加公司內部競賽時你的心態：', options: [
            { text: '重在體驗過程好玩就好', color: 'yellow' },
            { text: '盡全力做到最好不管結果如何', color: 'blue' },
            { text: '志在必得輸了會很不甘心', color: 'red' },
            { text: '配合參加但不會太在意名次', color: 'green' }
        ]
    },
    {
        id: 83, type: 'paired', pairId: 7, text: '你覺得理想的週末是：', options: [
            { text: '約朋友出去吃飯唱歌或看展覽', color: 'yellow' },
            { text: '在家看書寫東西整理思緒', color: 'blue' },
            { text: '進行自我提升如健身或學習新課程', color: 'red' },
            { text: '什麼也不做就舒服地躺著放空', color: 'green' }
        ]
    },
    {
        id: 84, type: 'paired', pairId: 7, text: '你最理想的休息方式是：', options: [
            { text: '熱鬧的社交活動或新體驗', color: 'yellow' },
            { text: '沉浸在個人愛好中安靜充電', color: 'blue' },
            { text: '做些有成就感的事情充實提升', color: 'red' },
            { text: '完全放鬆不被任何事打擾', color: 'green' }
        ]
    },
    {
        id: 85, type: 'paired', pairId: 8, text: '當上級交代一項重要任務給你：', options: [
            { text: '興奮覺得終於有新鮮事做了', color: 'yellow' },
            { text: '認真評估並制定詳細的執行計畫', color: 'blue' },
            { text: '充滿幹勁馬上開始執行', color: 'red' },
            { text: '有點壓力但會慢慢完成它', color: 'green' }
        ]
    },
    {
        id: 86, type: 'paired', pairId: 8, text: '接到一個高難度的工作專案你會：', options: [
            { text: '覺得很有挑戰性雖然壓力大但也很興奮', color: 'yellow' },
            { text: '先分析所有細節再有條不紊地推進', color: 'blue' },
            { text: '立刻投入全力拿下這個專案', color: 'red' },
            { text: '希望能有團隊支援一起分攤壓力', color: 'green' }
        ]
    },
    {
        id: 87, type: 'paired', pairId: 9, text: '你對工作和生活的平衡看法是：', options: [
            { text: '生活比工作重要人生要開心', color: 'yellow' },
            { text: '兩者都要做好才能安心', color: 'blue' },
            { text: '現階段拼事業成功了就有好生活', color: 'red' },
            { text: '平平穩穩就好不用太拼', color: 'green' }
        ]
    },
    {
        id: 88, type: 'paired', pairId: 9, text: '假如獲得一筆額外獎金你最可能：', options: [
            { text: '立刻規劃一次旅行或大吃一頓', color: 'yellow' },
            { text: '存起來或做穩健的理財規劃', color: 'blue' },
            { text: '投資自己的能力提升或事業拓展', color: 'red' },
            { text: '沒有特別計畫先留著以備不時之需', color: 'green' }
        ]
    },
    {
        id: 89, type: 'paired', pairId: 10, text: '你最害怕的事情是：', options: [
            { text: '被孤立沒有人願意跟我玩', color: 'yellow' },
            { text: '做出不完美或有瑕疵的結果', color: 'blue' },
            { text: '失去控制權或被人看不起', color: 'red' },
            { text: '生活的穩定被打破產生衝突', color: 'green' }
        ]
    },
    {
        id: 90, type: 'paired', pairId: 10, text: '你感到最焦慮的情境是：', options: [
            { text: '長時間獨處沒有社交互動', color: 'yellow' },
            { text: '被迫在準備不足的情況下行動', color: 'blue' },
            { text: '目標無法達成或權力被架空', color: 'red' },
            { text: '環境劇烈變動或人際關係緊張', color: 'green' }
        ]
    },
    // ===== 社會期望題 =====
    {
        id: 91, type: 'social', text: '關於誠實，以下最符合你的是：', options: [
            { text: '我這輩子從未說過任何謊話', color: 'blue', sd: true },
            { text: '我盡量誠實但偶爾會善意的小謊', color: 'blue' },
            { text: '視情況決定該說多少真話', color: 'red' },
            { text: '不太會說謊但也不會什麼都說', color: 'green' }
        ]
    },
    {
        id: 92, type: 'social', text: '面對他人的錯誤，你通常：', options: [
            { text: '我從不對任何人產生負面評價', color: 'green', sd: true },
            { text: '會在心裡想但不一定說出來', color: 'green' },
            { text: '看情況決定要不要點出來', color: 'red' },
            { text: '如果影響到我會直接說', color: 'yellow' }
        ]
    },
    {
        id: 93, type: 'social', text: '在工作中你的表現是：', options: [
            { text: '我做每件事都能百分之百投入全力', color: 'red', sd: true },
            { text: '重要的事情我會全力以赴', color: 'red' },
            { text: '看心情和興趣決定投入程度', color: 'yellow' },
            { text: '穩定地完成分配給我的工作', color: 'green' }
        ]
    },
    {
        id: 94, type: 'social', text: '關於情緒控制：', options: [
            { text: '我從未在任何場合感到煩躁或不耐煩', color: 'green', sd: true },
            { text: '我能控制但偶爾還是會焦躁', color: 'blue' },
            { text: '情緒來了就來不太刻意壓抑', color: 'yellow' },
            { text: '我會直接表達不滿', color: 'red' }
        ]
    },
    {
        id: 95, type: 'social', text: '對於他人的求助：', options: [
            { text: '無論什麼情況我都會立刻放下手邊的事去幫助', color: 'yellow', sd: true },
            { text: '能幫的我會幫但也要看自己的狀態', color: 'green' },
            { text: '如果對我也有益處會更願意幫', color: 'red' },
            { text: '評估情況後再決定如何協助', color: 'blue' }
        ]
    },
    {
        id: 96, type: 'social', text: '你對同事的看法：', options: [
            { text: '我認為每一位同事都是完美且優秀的', color: 'green', sd: true },
            { text: '大部分同事都不錯各有各的優點', color: 'yellow' },
            { text: '有些同事合得來有些不太行', color: 'blue' },
            { text: '我只在乎跟我工作相關的同事表現', color: 'red' }
        ]
    },
    {
        id: 97, type: 'social', text: '關於你的缺點：', options: [
            { text: '我真的想不到自己有什麼明顯的缺點', color: 'red', sd: true },
            { text: '我有缺點但一直在努力改善', color: 'blue' },
            { text: '我有一些缺點但覺得還好不影響大局', color: 'yellow' },
            { text: '每個人都有缺點我也不例外', color: 'green' }
        ]
    },
    {
        id: 98, type: 'social', text: '面對不公平的待遇：', options: [
            { text: '我從未對任何事感到嫉妒或不平', color: 'green', sd: true },
            { text: '會覺得不舒服但嘗試接受和理解', color: 'blue' },
            { text: '會想辦法為自己爭取公平', color: 'red' },
            { text: '抱怨一下但也就算了', color: 'yellow' }
        ]
    },
    {
        id: 99, type: 'social', text: '你在團隊合作中：', options: [
            { text: '我跟所有人都能完美配合從來沒有摩擦', color: 'yellow', sd: true },
            { text: '大部分時候配合很好偶有小分歧', color: 'green' },
            { text: '遇到有能力的隊友更能發揮', color: 'red' },
            { text: '需要時間磨合才能配合良好', color: 'blue' }
        ]
    },
    {
        id: 100, type: 'social', text: '關於自己的過去：', options: [
            { text: '我從未做過任何讓自己後悔的決定', color: 'red', sd: true },
            { text: '有一些後悔的事但已經釋懷', color: 'green' },
            { text: '後悔的事不少但讓我成長了', color: 'blue' },
            { text: '不太回頭看過去更關注當下', color: 'yellow' }
        ]
    }
];

module.exports = { QUESTION_BANK };
