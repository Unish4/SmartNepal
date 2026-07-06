import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import toast from "react-hot-toast";
import { Pencil } from "lucide-react";
import useIssueStore from "../../store/useIssueStore.js";
import useAuthStore from "../../store/useAuthStore.js";
import { CATEGORIES } from "../../constants/issue.js";
import LocationPicker from "../../components/map/LocationPicker.jsx";

const EditIssuePage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { currentIssue, isLoading, getIssueById, updateIssue } =
    useIssueStore();
  const { user } = useAuthStore();

  // Location state — pre-filled from the existing issue if it has coordinates.
  const [location, setLocation] = useState(null);
  const [prevIssue, setPrevIssue] = useState(null);

  if (currentIssue !== prevIssue) {
    setPrevIssue(currentIssue);
    setLocation(
      currentIssue?.location?.lat
        ? {
            lat: currentIssue.location.lat,
            lng: currentIssue.location.lng,
            address: currentIssue.location.address || "",
          }
        : null
    );
  }

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm();

  // Fetch the issue on mount so we have data to pre-fill.
  useEffect(() => {
    getIssueById(id);
  }, [id, getIssueById]);

  useEffect(() => {
    if (!currentIssue) return;

    reset({
      title: currentIssue.title,
      description: currentIssue.description,
      category: currentIssue.category,
      priority: currentIssue.priority,
    });
  }, [currentIssue, reset]);

  const onSubmit = async (data) => {
    const payload = {
      title: data.title,
      description: data.description,
      category: data.category,
      priority: data.priority,
      address: location?.address || currentIssue?.location?.address || "",
      lat: location?.lat ?? currentIssue?.location?.lat,
      lng: location?.lng ?? currentIssue?.location?.lng,
    };

    try {
      await updateIssue(id, payload);
      toast.success("Issue updated successfully!");
      navigate(`/issues/${id}`);
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to update issue.");
    }
  };

  if (isLoading && !currentIssue) {
    return (
      <div className="max-w-2xl mx-auto py-8 px-4 animate-pulse space-y-4">
        <div className="h-6 w-40 bg-gray-100 rounded" />
        <div className="h-10 w-full bg-gray-100 rounded-lg" />
        <div className="h-10 w-full bg-gray-100 rounded-lg" />
        <div className="h-32 w-full bg-gray-100 rounded-lg" />
      </div>
    );
  }

  if (
    currentIssue &&
    currentIssue.author?._id !== user?._id &&
    user?.role !== "admin"
  ) {
    return (
      <div className="max-w-2xl mx-auto text-center py-20">
        <p className="text-gray-500 text-sm">
          You are not authorized to edit this issue.
        </p>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto py-8 px-4">
      {/* Header */}
      <div className="mb-7">
        <div className="flex items-center gap-3 mb-1">
          <div className="w-9 h-9 bg-blue-50 rounded-lg flex items-center justify-center">
            <Pencil size={16} className="text-blue-600" />
          </div>
          <h1 className="text-2xl font-semibold text-gray-900">Edit Issue</h1>
        </div>
        <p className="text-gray-500 text-sm ml-12">
          Update the details of your report.
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
                ${errors.category ? "border-red-400" : "border-gray-200 focus:border-green-500"}`}
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

        {/* Location — pre-filled if the issue has existing coordinates */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">
            Location{" "}
            <span className="text-gray-400 font-normal">(optional)</span>
          </label>
          <LocationPicker
            onLocationChange={setLocation}
            initialPosition={
              currentIssue?.location?.lat
                ? {
                    lat: currentIssue.location.lat,
                    lng: currentIssue.location.lng,
                  }
                : null
            }
          />
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
            {isLoading ? "Saving..." : "Save Changes"}
          </button>
          <button
            type="button"
            onClick={() => navigate(`/issues/${id}`)}
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

export default EditIssuePage;
