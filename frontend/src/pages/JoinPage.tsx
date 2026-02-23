import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import tripService from "../services/tripService";

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
      setError("Invalid invite link");
      setLoading(false);
      return;
    }

    //รอ AuthContext โหลดก่อน
    if (auth.isLoading) return;

    //ถ้ายังไม่ login → redirect ไป login
    if (!auth.isAuthenticated) {
      const loginUrl = `/login?redirect=/join/${inviteCode}`;
      console.log("Redirecting to:", loginUrl);
      navigate(loginUrl);
      return;
    }


    //login แล้ว → เริ่ม join
  const doJoin = async () => {
  try {
  const res = await tripService.joinTrip(inviteCode);

  if (res.success) {
    navigate("/homepage", {
      state: { joinSuccess: true }
    });
  } else {
    navigate("/homepage", {
      state: {
        joinError: res.message
      }
    });
  }

} catch (err: any) {
  navigate("/homepage", {
    state: {
      joinError: err?.response?.data?.message || "Cannot join trip"
    }
  });
}

};


    doJoin();

  }, [auth.isLoading, auth.isAuthenticated, inviteCode, navigate]);

  if (loading) {
    return <div style={{ padding: 20 }}>Joining trip...</div>;
  }

  if (error) {
    return (
      <div style={{ padding: 20 }}>
        <h3>Error</h3>
        <p>{error}</p>
      </div>
    );
  }

  return null;
};

export default JoinPage;
