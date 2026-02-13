import 'dotenv/config';
import pg from 'pg';

const connectionString = process.env.DATABASE_URL;
console.log('Testing connection to:', connectionString.replace(/:[^@:]+@/, ':****@'));

const pool = new pg.Pool({
    connectionString,
    ssl: {
        rejectUnauthorized: false
    }
});

pool.connect((err, client, release) => {
    if (err) {
        console.error('Connection error:', err.stack);
        process.exit(1);
    }
    console.log('Successfully connected to the database!');
    client.query('SELECT NOW()', (err, result) => {
        release();
        if (err) {
            console.error('Query error:', err.stack);
            process.exit(1);
        }
        console.log('Query result:', result.rows[0]);
        process.exit(0);
    });
});
