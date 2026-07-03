import { useRef, useState } from "react";
import { Upload, X } from "lucide-react";
import toast from "react-hot-toast";

const MAX_FILES = 3;
const MAX_SIZE_BYTES = 10 * 1024 * 1024; // 10MB
const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp"];

const ImageUploader = ({ onFilesChange }) => {
  const [previews, setPreviews] = useState([]);
  const [isDragOver, setIsDragOver] = useState(false);
  const inputRef = useRef(null);

  // Validates a single file against MIME type and size.
  // Returns true if valid, shows a toast and returns false if not.
  const validateFile = (file) => {
    if (!ALLOWED_TYPES.includes(file.type)) {
      toast.error(`${file.name}: only JPEG, PNG or WebP allowed`);
      return false;
    }
    if (file.size > MAX_SIZE_BYTES) {
      toast.error(`${file.name}: must be under 10MB`);
      return false;
    }
    return true;
  };

  const addFiles = (fileList) => {
    const slotsLeft = MAX_FILES - previews.length;

    if (slotsLeft <= 0) {
      toast.error(`Maximum ${MAX_FILES} images per report`);
      return;
    }

    const incoming = Array.from(fileList)
      .filter(validateFile)
      .slice(0, slotsLeft); // never exceed the remaining slots

    if (!incoming.length) return;

    const newPreviews = incoming.map((file) => ({
      file,
      url: URL.createObjectURL(file),
    }));

    const updated = [...previews, ...newPreviews];
    setPreviews(updated);
    onFilesChange(updated.map((p) => p.file));
  };

  const removeFile = (index) => {
    // Revoke the blob URL to release browser memory.
    URL.revokeObjectURL(previews[index].url);
    const updated = previews.filter((_, i) => i !== index);
    setPreviews(updated);
    onFilesChange(updated.map((p) => p.file));
  };

  const handleInputChange = (e) => {
    if (e.target.files?.length) addFiles(e.target.files);
    // Reset so selecting the same file again triggers onChange.
    e.target.value = "";
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragOver(false);
    if (e.dataTransfer.files?.length) addFiles(e.dataTransfer.files);
  };

  return (
    <div>
      {/* Drop zone — hidden once MAX_FILES reached */}
      {previews.length < MAX_FILES && (
        <div
          onClick={() => inputRef.current?.click()}
          onDrop={handleDrop}
          onDragOver={(e) => {
            e.preventDefault();
            setIsDragOver(true);
          }}
          onDragLeave={() => setIsDragOver(false)}
          className={`border-2 border-dashed rounded-lg p-6 text-center
            cursor-pointer transition-all duration-150
            ${
              isDragOver
                ? "border-green-400 bg-green-50"
                : "border-gray-200 hover:border-green-300 hover:bg-green-50/30"
            }`}
        >
          <Upload
            size={24}
            className={`mx-auto mb-2 transition-colors
              ${isDragOver ? "text-green-500" : "text-gray-300"}`}
          />
          <p className="text-sm text-gray-500">
            Click to upload or drag and drop
          </p>
          <p className="text-xs text-gray-400 mt-1">
            JPEG, PNG, WebP · Max 10MB each · Up to {MAX_FILES} photos
          </p>

          {/* Hidden file input — triggered by clicking the drop zone */}
          <input
            ref={inputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            multiple
            onChange={handleInputChange}
            className="hidden"
          />
        </div>
      )}

      {/* Preview thumbnails */}
      {previews.length > 0 && (
        <div
          className={`grid grid-cols-3 gap-3 ${previews.length < MAX_FILES ? "mt-3" : ""}`}
        >
          {previews.map((preview, i) => (
            <div key={preview.url} className="relative group aspect-square">
              <img
                src={preview.url}
                alt={`Preview ${i + 1}`}
                className="w-full h-full object-cover rounded-lg border border-gray-100"
              />

              {/* Remove button — appears on hover */}
              <button
                type="button"
                onClick={() => removeFile(i)}
                className="absolute top-1.5 right-1.5 w-6 h-6 rounded-full
                  bg-gray-900/60 text-white flex items-center justify-center
                  opacity-0 group-hover:opacity-100 transition-opacity
                  hover:bg-red-500"
              >
                <X size={12} />
              </button>

              {/* "Cover" label on the first image */}
              {i === 0 && (
                <span
                  className="absolute bottom-1.5 left-1.5 text-xs
                  bg-black/50 text-white px-1.5 py-0.5 rounded font-medium"
                >
                  Cover
                </span>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Count indicator */}
      {previews.length > 0 && (
        <p className="text-xs text-gray-400 mt-2">
          {previews.length}/{MAX_FILES} photo{previews.length !== 1 ? "s" : ""}{" "}
          added
          {previews.length < MAX_FILES && " · click above to add more"}
        </p>
      )}
    </div>
  );
};

export default ImageUploader;
