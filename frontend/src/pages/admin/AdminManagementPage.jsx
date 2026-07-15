import { useEffect, useState } from "react";
import {
  ShieldPlus,
  Plus,
  X,
  Loader2,
  AlertTriangle,
  Pencil,
} from "lucide-react";
import toast from "react-hot-toast";
import {
  fetchAdmins,
  createAdminRequest,
  updateAdminJurisdictionRequest,
} from "../../services/adminService.js";
import { PROVINCES } from "../../constants/province.js";
import { timeAgo } from "../../utils/timeAgo.js";

const INPUT_CLS =
  "w-full h-10 px-3 rounded-lg border border-[#e2e8f0] text-sm text-[#0f172a] placeholder:text-[#94a3b8] outline-none focus:border-[#16a34a] focus:ring-2 focus:ring-[#16a34a]/15 transition-all bg-white";

const AdminManagementPage = () => {
  const [admins, setAdmins] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [formOpen, setFormOpen] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [editForm, setEditForm] = useState({ province: "", district: "" });

  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    province: "",
    district: "",
  });
  const districts = form.province ? (PROVINCES[form.province] ?? []) : [];

  const load = (showLoading = true) => {
    if (showLoading) setIsLoading(true);
    fetchAdmins()
      .then((res) => setAdmins(res.admins))
      .catch(() => toast.error("Failed to load admin accounts"))
      .finally(() => setIsLoading(false));
  };
  useEffect(() => {
    Promise.resolve().then(() => load(false));
  }, []);

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!form.name || !form.email || !form.password || !form.province) {
      toast.error("Please fill in all required fields");
      return;
    }
    setIsCreating(true);
    try {
      await createAdminRequest(form);
      toast.success("Admin account created");
      setForm({
        name: "",
        email: "",
        password: "",
        province: "",
        district: "",
      });
      setFormOpen(false);
      load();
    } catch (error) {
      toast.error(
        error.response?.data?.message || "Failed to create admin account",
      );
    } finally {
      setIsCreating(false);
    }
  };

  const startEditing = (admin) => {
    setEditingId(admin._id);
    setEditForm({
      province: admin.jurisdiction?.province || "",
      district: admin.jurisdiction?.district || "",
    });
  };

  const saveJurisdiction = async (adminId) => {
    if (!editForm.province) {
      toast.error("Province is required");
      return;
    }
    try {
      await updateAdminJurisdictionRequest(adminId, editForm);
      toast.success("Jurisdiction updated");
      setEditingId(null);
      load();
    } catch (error) {
      toast.error(
        error.response?.data?.message || "Failed to update jurisdiction",
      );
    }
  };

  const unconfiguredCount = admins.filter(
    (a) => a.role === "admin" && !a.jurisdiction?.province,
  ).length;

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-[#0f172a] tracking-tight">
            Admin Accounts
          </h1>
          <p className="text-sm text-[#64748b] mt-1">
            {admins.length} admin account{admins.length !== 1 ? "s" : ""} ·
            manage municipality assignments
          </p>
        </div>
        <button
          onClick={() => setFormOpen((v) => !v)}
          className="flex items-center gap-2 bg-[#16a34a] hover:bg-[#15803d] text-white text-sm font-semibold px-4 py-2.5 rounded-lg transition-colors shadow-sm"
        >
          {formOpen ? <X size={16} /> : <Plus size={16} />}
          {formOpen ? "Cancel" : "Add Admin"}
        </button>
      </div>

      {unconfiguredCount > 0 && (
        <div className="flex items-center gap-3 bg-amber-50 border-l-4 border-amber-400 rounded-xl px-5 py-3.5 mb-5">
          <AlertTriangle size={16} className="text-amber-600 shrink-0" />
          <p className="text-sm text-amber-700">
            <span className="font-semibold">
              {unconfiguredCount} admin account
              {unconfiguredCount !== 1 ? "s" : ""}
            </span>{" "}
            {unconfiguredCount === 1 ? "has" : "have"} no jurisdiction assigned
            and will see zero issues until fixed below.
          </p>
        </div>
      )}

      {formOpen && (
        <form
          onSubmit={handleCreate}
          className="bg-white rounded-xl border border-[#e2e8f0] shadow-sm p-5 mb-5"
        >
          <h2 className="text-sm font-semibold text-[#0f172a] mb-4">
            New Admin Account
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-xs font-semibold text-[#475569] mb-1.5">
                Full name <span className="text-red-500">*</span>
              </label>
              <input
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="Enter full name"
                className={INPUT_CLS}
              />
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
                autoComplete="new-password"
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                placeholder="Min 6 characters"
                className={INPUT_CLS}
              />            </div>
            <div>
              <label className="block text-xs font-semibold text-[#475569] mb-1.5">
                Province <span className="text-red-500">*</span>
              </label>
              <select
                value={form.province}
                onChange={(e) =>
                  setForm({ ...form, province: e.target.value, district: "" })
                }
                className={`${INPUT_CLS} cursor-pointer`}
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
                District{" "}
                <span className="text-[#94a3b8] font-normal">
                  (optional — leave blank for provincial oversight)
                </span>
              </label>
              <select
                value={form.district}
                onChange={(e) => setForm({ ...form, district: e.target.value })}
                disabled={!form.province}
                className={`${INPUT_CLS} cursor-pointer disabled:opacity-50`}
              >
                <option value="">All districts in province</option>
                {districts.map((d) => (
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
            className="flex items-center gap-2 h-10 px-5 bg-[#16a34a] hover:bg-[#15803d] text-white text-sm font-semibold rounded-lg transition-colors disabled:opacity-50"
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

      <div className="bg-white rounded-xl border border-[#e2e8f0] shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full min-w-160">
            <thead>
              <tr className="border-b border-[#e2e8f0] bg-[#f8fafc]">
                {[
                  "Admin",
                  "Role",
                  "Jurisdiction",
                  "Email",
                  "Joined",
                  "Actions",
                ].map((h) => (
                  <th
                    key={h}
                    className="text-left text-[10px] font-semibold text-[#94a3b8] uppercase tracking-widest px-4 py-3 whitespace-nowrap"
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-[#f8fafc]">
              {isLoading ? (
                Array.from({ length: 3 }).map((_, i) => (
                  <tr key={i} className="animate-pulse">
                    {Array.from({ length: 6 }).map((__, j) => (
                      <td key={j} className="px-4 py-3.5">
                        <div className="h-4 bg-[#f1f5f9] rounded" />
                      </td>
                    ))}
                  </tr>
                ))
              ) : admins.length > 0 ? (
                admins.map((admin) => (
                  <tr
                    key={admin._id}
                    className="hover:bg-[#f8fafc] transition-colors"
                  >
                    <td className="px-4 py-3.5">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-full bg-purple-50 border border-purple-200 flex items-center justify-center shrink-0">
                          <span className="text-xs font-bold text-purple-700">
                            {admin.name?.[0]?.toUpperCase()}
                          </span>
                        </div>
                        <p className="text-sm font-semibold text-[#0f172a] whitespace-nowrap">
                          {admin.name}
                        </p>
                      </div>
                    </td>
                    <td className="px-4 py-3.5 whitespace-nowrap">
                      <span
                        className={`text-xs font-semibold px-2.5 py-1 rounded-full ${admin.role === "super_admin" ? "bg-purple-100 text-purple-800" : "bg-purple-50 text-purple-700 border border-purple-200"}`}
                      >
                        {admin.role === "super_admin" ? "Super Admin" : "Admin"}
                      </span>
                    </td>
                    <td className="px-4 py-3.5">
                      {admin.role === "super_admin" ? (
                        <span className="text-xs text-[#94a3b8]">
                          All municipalities
                        </span>
                      ) : editingId === admin._id ? (
                        <div className="flex items-center gap-1.5">
                          <select
                            value={editForm.province}
                            onChange={(e) =>
                              setEditForm({
                                province: e.target.value,
                                district: "",
                              })
                            }
                            className="text-xs border border-[#e2e8f0] rounded-lg px-2 py-1"
                          >
                            <option value="">Province…</option>
                            {Object.keys(PROVINCES).map((p) => (
                              <option key={p} value={p}>
                                {p}
                              </option>
                            ))}
                          </select>
                          <select
                            value={editForm.district}
                            onChange={(e) =>
                              setEditForm({
                                ...editForm,
                                district: e.target.value,
                              })
                            }
                            disabled={!editForm.province}
                            className="text-xs border border-[#e2e8f0] rounded-lg px-2 py-1 disabled:opacity-50"
                          >
                            <option value="">All districts</option>
                            {(editForm.province
                              ? PROVINCES[editForm.province]
                              : []
                            ).map((d) => (
                              <option key={d} value={d}>
                                {d}
                              </option>
                            ))}
                          </select>
                          <button
                            onClick={() => saveJurisdiction(admin._id)}
                            className="text-xs text-[#16a34a] font-semibold hover:underline"
                          >
                            Save
                          </button>
                          <button
                            onClick={() => setEditingId(null)}
                            className="text-xs text-[#94a3b8] hover:underline"
                          >
                            Cancel
                          </button>
                        </div>
                      ) : admin.jurisdiction?.province ? (
                        <span className="text-xs text-[#475569]">
                          {admin.jurisdiction.district
                            ? `${admin.jurisdiction.district}, `
                            : ""}
                          {admin.jurisdiction.province}
                        </span>
                      ) : (
                        <span className="text-xs font-semibold text-amber-600">
                          ⚠ Not configured
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3.5">
                      <p className="text-sm text-[#475569]">{admin.email}</p>
                    </td>
                    <td className="px-4 py-3.5 whitespace-nowrap">
                      <p className="text-xs text-[#94a3b8]">
                        {timeAgo(admin.createdAt)}
                      </p>
                    </td>
                    <td className="px-4 py-3.5 whitespace-nowrap">
                      {admin.role === "admin" && editingId !== admin._id && (
                        <button
                          onClick={() => startEditing(admin)}
                          className="flex items-center gap-1 text-xs text-blue-600 hover:underline font-medium"
                        >
                          <Pencil size={11} /> Edit
                        </button>
                      )}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} className="px-4 py-16 text-center">
                    <ShieldPlus
                      size={28}
                      className="text-[#e2e8f0] mx-auto mb-2"
                    />
                    <p className="text-sm text-[#94a3b8]">
                      No admin accounts yet
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

export default AdminManagementPage;
