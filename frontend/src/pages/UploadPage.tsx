import { FileUploader } from "../components/FileUploader";

export const UploadPage = () => {
  return (
    <div className="max-w-3xl mx-auto">
      <h1 className="text-3xl font-bold mb-6">
        Upload Audio or Video
      </h1>

      <p className="text-slate-400 mb-8">
        Supported formats include common audio and video types.
      </p>

      <FileUploader />
    </div>
  );
};
