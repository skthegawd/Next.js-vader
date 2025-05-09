import React from 'react';

interface DownloadExportProps {
  onDownload: () => void;
}

const DownloadExport: React.FC<DownloadExportProps> = ({ onDownload }) => {
  return (
    <button onClick={onDownload} aria-label="Download generated code" className="download-btn">
      Download
    </button>
  );
};

export default DownloadExport; 