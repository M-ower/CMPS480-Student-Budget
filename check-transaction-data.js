require("dotenv").config({
    path: require("path").join(
        require("os").homedir(),
        ".studentbudget-db.env"
    )
});

const db = require("./db");

async function checkData() {
    try {
        const [categories] = await db.query(
            "SELECT category_id, name, type FROM categories ORDER BY category_id"
        );

        const [users] = await db.query(
            "SELECT user_id FROM user ORDER BY user_id"
        );

        console.log("\nCATEGORIES:");
        console.table(categories);

        console.log("\nUSER IDS:");
        console.table(users);
    } catch (error) {
        console.error("Database query failed:", error.message);
        process.exitCode = 1;
    } finally {
        await db.end();
    }
}

checkData();