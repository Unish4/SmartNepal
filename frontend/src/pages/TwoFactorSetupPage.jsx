import { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import {
  ShieldCheck,
  ShieldOff,
  Loader2,
  Copy,
  Check,
  AlertTriangle,
} from "lucide-react";
import useAuthStore from "../store/useAuthStore.js";
import { requiresTwoFactor } from "../constants/twoFactor.js";

export default function TwoFactorSetupPage() {
  const navigate = useNavigate();
  const {
    user,
    getTwoFactorStatus,
    setupTwoFactor,
    verifySetupTwoFactor,
    disableTwoFactor,
  } = useAuthStore();

  const [status, setStatus] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  // Setup flow state
  const [setupData, setSetupData] = useState(null); // { qrCodeDataUrl, manualEntryKey }
  const [setupCode, setSetupCode] = useState("");
  const [backupCodes, setBackupCodes] = useState(null);
  const [copiedCodes, setCopiedCodes] = useState(false);

  // Disable flow state
  const [showDisable, setShowDisable] = useState(false);
  const [disablePassword, setDisablePassword] = useState("");
  const [disableCode, setDisableCode] = useState("");

  const [isSubmitting, setIsSubmitting] = useState(false);

  const loadStatus = useCallback(() => {
    getTwoFactorStatus()
      .then(setStatus)
      .catch(() => {})
      .finally(() => setIsLoading(false));
  }, [getTwoFactorStatus]);

  useEffect(() => {
    if (user && !requiresTwoFactor(user)) {
      navigate("/profile");
      return;
    }
    loadStatus();
  }, [user, loadStatus, navigate]);

  const startSetup = async () => {
    setIsSubmitting(true);
    try {
      const res = await setupTwoFactor();
      setSetupData(res);
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to start setup");
    } finally {
      setIsSubmitting(false);
    }
  };

  const confirmSetup = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const res = await verifySetupTwoFactor(setupCode);
      setBackupCodes(res.backupCodes);
      loadStatus();
    } catch (error) {
      toast.error(error.response?.data?.message || "Invalid code");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDisable = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await disableTwoFactor(disablePassword, disableCode);
      toast.success("Two-factor authentication disabled");
      setShowDisable(false);
      loadStatus();
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to disable");
    } finally {
      setIsSubmitting(false);
    }
  };

  const copyBackupCodes = async () => {
    try {
      await navigator.clipboard.writeText(backupCodes.join("\n"));
      setCopiedCodes(true);
      setTimeout(() => setCopiedCodes(false), 2000);
    } catch {
      toast.error("Could not copy backup codes");
    }
  };
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="animate-spin text-[#16a34a]" />
      </div>
    );
  }

  // ── Backup codes reveal — shown exactly once, right after setup completes ──
  if (backupCodes) {
    return (
      <div className="min-h-screen bg-[#f8fafc] flex items-center justify-center p-6">
        <div className="w-full max-w-md bg-white rounded-2xl shadow-xl p-8">
          <div className="flex items-center gap-2 mb-4">
            <ShieldCheck size={20} className="text-[#16a34a]" />
            <h1 className="text-lg font-bold text-[#0f172a]">
              Save your backup codes
            </h1>
          </div>
          <p className="text-sm text-[#64748b] mb-4">
            Each code can be used once if you lose access to your authenticator
            app. Store them somewhere safe — they won't be shown again.
          </p>
          <div className="bg-[#f8fafc] border border-[#e2e8f0] rounded-lg p-4 grid grid-cols-2 gap-2 font-mono text-sm mb-4">
            {backupCodes.map((code) => (
              <span key={code} className="text-[#0f172a]">
                {code}
              </span>
            ))}
          </div>
          <button
            onClick={copyBackupCodes}
            className="w-full h-10 rounded-lg border border-[#e2e8f0] text-sm font-medium
              text-[#475569] hover:bg-[#f8fafc] transition-colors flex items-center justify-center gap-2 mb-3"
          >
            {copiedCodes ? (
              <>
                <Check size={14} /> Copied
              </>
            ) : (
              <>
                <Copy size={14} /> Copy all codes
              </>
            )}
          </button>
          <button
            onClick={() => {
              setBackupCodes(null);
              setSetupData(null);
              navigate("/profile");
            }}
            className="w-full h-11 rounded-lg bg-[#16a34a] hover:bg-[#15803d] text-white font-semibold text-sm transition-colors"
          >
            I've saved my codes — continue
          </button>
        </div>
      </div>
    );
  }

  const required = status?.required || requiresTwoFactor(user);
  const enabled = status?.enabled;

  return (
    <div className="min-h-screen bg-[#f8fafc] flex items-center justify-center p-6">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-xl p-8">
        <div className="flex items-center gap-2 mb-2">
          {enabled ? (
            <ShieldCheck size={20} className="text-[#16a34a]" />
          ) : (
            <ShieldOff size={20} className="text-amber-500" />
          )}
          <h1 className="text-lg font-bold text-[#0f172a]">
            Two-Factor Authentication
          </h1>
        </div>

        {required && !enabled && (
          <div className="flex items-start gap-2.5 bg-amber-50 border-l-4 border-amber-400 rounded-lg px-3.5 py-3 mb-5">
            <AlertTriangle
              size={14}
              className="text-amber-600 shrink-0 mt-0.5"
            />
            <p className="text-xs text-amber-700">
              Your role requires two-factor authentication. You won't be able to
              access admin or field actions until setup is complete.
            </p>
          </div>
        )}

        {enabled ? (
          !showDisable ? (
            <>
              <p className="text-sm text-[#64748b] mb-6">
                Two-factor authentication is currently{" "}
                <span className="font-semibold text-[#16a34a]">enabled</span> on
                your account.
              </p>
              <button
                onClick={() => setShowDisable(true)}
                className="w-full h-11 rounded-lg border border-red-200 text-red-600 font-semibold text-sm hover:bg-red-50 transition-colors"
              >
                Disable two-factor authentication
              </button>
            </>
          ) : (
            <form onSubmit={handleDisable} className="space-y-4">
              <p className="text-sm text-[#64748b]">
                Confirm your password and current code to disable.
              </p>
              <input
                type="password"
                placeholder="Current password"
                value={disablePassword}
                onChange={(e) => setDisablePassword(e.target.value)}
                className="w-full h-10 px-3 rounded-lg border border-[#e2e8f0] text-sm outline-none focus:border-[#16a34a]"
              />
              <input
                type="text"
                placeholder="6-digit code or backup code"
                value={disableCode}
                onChange={(e) => setDisableCode(e.target.value)}
                className="w-full h-10 px-3 rounded-lg border border-[#e2e8f0] text-sm outline-none focus:border-[#16a34a]"
              />
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setShowDisable(false)}
                  className="flex-1 h-10 rounded-lg border border-[#e2e8f0] text-sm font-medium text-[#475569]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex-1 h-10 rounded-lg bg-red-600 hover:bg-red-700 text-white text-sm font-semibold disabled:opacity-50"
                >
                  {isSubmitting ? "..." : "Disable"}
                </button>
              </div>
            </form>
          )
        ) : !setupData ? (
          <>
            <p className="text-sm text-[#64748b] mb-6">
              Add an extra layer of security using an authenticator app like
              Google Authenticator or Authy.
            </p>
            <button
              onClick={startSetup}
              disabled={isSubmitting}
              className="w-full h-11 rounded-lg bg-[#16a34a] hover:bg-[#15803d] text-white font-semibold text-sm transition-colors disabled:opacity-50"
            >
              {isSubmitting ? "Starting…" : "Set up two-factor authentication"}
            </button>
          </>
        ) : (
          <form onSubmit={confirmSetup}>
            <p className="text-sm text-[#64748b] mb-4">
              Scan this QR code with your authenticator app:
            </p>
            <img
              src={setupData.qrCodeDataUrl}
              alt="2FA QR code"
              className="mx-auto mb-4 w-44 h-44"
            />
            <p className="text-xs text-[#94a3b8] text-center mb-4">
              Can't scan? Enter this key manually: <br />
              <span className="font-mono text-[#0f172a]">
                {setupData.manualEntryKey}
              </span>
            </p>
            <input
              type="text"
              autoFocus
              placeholder="Enter the 6-digit code"
              value={setupCode}
              onChange={(e) => setSetupCode(e.target.value)}
              className="w-full h-11 px-3 text-center text-lg tracking-widest rounded-lg border
                border-[#e2e8f0] outline-none focus:border-[#16a34a] mb-4"
            />
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full h-11 rounded-lg bg-[#16a34a] hover:bg-[#15803d] text-white font-semibold text-sm disabled:opacity-50"
            >
              {isSubmitting ? "Verifying…" : "Confirm and enable"}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}

