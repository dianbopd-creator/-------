require('dotenv').config();
const db = require('./database');
const { v4: uuidv4 } = require('uuid');
const aiService = require('./services/aiService');

// Function to generate 5 fake candidates who have completed the test
async function seedMockCandidates() {
    console.log("Seeding 5 robust mock candidates...");

    // Fallback Job Category
    const jobCategoryId = 1;

    const candidates = [
        {
            name: "李大佑", phone: "0912-345-678", birth_date: "1992-05-15",
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
            red: 7, yellow: 3, green: 2, blue: 8, cri: 6,
            answers: [
                { q: "Q-BE-1", a: "在過去的經驗中，我曾面臨系統高併發導致資料庫死鎖的問題，後來透過優化 Index 以及實作 Redis 快取層解決，效能提升了 400%。" },
                { q: "Q-BE-2", a: "我認為清晰的程式碼架構大於一切，會使用 ESLint + Prettier，並且落實嚴格的 Code Review。" }
            ]
        },
        {
            name: "陳又青", phone: "0955-123-987", birth_date: "1995-10-22",
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
            red: 4, yellow: 9, green: 6, blue: 3, cri: 8,
            answers: [
                { q: "Q-PM-1", a: "遇到跨部門衝突時，我會先拉一場同步會議，釐清雙方真正的痛點，並透過數據來輔助決策，而不是各持己見。" },
                { q: "Q-PM-2", a: "當進度嚴重落後時，我會先確認 MVP (最小可行性產品) 的範圍，砍掉暫時不需要的功能，確保主幹能準時上線。" }
            ]
        },
        {
            name: "王小明", phone: "0987-654-321", birth_date: "1998-02-10",
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
            red: 3, yellow: 5, green: 8, blue: 5, cri: 7,
            answers: [
                { q: "Q-UI-1", a: "當遇到開發說實作困難時，我通常會請他們說明技術瓶頸，接著我會設計出一套折衷但不失體驗的替代方案。" },
                { q: "Q-UI-2", a: "設計的邏輯我都會透過觀察使用者的操作行為數據 (如 Hotjar) 來做驗證，而非只憑直覺。" }
            ]
        },
        {
            name: "張志偉", phone: "0911-222-333", birth_date: "1988-11-05",
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
            red: 9, yellow: 2, green: 2, blue: 8, cri: 5,
            answers: [
                { q: "Q-SRE-1", a: "面對零時差攻擊，我會優先切斷對外依賴網路，啟動備援機制，然後徹查 Log 中的異常封包。" },
                { q: "Q-SRE-2", a: "我們應當將基礎架構全部程式碼化 (IaC)，包含 Terraform 和 Ansible，謝絕手動改動 Server 設定。" }
            ]
        },
        {
            name: "林佳玲", phone: "0966-777-888", birth_date: "1996-07-18",
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
            red: 6, yellow: 8, green: 5, blue: 3, cri: 9,
            answers: [
                { q: "Q-MK-1", a: "如果行銷活動成效不如預期，我會馬上暫停無效的廣告投放，A/B 測試新的素材，並重新定向 (Retargeting) 潛在受眾。" },
                { q: "Q-MK-2", a: "我擅長捕捉社群時事梗，並在 2 小時內產出對應的迷因圖文，這種反應速度是我的最大優勢。" }
            ]
        }
    ];

    for (const c of candidates) {
        const id = uuidv4();

        // 1. Insert Candidate
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

        // 2. Insert Answers
        for (const ans of c.answers) {
            await new Promise((resolve) => {
                db.run(`INSERT INTO answers (candidate_id, question_code, answer_text) VALUES (?, ?, ?)`,
                    [id, ans.q, ans.a], resolve);
            });
        }

        // 3. Insert Personality
        await new Promise((resolve) => {
            db.run(`INSERT INTO personality_scores (
                candidate_id, red_score, blue_score, yellow_score, green_score, cri_score
            ) VALUES (?, ?, ?, ?, ?, ?)`,
                [id, c.red, c.blue, c.yellow, c.green, c.cri], resolve);
        });

        console.log(`Candidate ${c.name} inserted! Triggering AI...`);

        // 4. Trigger AI Service
        await aiService.generateAiReport(id);
    }

    console.log("All 5 robust mock candidates seeded successfully with AI generation!");
    process.exit(0);
}

seedMockCandidates();
