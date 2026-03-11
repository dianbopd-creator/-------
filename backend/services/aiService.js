const { GoogleGenerativeAI } = require('@google/generative-ai');
const CandidateRepo = require('../db/repositories/candidateRepository');

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

exports.generateAiReport = async (candidateId) => {
    if (!process.env.GEMINI_API_KEY) {
        throw new Error('未設定 GEMINI_API_KEY，請先前往系統環境變數設定。');
    }

    try {
        const candidate = await CandidateRepo.findById(candidateId);
        if (!candidate) throw new Error('Candidate not found');

        const [answers, personality, workExperiences] = await Promise.all([
            CandidateRepo.getAnswersByCandidate(candidateId),
            CandidateRepo.getPersonalityByCandidate(candidateId),
            CandidateRepo.getWorkExperiencesByCandidate(candidateId)
        ]);

        const qaSection = (answers || []).map((a, i) =>
            `  Q${i + 1}. [${a.question_code}]\n  A：${a.answer_text}`
        ).join('\n\n');

        const workExpSection = (workExperiences || []).map((exp, i) =>
            `  ${i + 1}. 職稱：${exp.job_title || '未知'}（年資：${exp.years || '未填'}）\n     成就描述：${exp.achievements || '未填'}`
        ).join('\n\n');

        const fpaDesc = personality ? `
  - 🔴 紅色（熱情外向型）：${personality.red_score ?? 0} 分 — 樂觀積極、喜歡表達、容易衝動
  - 🟡 黃色（目標導向型）：${personality.yellow_score ?? 0} 分 — 目的性強、自信果斷、可能過於直接
  - 🟢 綠色（穩定和諧型）：${personality.green_score ?? 0} 分 — 腳踏實地、耐心傾聽、甘於幕後
  - 🔵 藍色（謹慎分析型）：${personality.blue_score ?? 0} 分 — 責任心強、邏輯嚴謹、決策偏慢
  - ⚡ CRI 真實度指數：${personality.cri_score ?? 0}/10（越高表示作答越誠實）` : '  （尚無性格測驗資料）';

        const prompt = `
你是一位擁有 20 年經驗的頂尖資深人資長（CHRO），曾服務於麥肯錫、台積電、遠傳電信等企業，專精於高階人才識別、行為面試深度分析與職涯規劃建議。

你現在要為以下一位求職者撰寫一份**極具洞察力、客觀且可直接用於面試決策**的人才評鑑報告。
請務必緊扣該名求職者所應徵的職缺：【${candidate.jc_department || '未知部門'} - ${candidate.jc_position || '未知職缺'}】，用最高標準來審視其潛力。

報告目標讀者是公司主管與 HR 主管，必須：
1. **排版清晰**，每個段落獨立、易於快速閱讀。
2. **分析有具體引用**，引用候選人的原話或數字來佐證觀點。
3. **針對性強**，切勿使用萬用樣板語言，必須根據【${candidate.jc_position || '該職缺'}】的實際需求來評斷好壞。
4. **給出明確建議**，不要模糊說「表現尚可」，要說「建議做 OOO 因為 XXX」。

---

## 【求職者原始資料】

**應徵職缺：** ${candidate.jc_department || '未指定'} - ${candidate.jc_position || '未指定'}

**基本資料：**
- 姓名：${candidate.name}
- 學歷：${candidate.education_school} ${candidate.education_major ? '（' + candidate.education_major + '）' : ''}
- 專長技能：${candidate.skills || '未填'}
- 證照：${candidate.certifications || '無'}
- 離職原因：${candidate.leave_reason || '未填'}
- 應徵動機：${candidate.motivation || '未填'}
        - 職涯規劃：短期【${candidate.career_plan_short || '未填'}】→ 中期【${candidate.career_plan_mid || '未填'}】→ 長期【${candidate.career_plan_long || '未填'}】
        - 人生夢想：${candidate.dream || '未填'}

** 工作經歷（共 ${(workExperiences || []).length} 筆）：**
            ${workExpSection || '  （無工作經歷）'}

${candidate.resume_text ? `**外部履歷原文（104 / 紙本掃描上傳）：**
> ⚠️ 以下是候選人親自上傳的完整履歷，請優先以此為工作經歷的依據，深度分析其中的項目與成就：

\`\`\`
${candidate.resume_text.substring(0, 4000)}${candidate.resume_text.length > 4000 ? '\n\n[... 文件過長，已截取前段 ...]' : ''}
\`\`\`` : '**外部履歷：** 未上傳'
            }

** 嘉樂 FPA 四色性格測驗：**
            ${fpaDesc}

** 專業職能問答（共 ${(answers || []).length} 題）：**
            ${qaSection || '  （無問答資料）'}

        ---

## 【報告輸出要求】

請嚴格按以下 8 個章節輸出，每個章節之間用 \`---\` 分隔。**不要加任何前言或後語。**

---

# 🏷️ 一、候選人快速標籤

> 用 5～7 個 emoji 關鍵字標籤，直觀呈現這個人的核心特質與潛在風險。每個標籤格式為：「emoji 兩到四字」，以逗號分隔，例如：🚀 高執行力、🧩 系統思維、⚠️ 穩定性待觀察。

---

# 📊 二、六維人才評分

> 為以下每個維度給出 **1～10 分** 並附上 **2～3 句具體評語**，評語必須直接引用候選人的答案或履歷內容作為依據。

**評分維度：**

**① 🎯 職缺契合度（X/10）**
（候選人的背景、技能、過往經歷是否與【${candidate.jc_position || '該職缺'}】高度匹配？）

**② 💼 專業硬實力（X/10）**
（是否具備該職位所需的核心技能、知識或經驗？有無相關成功案例或數據佐證？）

**③ 🔥 工作動力與積極性（X/10）**
（對這份工作的渴望程度、應徵動機是否真誠、能否長期投入？）

**④ 🧠 學習成長潛力（X/10）**
（面對新挑戰的態度、學習意願、職涯目標的清晰度？）

**⑤ 🤝 團隊協作與溝通（X/10）**
（人際關係能力、情商展現、是否能在團隊中發揮正面影響力？）

**⑥ ⚖️ 穩定性風險（X/10）**
（10 = 高風險極易流失，1 = 非常穩定。綜合離職紀錄、動機真實性、生涯規劃一致性來評估。）

---

# 🎯 三、適職性深度分析

> 這是最重要的評估章節之一。請根據候選人應徵的職位【${candidate.jc_position || '該職缺'}】，**挑選出 4 到 5 個該職位最不可或缺的核心能力或特質**（例如：若是會計，須著重「細緻度、數字敏感度、合規性」；若是工程師，須著重「邏輯思維、解題能力」；若是業務，著重「抗壓性、陌生開發」等），並逐一提出深度分析。

對每一個你挑選出的核心能力，請包含：
**[該核心能力名稱]**
（深入分析候選人在此項能力的表現，必須引用具體的問答內容、履歷陳述或 FPA 測驗性格做為佐證，不允許空泛描述。）

**綜合適職性結論：**
（給出明確結論：「高度適合」/ 「適合但需輔導」/ 「建議謹慎考量」，並說明主要理由）

---

# ✅ 四、三大核心優勢

> 列出 3 個最突出的優勢，每個優勢的輸出格式必須嚴格依照以下結構（務必確實空行）：

**1. [優勢標題]**

> 「[引用候選人原話]」

（深入解析...這能看出...）

**實際價值：**
[說明對公司的實際價值]

---


# ⚠️ 五、三大潛在風險

> 列出 3 個需要特別關注的疑慮，每個風險的輸出格式必須嚴格依照以下結構（務必確實空行）：

**1. [風險標題]**

**具體的信號來源：**
[哪句話 / 哪個數字透露出這個風險？]

---


# 🧬 六、FPA 性格特質工作風格解析

> 根據四色測驗結果，深度解讀這個人的工作風格，必須包含：

**① 主導色彩解讀與預測**
（最高分顏色代表其最自然的行為模式，預期在【${candidate.jc_position || '該職缺'}】中的日常表現形式）

**② 色彩組合帶來的複合特質**
（兩種以上高分顏色的組合會產生什麼樣的人格特質？這對【${candidate.jc_position || '該職缺'}】有什麼加分或扣分影響？）

**③ 低分色彩的潛在盲點**
（哪個顏色分數最低？這代表他在哪方面可能表現弱勢？針對其應徵的職務該如何補強？）

**④ CRI 真實度解讀**
（${personality?.cri_score ?? 0}/10 的 CRI 分數代表什麼？候選人對自己的認知是否客觀？作答是否可能有「裝扮」傾向？）

---

# 🎤 七、精準面試追問題目

> 針對上述分析中發現的**具體疑慮、潛在風險（包含第五大項的風險）或亮點**，提供 5 個高品質行為面試問題。
> 每題的輸出格式必須嚴格依照以下結構（務必確實空行）：

**1. [面試問題]**
（以「請分享...」「您曾經...」「假設...」開頭）

**背後考量與探測目的：**
（詳細說明為何要問這題？是基於候選人的哪個經歷或潛在風險？希望藉由這題驗證什麼具體的特質或能力？）

---


**【最後注意事項】**
- 全程使用**繁體中文**，語氣像真正的資深 CHRO 在寫評鑑報告
- **每個評語都必須有具體依據**，不允許「表現良好」這種空洞描述
- 如果某些資料（如外部履歷）不存在，請誠實說明「此項資料未提供，以下分析基於問答與基本資料」
- 評分要真實，不要全給高分，要能體現候選人間的差異
- 不要在最外層加 \`\`\` 代碼區塊

**【格式排版嚴格規定 — 必須遵守】**
- 每個章節標題（# 開頭）**前後各空一行**，讓標題獨立換行
- 每個子標題（**1. 2. 3.** 或 **①②③** 開頭）前後都要**各空一行**
- 遇到粗體的專有名詞（如 **實際價值：**、**具體的信號來源：**、**背後考量與探測目的：**），**前面與後面都必須強制空一行**
- 每個分析段落之間必須有**一行完整空白**，不可文字連接緊接文字
- 每一要點、每一評語都要獨立成段，禁止超過 3 行不換行的密集段落
- 引用候選人原話時，用 blockquote 格式：> 「候選人說：...」
- 評分項目輸出時，每一維度都要**獨立成一個段落**，不可混在一起
`;


        let responseText = '';
        const modelsToTry = ['gemini-2.5-flash', 'gemini-1.5-pro', 'gemini-1.5-flash', 'gemini-pro'];
        let lastError = null;

        for (const modelName of modelsToTry) {
            try {
                const model = genAI.getGenerativeModel({ model: modelName });
                const result = await model.generateContent(prompt);
                responseText = result.response.text();
                console.log(`[AI Report] Generated using model: ${modelName}`);
                break; // Success
            } catch (err) {
                console.warn(`[AI Report] Model ${modelName} failed: ${err.message}`);
                lastError = err;
            }
        }

        if (!responseText) {
            throw new Error(`所有模型均生成失敗。最後一個錯誤：${lastError?.message || '未知錯誤'}`);
        }

        await CandidateRepo.saveAiReport(candidateId, responseText);
        console.log(`[AI Report] Successfully generated for candidate ${candidateId}`);

    } catch (error) {
        console.error('[AI Report] Generation failed:', error.message);
        await CandidateRepo.saveAiReport(
            candidateId,
            `**⚠️ AI 分析生成失敗**\n\n錯誤訊息：\`${error.message}\`\n\n請確認 GEMINI_API_KEY 設定正確後，使用「手動重新產生」按鈕重試。`
        );
    }
};
