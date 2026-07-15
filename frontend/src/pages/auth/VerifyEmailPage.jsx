import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { MapPin, CheckCircle, XCircle, Loader2 } from "lucide-react";
import useAuthStore from "../../store/useAuthStore.js";

export default function VerifyEmailPage() {
  const { token } = useParams();
  const { verifyEmail } = useAuthStore();
  const [status, setStatus] = useState("loading"); // loading | success | error
  const [message, setMessage] = useState("");
  const [prevToken, setPrevToken] = useState(token);
  if (token !== prevToken) {
    setPrevToken(token);
    setStatus("loading");
    setMessage("");
  }

  useEffect(() => {
    let isCurrent = true;

    verifyEmail(token)
      .then(() => {
        if (isCurrent) {
          setStatus("success");
        }
      })
      .catch((error) => {
        if (isCurrent) {
          setStatus("error");
          if (!error.response) {
            setMessage("Network error. Please check your connection and try again.");
          } else {
            setMessage(
              error.response.data?.message ||
                "This verification link is invalid or has expired.",
            );
          }
        }
      });

    return () => {
      isCurrent = false;
    };
  }, [token, verifyEmail]);

  return (
    <div className="min-h-screen bg-[#f8fafc] flex items-center justify-center p-6">
      <div className="w-full max-w-100 bg-white rounded-2xl shadow-xl p-8 text-center">
        <div className="flex items-center justify-center gap-2 mb-6">
          <div className="w-8 h-8 rounded-lg bg-[#16a34a] flex items-center justify-center">
            <MapPin size={15} className="text-white" />
          </div>
          <span className="font-bold text-[#0f172a] text-[15px]">
            Smart<span className="text-[#16a34a]">Nepal</span>
          </span>
        </div>

        {status === "loading" && (
          <>
            <Loader2
              size={32}
              className="text-[#16a34a] animate-spin mx-auto mb-4"
            />
            <p className="text-sm text-[#64748b]">Verifying your email…</p>
          </>
        )}

        {status === "success" && (
          <>
            <div className="w-14 h-14 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-4">
              <CheckCircle size={26} className="text-[#16a34a]" />
            </div>
            <h2 className="text-lg font-bold text-[#0f172a] mb-2">
              Email verified
            </h2>
            <p className="text-sm text-[#64748b] mb-6">
              Your account is now fully verified.
            </p>
            <Link
              to="/"
              className="inline-block h-10 px-6 leading-10 rounded-lg bg-[#16a34a] hover:bg-[#15803d] text-white text-sm font-semibold transition-colors"
            >
              Continue to NepalSewa
            </Link>
          </>
        )}

        {status === "error" && (
          <>
            <div className="w-14 h-14 rounded-full bg-red-50 flex items-center justify-center mx-auto mb-4">
              <XCircle size={26} className="text-red-500" />
            </div>
            <h2 className="text-lg font-bold text-[#0f172a] mb-2">
              Verification failed
            </h2>
            <p className="text-sm text-[#64748b]">{message}</p>
          </>
        )}
      </div>
    </div>
  );
}
