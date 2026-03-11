/**
 * migration_add_permissions.js
 * 
 * 在 Supabase 正式站的 admin_users 資料表新增 permissions_json 欄位。
 * 執行方式：在 backend 目錄下執行 node migration_add_permissions.js
 */

require('dotenv').config({ path: __dirname + '/.env' });
const { Pool } = require('pg');

// 直接使用 Supabase 的連線字串 (從 .env 取得，移除 pgbouncer 參數避免 DDL 衝突)
const connectionString = "postgresql://postgres.nasfchefgkcxeohlspbz:6f9RxP-WvAJBjdh@aws-1-ap-northeast-1.pooler.supabase.com:6543/postgres";

const pool = new Pool({ connectionString, ssl: { rejectUnauthorized: false } });

async function migrate() {
    const client = await pool.connect();
    try {
        console.log('[INFO] 開始資料庫遷移：新增 permissions_json 欄位...');

        // 先確認欄位是否已存在
        const checkResult = await client.query(`
            SELECT column_name FROM information_schema.columns
            WHERE table_name = 'admin_users' AND column_name = 'permissions_json'
        `);

        if (checkResult.rows.length > 0) {
            console.log('[SKIP] permissions_json 欄位已存在，跳過遷移。');
        } else {
            await client.query(`
                ALTER TABLE admin_users 
                ADD COLUMN permissions_json TEXT DEFAULT '[]'
            `);
            console.log('[OK] 成功新增 permissions_json 欄位！');
        }

        // 將所有現有的 superadmin 帳號的 permissions_json 設為特殊標記
        const updateResult = await client.query(`
            UPDATE admin_users 
            SET permissions_json = '["superadmin_full"]'
            WHERE role = 'superadmin' AND (permissions_json IS NULL OR permissions_json = '[]')
        `);
        console.log(`[OK] 已更新 ${updateResult.rowCount} 個 superadmin 帳號的標記。`);

        console.log('[DONE] 遷移完成！現在可以重新部署後端了。');
    } catch (err) {
        console.error('[ERROR] 遷移失敗：', err.message);
        throw err;
    } finally {
        client.release();
        await pool.end();
    }
}

migrate().catch(err => {
    console.error('Fatal error:', err);
    process.exit(1);
});
