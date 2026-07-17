import {
  useRef,
  useState,
  useImperativeHandle,
  forwardRef,
  useEffect,
} from "react";
import { Upload, X, Camera } from "lucide-react";
import toast from "react-hot-toast";
import ExifReader from "exifreader";

const MAX_FILES = 3;
const MAX_SIZE_BYTES = 10 * 1024 * 1024; // 10MB
const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp"];

const ImageUploader = forwardRef(
  ({ files = [], onFilesChange, onLocationFromPhoto }, ref) => {
    const [previews, setPreviews] = useState(() =>
      files.map((file) => ({
        file,
        url: URL.createObjectURL(file),
      })),
    );
    const [isDragOver, setIsDragOver] = useState(false);
    const inputRef = useRef(null);

    // Keep ref of latest previews for cleanup on unmount
    const previewsRef = useRef(previews);
    useEffect(() => {
      previewsRef.current = previews;
    }, [previews]);

    // Camera state
    const [isCameraActive, setIsCameraActive] = useState(false);
    const [cameraStream, setCameraStream] = useState(null);
    const videoRef = useRef(null);

    // Clean up previews object URLs on unmount to prevent leaks
    useEffect(() => {
      return () => {
        previewsRef.current.forEach((p) => URL.revokeObjectURL(p.url));
      };
    }, []);

    // Clean up camera stream on unmount
    useEffect(() => {
      return () => {
        if (cameraStream) {
          cameraStream.getTracks().forEach((track) => track.stop());
        }
      };
    }, [cameraStream]);

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

    const addFiles = async (fileList) => {
      const slotsLeft = MAX_FILES - previews.length;

      if (slotsLeft <= 0) {
        toast.error(`Maximum ${MAX_FILES} images per report`);
        return;
      }

      const incoming = Array.from(fileList)
        .filter(validateFile)
        .slice(0, slotsLeft); // never exceed the remaining slots

      if (!incoming.length) return;

      // Try to extract GPS coordinates from photos
      for (const file of incoming) {
        try {
          const buffer = await file.arrayBuffer();
          const tags = ExifReader.load(buffer, { expanded: true });
          if (
            tags.gps &&
            typeof tags.gps.Latitude === "number" &&
            typeof tags.gps.Longitude === "number"
          ) {
            if (onLocationFromPhoto) {
              onLocationFromPhoto({
                lat: tags.gps.Latitude,
                lng: tags.gps.Longitude,
              });
            }
          }
        } catch (err) {
          // Silent catch for images without EXIF data
          console.log("EXIF check skipped or failed for", file.name, err);
        }
      }

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

    const stopCamera = () => {
      if (cameraStream) {
        cameraStream.getTracks().forEach((track) => track.stop());
        setCameraStream(null);
      }
      setIsCameraActive(false);
    };

    const capturePhoto = () => {
      if (!videoRef.current || !cameraStream) return;

      const video = videoRef.current;
      const canvas = document.createElement("canvas");
      canvas.width = video.videoWidth || 640;
      canvas.height = video.videoHeight || 480;

      const ctx = canvas.getContext("2d");
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

      canvas.toBlob(
        (blob) => {
          if (blob) {
            const file = new File([blob], `camera_capture_${Date.now()}.jpg`, {
              type: "image/jpeg",
            });
            addFiles([file]);
            stopCamera();
            toast.success("Photo captured successfully!");
          } else {
            toast.error("Failed to capture photo");
          }
        },
        "image/jpeg",
        0.85,
      );
    };

    const startCameraCapture = async () => {
      const slotsLeft = MAX_FILES - previews.length;
      if (slotsLeft <= 0) {
        toast.error(`Maximum ${MAX_FILES} images per report`);
        return;
      }

      if (isCameraActive) {
        toast.error("Camera is already active");
        return;
      }

      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        toast.error("Camera access is not supported on this device/browser");
        return;
      }

      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: "environment" },
          audio: false,
        });
        setCameraStream(stream);
        setIsCameraActive(true);
        setTimeout(() => {
          if (videoRef.current) {
            videoRef.current.srcObject = stream;
          }
        }, 100);
      } catch (err) {
        console.error("Camera access error:", err);
        toast.error("Could not access camera. Please check permissions.");
      }
    };

    useImperativeHandle(ref, () => ({
      triggerUpload() {
        if (previews.length >= MAX_FILES) {
          toast.error(`Maximum ${MAX_FILES} images per report`);
          return;
        }
        inputRef.current?.click();
      },
      async triggerCamera() {
        await startCameraCapture();
      },
    }));

    return (
      <div>
        {/* Choice grid — hidden once MAX_FILES reached */}
        {previews.length < MAX_FILES && (
          <div className="grid sm:grid-cols-2 gap-4">
            {/* Upload card */}
            <div
              onClick={() => inputRef.current?.click()}
              onDrop={handleDrop}
              onDragOver={(e) => {
                e.preventDefault();
                setIsDragOver(true);
              }}
              onDragLeave={() => setIsDragOver(false)}
              className={`border-2 border-dashed rounded-2xl p-6 text-center
              cursor-pointer transition-all duration-150 flex flex-col justify-center items-center min-h-36
              ${
                isDragOver
                  ? "border-green-400 bg-green-50"
                  : "border-gray-200 hover:border-green-300 hover:bg-green-50/30"
              }`}
            >
              <Upload
                size={24}
                className={`mb-2 transition-colors
                ${isDragOver ? "text-green-500" : "text-gray-300"}`}
              />
              <p className="text-sm font-semibold text-gray-700">
                Upload Images
              </p>
              <p className="text-[11px] text-gray-400 mt-1 text-center max-w-xs leading-normal">
                Click to select or drag & drop files (JPEG, PNG, WebP · Max
                10MB)
              </p>
              {/* Hidden file input */}
              <input
                ref={inputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp"
                multiple
                onChange={handleInputChange}
                className="hidden"
              />
            </div>

            {/* Camera trigger card */}
            <div
              onClick={startCameraCapture}
              className="border-2 border-dashed border-gray-200 hover:border-green-300
              hover:bg-green-50/30 rounded-2xl p-6 text-center cursor-pointer transition-all
              duration-150 flex flex-col justify-center items-center min-h-36 group"
            >
              <Camera
                size={24}
                className="mb-2 text-gray-300 group-hover:text-green-500 transition-colors"
              />
              <p className="text-sm font-semibold text-gray-700">
                Take a Photo
              </p>
              <p className="text-[11px] text-gray-400 mt-1 text-center max-w-xs leading-normal">
                Use your device's camera to capture a live photo of the issue
              </p>
            </div>
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
                  aria-label={`Remove photo ${i + 1}`}
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
            {previews.length}/{MAX_FILES} photo
            {previews.length !== 1 ? "s" : ""} added
            {previews.length < MAX_FILES && " · click above to add more"}
          </p>
        )}

        {/* Camera modal */}
        {isCameraActive && (
          <div className="fixed inset-0 bg-black/90 z-50 flex flex-col items-center justify-center p-4">
            <div className="relative w-full max-w-lg bg-[#09090b] rounded-2xl overflow-hidden shadow-2xl border border-zinc-800">
              {/* Header */}
              <div className="flex items-center justify-between px-4 py-3 border-b border-zinc-800 bg-zinc-900/50">
                <span className="text-zinc-200 text-sm font-semibold flex items-center gap-2">
                  <Camera size={14} className="text-[#16a34a]" /> Take Photo
                </span>
                <button
                  type="button"
                  onClick={stopCamera}
                  className="w-8 h-8 rounded-full flex items-center justify-center text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors"
                >
                  <X size={18} />
                </button>
              </div>

              {/* Video Feed */}
              <div className="relative aspect-video bg-black flex items-center justify-center">
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  className="w-full h-full object-cover"
                />
              </div>

              {/* Controls */}
              <div className="flex items-center justify-between px-6 py-4 bg-[#09090b]">
                <button
                  type="button"
                  onClick={stopCamera}
                  className="px-4 py-2 text-sm font-medium text-zinc-400 hover:text-white transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={capturePhoto}
                  className="w-14 h-14 rounded-full bg-red-600 hover:bg-red-700 flex items-center justify-center border-4 border-zinc-300 shadow-lg active:scale-95 transition-all"
                  aria-label="Capture Photo"
                >
                  <div className="w-5 h-5 rounded-full bg-white" />
                </button>
                <div className="w-13" />{" "}
                {/* Spacer for centering capture button */}
              </div>
            </div>
          </div>
        )}
      </div>
    );
  },
);

export default ImageUploader;
