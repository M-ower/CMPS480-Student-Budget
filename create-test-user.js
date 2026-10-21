require("dotenv").config({
    path: require("path").join(
        require("os").homedir(),
        ".studentbudget-db.env"
    )
});

const bcrypt = require("bcryptjs");
const db = require("./db");

async function createTestUser() {
    const email = process.env.TEST_EMAIL;
    const password = process.env.TEST_PASSWORD;

    if (!email || !password || password.length < 12) {
        console.error("Set TEST_EMAIL and TEST_PASSWORD (at least 12 characters).");
        process.exitCode = 1;
        await db.end();
        return;
    }

    try {
        const hash = await bcrypt.hash(password, 12);

        await db.execute(
            `INSERT INTO user
                (email, password_hash, first_name, last_name, created_at)
             VALUES (?, ?, ?, ?, NOW())
             ON DUPLICATE KEY UPDATE password_hash = ?`,
            [email, hash, "Test", "Student", hash]
        );

        console.log("Test account created or updated.");
    } catch (error) {
        console.error("Test account error:", error.message);
        process.exitCode = 1;
    } finally {
        await db.end();
    }
}

createTestUser();
