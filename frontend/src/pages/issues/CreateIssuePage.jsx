import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import toast from "react-hot-toast";
import { FileText } from "lucide-react";
import useIssueStore from "../../store/useIssueStore.js";
import { CATEGORIES } from "../../constants/issue.js";
import ImageUploader from "../../components/issues/ImageUploader.jsx";
import LocationPicker from "../../components/map/LocationPicker.jsx";

const CreateIssuePage = () => {
  const navigate = useNavigate();
  const { createIssue, isLoading } = useIssueStore();

  const [imageFiles, setImageFiles] = useState([]);

  const [location, setLocation] = useState(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({ defaultValues: { priority: "low" } });

  const onSubmit = async (data) => {
    const payload = {
      title: data.title,
      description: data.description,
      category: data.category,
      priority: data.priority,
      address: location?.address || "",
      lat: location?.lat,
      lng: location?.lng,
      images: imageFiles,
    };

    try {
      const res = await createIssue(payload);
      toast.success("Issue reported successfully!");
      navigate(`/issues/${res.issue._id}`);
    } catch (error) {
      toast.error(
        error.response?.data?.message || "Failed to submit. Try again.",
      );
    }
  };

  return (
    <div className="max-w-2xl mx-auto">
      {/* Header */}
      <div className="mb-7">
        <div className="flex items-center gap-3 mb-1">
          <div className="w-9 h-9 bg-green-50 rounded-lg flex items-center justify-center">
            <FileText size={18} className="text-green-600" />
          </div>
          <h1 className="text-2xl font-semibold text-gray-900">
            Report an Issue
          </h1>
        </div>
        <p className="text-gray-500 text-sm ml-12">
          Describe the civic problem so your municipality can act on it.
        </p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-5">
        {/* Title */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">
            Issue title <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            placeholder="e.g. Large pothole on Baneshwor road near the school"
            {...register("title", {
              required: "Title is required",
              maxLength: {
                value: 100,
                message: "Title cannot exceed 100 characters",
              },
            })}
            className={`w-full px-3.5 py-2.5 text-sm rounded-lg border outline-none
              transition-all
              ${
                errors.title
                  ? "border-red-400 bg-red-50/30"
                  : "border-gray-200 focus:border-green-500 focus:bg-green-50/20"
              }`}
          />
          {errors.title && (
            <p className="text-xs text-red-500 mt-1">{errors.title.message}</p>
          )}
        </div>

        {/* Category + Priority */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Category <span className="text-red-500">*</span>
            </label>
            <select
              {...register("category", {
                required: "Please select a category",
              })}
              className={`w-full px-3.5 py-2.5 text-sm rounded-lg border bg-white
                outline-none transition-all
                ${
                  errors.category
                    ? "border-red-400"
                    : "border-gray-200 focus:border-green-500"
                }`}
            >
              <option value="">Select category</option>
              {CATEGORIES.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
            {errors.category && (
              <p className="text-xs text-red-500 mt-1">
                {errors.category.message}
              </p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Priority
            </label>
            <select
              {...register("priority")}
              className="w-full px-3.5 py-2.5 text-sm rounded-lg border border-gray-200
                bg-white outline-none focus:border-green-500 transition-all"
            >
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
              <option value="critical">Critical</option>
            </select>
          </div>
        </div>

        {/* Description */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">
            Description <span className="text-red-500">*</span>
          </label>
          <textarea
            rows={5}
            placeholder="Describe the issue in detail. What did you see? How long has it been there? Who does it affect?"
            {...register("description", {
              required: "Description is required",
              minLength: {
                value: 10,
                message: "Please provide at least 10 characters",
              },
            })}
            className={`w-full px-3.5 py-2.5 text-sm rounded-lg border outline-none
              transition-all resize-vertical
              ${
                errors.description
                  ? "border-red-400 bg-red-50/30"
                  : "border-gray-200 focus:border-green-500 focus:bg-green-50/20"
              }`}
          />
          {errors.description && (
            <p className="text-xs text-red-500 mt-1">
              {errors.description.message}
            </p>
          )}
        </div>

        {/* Photos */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">
            Photos{" "}
            <span className="text-gray-400 font-normal">
              (optional · up to 3)
            </span>
          </label>
          <ImageUploader onFilesChange={setImageFiles} />
        </div>

        {/* Location — Phase 6: replaced text input with interactive map */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">
            Location{" "}
            <span className="text-gray-400 font-normal">(optional)</span>
          </label>
          <LocationPicker onLocationChange={setLocation} />

          {/* Show the reverse-geocoded address below the map if set */}
          {location?.address && (
            <p className="text-xs text-gray-500 mt-2 leading-relaxed">
              <span className="font-medium text-gray-700">Address: </span>
              {location.address}
            </p>
          )}
        </div>

        {/* Actions */}
        <div className="flex items-center gap-3 pt-1">
          <button
            type="submit"
            disabled={isLoading}
            className="flex-1 py-2.5 bg-green-600 text-white text-sm font-medium
              rounded-lg hover:bg-green-700 transition-colors
              disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? "Submitting..." : "Submit Report"}
          </button>
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="px-5 py-2.5 border border-gray-200 text-gray-600 text-sm
              rounded-lg hover:bg-gray-50 transition-colors"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
};

export default CreateIssuePage;
