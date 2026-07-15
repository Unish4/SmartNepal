import { useEffect, useState } from "react";
import { HardHat, Plus, X, Loader2 } from "lucide-react";
import toast from "react-hot-toast";
import {
  fetchFieldWorkers,
  createFieldWorkerRequest,
} from "../../services/adminService.js";
import { FIELD_DEPARTMENTS } from "../../constants/issue.js";
import { timeAgo } from "../../utils/timeAgo.js";
import { PROVINCES } from "../../constants/province.js";
import useAuthStore from "../../store/useAuthStore.js";

const INPUT_CLS =
  "w-full h-10 px-3 rounded-lg border border-[#e2e8f0] text-sm text-[#0f172a] " +
  "placeholder:text-[#94a3b8] outline-none focus:border-[#16a34a] " +
  "focus:ring-2 focus:ring-[#16a34a]/15 transition-all bg-white";

const AdminFieldWorkersPage = () => {
  const [fieldWorkers, setFieldWorkers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  const { user } = useAuthStore();
  const isSuperAdmin = user?.role === "super_admin";

  const [formOpen, setFormOpen] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    department: "",
    phone: "",
    province: isSuperAdmin ? "" : user?.jurisdiction?.province || "",
    district: isSuperAdmin ? "" : user?.jurisdiction?.district || "",
  });

  const loadFieldWorkers = async () => {
    setIsLoading(true);
    try {
      const res = await fetchFieldWorkers();
      setFieldWorkers(res.fieldWorkers);
    } catch {
      setError("Failed to load field workers");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    // call async loader inside effect to avoid setting state synchronously in effect body
    (async () => {
      await loadFieldWorkers();
    })();
  }, []);

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!form.name || !form.email || !form.password || !form.department || !form.province || !form.district) {
      toast.error("Please fill in all required fields");
      return;
    }
    setIsCreating(true);
    try {
      await createFieldWorkerRequest(form);
      toast.success("Field worker account created");
      setForm({ name: "", email: "", password: "", department: "", phone: "" });
      setFormOpen(false);
      loadFieldWorkers();
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to create account");
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-[#0f172a] tracking-tight">
            Field Workers
          </h1>
          <p className="text-sm text-[#64748b] mt-1">
            {fieldWorkers.length} crew member
            {fieldWorkers.length !== 1 ? "s" : ""} registered
          </p>
        </div>
        <button
          onClick={() => setFormOpen((v) => !v)}
          className="flex items-center gap-2 bg-[#16a34a] hover:bg-[#15803d]
            text-white text-sm font-semibold px-4 py-2.5 rounded-lg
            transition-colors shadow-sm"
        >
          {formOpen ? <X size={16} /> : <Plus size={16} />}
          {formOpen ? "Cancel" : "Add Field Worker"}
        </button>
      </div>

      {/* Inline create form */}
      {formOpen && (
        <form
          onSubmit={handleCreate}
          className="bg-white rounded-xl border border-[#e2e8f0] shadow-sm p-5 mb-5"
        >
          <h2 className="text-sm font-semibold text-[#0f172a] mb-4">
            New Field Worker Account
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-xs font-semibold text-[#475569] mb-1.5">
                Full name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="Enter full name"
                className={INPUT_CLS}
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-[#475569] mb-1.5">
                Department <span className="text-red-500">*</span>
              </label>
              <select
                value={form.department}
                onChange={(e) =>
                  setForm({ ...form, department: e.target.value })
                }
                className={`${INPUT_CLS} cursor-pointer`}
              >
                <option value="">Select department</option>
                {FIELD_DEPARTMENTS.map((d) => (
                  <option key={d} value={d}>
                    {d}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-[#475569] mb-1.5">
                Email <span className="text-red-500">*</span>
              </label>
              <input
                type="email"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                placeholder="Enter email address"
                className={INPUT_CLS}
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-[#475569] mb-1.5">
                Temporary password <span className="text-red-500">*</span>
              </label>
              <input
                type="password"
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                placeholder="Min 6 characters"
                className={INPUT_CLS}
              />{" "}
            </div>
            <div>
              <label className="block text-xs font-semibold text-[#475569] mb-1.5">
                Phone{" "}
                <span className="text-[#94a3b8] font-normal">(optional)</span>
              </label>
              <input
                type="tel"
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
                placeholder="98XXXXXXXX"
                className={INPUT_CLS}
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-[#475569] mb-1.5">
                Province <span className="text-red-500">*</span>
              </label>
              <select
                value={form.province}
                onChange={(e) =>
                  setForm({ ...form, province: e.target.value, district: "" })
                }
                disabled={!isSuperAdmin}
                className={`${INPUT_CLS} cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed`}
              >
                <option value="">Select province</option>
                {Object.keys(PROVINCES).map((p) => (
                  <option key={p} value={p}>
                    {p}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-[#475569] mb-1.5">
                District <span className="text-red-500">*</span>
              </label>
              <select
                value={form.district}
                onChange={(e) => setForm({ ...form, district: e.target.value })}
                disabled={!isSuperAdmin || !form.province}
                className={`${INPUT_CLS} cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed`}
              >
                <option value="">Select district</option>
                {(form.province ? PROVINCES[form.province] : []).map((d) => (
                  <option key={d} value={d}>
                    {d}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <button
            type="submit"
            disabled={isCreating}
            className="flex items-center gap-2 h-10 px-5 bg-[#16a34a]
              hover:bg-[#15803d] text-white text-sm font-semibold rounded-lg
              transition-colors disabled:opacity-50"
          >
            {isCreating ? (
              <>
                <Loader2 size={14} className="animate-spin" /> Creating…
              </>
            ) : (
              "Create Account"
            )}
          </button>
        </form>
      )}

      {error && (
        <div
          className="bg-red-50 border-l-4 border-red-500 text-red-700
          text-sm rounded-lg p-4 mb-4"
        >
          {error}
        </div>
      )}

      {/* Table */}
      <div className="bg-white rounded-xl border border-[#e2e8f0] shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full min-w-140">
            <thead>
              <tr className="border-b border-[#e2e8f0] bg-[#f8fafc]">
                {["Field Worker", "Department", "Email", "Phone", "Joined"].map(
                  (h) => (
                    <th
                      key={h}
                      className="text-left text-[10px] font-semibold
                    text-[#94a3b8] uppercase tracking-widest px-4 py-3 whitespace-nowrap"
                    >
                      {h}
                    </th>
                  ),
                )}
              </tr>
            </thead>
            <tbody className="divide-y divide-[#f8fafc]">
              {isLoading ? (
                Array.from({ length: 4 }).map((_, i) => (
                  <tr key={i} className="animate-pulse">
                    {Array.from({ length: 5 }).map((__, j) => (
                      <td key={j} className="px-4 py-3.5">
                        <div className="h-4 bg-[#f1f5f9] rounded" />
                      </td>
                    ))}
                  </tr>
                ))
              ) : fieldWorkers.length > 0 ? (
                fieldWorkers.map((fw) => (
                  <tr
                    key={fw._id}
                    className="hover:bg-[#f8fafc] transition-colors"
                  >
                    <td className="px-4 py-3.5">
                      <div className="flex items-center gap-2.5">
                        <div
                          className="w-8 h-8 rounded-full bg-[#f0fdf4] border
                          border-[#bbf7d0] flex items-center justify-center shrink-0"
                        >
                          <span className="text-xs font-bold text-[#16a34a]">
                            {fw.name?.[0]?.toUpperCase()}
                          </span>
                        </div>
                        <p className="text-sm font-semibold text-[#0f172a] whitespace-nowrap">
                          {fw.name}
                        </p>
                      </div>
                    </td>
                    <td className="px-4 py-3.5 whitespace-nowrap">
                      <span
                        className="text-xs font-medium text-[#16a34a]
                        bg-[#f0fdf4] border border-[#bbf7d0] px-2.5 py-1 rounded-full"
                      >
                        {fw.department}
                      </span>
                    </td>
                    <td className="px-4 py-3.5">
                      <p className="text-sm text-[#475569]">{fw.email}</p>
                    </td>
                    <td className="px-4 py-3.5 whitespace-nowrap">
                      <p className="text-sm text-[#64748b]">
                        {fw.phone ? `+977 ${fw.phone}` : "—"}
                      </p>
                    </td>
                    <td className="px-4 py-3.5 whitespace-nowrap">
                      <p className="text-xs text-[#94a3b8]">
                        {timeAgo(fw.createdAt)}
                      </p>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={5} className="px-4 py-16 text-center">
                    <HardHat
                      size={28}
                      className="text-[#e2e8f0] mx-auto mb-2"
                    />
                    <p className="text-sm text-[#94a3b8]">
                      No field workers added yet
                    </p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default AdminFieldWorkersPage;
