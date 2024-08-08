import React from 'react';

const PdfViewer = ({ url }: { url: string }) => {
  return (
    <div style={{ width: '100%', height: '100vh' }}>
      <iframe
        src={url}
        style={{ width: '100%', height: '100%' }}
      >
        This browser does not support PDFs.
      </iframe>
    </div>
  );
};

export default PdfViewer;
