// import { useState } from 'react';
// import { Upload, FileText, Printer, X, CheckCircle, AlertCircle } from 'lucide-react';
// import axios from 'axios';

// interface UploadStatus {
//   type: 'success' | 'error';
//   message: string;
// }

// const printUrl = 'http://localhost:3000/api/print/submit';
// const FILE_STACK_API_KEY = process.env.REACT_APP_FILE_STACK_API_KEY ||;

// function App() {
//   const [selectedFile, setSelectedFile] = useState<File | null>(null);
//   const [uploading, setUploading] = useState<boolean>(false);
//   const [uploadStatus, setUploadStatus] = useState<UploadStatus | null>(null);
//   const [dragActive, setDragActive] = useState<boolean>(false);

//   const handleDrag = (e: React.DragEvent<HTMLDivElement>): void => {
//     e.preventDefault();
//     e.stopPropagation();
//     if (e.type === "dragenter" || e.type === "dragover") {
//       setDragActive(true);
//     } else if (e.type === "dragleave") {
//       setDragActive(false);
//     }
//   };

//   const handleDrop = (e: React.DragEvent<HTMLDivElement>): void => {
//     e.preventDefault();
//     e.stopPropagation();
//     setDragActive(false);

//     if (e.dataTransfer.files && e.dataTransfer.files[0]) {
//       const file = e.dataTransfer.files[0];
//       if (file.type === 'application/pdf') {
//         setSelectedFile(file);
//         setUploadStatus(null);
//       } else {
//         setUploadStatus({ type: 'error', message: 'Please upload a PDF file' });
//       }
//     }
//   };

//   const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>): void => {
//     if (e.target.files && e.target.files[0]) {
//       const file = e.target.files[0];
//       if (file.type === 'application/pdf') {
//         setSelectedFile(file);
//         setUploadStatus(null);
//       } else {
//         setUploadStatus({ type: 'error', message: 'Please upload a PDF file' });
//       }
//     }
//   };

//   /**
//    * Upload file to FileStack first, then submit to print queue
//    */
//   const handleUpload = async () => {
//     if (!selectedFile) return;

//     setUploading(true);
//     setUploadStatus(null);

//     try {
//       // Step 1: Upload to FileStack
//       setUploadStatus({ type: 'success', message: 'Uploading to FileStack...' });
      
//       const fileStackResponse = await uploadToFileStack(selectedFile);
      
//       console.log('✅ FileStack Response:', fileStackResponse);

//       // Step 2: Submit print job with FileStack URL
//       setUploadStatus({ type: 'success', message: 'Sending to print queue...' });

//       const printResponse = await axios.post(printUrl, {
//         fileName: fileStackResponse.filename,
//         fileUrl: fileStackResponse.url,
//         fileSize: fileStackResponse.size,
//         fileKey: fileStackResponse.key,
//         originalName: selectedFile.name,
//         submittedBy: 'frontend-user',
//         copies: 1,
//         color: true,
//         duplex: false,
//         printerName: 'default'
//       }, {
//         headers: {
//           'Content-Type': 'application/json',
//         },
//       });

//       setUploadStatus({
//         type: 'success',
//         message: `"${selectedFile.name}" uploaded and sent to print queue successfully!`,
//       });

//       console.log('✅ Print Server Response:', printResponse.data);

//       // Reset after a short delay
//       setTimeout(() => {
//         setSelectedFile(null);
//         setUploadStatus(null);
//       }, 3000);

//     } catch (error: any) {
//       console.error('Upload Error:', error);
//       const errorMessage = getErrorMessage(error);
//       setUploadStatus({ type: 'error', message: errorMessage });
//     } finally {
//       setUploading(false);
//     }
//   };

//   /**
//    * Upload file to FileStack
//    */
//   const uploadToFileStack = async (file: File): Promise<any> => {
//     if (!FILE_STACK_API_KEY) {
//       throw new Error('FileStack API key not configured');
//     }

//     const formData = new FormData();
//     formData.append('fileUpload', file);

//     try {
//       const response = await fetch(`https://www.filestackapi.com/api/store/S3?key=${FILE_STACK_API_KEY}`, {
//         method: 'POST',
//         body: formData,
//         // Note: Don't set Content-Type header for FormData, browser will set it automatically with boundary
//       });

//       if (!response.ok) {
//         const errorText = await response.text();
//         throw new Error(`FileStack upload failed: ${response.status} - ${errorText}`);
//       }

//       return await response.json();
//     } catch (error) {
//       console.error('FileStack upload error:', error);
//       throw new Error(`Failed to upload to FileStack: ${error instanceof Error ? error.message : 'Unknown error'}`);
//     }
//   };

//   /**
//    * Extract error message from various error types
//    */
//   const getErrorMessage = (error: any): string => {
//     if (error.response?.data?.message) {
//       return error.response.data.message;
//     }
//     if (error.message) {
//       return error.message;
//     }
//     return 'Failed to process file. Please try again.';
//   };

