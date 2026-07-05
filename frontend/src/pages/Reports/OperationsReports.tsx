import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';
import { safeDate } from '../../utils/date';
import {
  FileText,
  Plus,
  Download,
  X,
  CheckCircle,
  XCircle,
  Upload,
  AlertTriangle,
  History,
  FileSpreadsheet,
  ChevronRight
} from 'lucide-react';

interface ReportItem {
  id: string;
  plant_id: string;
  plant_name: string;
  year: number;
  month: number;
  revenue: number;
  expenses: number;
  production_units: number;
  attendance_rate: number;
  safety_incidents: number;
  quality_score: number;
  remarks: string;
  status: string;
  submitted_by_name: string;
  submitted_at: string;
}

interface UploadHistoryItem {
  id: string;
  plant_id: string;
  year: number;
  month: number;
  file_name: string;
  status: string;
  validation_score: number;
  uploaded_by_name: string;
  uploaded_at: string;
}

interface ValidationIssue {
  row?: number;
  column?: string;
  value?: string;
  rule: string;
}

interface ValidationReport {
  status: string;
  file_name: string;
  total_errors: number;
  total_warnings: number;
  errors: ValidationIssue[];
  warnings: ValidationIssue[];
  parsed_data?: any;
  upload_id?: string;
}

const MONTH_NAMES = [
  "", "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December"
];

const formatINR = (value: number) => {
  if (value >= 10000000) {
    return `₹${(value / 10000000).toFixed(2)} Cr`;
  }
  return `₹${(value / 100000).toFixed(1)} L`;
};

