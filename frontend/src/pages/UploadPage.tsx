import { FileUploader } from "../components/FileUploader";

export const UploadPage = () => {
  return (
    <div className="p-8 max-w-3xl mx-auto">
      <h2 className="text-2xl font-semibold mb-4">Upload File</h2>
      <FileUploader />
    </div>
  );
};