//   const removeFile = () => {
//     setSelectedFile(null);
//     setUploadStatus(null);
//   };

//   const formatFileSize = (bytes: number) => {
//     if (bytes < 1024) return bytes + ' B';
//     if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
//     return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
//   };

//   return (
//     <div className="min-h-screen from-blue-50 to-indigo-100 flex items-center justify-center p-4">
//       <div className="w-full max-w-2xl bg-white rounded-2xl shadow-xl p-8">
//         <div className="text-center mb-8">
//           <div className="inline-flex items-center justify-center w-16 h-16 bg-indigo-100 rounded-full mb-4">
//             <Printer className="w-8 h-8 text-indigo-600" />
//           </div>
//           <h1 className="text-3xl font-bold text-gray-900 mb-2">Print PDF</h1>
//           <p className="text-gray-600">Upload your PDF file to send it to the print queue</p>
//         </div>

//         {/* Upload Area */}
//         <div
//           className={`relative border-2 border-dashed rounded-xl p-8 transition-all ${
//             dragActive ? 'border-indigo-500 bg-indigo-50' : 'border-gray-300 bg-gray-50'
//           }`}
//           onDragEnter={handleDrag}
//           onDragLeave={handleDrag}
//           onDragOver={handleDrag}
//           onDrop={handleDrop}
//         >
//           {!selectedFile ? (
//             <div className="text-center">
//               <Upload className="w-12 h-12 text-gray-400 mx-auto mb-4" />
//               <p className="text-lg font-semibold text-gray-700 mb-2">
//                 Drag and drop your PDF here
//               </p>
//               <p className="text-sm text-gray-500 mb-4">or</p>
//               <label className="inline-flex items-center px-6 py-3 bg-indigo-600 text-white rounded-lg font-semibold cursor-pointer hover:bg-indigo-700 transition-colors">
//                 <Upload className="w-5 h-5 mr-2" />
//                 Browse Files
//                 <input
//                   type="file"
//                   accept=".pdf"
//                   onChange={handleFileSelect}
//                   className="hidden"
//                 />
//               </label>
//               <p className="text-xs text-gray-400 mt-4">Only PDF files are supported</p>
//             </div>
//           ) : (
//             <div className="flex items-center justify-between bg-white rounded-lg p-4 border border-gray-200">
//               <div className="flex items-center flex-1">
//                 <div className="flex-shrink-0 w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center mr-4">
//                   <FileText className="w-6 h-6 text-red-600" />
//                 </div>
//                 <div className="flex-1 min-w-0">
//                   <p className="text-sm font-semibold text-gray-900 truncate">
//                     {selectedFile.name}
//                   </p>
//                   <p className="text-xs text-gray-500">{formatFileSize(selectedFile.size)}</p>
//                 </div>
//               </div>
//               <button
//                 onClick={removeFile}
//                 className="ml-4 p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
//                 disabled={uploading}
//               >
//                 <X className="w-5 h-5" />
//               </button>
//             </div>
//           )}
//         </div>

//         {/* Status Messages */}
//         {uploadStatus && (
//           <div
//             className={`mt-4 p-4 rounded-lg flex items-center ${
//               uploadStatus.type === 'success'
//                 ? 'bg-green-50 text-green-800'
//                 : 'bg-red-50 text-red-800'
//             }`}
//           >
//             {uploadStatus.type === 'success' ? (
//               <CheckCircle className="w-5 h-5 mr-3 flex-shrink-0" />
//             ) : (
//               <AlertCircle className="w-5 h-5 mr-3 flex-shrink-0" />
//             )}
//             <p className="text-sm font-medium">{uploadStatus.message}</p>
//           </div>
//         )}

//         {/* Print Button */}
//         {selectedFile && !uploadStatus && (
//           <button
//             onClick={handleUpload}
//             disabled={uploading}
//             className={`w-full mt-6 py-4 rounded-xl font-semibold text-white transition-all flex items-center justify-center ${
//               uploading
//                 ? 'bg-gray-400 cursor-not-allowed'
//                 : 'bg-indigo-600 hover:bg-indigo-700 hover:shadow-lg'
//             }`}
//           >
//             {uploading ? (
//               <>
//                 <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-3"></div>
//                 Uploading to FileStack...
//               </>
//             ) : (
//               <>
//                 <Printer className="w-5 h-5 mr-3" />
//                 Upload and Send to Print Queue
//               </>
//             )}
//           </button>
//         )}
//       </div>
//     </div>
//   );
// }

// export default App;

import { useState } from 'react';
import { Upload, FileText, Printer, X, CheckCircle, AlertCircle } from 'lucide-react';
import axios from 'axios';

interface UploadStatus {
  type: 'success' | 'error';
  message: string;
}

const printUrl = 'http://localhost:3000/api/print/submit';