const OperationsReports: React.FC = () => {
  const { user } = useAuth();
  const isAdmin = user?.role === 'Enterprise Admin';

  const getPreviousCompletedPeriod = () => {
    const d = new Date();
    d.setMonth(d.getMonth() - 1);
    return {
      year: d.getFullYear(),
      month: d.getMonth() + 1
    };
  };
  const defaultPeriod = getPreviousCompletedPeriod();
  
  const [activeTab, setActiveTab] = useState<'reports' | 'history'>('reports');
  const [reports, setReports] = useState<ReportItem[]>([]);
  const [historyList, setHistoryList] = useState<UploadHistoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Form states
  const [showSubmitModal, setShowSubmitModal] = useState(false);
  const [newReport, setNewReport] = useState({
    plant_id: user?.plant_id || '',
    year: defaultPeriod.year,
    month: defaultPeriod.month,
    revenue: '',
    expenses: '',
    production_units: '',
    attendance_rate: '',
    safety_incidents: '0',
    quality_score: '',
    remarks: ''
  });

  // Admin filter states
  const [filterYear, setFilterYear] = useState<number>(defaultPeriod.year);
  const [filterMonth, setFilterMonth] = useState<number>(defaultPeriod.month);

  const currentYear = new Date().getFullYear();
  const yearOptions = [currentYear, currentYear - 1, currentYear - 2];

  // EEIM Upload States
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [uploadStep, setUploadStep] = useState<1 | 2 | 3>(1); // 1: Select, 2: Validate/Preview, 3: Success
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [validationReport, setValidationReport] = useState<ValidationReport | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  const fetchReports = async () => {
    setLoading(true);
    setError(null);
    try {
      let url = '/operations-reports/';
      if (isAdmin) {
        url = `/operations-reports/?year=${filterYear}&month=${filterMonth}`;
      }
      const res = await api.get(url);
      setReports(res.data);
    } catch (err) {
      console.error(err);
      setError('Failed to fetch operations reports list.');
    } finally {
      setLoading(false);
    }
  };

  const fetchHistory = async () => {
    setLoading(true);
    try {
      const res = await api.get('/operations-reports/history/uploads');
      setHistoryList(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'reports') fetchReports();
    else fetchHistory();
  }, [filterYear, filterMonth, activeTab]);

  const handleOpenSubmit = () => {
    setNewReport({
      plant_id: user?.plant_id || '',
      year: defaultPeriod.year,
      month: defaultPeriod.month,
      revenue: '',
      expenses: '',
      production_units: '',
      attendance_rate: '',
      safety_incidents: '0',
      quality_score: '',
      remarks: ''
    });
    setShowSubmitModal(true);
  };

  const handleSubmitReport = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const payload = {
        ...newReport,
        year: Number(newReport.year),
        month: Number(newReport.month),
        revenue: Number(newReport.revenue),
        expenses: Number(newReport.expenses),
        production_units: Number(newReport.production_units),
        attendance_rate: Number(newReport.attendance_rate),
        safety_incidents: Number(newReport.safety_incidents),
        quality_score: Number(newReport.quality_score)
      };

      await api.post('/operations-reports/', payload);
      setShowSubmitModal(false);
      fetchReports();
    } catch (err: any) {
      alert(err.response?.data?.detail || 'Failed to submit operations report.');
    }
  };

  const handleApprove = async (reportId: string) => {
    if (!confirm('Are you sure you want to approve this operations report?')) return;
    try {
      await api.post(`/operations-reports/${reportId}/approve`);
      fetchReports();
    } catch (err) {
      alert('Failed to approve report.');
    }
  };

  const handleReject = async (reportId: string) => {
    if (!confirm('Are you sure you want to reject this operations report?')) return;
    try {
      await api.post(`/operations-reports/${reportId}/reject`);
      fetchReports();
    } catch (err) {
      alert('Failed to reject report.');
    }
  };

  const handleExportCSV = () => {
    if (reports.length === 0) return;
    
    const headers = [
      'Plant ID', 'Plant Name', 'Period', 'Revenue (INR)', 'Expenses (INR)',
      'Production Units', 'Attendance Rate (%)', 'Safety Incidents', 'Quality Score (%)',
      'Status', 'Submitted By', 'Submitted At'
    ];
    
    const rows = reports.map((r) => [
      r.plant_id, r.plant_name, `${MONTH_NAMES[r.month]} ${r.year}`,
      r.revenue, r.expenses, r.production_units, r.attendance_rate,
      r.safety_incidents, r.quality_score, r.status, r.submitted_by_name,
      safeDate(r.submitted_at).toLocaleString()
    ]);
    
    const csvContent = 'data:text/csv;charset=utf-8,' +
      [headers.join(','), ...rows.map((e) => e.map(val => `"${val}"`).join(','))].join('\n');
      
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `DMEOP_Operations_Reports_${MONTH_NAMES[filterMonth]}_${filterYear}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // --- EEIM Handlers ---
  const handleDownloadTemplate = async () => {
    try {
      console.log('Initiating template download');
      const token = localStorage.getItem('dibms_token');
      const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api/v1';
      
      const response = await fetch(`${API_BASE_URL}/operations-reports/template/download?month=${defaultPeriod.month}&year=${defaultPeriod.year}`, {
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
      link.setAttribute('download', `Template_${MONTH_NAMES[defaultPeriod.month]}_${defaultPeriod.year}.xlsx`);
      document.body.appendChild(link);
      
      link.click();
      
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Template download failed', err);
      alert("Failed to download template.");
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedFile(e.target.files[0]);
      setUploadError(null);
    }
  };

  const handleUploadExcel = async () => {
    if (!selectedFile) return;
    setIsUploading(true);
    setUploadError(null);
    
    const formData = new FormData();
    formData.append('file', selectedFile);
    
    try {
      const res = await api.post('/operations-reports/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      setValidationReport(res.data);
      setUploadStep(2);
    } catch (err: any) {
      setUploadError(err.response?.data?.detail || "Upload failed due to a server error.");
    } finally {
      setIsUploading(false);
    }
  };

  const handleConfirmUpload = async () => {
    if (!validationReport?.upload_id) return;
    setIsUploading(true);
    setUploadError(null);
    
    try {
      await api.post('/operations-reports/confirm', { upload_id: validationReport.upload_id });
      setUploadStep(3);
      fetchReports();
    } catch (err: any) {
      setUploadError(err.response?.data?.detail || "Failed to confirm upload.");
      setUploadStep(1); // Go back if failed
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="p-6 space-y-6 animate-fade-in">
      {/* Header banner */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between bg-white p-6 rounded-xl border border-slate-100 shadow-sm">
        <div>
          <h2 className="text-xl font-bold text-slate-800 flex items-center">
            <FileText className="w-5 h-5 mr-2 text-blue-600" />
            Plant Operations Reports
          </h2>
          <p className="text-xs text-slate-400 mt-1 font-medium">
            Review and audit plant production outputs, EHS metrics, quality scores, and operational revenue.
          </p>
        </div>
        
        <div className="flex items-center space-x-2 mt-4 md:mt-0">
          {isAdmin && reports.length > 0 && activeTab === 'reports' && (
            <button
              onClick={handleExportCSV}
              className="enterprise-btn-secondary flex items-center cursor-pointer"
            >
              <Download className="w-4 h-4 mr-2" />
              Export Sheet
            </button>
          )}
          {!isAdmin && (
            <>
              <button
                onClick={handleDownloadTemplate}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center shadow-sm"
              >
                <Download className="w-4 h-4 mr-2" />
                Template
              </button>
              <button
                onClick={() => {
                  setUploadStep(1);
                  setSelectedFile(null);
                  setValidationReport(null);
                  setUploadError(null);
                  setShowUploadModal(true);
                }}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center shadow-sm"
              >
                <FileSpreadsheet className="w-4 h-4 mr-2" />
                Upload Excel
              </button>
              <button
                onClick={handleOpenSubmit}
                className="enterprise-btn-primary flex items-center cursor-pointer"
              >
                <Plus className="w-4 h-4 mr-2" />
                Manual Entry
              </button>
            </>
          )}
        </div>
      </div>
      
      {/* Tabs */}
      <div className="flex space-x-4 border-b border-slate-200">
        <button
          onClick={() => setActiveTab('reports')}
          className={`pb-2 text-xs font-bold ${activeTab === 'reports' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-slate-400 hover:text-slate-600'} cursor-pointer transition-colors`}
        >
          Operations Reports
        </button>
        <button
          onClick={() => setActiveTab('history')}
          className={`pb-2 text-xs font-bold flex items-center ${activeTab === 'history' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-slate-400 hover:text-slate-600'} cursor-pointer transition-colors`}
        >
          <History className="w-3.5 h-3.5 mr-1" />
          Upload History
        </button>
      </div>

      {activeTab === 'reports' && (
        <>
          {/* Admin Filters */}
          {isAdmin && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-white p-4 rounded-xl border border-slate-100 shadow-sm">
              <div>
                <label className="block text-[10px] font-semibold text-slate-400 uppercase mb-1">Select Year</label>
                <select
                  value={filterYear}
                  onChange={(e) => setFilterYear(Number(e.target.value))}
                  className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg outline-none focus:border-blue-600 transition-all bg-slate-50/50"
                >
                  {yearOptions.map((y) => (
                    <option key={y} value={y}>{y}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-[10px] font-semibold text-slate-400 uppercase mb-1">Select Month</label>
                <select
                  value={filterMonth}
                  onChange={(e) => setFilterMonth(Number(e.target.value))}
                  className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg outline-none focus:border-blue-600 transition-all bg-slate-50/50"
                >
                  {MONTH_NAMES.map((name, idx) => {
                    if (idx === 0) return null;
                    return <option key={idx} value={idx}>{name}</option>;
                  })}
                </select>
              </div>
            </div>
          )}

          {/* Reports Table Grid */}
          {loading ? (
            <div className="flex py-20 justify-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
          ) : error ? (
            <div className="p-4 bg-rose-50 border border-rose-100 rounded-xl text-rose-600 text-xs">
              {error}
            </div>
          ) : (
            <div className="bg-white rounded-xl border border-slate-100 shadow-sm overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-100">
                      <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-wider">Plant</th>
                      <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-wider">Period</th>
                      <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-wider">Financials</th>
                      <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-wider">Manufacturing Metrics</th>
                      <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-wider">Approval Status</th>
                      <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-wider text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {reports.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="px-6 py-10 text-center text-xs text-slate-400">
                          No operations reports filed for the selected period.
                        </td>
                      </tr>
                    ) : (
                      reports.map((report) => (
                        <tr key={report.id} className="hover:bg-slate-50/50 transition-colors">
                          <td className="px-6 py-4">
                            <span className="text-xs font-bold text-slate-800">{report.plant_name}</span>
                          </td>
                          <td className="px-6 py-4">
                            <span className="text-xs text-slate-600 font-semibold">
                              {MONTH_NAMES[report.month]} {report.year}
                            </span>
                          </td>
                          <td className="px-6 py-4">
                            <div className="space-y-1 text-xs">
                              <p className="text-slate-700">
                                Rev: <strong className="text-slate-800">{formatINR(report.revenue)}</strong>
                              </p>
                              <p className="text-slate-400">
                                Exp: <span>{formatINR(report.expenses)}</span>
                              </p>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-[11px] text-slate-600 font-medium">
                              <div>Units: <strong className="text-slate-800">{report.production_units}</strong></div>
                              <div>Att: <strong className="text-slate-800">{report.attendance_rate}%</strong></div>
                              <div className={report.safety_incidents > 0 ? "text-rose-600 font-bold" : ""}>
                                Incidents: <span>{report.safety_incidents}</span>
                              </div>
                              <div className={report.quality_score < 90.0 ? "text-rose-600 font-bold" : "text-emerald-600 font-bold"}>
                                Quality: <span>{report.quality_score}%</span>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <span className={`inline-flex px-2 py-0.5 rounded text-[10px] font-bold border ${
                              report.status === 'Approved' 
                                ? 'bg-emerald-50 text-emerald-600 border-emerald-100'
                                : report.status === 'Rejected'
                                ? 'bg-rose-50 text-rose-600 border-rose-100'
                                : 'bg-amber-50 text-amber-600 border-amber-100'
                            }`}>
                              {report.status}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-right">
                            {isAdmin && report.status === 'Submitted' ? (
                              <div className="flex justify-end space-x-1.5">
                                <button
                                  onClick={() => handleApprove(report.id)}
                                  className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded text-[10px] font-bold transition-colors cursor-pointer inline-flex items-center"
                                  title="Approve Report"
                                >
                                  <CheckCircle className="w-3.5 h-3.5 mr-1" />
                                  Approve
                                </button>
                                <button
                                  onClick={() => handleReject(report.id)}
                                  className="px-2.5 py-1 bg-rose-600 hover:bg-rose-700 text-white rounded text-[10px] font-bold transition-colors cursor-pointer inline-flex items-center"
                                  title="Reject Report"
                                >
                                  <XCircle className="w-3.5 h-3.5 mr-1" />
                                  Reject
                                </button>
                              </div>
                            ) : (
                              <span className="text-[10px] text-slate-400 font-medium">No actions</span>
                            )}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </>
      )}

      {/* HISTORY VIEW */}
      {activeTab === 'history' && (
        <div className="bg-white rounded-xl border border-slate-100 shadow-sm overflow-hidden">
          {loading ? (
            <div className="flex py-20 justify-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
          ) : (
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-100">
                  <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-wider">File Name</th>
                  <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-wider">Period</th>
                  <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-wider">Score</th>
                  <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-wider">Uploaded By</th>
                  <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-wider">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {historyList.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-10 text-center text-xs text-slate-400">
                      No Excel uploads found.
                    </td>
                  </tr>
                ) : (
                  historyList.map((h) => (
                    <tr key={h.id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="px-6 py-4">
                        <span className="text-xs font-bold text-slate-800">{h.file_name}</span>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-xs text-slate-600 font-semibold">
                          {MONTH_NAMES[h.month]} {h.year}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        {h.validation_score !== null ? (
                          <span className={`text-xs font-bold ${h.validation_score === 100 ? 'text-emerald-600' : h.validation_score > 70 ? 'text-amber-600' : 'text-rose-600'}`}>
                            {h.validation_score.toFixed(1)}%
                          </span>
                        ) : (
                          <span className="text-xs text-slate-400">-</span>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex px-2 py-0.5 rounded text-[10px] font-bold border ${
                          h.status === 'Success' 
                            ? 'bg-emerald-50 text-emerald-600 border-emerald-100'
                            : h.status === 'Pending'
                            ? 'bg-amber-50 text-amber-600 border-amber-100'
                            : 'bg-rose-50 text-rose-600 border-rose-100'
                        }`}>
                          {h.status}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-[11px] text-slate-600">{h.uploaded_by_name}</span>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-[11px] text-slate-500">{safeDate(h.uploaded_at).toLocaleString()}</span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          )}
        </div>
      )}

      {/* EEIM UPLOAD MODAL */}
      {showUploadModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-filter backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl border border-slate-100 shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto animate-fade-in">
            <div className="flex items-center justify-between p-4 border-b border-slate-100 bg-slate-50">
              <h3 className="text-sm font-bold text-slate-800 flex items-center">
                <FileSpreadsheet className="w-4 h-4 mr-2 text-blue-600" />
                Enterprise Excel Upload
              </h3>
              <button onClick={() => setShowUploadModal(false)} className="text-slate-400 hover:text-slate-600 cursor-pointer">
                <X className="w-4 h-4" />
              </button>
            </div>
            
            <div className="p-6">
              {/* Progress Tracker */}
              <div className="flex items-center justify-between mb-8 relative">
                <div className="absolute left-0 top-1/2 w-full h-0.5 bg-slate-100 -z-10"></div>
                <div className={`flex flex-col items-center ${uploadStep >= 1 ? 'text-blue-600' : 'text-slate-400'}`}>
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs ${uploadStep >= 1 ? 'bg-blue-600 text-white' : 'bg-slate-100'}`}>1</div>
                  <span className="text-[10px] font-bold mt-1 uppercase">Select File</span>
                </div>
                <div className={`flex flex-col items-center ${uploadStep >= 2 ? 'text-blue-600' : 'text-slate-400'}`}>
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs ${uploadStep >= 2 ? 'bg-blue-600 text-white' : 'bg-slate-100'}`}>2</div>
                  <span className="text-[10px] font-bold mt-1 uppercase">Validate & Preview</span>
                </div>
                <div className={`flex flex-col items-center ${uploadStep >= 3 ? 'text-emerald-600' : 'text-slate-400'}`}>
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs ${uploadStep >= 3 ? 'bg-emerald-600 text-white' : 'bg-slate-100'}`}>3</div>
                  <span className="text-[10px] font-bold mt-1 uppercase">Confirm</span>
                </div>
              </div>

              {uploadError && (
                <div className="mb-4 p-3 bg-rose-50 border border-rose-100 rounded-lg text-rose-600 text-xs flex items-start">
                  <XCircle className="w-4 h-4 mr-2 shrink-0 mt-0.5" />
                  <p>{uploadError}</p>
                </div>
              )}

              {uploadStep === 1 && (
                <div className="space-y-6">
                  <div className="border-2 border-dashed border-slate-200 rounded-xl p-10 flex flex-col items-center justify-center bg-slate-50 hover:bg-slate-100 transition-colors cursor-pointer relative">
                    <input 
                      type="file" 
                      accept=".xlsx"
                      onChange={handleFileChange}
                      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                    />
                    <Upload className="w-10 h-10 text-slate-400 mb-3" />
                    <p className="text-sm font-bold text-slate-700">Drag & drop your Excel report here</p>
                    <p className="text-xs text-slate-400 mt-1">or click to browse (.xlsx only)</p>
                  </div>
                  
                  {selectedFile && (
                    <div className="p-3 bg-blue-50 border border-blue-100 rounded-lg flex items-center justify-between">
                      <div className="flex items-center">
                        <FileSpreadsheet className="w-4 h-4 text-blue-600 mr-2" />
                        <span className="text-xs font-semibold text-slate-700">{selectedFile.name}</span>
                      </div>
                      <span className="text-[10px] text-slate-400">{(selectedFile.size / 1024).toFixed(1)} KB</span>
                    </div>
                  )}

                  <div className="flex justify-end pt-4 border-t border-slate-100">
                    <button
                      onClick={handleUploadExcel}
                      disabled={!selectedFile || isUploading}
                      className="enterprise-btn-primary flex items-center cursor-pointer disabled:opacity-50"
                    >
                      {isUploading ? 'Uploading...' : 'Upload & Validate'}
                      <ChevronRight className="w-4 h-4 ml-1" />
                    </button>
                  </div>
                </div>
              )}

              {uploadStep === 2 && validationReport && (
                <div className="space-y-6">
                  {/* Validation Summary */}
                  <div className={`p-4 rounded-xl border flex items-start ${
                    validationReport.status === 'SUCCESS' ? 'bg-emerald-50 border-emerald-100' :
                    validationReport.status === 'WARNINGS' ? 'bg-amber-50 border-amber-100' :
                    'bg-rose-50 border-rose-100'
                  }`}>
                    {validationReport.status === 'SUCCESS' ? <CheckCircle className="w-5 h-5 text-emerald-600 mr-3 mt-0.5 shrink-0" /> :
                     validationReport.status === 'WARNINGS' ? <AlertTriangle className="w-5 h-5 text-amber-600 mr-3 mt-0.5 shrink-0" /> :
                     <XCircle className="w-5 h-5 text-rose-600 mr-3 mt-0.5 shrink-0" />}
                    
                    <div>
                      <h4 className={`text-sm font-bold ${
                        validationReport.status === 'SUCCESS' ? 'text-emerald-800' :
                        validationReport.status === 'WARNINGS' ? 'text-amber-800' : 'text-rose-800'
                      }`}>
                        Validation {validationReport.status === 'SUCCESS' ? 'Passed' : validationReport.status === 'WARNINGS' ? 'Passed with Warnings' : 'Failed'}
                      </h4>
                      <p className={`text-xs mt-1 ${
                        validationReport.status === 'SUCCESS' ? 'text-emerald-600' :
                        validationReport.status === 'WARNINGS' ? 'text-amber-700' : 'text-rose-600'
                      }`}>
                        {validationReport.total_errors} Errors | {validationReport.total_warnings} Warnings found in <strong>{validationReport.file_name}</strong>
                      </p>
                    </div>
                  </div>

                  {/* Errors and Warnings List */}
                  {(validationReport.errors.length > 0 || validationReport.warnings.length > 0) && (
                    <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
                      <table className="w-full text-left">
                        <thead className="bg-slate-50 border-b border-slate-200">
                          <tr>
                            <th className="px-4 py-2 text-[10px] font-bold text-slate-500 uppercase">Issue</th>
                            <th className="px-4 py-2 text-[10px] font-bold text-slate-500 uppercase">Field</th>
                            <th className="px-4 py-2 text-[10px] font-bold text-slate-500 uppercase">Entered Value</th>
                            <th className="px-4 py-2 text-[10px] font-bold text-slate-500 uppercase">Rule</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {validationReport.errors.map((err, idx) => (
                            <tr key={`err-${idx}`}>
                              <td className="px-4 py-2"><span className="inline-flex px-1.5 py-0.5 bg-rose-100 text-rose-700 text-[9px] font-bold rounded uppercase">Error</span></td>
                              <td className="px-4 py-2 text-xs font-semibold text-slate-700">{err.column || 'General'}</td>
                              <td className="px-4 py-2 text-xs text-rose-600 font-mono">{err.value || '-'}</td>
                              <td className="px-4 py-2 text-xs text-slate-600">{err.rule}</td>
                            </tr>
                          ))}
                          {validationReport.warnings.map((warn, idx) => (
                            <tr key={`warn-${idx}`}>
                              <td className="px-4 py-2"><span className="inline-flex px-1.5 py-0.5 bg-amber-100 text-amber-700 text-[9px] font-bold rounded uppercase">Warning</span></td>
                              <td className="px-4 py-2 text-xs font-semibold text-slate-700">{warn.column || 'General'}</td>
                              <td className="px-4 py-2 text-xs text-amber-600 font-mono">{warn.value || '-'}</td>
                              <td className="px-4 py-2 text-xs text-slate-600">{warn.rule}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}

                  {/* Parsed Data Preview */}
                  {validationReport.parsed_data && validationReport.status !== 'FAILED' && (
                    <div className="mt-4">
                      <h4 className="text-xs font-bold text-slate-800 uppercase mb-3">Data Preview</h4>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                        <div className="p-3 bg-slate-50 border border-slate-100 rounded-lg">
                          <p className="text-[10px] font-bold text-slate-400 uppercase">Period</p>
                          <p className="text-xs font-bold text-slate-800 mt-1">{MONTH_NAMES[validationReport.parsed_data.month]} {validationReport.parsed_data.year}</p>
                        </div>
                        <div className="p-3 bg-slate-50 border border-slate-100 rounded-lg">
                          <p className="text-[10px] font-bold text-slate-400 uppercase">Revenue</p>
                          <p className="text-xs font-bold text-slate-800 mt-1">{formatINR(validationReport.parsed_data.revenue)}</p>
                        </div>
                        <div className="p-3 bg-slate-50 border border-slate-100 rounded-lg">
                          <p className="text-[10px] font-bold text-slate-400 uppercase">Production</p>
                          <p className="text-xs font-bold text-slate-800 mt-1">{validationReport.parsed_data.production_units} units</p>
                        </div>
                        <div className="p-3 bg-slate-50 border border-slate-100 rounded-lg">
                          <p className="text-[10px] font-bold text-slate-400 uppercase">Quality</p>
                          <p className="text-xs font-bold text-emerald-600 mt-1">{validationReport.parsed_data.quality_score}%</p>
                        </div>
                      </div>
                    </div>
                  )}

                  <div className="flex justify-between pt-4 border-t border-slate-100">
                    <button
                      onClick={() => setUploadStep(1)}
                      className="enterprise-btn-secondary cursor-pointer"
                    >
                      Back
                    </button>
                    <button
                      onClick={handleConfirmUpload}
                      disabled={validationReport.status === 'FAILED' || isUploading}
                      className="enterprise-btn-primary flex items-center cursor-pointer disabled:opacity-50"
                    >
                      {isUploading ? 'Saving...' : 'Confirm & Save Data'}
                    </button>
                  </div>
                </div>
              )}

              {uploadStep === 3 && (
                <div className="py-10 flex flex-col items-center justify-center text-center animate-fade-in">
                  <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mb-4">
                    <CheckCircle className="w-8 h-8 text-emerald-600" />
                  </div>
                  <h3 className="text-lg font-bold text-slate-800">Upload Successful!</h3>
                  <p className="text-sm text-slate-500 mt-2 max-w-sm">
                    The operations report has been securely saved and your plant's KPIs have been updated.
                  </p>
                  <button
                    onClick={() => {
                      setShowUploadModal(false);
                      setActiveTab('history');
                    }}
                    className="mt-6 enterprise-btn-primary cursor-pointer"
                  >
                    View Upload History
                  </button>
                </div>
              )}

            </div>
          </div>
        </div>
      )}

      {/* MANAGER MANUAL SUBMISSION MODAL (Legacy) */}
      {showSubmitModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-filter backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl border border-slate-100 shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto animate-fade-in">
            <div className="flex items-center justify-between p-4 border-b border-slate-100">
              <h3 className="text-sm font-semibold text-slate-800">Submit Manual Report</h3>
              <button onClick={() => setShowSubmitModal(false)} className="text-slate-400 hover:text-slate-600 cursor-pointer">
                <X className="w-4 h-4" />
              </button>
            </div>
            
            <form onSubmit={handleSubmitReport} className="p-4 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-semibold text-slate-400 uppercase mb-1">Year</label>
                  <select
                    value={newReport.year}
                    onChange={(e) => setNewReport({ ...newReport, year: Number(e.target.value) })}
                    className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg outline-none focus:border-blue-600"
                  >
                    {yearOptions.map((y) => (
                      <option key={y} value={y}>{y}</option>
                    ))}
                  </select>
                </div>
                
                <div>
                  <label className="block text-[10px] font-semibold text-slate-400 uppercase mb-1">Month</label>
                  <select
                    value={newReport.month}
                    onChange={(e) => setNewReport({ ...newReport, month: Number(e.target.value) })}
                    className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg outline-none focus:border-blue-600"
                  >
                    {MONTH_NAMES.map((name, idx) => {
                      if (idx === 0) return null;
                      return <option key={idx} value={idx}>{name}</option>;
                    })}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-semibold text-slate-400 uppercase mb-1">Revenue (INR) *</label>
                  <input
                    type="number"
                    required
                    placeholder="e.g. 7500000"
                    value={newReport.revenue}
                    onChange={(e) => setNewReport({ ...newReport, revenue: e.target.value })}
                    className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg outline-none focus:border-blue-600"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-semibold text-slate-400 uppercase mb-1">Expenses (INR) *</label>
                  <input
                    type="number"
                    required
                    placeholder="e.g. 5200000"
                    value={newReport.expenses}
                    onChange={(e) => setNewReport({ ...newReport, expenses: e.target.value })}
                    className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg outline-none focus:border-blue-600"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-[10px] font-semibold text-slate-400 uppercase mb-1">Production Units *</label>
                  <input
                    type="number"
                    required
                    placeholder="e.g. 15000"
                    value={newReport.production_units}
                    onChange={(e) => setNewReport({ ...newReport, production_units: e.target.value })}
                    className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg outline-none focus:border-blue-600"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-semibold text-slate-400 uppercase mb-1">Attendance Rate (%) *</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    placeholder="e.g. 95.5"
                    value={newReport.attendance_rate}
                    onChange={(e) => setNewReport({ ...newReport, attendance_rate: e.target.value })}
                    className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg outline-none focus:border-blue-600"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-semibold text-slate-400 uppercase mb-1">Safety Incidents</label>
                  <input
                    type="number"
                    value={newReport.safety_incidents}
                    onChange={(e) => setNewReport({ ...newReport, safety_incidents: e.target.value })}
                    className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg outline-none focus:border-blue-600"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-semibold text-slate-400 uppercase mb-1">Quality Score (%) *</label>
                <input
                  type="number"
                  step="0.1"
                  required
                  placeholder="e.g. 98.4"
                  value={newReport.quality_score}
                  onChange={(e) => setNewReport({ ...newReport, quality_score: e.target.value })}
                  className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg outline-none focus:border-blue-600"
                />
              </div>

              <div>
                <label className="block text-[10px] font-semibold text-slate-400 uppercase mb-1">Remarks</label>
                <textarea
                  rows={3}
                  placeholder="Provide brief notes on manufacturing runs or downtime."
                  value={newReport.remarks}
                  onChange={(e) => setNewReport({ ...newReport, remarks: e.target.value })}
                  className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg outline-none focus:border-blue-600"
                />
              </div>

              <div className="flex justify-end space-x-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowSubmitModal(false)}
                  className="enterprise-btn-secondary cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="enterprise-btn-primary cursor-pointer"
                >
                  Submit Report
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default OperationsReports;
