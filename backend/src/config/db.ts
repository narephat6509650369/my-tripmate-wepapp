import { env } from "process";

import mysql from 'mysql2/promise';

export const pool = mysql.createPool({
  host: 'localhost',
  user: 'root',
  password: env.DB_PASSWORD || '',
  database: env.DB_NAME || 'tripmate',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

export default pool;
