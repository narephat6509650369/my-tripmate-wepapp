// กำหนด Type สำหรับ Payload ที่ถอดรหัสจาก JWT
export interface JwtPayload {
    user_id: string;
    email: string;
    // อาจมี property อื่นๆ จาก JWT payload เช่น iat, exp
}

// ขยาย Request Interface ของ Express
declare global {
    namespace Express {
        interface Request {
            user?: JwtPayload; // กำหนดให้ req.user เป็น optional (อาจมีหรือไม่มีก็ได้)
        }
    }
}