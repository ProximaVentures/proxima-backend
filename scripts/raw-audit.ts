import pg from 'pg';
import dotenv from 'dotenv';
dotenv.config();

const { Client } = pg;
const connectionString = process.env.DATABASE_URL;

async function audit() {
    const client = new Client({ connectionString });
    await client.connect();
    
    try {
        const res = await client.query('SELECT role, count(*) FROM "User" GROUP BY role');
        console.log('User Roles Distribution:');
        console.table(res.rows);
        
        const pros = await client.query('SELECT id, email FROM "User" WHERE role = \'PROFESSIONAL\' LIMIT 5');
        console.log('Sample Professionals:');
        console.table(pros.rows);

        const clients = await client.query('SELECT id, email FROM "User" WHERE role = \'CLIENT\' LIMIT 5');
        console.log('Sample Clients:');
        console.table(clients.rows);
    } catch (err) {
        console.error(err);
    } finally {
        await client.end();
    }
}

audit();
