const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const bcrypt = require('bcrypt');

const dbPath = path.resolve(__dirname, 'database.sqlite');
const db = new sqlite3.Database(dbPath, (err) => {
    if (err) {
        console.error('Error opening database', err.message);
        return;
    }

    const saltRounds = 10;
    const newPassword = 'Aa880213!?';

    bcrypt.hash(newPassword, saltRounds, (err, hash) => {
        if (err) {
            console.error('Encryption error:', err.message);
            return;
        }

        db.run(
            `UPDATE admin_users SET password_hash = ? WHERE username = 'admin'`,
            [hash],
            function (err) {
                if (err) {
                    console.error('Failed to update admin password:', err.message);
                } else if (this.changes > 0) {
                    console.log('Successfully updated the default admin password.');
                } else {
                    console.log('Admin user not found, nothing to update.');
                }

                // Also update the database.js seed file logic
                const fs = require('fs');
                const dbFile = path.resolve(__dirname, 'database.js');
                let dbContent = fs.readFileSync(dbFile, 'utf8');
                dbContent = dbContent.replace(/bcrypt\.hash\('admin123'/g, `bcrypt.hash('Aa880213!?'`);
                fs.writeFileSync(dbFile, dbContent);
                console.log('Successfully updated default seed password in database.js');

                db.close();
            }
        );
    });
});
