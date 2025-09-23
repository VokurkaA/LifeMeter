import {Pool} from 'pg';

export const config = {
    user: process.env.DB_USER,
    host: process.env.DB_HOST || 'localhost',
    password: process.env.DB_PASSWORD,
    dbName: process.env.DB_NAME,
    port: parseInt(process.env.DB_PORT || '5432')
};

export const pool = new Pool({
    user: config.user,
    host: config.host,
    database: config.dbName,
    password: config.password,
    port: config.port,
    max: 20,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 2000
});

pool.on('error', (err) => {
    console.error('Unexpected error on idle client', err);
    process.exit(-1);
});

(async () => {
    try {
        await pool.query('SELECT 1');
        console.log('Database connection successful');
    } catch (error) {
        console.error('Error executing query', error);
    }
})();