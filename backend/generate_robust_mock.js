require('dotenv').config();
const db = require('./database');
const { v4: uuidv4 } = require('uuid');
const aiService = require('./services/aiService');
const fs = require('fs');
const path = require('path');

// Read questions bank
const questionsPath = path.join(__dirname, '../frontend/src/data/questions.json');
const questionsData = JSON.parse(fs.readFileSync(questionsPath, 'utf-8'));
const allQuestions = questionsData.flatMap(cat => cat.questions); // Array of question objects: {id, text}

// Helper to generate a contextual answer
function generateAnswer(candidate, qText) {
    const isEngineer = candidate.job === '工程師';
    const isPM = candidate.job === '專案經理';
    const isDesigner = candidate.job === '設計師';
    const isSRE = candidate.job === '資安專家';
    const isMarketing = candidate.job === '行銷企劃';

    // Generic fallback responses that still look professional
    let ans = `對於這個問題：「${qText}」，我長期的實務經驗告訴我必須以數據與邏輯為導向來決策。`;

    if (qText.includes("衝突")) {
        ans = "我會先召開跨部門或跨團隊的同步會議，釐清雙方真正的痛點，並透過數據與使用者回饋來輔助評估，而非各持己見。溝通是解決衝突的唯一捷徑。";
    } else if (qText.includes("失敗") || qText.includes("挫折")) {
        ans = "我曾遇過專案時程嚴重落後的情況。當時我立刻盤點現有資源，並與高層爭取重排優先層級 (Priority)，把 MVP (核心功能) 守住，順利幫助團隊度過危機。";
    } else if (qText.includes("優勢") || qText.includes("專長")) {
        ans = `我的最大優勢在於：${candidate.skills}。我能夠快速將這些技能運用在實際業務上，並且帶來可量化的改善成效。`;
    } else if (qText.includes("動機") || qText.includes("為何")) {
        ans = `${candidate.motivation}。這不僅是我職涯的下一步，也是我個人理想的實踐。`;
    } else if (qText.includes("目標") || qText.includes("規劃")) {
        ans = `短期目標是：${candidate.career_plan_short}；長期目標則是：${candidate.career_plan_long}。我很期待能在貴公司實現這些藍圖。`;
    } else if (qText.includes("同事") || qText.includes("主管")) {
        ans = "我習慣與團隊保持透明且高效的溝通，透過定期 Sync 和敏捷開發的精神，確保大家的目標一致。我不喜歡推諉塞責的職場文化。";
    } else {
        // Industry-specific random flavors
        if (isEngineer) ans += " 我習慣透過 CI/CD 和自動化測試來確保程式碼品質，減少人為錯誤。";
        if (isPM) ans += " 我擅長運用敏捷 (Agile) 思維，切分 User Story 來掌控交付節奏。";
        if (isDesigner) ans += " 我認為所有的設計都該基於強大的設計系統 (Design System) 以及使用者訪談 (User Research)。";
        if (isSRE) ans += " 我要求架構必須具備高可用性 (High Availability) 和災難復原能力 (DR)。";
        if (isMarketing) ans += " 我對於市場動態的觀察十分敏銳，能夠第一時間抓住社群紅利並轉化為實際營收。";
    }

    return ans;
}

