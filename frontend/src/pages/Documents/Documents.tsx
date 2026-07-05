import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';
import {
  FolderOpen,
  Search,
  FileText,
  FileSpreadsheet,
  Image as ImageIcon,
  File as FileIcon,
  Download,
  Trash2,
  X,
  UploadCloud
} from 'lucide-react';


interface DocumentItem {
  id: string;
  file_name: string;
  file_type: string;
  file_size: number;
  plant_id: string;
  plant_name: string;
  file_path: string;
  category: string;
  uploaded_by_name: string;
  uploaded_at: string;
}

interface PlantItem {
  id: string;
  name: string;
}

const DOCUMENT_CATEGORIES = [
  "SOP",
  "EH&S Compliance",
  "Equipment Calibration",
  "Financial Audit"
];

const Documents: React.FC = () => {
  const { user } = useAuth();
  const isAdmin = user?.role === 'Enterprise Admin';

  const [documents, setDocuments] = useState<DocumentItem[]>([]);
  const [plants, setPlants] = useState<PlantItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Search/Filter states
  const [search, setSearch] = useState('');
  const [plantFilter, setPlantFilter] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [typeFilter, setTypeFilter] = useState('');

  // Upload modal states
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploadCategory, setUploadCategory] = useState('SOP');
  const [uploadPlantId, setUploadPlantId] = useState(user?.plant_id || '');
  const [uploading, setUploading] = useState(false);

  const fetchDocuments = async () => {
    setLoading(true);
    setError(null);
    try {
      const plantParam = plantFilter ? `&plant_id=${plantFilter}` : '';
      const res = await api.get(`/documents/?${plantParam}`);
      setDocuments(res.data);
    } catch (err) {
      console.error(err);
      setError('Failed to fetch technical documents directory.');
    } finally {
      setLoading(false);
    }
  };

  const fetchPlants = async () => {
    if (!isAdmin) return;
    try {
      const res = await api.get('/plants/');
      setPlants(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchDocuments();
  }, [plantFilter]);

  useEffect(() => {
    fetchPlants();
  }, []);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedFile(e.target.files[0]);
    }
  };

  const handleUploadSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFile || !uploadPlantId) {
      alert('Please select a file and target plant.');
      return;
    }

    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', selectedFile);
      formData.append('category', uploadCategory);
      
      await api.post(`/documents/upload?plant_id=${uploadPlantId}`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });

      setShowUploadModal(false);
      setSelectedFile(null);
      fetchDocuments();
    } catch (err: any) {
      console.error(err);
      alert(err.response?.data?.detail || 'Failed to upload technical document.');
    } finally {
      setUploading(false);
    }
  };

  const handleDownload = async (docId: string, fileName: string) => {
    try {
      console.log('Initiating download for:', docId, fileName);
      const token = localStorage.getItem('dibms_token');
      const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api/v1';
      
      const response = await fetch(`${API_BASE_URL}/documents/download/${docId}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (!response.ok) throw new Error(`Network response was not ok: ${response.statusText}`);
      
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      
      const link = document.createElement('a');
      link.style.display = 'none';
      link.href = url;
      link.setAttribute('download', fileName);
      document.body.appendChild(link);
      
      link.click();
      
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Download failed', err);
      alert('Failed to download file.');
    }
  };

  const handleDelete = async (docId: string, name: string) => {
    if (confirm(`Are you sure you want to delete file ${name}?`)) {
      try {
        await api.delete(`/documents/${docId}`);
        fetchDocuments();
      } catch (err) {
        console.error(err);
        alert('Failed to delete file.');
      }
    }
  };

  const getFileIcon = (type: string) => {
    switch (type) {
      case 'Excel':
        return <FileSpreadsheet className="w-8 h-8 text-emerald-500" />;
      case 'PDF':
        return <FileText className="w-8 h-8 text-rose-500" />;
      case 'Image':
        return <ImageIcon className="w-8 h-8 text-blue-500" />;
      default:
        return <FileIcon className="w-8 h-8 text-slate-400" />;
    }
  };

  const formatBytes = (bytes: number, decimals = 2) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
  };

  const filteredDocuments = documents.filter((doc) => {
    const matchesSearch = doc.file_name.toLowerCase().includes(search.toLowerCase());
    const matchesType = typeFilter ? doc.file_type === typeFilter : true;
    const matchesCategory = categoryFilter ? doc.category === categoryFilter : true;
    return matchesSearch && matchesType && matchesCategory;
  });

  return (
    <div className="p-6 space-y-6 animate-fade-in">
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between bg-white p-6 rounded-xl border border-slate-100 shadow-sm">
        <div>
          <h2 className="text-xl font-bold text-slate-800 flex items-center">
            <FolderOpen className="w-5 h-5 mr-2 text-blue-600" />
            Technical &amp; Quality Documents
          </h2>
          <p className="text-xs text-slate-400 mt-1 font-medium">
            Manage factory Standard Operating Procedures (SOPs), equipment calibration schedules, and safety logs.
          </p>
        </div>
        <button
          onClick={() => {
            setUploadPlantId(user?.plant_id || '');
            setUploadCategory('SOP');
            setSelectedFile(null);
            setShowUploadModal(true);
          }}
          className="mt-4 md:mt-0 enterprise-btn-primary flex items-center cursor-pointer"
        >
          <UploadCloud className="w-4 h-4 mr-2" />
          Upload Document
        </button>
      </div>

      {/* Advanced Filters */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 bg-white p-4 rounded-xl border border-slate-100 shadow-sm">
        <div className="relative md:col-span-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
          <input
            type="text"
            placeholder="Search by file name..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-xs border border-slate-200 rounded-lg outline-none focus:border-blue-600 transition-all bg-slate-50/50"
          />
        </div>

        {isAdmin && (
          <div>
            <select
              value={plantFilter}
              onChange={(e) => setPlantFilter(e.target.value)}
              className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg outline-none focus:border-blue-600 transition-all bg-slate-50/50"
            >
              <option value="">All Plants</option>
              {plants.map((p) => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>
          </div>
        )}

        <div className={!isAdmin ? 'md:col-span-2' : ''}>
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg outline-none focus:border-blue-600 transition-all bg-slate-50/50"
          >
            <option value="">All Categories</option>
            {DOCUMENT_CATEGORIES.map((cat) => (
              <option key={cat} value={cat}>{cat}</option>
            ))}
          </select>
        </div>

        <div>
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg outline-none focus:border-blue-600 transition-all bg-slate-50/50"
          >
            <option value="">All Formats</option>
            <option value="PDF">PDF</option>
            <option value="Excel">Excel Sheets</option>
            <option value="Image">Schematics/Images</option>
            <option value="Document">Other Docs</option>
          </select>
        </div>
      </div>

      {/* Grid of Documents */}
      {loading ? (
        <div className="flex py-20 justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      ) : error ? (
        <div className="p-4 bg-rose-50 border border-rose-100 rounded-xl text-rose-600 text-xs">
          {error}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredDocuments.length === 0 ? (
            <div className="col-span-full bg-white p-12 text-center border border-slate-100 rounded-xl">
              <FolderOpen className="w-12 h-12 text-slate-300 mx-auto mb-4" />
              <p className="text-xs text-slate-400 font-semibold">No files match the filters.</p>
            </div>
          ) : (
            filteredDocuments.map((doc) => (
              <div key={doc.id} className="enterprise-card p-5 flex flex-col justify-between hover:shadow-md transition-shadow">
                <div className="flex items-start justify-between">
                  <div className="flex items-start space-x-3 min-w-0">
                    <div className="p-2 bg-slate-50 border border-slate-100 rounded-lg shrink-0">
                      {getFileIcon(doc.file_type)}
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-bold text-slate-800 truncate" title={doc.file_name}>
                        {doc.file_name}
                      </p>
                      <span className="inline-flex mt-1 items-center px-1.5 py-0.5 rounded text-[8px] font-bold bg-blue-50 text-blue-600 border border-blue-100 uppercase tracking-wider">
                        {doc.category}
                      </span>
                      <p className="text-[10px] text-slate-400 mt-1 font-semibold">
                        Plant: {doc.plant_name}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => handleDelete(doc.id, doc.file_name)}
                    className="text-slate-400 hover:text-rose-600 p-1 rounded-lg transition-colors cursor-pointer"
                    title="Delete Document"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>

                <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between text-[10px] text-slate-400 font-medium">
                  <div>
                    <span>Size: {formatBytes(doc.file_size)}</span>
                    <span className="mx-2">•</span>
                    <span>Uploaded {new Date(doc.uploaded_at).toLocaleDateString()}</span>
                  </div>
                  <button
                    onClick={() => handleDownload(doc.id, doc.file_name)}
                    className="enterprise-btn-secondary py-1 px-2.5 flex items-center cursor-pointer text-[9px]"
                  >
                    <Download className="w-3 h-3 mr-1" />
                    Get File
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* UPLOAD DOCUMENT MODAL */}
      {showUploadModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-filter backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl border border-slate-100 shadow-xl w-full max-w-md animate-fade-in">
            <div className="flex items-center justify-between p-4 border-b border-slate-100">
              <h3 className="text-sm font-semibold text-slate-800">Upload Technical Document</h3>
              <button onClick={() => setShowUploadModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-4 h-4" />
              </button>
            </div>
            
            <form onSubmit={handleUploadSubmit} className="p-4 space-y-4">
              <div>
                <label className="block text-[10px] font-semibold text-slate-400 uppercase mb-1">Target Plant *</label>
                {isAdmin ? (
                  <select
                    value={uploadPlantId}
                    onChange={(e) => setUploadPlantId(e.target.value)}
                    required
                    className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg outline-none focus:border-blue-600"
                  >
                    <option value="">Select Plant Location</option>
                    {plants.map((p) => (
                      <option key={p.id} value={p.id}>{p.name}</option>
                    ))}
                  </select>
                ) : (
                  <input
                    type="text"
                    disabled
                    value={user?.plant_name || 'My Plant'}
                    className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg outline-none bg-slate-100 text-slate-500 cursor-not-allowed"
                  />
                )}
              </div>

              <div>
                <label className="block text-[10px] font-semibold text-slate-400 uppercase mb-1">Document Category *</label>
                <select
                  value={uploadCategory}
                  onChange={(e) => setUploadCategory(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg outline-none focus:border-blue-600"
                >
                  {DOCUMENT_CATEGORIES.map((cat) => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[10px] font-semibold text-slate-400 uppercase mb-1">Select File *</label>
                <input
                  type="file"
                  onChange={handleFileChange}
                  required
                  className="w-full text-xs text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-xs file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                />
              </div>

              <div className="flex justify-end space-x-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowUploadModal(false)}
                  className="enterprise-btn-secondary"
                  disabled={uploading}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="enterprise-btn-primary"
                  disabled={uploading}
                >
                  {uploading ? 'Uploading...' : 'Upload File'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Documents;
