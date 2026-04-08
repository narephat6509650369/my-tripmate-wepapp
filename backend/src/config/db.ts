import dotenv from 'dotenv';
import mysql, { type PoolOptions } from 'mysql2/promise';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

dotenv.config();

// สร้าง __dirname สำหรับ ES Modules (เนื่องจากไฟล์นี้อยู่ใน src/config)
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);


const sslCertPath = path.resolve(__dirname, '../../isrgrootx1.pem');

const dbConfig: PoolOptions = {
  host: process.env.DB_HOST as string,
  user: process.env.DB_USER as string,
  password: process.env.DB_PASSWORD as string,
  database: process.env.DB_NAME as string,
  port: Number(process.env.DB_PORT) || 4000,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  enableKeepAlive: true,     
  keepAliveInitialDelay: 10000,
  ssl: {
    ca: fs.readFileSync(sslCertPath), 
  },
};

export const pool = mysql.createPool(dbConfig);

// ทดสอบการเชื่อมต่อ
pool.getConnection()
  .then((connection) => {
    console.log('✅ Successfully connected to TiDB Cloud!');
    connection.release();
  })
  .catch((err) => {
    console.error('❌ TiDB Connection Error:', err.message);
  });