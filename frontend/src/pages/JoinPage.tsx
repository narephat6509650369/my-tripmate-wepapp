import { useEffect, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import tripService from "../services/tripService";

const JoinPage = () => {
  const navigate = useNavigate();
  const { inviteCode } = useParams();
  const auth = useAuth();
  const hasJoined = useRef(false);

  const [status, setStatus] = useState<"loading" | "error">("loading");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    if (!inviteCode) {
      setErrorMsg("ลิงก์เชิญไม่ถูกต้อง");
      setStatus("error");
      return;
    }

    //รอ AuthContext โหลดก่อน
    if (auth.isLoading) return;

    //ถ้ายังไม่ login → redirect ไป login
    if (!auth.isAuthenticated) {
      navigate(`/login?redirect=/join/${inviteCode}`);
      return;
    }

    if (hasJoined.current) return;
    hasJoined.current = true;

    //login แล้ว → เริ่ม join
    const doJoin = async () => {
      try {
        const res = await tripService.requestToJoin(inviteCode);

        if (res.success) {
          navigate("/homepage", {
            state: { joinPending: true },
            replace: true
          });
        } else {
          navigate("/homepage", {
            state: { joinError: res.message || "ไม่สามารถส่งคำขอได้" },
            replace: true
          });
        }
      } catch (err: any) {
        navigate("/homepage", {
          state: { joinError: "เกิดข้อผิดพลาด กรุณาลองใหม่" },
          replace: true
        });
      }
    };

    doJoin();
  }, [auth.isLoading, auth.isAuthenticated, inviteCode, navigate]);

  // Error state
  if (status === "error") {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 flex items-center justify-center">
        <div className="bg-white rounded-xl shadow-lg p-8 max-w-sm w-full text-center">
          <div className="text-5xl mb-4">❌</div>
          <h2 className="text-xl font-bold text-gray-800 mb-2">เกิดข้อผิดพลาด</h2>
          <p className="text-gray-500 mb-6">{errorMsg}</p>
          <button
            onClick={() => navigate("/homepage")}
            className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition"
          >
            กลับหน้าหลัก
          </button>
        </div>
      </div>
    );
  }

  // Loading state
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 flex items-center justify-center">
      <div className="bg-white rounded-xl shadow-lg p-8 max-w-sm w-full text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4" />
        <p className="text-gray-500">กำลังเข้าร่วมทริป...</p>
      </div>
    </div>
  );
};

export default JoinPage;