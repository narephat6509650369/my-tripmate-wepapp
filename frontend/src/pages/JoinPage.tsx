import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import tripService from "../services/tripService";

// Helper function แปล message → ภาษาไทย
const getUserFriendlyMessage = (message?: string, code?: string): string => {
  const msg = (message || "").toLowerCase();

  if (msg.includes("already") || msg.includes("member"))
    return "คุณเป็นสมาชิกของทริปนี้แล้ว";
  if (msg.includes("not found") || msg.includes("invalid"))
    return "ไม่พบทริปนี้ หรือรหัสเชิญไม่ถูกต้อง";
  if (msg.includes("full"))
    return "ทริปนี้มีสมาชิกเต็มแล้ว";
  if (msg.includes("closed") || msg.includes("expired"))
    return "ลิงก์เชิญนี้หมดอายุแล้ว";

  return "ไม่สามารถเข้าร่วมทริปได้ กรุณาลองใหม่อีกครั้ง";
};

const JoinPage = () => {
  const navigate = useNavigate();
  const { inviteCode } = useParams();
  const auth = useAuth();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    console.log("inviteCode:", inviteCode);
    console.log("isLoading:", auth.isLoading);
    console.log("isAuthenticated:", auth.isAuthenticated);

    if (!inviteCode) {
      setError("ไม่พบรหัสเชิญ กรุณาตรวจสอบลิงก์อีกครั้ง");
      setLoading(false);
      return;
    }

    // รอ AuthContext โหลดก่อน
    if (auth.isLoading) return;

    // ถ้ายังไม่ login → redirect ไป login
    if (!auth.isAuthenticated) {
      const loginUrl = `/login?redirect=/join/${inviteCode}`;
      console.log("Redirecting to:", loginUrl);
      navigate(loginUrl);
      return;
    }

    // login แล้ว → เริ่ม join
    const doJoin = async () => {
      try {
        const res = await tripService.requestToJoin(inviteCode);

        if (res.success) {
          navigate("/homepage", {
            state: { joinSuccess: false, joinPending: true }
          });
        } else {
          // แปลง message จาก Backend → ภาษาไทยก่อนส่งไปแสดง
          const userMessage = getUserFriendlyMessage(res.message, res.code);
          navigate("/homepage", {
            state: { joinError: userMessage }
          });
        }

      } catch (err: any) {
        // ไม่ส่ง err.message ตรง ๆ ให้ User
        navigate("/homepage", {
          state: {
            joinError: "ไม่สามารถเข้าร่วมทริปได้ กรุณาลองใหม่อีกครั้ง"
          }
        });
      }
    };

    doJoin();

  }, [auth.isLoading, auth.isAuthenticated, inviteCode, navigate]);

  if (loading && !error) {
    return (
      <div style={{ padding: 20, textAlign: "center" }}>
        <p>กำลังเข้าร่วมทริป...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ padding: 20, textAlign: "center" }}>
        <p style={{ color: "#c33" }}>{error}</p>
        <button onClick={() => navigate("/homepage")}>
          กลับหน้าหลัก
        </button>
      </div>
    );
  }

  return null;
};

export default JoinPage;