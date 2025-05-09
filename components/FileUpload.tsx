import React, { useRef } from 'react';

interface FileUploadProps {
  onUpload: (file: File) => void;
}

const FileUpload: React.FC<FileUploadProps> = ({ onUpload }) => {
  const inputRef = useRef<HTMLInputElement>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      onUpload(e.target.files[0]);
      e.target.value = '';
    }
  };

  return (
    <div className="file-upload">
      <label htmlFor="file-upload-input">Attach file:</label>
      <input
        id="file-upload-input"
        type="file"
        ref={inputRef}
        onChange={handleChange}
        aria-label="Upload file"
      />
    </div>
  );
};

export default FileUpload; 