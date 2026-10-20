require("dotenv").config({
    path: require("path").join(
        require("os").homedir(),
        ".studentbudget-db.env"
    )
});

const db = require("./db");

async function checkPasswordFormat() {
    try {
        const [rows] = await db.query(`
            SELECT
                CHAR_LENGTH(password_hash) AS hash_length,
                LEFT(password_hash, 4) AS hash_prefix,
                COUNT(*) AS user_count
            FROM user
            GROUP BY
                CHAR_LENGTH(password_hash),
                LEFT(password_hash, 4)
        `);

        console.table(rows);
    } catch (error) {
        console.error("Query failed:", error.message);
    } finally {
        await db.end();
    }
}

checkPasswordFormat();