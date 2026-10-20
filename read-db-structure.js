require('dotenv').config({
    path: require('path').join(
        require('os').homedir(),
        '.studentbudget-db.env'
    )
});

const db = require('./db');

async function inspectDatabase() {
    try {
        const [tables] = await db.query('SHOW TABLES');

        console.log('\nDATABASE TABLES:');

        for (const table of tables) {
            const tableName = Object.values(table)[0];

            console.log(`\n--- ${tableName} ---`);

            const [columns] = await db.query(
                'SHOW COLUMNS FROM ??',
                [tableName]
            );

            columns.forEach(column => {
                console.log(
                    `${column.Field} | ${column.Type} | Null: ${column.Null} | Key: ${column.Key}`
                );
            });
        }
    } catch (error) {
        console.error('Database inspection failed:', error.message);
        process.exitCode = 1;
    } finally {
        await db.end();
    }
}

inspectDatabase();