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
    if (!inviteCode) {
      setError("Invalid invite link");
      setLoading(false);
      return;
    }

    // ถ้ายังไม่ได้ login → redirect ไป login พร้อม redirect กลับหลัง login
    if (!auth.isAuthenticated) {
      navigate(`/login?redirect=/join/${inviteCode}`);
      return;
    }

    // login แล้ว → เริ่ม join trip
    const doJoin = async () => {
      try {
        const res = await tripService.joinTrip(inviteCode);

        if (res.success) {
          const tripId = res.data?.trip_id;
          if (tripId) {
            navigate(`/trip/${tripId}`);
            return;
          }
          navigate("/trips");
          return;
        }

        // ถ้า join ซ้ำ เช่น already joined หรือ member already exists
        if (res.code === "ALREADY_JOINED" || res.code === "MEMBER_EXISTS") {
          const tripId = res.data?.trip_id;
          if (tripId) {
            navigate(`/trip/${tripId}`);
          } else {
            navigate("/trips");
          }
          return;
        }

        // invalid code / expired / not found
        setError(res.message || "Invite link invalid or expired");

      } catch (err) {
        console.error(err);
        setError("Failed to join trip. Please try again later.");
      } finally {
        setLoading(false);
      }
    };

    doJoin();
  }, [auth.isAuthenticated, inviteCode, navigate]);

  if (loading) {
    return (
      <div style={{ padding: 20 }}>
        Joining trip...
      </div>
    );
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
