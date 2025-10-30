import mysql from "mysql2/promise";
import dotenv from "dotenv";
import { dirname, join } from "path/win32";
import { fileURLToPath } from "url";


// แปลง import.meta.url → __dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// โหลด .env
dotenv.config({ path: join(__dirname, "../.env") });

export const pool = mysql.createPool({
  host: process.env.DB_HOST as string,
  user: process.env.DB_USER as string,
  password: process.env.DB_PASSWORD as string,
  database: process.env.DB_NAME as string,
  port: Number(process.env.DB_PORT) || 3306,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
});

export async function testConnection() {
  try {
    const connection = await pool.getConnection();
    console.log("Database connected successfully.");
    connection.release();
  } catch (err) {
    console.error("Unable to connect to the database:", err);
  }
 }
