import React, { useState, useRef } from 'react';
import { UploadCloud, Image as ImageIcon, CheckCircle, AlertCircle, RefreshCw, X } from 'lucide-react';
import axiosClient from '../../api/axiosClient';

const EvidenceUploader = ({ emergencyId, onEvidenceUploaded }) => {
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [description, setDescription] = useState('');
  const [resolutionNotes, setResolutionNotes] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [uploadStatus, setUploadStatus] = useState(null); // success | error
  const [errorMessage, setErrorMessage] = useState('');
  const fileInputRef = useRef(null);

  const handleFileSelect = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      setErrorMessage('File size exceeds 10MB limit.');
      return;
    }

    setSelectedFile(file);
    setPreviewUrl(URL.createObjectURL(file));
    setErrorMessage('');
    setUploadStatus(null);
  };

  const handleClear = () => {
    setSelectedFile(null);
    setPreviewUrl(null);
    setDescription('');
    setResolutionNotes('');
    setErrorMessage('');
    setUploadStatus(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleUpload = async (e) => {
    e.preventDefault();
    if (!selectedFile) {
      setErrorMessage('Please select an image file to upload.');
      return;
    }

    setIsUploading(true);
    setErrorMessage('');

    const formData = new FormData();
    formData.append('file', selectedFile);
    if (description) formData.append('description', description);
    if (resolutionNotes) formData.append('resolution_notes', resolutionNotes);

    try {
      const res = await axiosClient.post(`/api/evidence/upload/${emergencyId}`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      setUploadStatus('success');
      if (onEvidenceUploaded) onEvidenceUploaded(res.data);
      setTimeout(() => {
        handleClear();
      }, 2000);
    } catch (err) {
      console.error('Evidence upload failed:', err);
      setUploadStatus('error');
      setErrorMessage(err.response?.data?.detail || 'Failed to upload evidence file.');
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="glass-card p-5 rounded-2xl border border-slate-800 space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h4 className="text-sm font-bold text-slate-100 flex items-center gap-2">
            <UploadCloud className="w-4 h-4 text-cyan-400" />
            Upload Proof of Resolution Evidence
          </h4>
          <p className="text-xs text-slate-400 mt-0.5">
            Attach on-scene photos, rescue verification documents, or resolution notes.
          </p>
        </div>
      </div>

      {uploadStatus === 'success' && (
        <div className="p-3 rounded-xl bg-emerald-950/60 border border-emerald-800 text-emerald-300 text-xs flex items-center gap-2">
          <CheckCircle className="w-4 h-4 text-emerald-400" />
          <span>Proof of resolution uploaded and recorded in the audit log.</span>
        </div>
      )}

      {errorMessage && (
        <div className="p-3 rounded-xl bg-rose-950/60 border border-rose-800 text-rose-300 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-rose-400" />
          <span>{errorMessage}</span>
        </div>
      )}

      <form onSubmit={handleUpload} className="space-y-4">
        {/* File Drop Area / Preview */}
        {!previewUrl ? (
          <div
            onClick={() => fileInputRef.current?.click()}
            className="border-2 border-dashed border-slate-700 hover:border-cyan-500 rounded-xl p-6 text-center cursor-pointer transition-colors bg-slate-900/40"
          >
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*,.pdf"
              onChange={handleFileSelect}
              className="hidden"
            />
            <ImageIcon className="w-8 h-8 text-slate-500 mx-auto mb-2" />
            <p className="text-xs font-semibold text-slate-300">
              Click to select photo or evidence file
            </p>
            <p className="text-[10px] text-slate-500 mt-1 font-mono">
              JPEG, PNG, WEBP, PDF up to 10MB
            </p>
          </div>
        ) : (
          <div className="relative rounded-xl overflow-hidden border border-slate-700 bg-slate-900/80 p-2">
            <div className="flex items-center justify-between p-2 mb-2 bg-slate-800/80 rounded-lg">
              <span className="text-xs font-mono text-slate-300 truncate max-w-xs">
                {selectedFile?.name} ({(selectedFile?.size / 1024).toFixed(1)} KB)
              </span>
              <button
                type="button"
                onClick={handleClear}
                className="p-1 text-slate-400 hover:text-white rounded"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            {selectedFile?.type.startsWith('image/') && (
              <img
                src={previewUrl}
                alt="Evidence Preview"
                className="max-h-48 rounded-lg object-contain mx-auto"
              />
            )}
          </div>
        )}

        {/* Resolution Notes */}
        <div>
          <label className="block text-xs font-mono font-medium text-slate-400 mb-1">
            Resolution Notes / On-Scene Observations:
          </label>
          <textarea
            rows={2}
            value={resolutionNotes}
            onChange={(e) => setResolutionNotes(e.target.value)}
            placeholder="e.g., Victims safely evacuated to shelter, medical first aid administered."
            className="w-full bg-slate-900 border border-slate-700 rounded-xl p-2.5 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-cyan-500"
          />
        </div>

        {/* Submit */}
        <div className="flex justify-end gap-2">
          {selectedFile && (
            <button
              type="button"
              onClick={handleClear}
              className="px-3 py-1.5 text-xs text-slate-400 hover:text-slate-200"
            >
              Cancel
            </button>
          )}
          <button
            type="submit"
            disabled={!selectedFile || isUploading}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold bg-cyan-600 hover:bg-cyan-500 text-white shadow-glow transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isUploading ? (
              <>
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                Uploading Evidence...
              </>
            ) : (
              <>
                <UploadCloud className="w-3.5 h-3.5" />
                Submit Verification
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};

export default EvidenceUploader;