async function seedMockCandidates() {
    console.log("Cleaning old candidates...");
    await new Promise(res => db.run('DELETE FROM candidates', res));
    await new Promise(res => db.run('DELETE FROM answers', res));
    await new Promise(res => db.run('DELETE FROM personality_scores', res));

    console.log("Seeding 5 robust mock candidates...");
    const jobCategoryId = 1;

    const candidates = [
        {
            job: "工程師", name: "李大佑", phone: "0912-345-678", birth_date: "1992-05-15",
            education_school: "國立台灣大學", education_major: "資訊工程學系",
            current_salary_monthly: "85,000", current_salary_annual: "1,100,000",
            expected_salary_monthly: "100,000", expected_salary_annual: "1,400,000",
            driving_license: "汽機車駕照", certifications: "AWS Certified Solutions Architect",
            skills: "React, Node.js, Python, PostgreSQL, Docker",
            leave_reason: "尋求更具挑戰性的架構設計職缺",
            motivation: "貴公司的產品在全球具有高競爭力，希望能貢獻所長",
            career_plan_short: "快速熟悉團隊與系統架構",
            career_plan_mid: "帶領小組完成核心系統微服務化",
            career_plan_long: "成為出色的技術總監",
            dream: "開發出能影響百萬人的軟體產品",
            red: 7, yellow: 3, green: 2, blue: 8, cri: 6
        },
        {
            job: "專案經理", name: "陳又青", phone: "0955-123-987", birth_date: "1995-10-22",
            education_school: "國立政治大學", education_major: "企業管理學系",
            current_salary_monthly: "60,000", current_salary_annual: "850,000",
            expected_salary_monthly: "75,000", expected_salary_annual: "1,000,000",
            driving_license: "無", certifications: "PMP 專案管理師、Google Analytics 認證",
            skills: "專案時程控管、跨部門溝通、數據分析、Jira, Trello",
            leave_reason: "原公司組織異動，職涯發展受限",
            motivation: "欣賞貴公司的創新文化，認為自己的溝通強項能加速專案推進",
            career_plan_short: "在三個月內理解所有開發流程",
            career_plan_mid: "優化目前專案的交付週期",
            career_plan_long: "成為事業群經理",
            dream: "擁有自己的事業，或幫助一間新創公司成為獨角獸",
            red: 4, yellow: 9, green: 6, blue: 3, cri: 8
        },
        {
            job: "設計師", name: "王小明", phone: "0987-654-321", birth_date: "1998-02-10",
            education_school: "國立成功大學", education_major: "工業設計學系",
            current_salary_monthly: "55,000", current_salary_annual: "750,000",
            expected_salary_monthly: "65,000", expected_salary_annual: "900,000",
            driving_license: "機車駕照", certifications: "無",
            skills: "Figma, Adobe XD, Illustrator, Photoshop, UI/UX Design",
            leave_reason: "想尋找更重視使用者體驗的團隊",
            motivation: "貴公司的產品介面非常有質感，希望能加入並帶來更多微互動設計",
            career_plan_short: "熟悉現有 Design System",
            career_plan_mid: "推動全站無障礙 (A11y) 介面設計",
            career_plan_long: "成為 Design Lead",
            dream: "設計出獲得紅點設計大獎的產品",
            red: 3, yellow: 5, green: 8, blue: 5, cri: 7
        },
        {
            job: "資安專家", name: "張志偉", phone: "0911-222-333", birth_date: "1988-11-05",
            education_school: "國立清華大學", education_major: "電機工程學系",
            current_salary_monthly: "120,000", current_salary_annual: "1,800,000",
            expected_salary_monthly: "150,000", expected_salary_annual: "2,200,000",
            driving_license: "汽車駕照", certifications: "Cisco CCNA, CISSP",
            skills: "網路安全、大流量負載均衡、Linux Kernel, C, C++",
            leave_reason: "想要帶領更大規模的研發部門",
            motivation: "看好貴公司在雲端基礎架構上的遠景",
            career_plan_short: "盤點所有技術債與資安漏洞",
            career_plan_mid: "建立零信任架構 (Zero Trust Architecture)",
            career_plan_long: "擔任技術副總 (VP of Engineering)",
            dream: "成為台灣頂尖的資安架構專家",
            red: 9, yellow: 2, green: 2, blue: 8, cri: 5
        },
        {
            job: "行銷企劃", name: "林佳玲", phone: "0966-777-888", birth_date: "1996-07-18",
            education_school: "世新大學", education_major: "公共關係暨廣告學系",
            current_salary_monthly: "45,000", current_salary_annual: "550,000",
            expected_salary_monthly: "55,000", expected_salary_annual: "700,000",
            driving_license: "機車駕照", certifications: "TOEIC 920",
            skills: "社群行銷、文案撰寫、媒體公關、活動企劃",
            leave_reason: "想轉換跑道到更具發展性的科技業",
            motivation: "貴公司的品牌形象很年輕，我有許多創意企劃想在這裡實現",
            career_plan_short: "熟悉產業 Know-how 與競品分析",
            career_plan_mid: "操盤百萬級距的整合行銷專案",
            career_plan_long: "成為行銷總監 (CMO)",
            dream: "能夠透過創意行銷改變世界的消費習慣",
            red: 6, yellow: 8, green: 5, blue: 3, cri: 9
        }
    ];

    for (const c of candidates) {
        const id = uuidv4();

        await new Promise((resolve) => {
            db.run(`INSERT INTO candidates (
                id, name, job_category_id, phone, birth_date, education_school, education_major,
                current_salary_monthly, current_salary_annual, expected_salary_monthly, expected_salary_annual,
                driving_license, certifications, skills, leave_reason, motivation,
                career_plan_short, career_plan_mid, career_plan_long, dream, status
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                [id, c.name, jobCategoryId, c.phone, c.birth_date, c.education_school, c.education_major,
                    c.current_salary_monthly, c.current_salary_annual, c.expected_salary_monthly, c.expected_salary_annual,
                    c.driving_license, c.certifications, c.skills, c.leave_reason, c.motivation,
                    c.career_plan_short, c.career_plan_mid, c.career_plan_long, c.dream, 'completed'],
                resolve);
        });

        // Answer ALL 30 questions
        for (const q of allQuestions) {
            const simulatedAnswer = generateAnswer(c, q.text);
            await new Promise((resolve) => {
                db.run(`INSERT INTO answers (candidate_id, question_code, answer_text) VALUES (?, ?, ?)`,
                    [id, q.id, simulatedAnswer], resolve);
            });
        }

        await new Promise((resolve) => {
            db.run(`INSERT INTO personality_scores (
                candidate_id, red_score, blue_score, yellow_score, green_score, cri_score
            ) VALUES (?, ?, ?, ?, ?, ?)`,
                [id, c.red, c.blue, c.yellow, c.green, c.cri], resolve);
        });

        console.log(`Candidate ${c.name} inserted! Extracting 30 answers. Triggering AI...`);

        // Wait for AI report
        try {
            await aiService.generateAiReport(id);
            console.log(`=> AI Report generated for ${c.name}`);
        } catch (e) {
            console.error(`=> Error generating AI for ${c.name}`, e);
        }
    }

    console.log("All mocked data is complete! Please reload the UI.");
    process.exit(0);
}

seedMockCandidates();