function App() {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState<boolean>(false);
  const [uploadStatus, setUploadStatus] = useState<UploadStatus | null>(null);
  const [dragActive, setDragActive] = useState<boolean>(false);

  const handleDrag = (e: React.DragEvent<HTMLDivElement>): void => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>): void => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      if (file.type === 'application/pdf') {
        setSelectedFile(file);
        setUploadStatus(null);
      } else {
        setUploadStatus({ type: 'error', message: 'Please upload a PDF file' });
      }
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>): void => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      if (file.type === 'application/pdf') {
        setSelectedFile(file);
        setUploadStatus(null);
      } else {
        setUploadStatus({ type: 'error', message: 'Please upload a PDF file' });
      }
    }
  };

  /**
   * 🧩 Updated: Real upload logic using axios
   */
  const handleUpload = async () => {
    if (!selectedFile) return;

    setUploading(true);
    setUploadStatus(null);

    try {
      const formData = new FormData();
      formData.append('pdfFile', selectedFile);
      formData.append('submittedBy', 'frontend-user'); // Optional extra data
      formData.append('copies', '1');
      formData.append('color', 'true');
      formData.append('duplex', 'false');

      const response = await axios.post(printUrl, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      setUploadStatus({
        type: 'success',
        message: `"${selectedFile.name}" sent to print queue successfully!`,
      });

      console.log('✅ Server Response:', response.data);

      // Reset after a short delay
      setTimeout(() => {
        setSelectedFile(null);
        setUploadStatus(null);
      }, 3000);
    } catch (error: any) {
      console.error('Upload Error:', error);
      const errorMessage =
        error.response?.data?.message ||
        'Failed to send file to print queue. Please try again.';
      setUploadStatus({ type: 'error', message: errorMessage });
    } finally {
      setUploading(false);
    }
  };

  const removeFile = () => {
    setSelectedFile(null);
    setUploadStatus(null);
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  return (
    <div className="min-h-screen from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="w-full max-w-2xl bg-white rounded-2xl shadow-xl p-8">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-indigo-100 rounded-full mb-4">
            <Printer className="w-8 h-8 text-indigo-600" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Print PDF</h1>
          <p className="text-gray-600">Upload your PDF file to send it to the print queue</p>
        </div>

        {/* Upload Area */}
        <div
          className={`relative border-2 border-dashed rounded-xl p-8 transition-all ${
            dragActive ? 'border-indigo-500 bg-indigo-50' : 'border-gray-300 bg-gray-50'
          }`}
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
        >
          {!selectedFile ? (
            <div className="text-center">
              <Upload className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-lg font-semibold text-gray-700 mb-2">
                Drag and drop your PDF here
              </p>
              <p className="text-sm text-gray-500 mb-4">or</p>
              <label className="inline-flex items-center px-6 py-3 bg-indigo-600 text-white rounded-lg font-semibold cursor-pointer hover:bg-indigo-700 transition-colors">
                <Upload className="w-5 h-5 mr-2" />
                Browse Files
                <input
                  type="file"
                  accept=".pdf"
                  onChange={handleFileSelect}
                  className="hidden"
                />
              </label>
              <p className="text-xs text-gray-400 mt-4">Only PDF files are supported</p>
            </div>
          ) : (
            <div className="flex items-center justify-between bg-white rounded-lg p-4 border border-gray-200">
              <div className="flex items-center flex-1">
                <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center mr-4">
                  <FileText className="w-6 h-6 text-red-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-gray-900 truncate">
                    {selectedFile.name}
                  </p>
                  <p className="text-xs text-gray-500">{formatFileSize(selectedFile.size)}</p>
                </div>
              </div>
              <button
                onClick={removeFile}
                className="ml-4 p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                disabled={uploading}
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          )}
        </div>

        {/* Status Messages */}
        {uploadStatus && (
          <div
            className={`mt-4 p-4 rounded-lg flex items-center ${
              uploadStatus.type === 'success'
                ? 'bg-green-50 text-green-800'
                : 'bg-red-50 text-red-800'
            }`}
          >
            {uploadStatus.type === 'success' ? (
              <CheckCircle className="w-5 h-5 mr-3" />
            ) : (
              <AlertCircle className="w-5 h-5 mr-3" />
            )}
            <p className="text-sm font-medium">{uploadStatus.message}</p>
          </div>
        )}

        {/* Print Button */}
        {selectedFile && !uploadStatus && (
          <button
            onClick={handleUpload}
            disabled={uploading}
            className={`w-full mt-6 py-4 rounded-xl font-semibold text-white transition-all flex items-center justify-center ${
              uploading
                ? 'bg-gray-400 cursor-not-allowed'
                : 'bg-indigo-600 hover:bg-indigo-700 hover:shadow-lg'
            }`}
          >
            {uploading ? (
              <>
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-3"></div>
                Sending to Print Queue...
              </>
            ) : (
              <>
                <Printer className="w-5 h-5 mr-3" />
                Send to Print Queue
              </>
            )}
          </button>
        )}
      </div>
    </div>
  );
}

export default App;