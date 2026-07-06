import { useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import {
  Check,
  ChevronLeft,
  ChevronRight,
  X,
  Camera,
  Upload,
  Sparkles,
  MapPin,
  AlertCircle,
  Send,
  CheckCircle,
} from "lucide-react";
import toast from "react-hot-toast";
import useIssueStore from "../../store/useIssueStore.js";
import {
  CATEGORIES,
  CATEGORY_ICONS,
  CATEGORY_CONFIG,
} from "../../constants/issue.js";
import ImageUploader from "../../components/issues/ImageUploader.jsx";
import LocationPicker from "../../components/map/LocationPicker.jsx";

const STEP_LABELS = ["Details", "Photo", "Location"];

// ── Step indicator ──────────────────────────────────────────────────────────
function StepIndicator({ step }) {
  return (
    <div className="px-8 pt-7 pb-6 border-b border-[#f1f5f9]">
      <div className="flex items-center">
        {STEP_LABELS.map((label, i) => {
          const n = i + 1;
          const done = step > n;
          const cur = step === n;
          return (
            <div
              key={label}
              className="flex items-center flex-1 last:flex-none"
            >
              <div className="flex flex-col items-center">
                <div
                  className={`w-7 h-7 rounded-full flex items-center justify-center
                  text-xs font-bold shrink-0 transition-all duration-300
                  ${
                    done
                      ? "bg-[#16a34a] text-white"
                      : cur
                        ? "bg-[#16a34a] text-white ring-4 ring-[#16a34a]/15"
                        : "bg-[#e2e8f0] text-[#94a3b8]"
                  }`}
                >
                  {done ? <Check size={13} strokeWidth={3} /> : n}
                </div>
                <span
                  className={`text-xs mt-1.5 font-medium whitespace-nowrap transition-colors
                  ${cur ? "text-[#16a34a] font-semibold" : done ? "text-[#16a34a]" : "text-[#94a3b8]"}`}
                >
                  {label}
                </span>
              </div>
              {i < STEP_LABELS.length - 1 && (
                <div
                  className={`flex-1 h-0.5 mx-3 mb-4 rounded-full transition-all duration-300
                  ${step > n ? "bg-[#16a34a]" : "bg-[#e2e8f0]"}`}
                />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ── Success state ────────────────────────────────────────────────────────────
function SuccessState({ issueId, onReportAnother }) {
  const navigate = useNavigate();
  return (
    <div className="p-12 text-center">
      <div
        className="w-20 h-20 rounded-full bg-green-100 flex items-center justify-center
        mx-auto mb-6 border-4 border-[#f0fdf4]"
      >
        <CheckCircle size={38} className="text-[#16a34a]" fill="#16a34a" />
      </div>
      <h2 className="text-2xl font-bold text-[#16a34a] mb-3">
        Issue Reported!
      </h2>
      <p className="text-base text-[#0f172a] mb-1.5">
        Your report has been submitted successfully.
      </p>
      <p className="text-sm text-[#94a3b8] mb-8 leading-relaxed">
        The municipality will review it within 48 hours. You will be notified of
        any updates.
      </p>
      <div className="flex flex-col gap-3 max-w-xs mx-auto">
        <button
          onClick={() => navigate(`/issues/${issueId}`)}
          className="h-11 rounded-xl bg-[#16a34a] hover:bg-[#15803d] text-white font-semibold text-sm transition-colors shadow-sm"
        >
          View My Report
        </button>
        <button
          onClick={onReportAnother}
          className="h-11 rounded-xl border border-[#e2e8f0] text-[#475569] font-medium text-sm hover:bg-[#f8fafc] transition-colors"
        >
          Report Another Issue
        </button>
      </div>
    </div>
  );
}

// ── Step 1: Details ──────────────────────────────────────────────────────────
function Step1({ onNext, formMethods }) {
  const {
    register,
    formState: { errors },
    watch,
    setValue,
  } = formMethods;
  const category = watch("category");
  const description = watch("description", "");
  const [showAISuggest, setShowAISuggest] = useState(false);
  const [aiApplied, setAiApplied] = useState(false);

  const AI_TITLE =
    "Damaged road surface with deep pothole creating safety hazard";
  const showAIBanner = description.length >= 50 && !aiApplied;

  return (
    <div className="p-8">
      <h2 className="text-2xl font-bold text-[#0f172a] mb-1">
        Report an Issue
      </h2>
      <p className="text-sm text-[#94a3b8] mb-6">Step 1 of 3: Issue details</p>

      {/* Title */}
      <div className="mb-4">
        <label className="block text-xs font-semibold uppercase tracking-wider text-[#475569] mb-2">
          Issue Title <span className="text-red-500">*</span>
        </label>
        <input
          type="text"
          placeholder="Briefly describe the issue"
          {...register("title", {
            required: "Title is required",
            maxLength: { value: 100, message: "Max 100 characters" },
          })}
          className="w-full h-10 px-3 rounded-lg border border-[#e2e8f0] text-sm text-[#0f172a]
            placeholder:text-[#94a3b8] outline-none focus:border-[#16a34a] focus:ring-2
            focus:ring-[#16a34a]/15 transition-all"
        />
        {errors.title && (
          <p className="text-xs text-red-500 mt-1">{errors.title.message}</p>
        )}
        <button
          type="button"
          onClick={() => setShowAISuggest(!showAISuggest)}
          className="flex items-center gap-1.5 mt-2 text-xs font-medium text-violet-600 hover:text-violet-700 transition-colors"
        >
          <Sparkles size={11} /> Let our AI suggest a title
        </button>
        {showAISuggest && (
          <div className="mt-2 bg-violet-50 border border-violet-100 rounded-xl p-3.5">
            <div className="flex items-center justify-between mb-1.5">
              <p className="text-xs font-semibold text-violet-600">
                AI suggestion:
              </p>
              <button
                type="button"
                onClick={() => setShowAISuggest(false)}
                className="text-violet-400 hover:text-violet-600 transition-colors"
              >
                <X size={14} />
              </button>
            </div>
            <p className="text-sm text-[#0f172a] mb-3 leading-snug">
              {AI_TITLE}
            </p>
            <button
              type="button"
              onClick={() => {
                setValue("title", AI_TITLE);
                setShowAISuggest(false);
              }}
              className="h-7 px-3 rounded-lg bg-violet-600 hover:bg-violet-700 text-white text-xs font-semibold transition-colors"
            >
              Use this title
            </button>
          </div>
        )}
      </div>

      {/* Category icon grid */}
      <div className="mb-4">
        <label className="block text-xs font-semibold uppercase tracking-wider text-[#475569] mb-2">
          Category <span className="text-red-500">*</span>
        </label>
        <div className="grid grid-cols-4 sm:grid-cols-7 gap-2">
          {CATEGORIES.map((cat) => {
            const Icon = CATEGORY_ICONS[cat] || AlertCircle;
            const cfg = CATEGORY_CONFIG[cat] || CATEGORY_CONFIG["Other"];
            const active = category === cat;
            return (
              <button
                key={cat}
                type="button"
                onClick={() =>
                  setValue("category", cat, { shouldValidate: true })
                }
                className={`flex flex-col items-center justify-center gap-1.5 rounded-xl border-2 text-center transition-all`}
                style={{
                  height: 68,
                  borderColor: active ? "#16a34a" : "#e2e8f0",
                  backgroundColor: active ? "#f0fdf4" : "white",
                }}
              >
                <Icon
                  size={18}
                  style={{ color: active ? "#16a34a" : cfg.color }}
                />
                <span
                  className={`text-[9px] font-semibold leading-tight ${active ? "text-[#16a34a]" : "text-[#64748b]"}`}
                >
                  {cat.split(" ")[0]}
                </span>
              </button>
            );
          })}
        </div>
        <input
          type="hidden"
          {...register("category", { required: "Please select a category" })}
        />
        {errors.category && (
          <p className="text-xs text-red-500 mt-1">{errors.category.message}</p>
        )}
      </div>

      {/* Priority */}
      <div className="mb-4">
        <label className="block text-xs font-semibold uppercase tracking-wider text-[#475569] mb-2">
          Priority Level
        </label>
        <div className="relative">
          <select
            {...register("priority")}
            className="w-full h-10 pl-3 pr-8 rounded-lg border border-[#e2e8f0] text-sm
              text-[#0f172a] outline-none focus:border-[#16a34a] bg-white appearance-none cursor-pointer"
          >
            <option value="low">Low Priority</option>
            <option value="medium">Medium Priority</option>
            <option value="high">High Priority</option>
            <option value="critical">Critical Priority</option>
          </select>
          <ChevronRight
            size={13}
            className="absolute right-3 top-1/2 -translate-y-1/2 rotate-90 text-[#94a3b8] pointer-events-none"
          />
        </div>
      </div>

      {/* Description */}
      <div className="mb-4">
        <label className="block text-xs font-semibold uppercase tracking-wider text-[#475569] mb-2">
          Description <span className="text-red-500">*</span>
        </label>
        <textarea
          rows={4}
          placeholder="Describe the issue in detail. What did you see? How long has it been there? Who is affected?"
          {...register("description", {
            required: "Description is required",
            minLength: { value: 10, message: "At least 10 characters" },
          })}
          className="w-full px-3 py-2.5 rounded-lg border border-[#e2e8f0] text-sm
            placeholder:text-[#94a3b8] text-[#0f172a] outline-none focus:border-[#16a34a]
            focus:ring-2 focus:ring-[#16a34a]/15 transition-all resize-none leading-relaxed"
        />
        <p className="text-[10px] text-[#94a3b8] mt-1 text-right">
          {description.length} characters
        </p>
        {errors.description && (
          <p className="text-xs text-red-500 mt-1">
            {errors.description.message}
          </p>
        )}
      </div>

      {/* AI banner */}
      {showAIBanner && (
        <div className="bg-violet-50 border border-violet-100 rounded-xl p-4 flex items-start gap-3 mb-4">
          <Sparkles size={15} className="text-violet-600 shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="text-xs font-semibold text-violet-700 mb-1.5">
              AI suggests:{" "}
              <span className="font-bold">Road Damage · High Priority</span>
            </p>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => {
                  setValue("category", "Road Damage");
                  setValue("priority", "high");
                  setAiApplied(true);
                  toast.success("AI suggestion applied");
                }}
                className="h-7 px-3 rounded-lg border border-violet-300 text-violet-700 text-xs font-semibold hover:bg-violet-100 transition-colors"
              >
                Apply AI suggestion
              </button>
              <button
                type="button"
                onClick={() => setAiApplied(true)}
                className="h-7 px-2 text-xs text-violet-400 hover:text-violet-600 transition-colors"
              >
                Keep my selection
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="flex justify-end mt-6">
        <button
          type="button"
          onClick={onNext}
          className="flex items-center gap-2 h-11 px-6 rounded-xl bg-[#16a34a]
            hover:bg-[#15803d] text-white font-semibold text-sm transition-all shadow-sm"
        >
          Next: Add Photo <ChevronRight size={14} />
        </button>
      </div>
    </div>
  );
}

// ── Step 2: Photo ─────────────────────────────────────────────────────────────
function Step2({ onNext, onBack, imageFiles, setImageFiles }) {
  const [guidelinesOpen, setGuidelinesOpen] = useState(false);
  const uploaderRef = useRef(null);

  return (
    <div className="p-8">
      <h2 className="text-2xl font-bold text-[#0f172a] mb-1">Add a photo</h2>
      <p className="text-sm text-[#94a3b8] mb-6">
        A clear photo helps authorities assess the issue faster.
      </p>

      {/* Image upload area with Camera and Upload icons */}
      <div className="mb-4">
        <ImageUploader ref={uploaderRef} onFilesChange={setImageFiles} />

        {/* Quick action buttons for photo */}
        <div className="flex gap-3 mt-3">
          <button
            type="button"
            onClick={() => {
              uploaderRef.current?.triggerCamera();
            }}
            className="flex-1 flex items-center justify-center gap-2 h-10 rounded-lg border border-[#e2e8f0] text-sm font-medium text-[#475569] hover:bg-[#f8fafc] transition-colors cursor-pointer"
          >
            <Camera size={16} className="text-[#16a34a]" />
            Take Photo
          </button>
          <button
            type="button"
            onClick={() => {
              uploaderRef.current?.triggerUpload();
            }}
            className="flex-1 flex items-center justify-center gap-2 h-10 rounded-lg border border-[#e2e8f0] text-sm font-medium text-[#475569] hover:bg-[#f8fafc] transition-colors cursor-pointer"
          >
            <Upload size={16} className="text-[#16a34a]" />
            Upload Photo
          </button>
        </div>
      </div>

      {/* Guidelines accordion */}
      <div className="border border-[#e2e8f0] rounded-xl mb-4 overflow-hidden">
        <button
          type="button"
          onClick={() => setGuidelinesOpen(!guidelinesOpen)}
          className="w-full flex items-center justify-between px-4 py-3 text-sm font-medium
            text-[#475569] hover:bg-[#f8fafc] transition-colors"
        >
          <div className="flex items-center gap-2">
            <Camera size={14} className="text-[#94a3b8]" />
            <span>Photo guidelines</span>
          </div>
          <ChevronRight
            size={14}
            className={`text-[#94a3b8] transition-transform duration-200 ${guidelinesOpen ? "rotate-90" : ""}`}
          />
        </button>
        {guidelinesOpen && (
          <div className="px-4 pb-4 pt-2 border-t border-[#f1f5f9] bg-[#f8fafc]">
            <ul className="space-y-2">
              {[
                "Capture the full extent of the issue in frame",
                "Ensure good lighting — avoid backlit or blurry shots",
                "Include nearby context like a street sign or landmark",
                "Avoid capturing people's faces in your photo",
                "Landscape orientation works best for street-level issues",
              ].map((tip) => (
                <li
                  key={tip}
                  className="flex items-start gap-2 text-xs text-[#64748b]"
                >
                  <Check
                    size={11}
                    className="text-[#16a34a] mt-0.5 shrink-0"
                    strokeWidth={3}
                  />
                  {tip}
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>

      {imageFiles.length > 0 && (
        <div className="flex items-center gap-2 p-3 bg-green-50 border border-green-100 rounded-xl mb-4">
          <CheckCircle size={16} className="text-[#16a34a] shrink-0" />
          <p className="text-sm text-[#16a34a] font-medium">
            {imageFiles.length} photo{imageFiles.length > 1 ? "s" : ""} selected
          </p>
        </div>
      )}

      <p className="text-xs text-[#94a3b8] mb-6">
        Photo is recommended but not required to submit.
      </p>

      <div className="flex items-center justify-between">
        <button
          type="button"
          onClick={onBack}
          className="flex items-center gap-2 h-11 px-5 rounded-xl border border-[#e2e8f0]
            text-[#475569] font-medium text-sm hover:bg-[#f8fafc] transition-colors"
        >
          <ChevronLeft size={14} /> Back
        </button>
        <button
          type="button"
          onClick={onNext}
          className="flex items-center gap-2 h-11 px-6 rounded-xl bg-[#16a34a]
            hover:bg-[#15803d] text-white font-semibold text-sm transition-all shadow-sm"
        >
          Next: Set Location <ChevronRight size={14} />
        </button>
      </div>
    </div>
  );
}

// ── Step 3: Location ──────────────────────────────────────────────────────────
function Step3({ onSubmit, onBack, isLoading, location, setLocation }) {
  return (
    <div className="p-8">
      <h2 className="text-2xl font-bold text-[#0f172a] mb-1">
        Set the location
      </h2>
      <p className="text-sm text-[#94a3b8] mb-5">
        Tap the map where the issue is located.
      </p>

      <LocationPicker onLocationChange={setLocation} />

      {/* Location confirmation */}
      {location ? (
        <div className="flex items-center gap-2.5 p-3.5 bg-green-50 border border-green-100 rounded-xl mt-3 mb-6">
          <CheckCircle size={16} className="text-[#16a34a] shrink-0" />
          <div>
            <p className="text-sm font-semibold text-[#16a34a]">
              Location pinned
            </p>
            {location.address && (
              <p className="text-xs text-[#94a3b8] mt-0.5 flex items-center gap-1">
                <MapPin size={10} className="shrink-0" />
                <span className="line-clamp-1">{location.address}</span>
              </p>
            )}
          </div>
        </div>
      ) : (
        <div className="flex items-center gap-2.5 p-3.5 bg-amber-50 border border-amber-100 rounded-xl mt-3 mb-6">
          <AlertCircle size={16} className="text-amber-500 shrink-0" />
          <p className="text-sm text-amber-600">
            Please set a location on the map above
          </p>
        </div>
      )}

      <div className="flex items-center justify-between">
        <button
          type="button"
          onClick={onBack}
          className="flex items-center gap-2 h-11 px-5 rounded-xl border border-[#e2e8f0]
            text-[#475569] font-medium text-sm hover:bg-[#f8fafc] transition-colors"
        >
          <ChevronLeft size={14} /> Back
        </button>
        <button
          type="button"
          onClick={onSubmit}
          disabled={!location || isLoading}
          className="flex items-center gap-2 h-11 px-6 rounded-xl bg-[#16a34a]
            hover:bg-[#15803d] disabled:opacity-40 disabled:cursor-not-allowed
            text-white font-semibold text-sm transition-all shadow-sm"
        >
          <Send size={14} /> {isLoading ? "Submitting…" : "Submit Report"}
        </button>
      </div>
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────
export default function CreateIssuePage() {
  const navigate = useNavigate();
  const { createIssue, isLoading } = useIssueStore();

  const [step, setStep] = useState(1);
  const [submitted, setSubmitted] = useState(false);
  const [createdId, setCreatedId] = useState(null);
  const [imageFiles, setImageFiles] = useState([]);
  const [location, setLocation] = useState(null);

  const formMethods = useForm({ defaultValues: { priority: "low" } });
  const { getValues } = formMethods;

  const handleSubmit = async () => {
    const data = getValues();
    const payload = {
      title: data.title,
      description: data.description,
      category: data.category,
      priority: data.priority || "low",
      address: location?.address || "",
      lat: location?.lat,
      lng: location?.lng,
      images: imageFiles,
    };
    try {
      const res = await createIssue(payload);
      setCreatedId(res.issue._id);
      setSubmitted(true);
      toast.success("Report submitted!");
    } catch (error) {
      toast.error(
        error.response?.data?.message || "Failed to submit. Try again.",
      );
    }
  };

  const resetForm = () => {
    setStep(1);
    setSubmitted(false);
    setCreatedId(null);
    setImageFiles([]);
    setLocation(null);
    formMethods.reset({ priority: "low" });
  };

  return (
    <div className="min-h-screen bg-[#f8fafc]">
      <div className="flex items-start justify-center min-h-[calc(100vh-64px)] p-6 py-10">
        <div className="bg-white rounded-2xl shadow-xl w-full max-w-160 overflow-hidden">
          {/* Close button for modal-like experience */}
          <div className="relative">
            {!submitted && <StepIndicator step={step} />}
            <button
              onClick={() => navigate("/issues")}
              className="absolute top-4 right-4 w-8 h-8 rounded-full flex items-center justify-center
                border border-[#e2e8f0] text-[#94a3b8] hover:text-[#475569] hover:bg-[#f8fafc] transition-colors"
              aria-label="Close"
            >
              <X size={16} />
            </button>
          </div>

          {submitted ? (
            <SuccessState issueId={createdId} onReportAnother={resetForm} />
          ) : step === 1 ? (
            <Step1 onNext={() => setStep(2)} formMethods={formMethods} />
          ) : step === 2 ? (
            <Step2
              onNext={() => setStep(3)}
              onBack={() => setStep(1)}
              imageFiles={imageFiles}
              setImageFiles={setImageFiles}
            />
          ) : (
            <Step3
              onBack={() => setStep(2)}
              onSubmit={handleSubmit}
              isLoading={isLoading}
              location={location}
              setLocation={setLocation}
            />
          )}
        </div>
      </div>
    </div>
  );
}
