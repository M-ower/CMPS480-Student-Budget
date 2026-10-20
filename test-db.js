require('dotenv').config({
    path: require('path').join(
        require('os').homedir(),
        '.studentbudget-db.env'
    )
});

const db = require('./db');

async function testConnection() {
    try {
        const [rows] = await db.query('SELECT 1 AS connected');
        console.log('MySQL connection successful!', rows);
    } catch (error) {
        console.error('Connection failed:', error.message);
    } finally {
        await db.end();
    }
}

testConnection();