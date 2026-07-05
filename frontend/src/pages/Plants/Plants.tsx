import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import {
  Building2,
  Search,
  Plus,
  Mail,
  MapPin,
  Eye,
  Trash2,
  X,
  FileText,
  TrendingUp,
  Compass
} from 'lucide-react';

interface PlantItem {
  id: string;
  name: string;
  state: string;
  location: string;
  region: string;
  contact_email: string;
  contact_phone: string;
  status: string;
  created_at: string;
}

const formatINR = (value: number) => {
  if (value >= 10000000) {
    return `₹${(value / 10000000).toFixed(2)} Cr`;
  }
  return `₹${(value / 100000).toFixed(1)} L`;
};

const Plants: React.FC = () => {
  const [plants, setPlants] = useState<PlantItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const [search, setSearch] = useState('');
  const [regionFilter, setRegionFilter] = useState('');
  
  const [showAddModal, setShowAddModal] = useState(false);
  const [newPlant, setNewPlant] = useState({
    id: '',
    name: '',
    state: '',
    location: '',
    region: 'West',
    contact_email: '',
    contact_phone: '',
    status: 'active'
  });
  
  const [selectedPlant, setSelectedPlant] = useState<PlantItem | null>(null);
  const [plantDetailData, setPlantDetailData] = useState<any>(null);
  const [loadingDetail, setLoadingDetail] = useState(false);

  const fetchPlants = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.get('/plants/');
      setPlants(res.data);
    } catch (err) {
      console.error(err);
      setError('Failed to fetch manufacturing plants. Please check connection.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPlants();
  }, []);

  const handleOpenDetails = async (plant: PlantItem) => {
    setSelectedPlant(plant);
    setLoadingDetail(true);
    setPlantDetailData(null);
    try {
      const workforceRes = await api.get(`/workforce/?plant_id=${plant.id}`);
      const reportsRes = await api.get(`/operations-reports/?plant_id=${plant.id}`);
      const docsRes = await api.get(`/documents/?plant_id=${plant.id}`);
      
      setPlantDetailData({
        workforce: workforceRes.data,
        reports: reportsRes.data,
        documents: docsRes.data
      });
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingDetail(false);
    }
  };

  const handleCreatePlant = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPlant.id || !newPlant.name || !newPlant.location || !newPlant.contact_email) {
      alert('Please fill in all required fields.');
      return;
    }
    
    try {
      await api.post('/plants/', newPlant);
      setShowAddModal(false);
      setNewPlant({
        id: '',
        name: '',
        state: '',
        location: '',
        region: 'West',
        contact_email: '',
        contact_phone: '',
        status: 'active'
      });
      fetchPlants();
    } catch (err: any) {
      console.error(err);
      alert(err.response?.data?.detail || 'Failed to register manufacturing plant.');
    }
  };

  const handleDeletePlant = async (id: string) => {
    if (confirm(`Are you sure you want to delete plant ${id}? All related workforce and report logs will be lost.`)) {
      try {
        await api.delete(`/plants/${id}`);
        fetchPlants();
      } catch (err) {
        console.error(err);
        alert('Failed to delete plant.');
      }
    }
  };

  const filteredPlants = plants.filter((p) => {
    const matchesSearch =
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.id.toLowerCase().includes(search.toLowerCase()) ||
      p.location.toLowerCase().includes(search.toLowerCase());
    
    const matchesRegion = regionFilter ? p.region === regionFilter : true;
    return matchesSearch && matchesRegion;
  });

  // Group by regions for premium visualization
  const regions = ['North', 'South', 'East', 'West'];

  return (
    <div className="p-6 space-y-6 animate-fade-in">
      {/* Header Panel */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between bg-white p-6 rounded-xl border border-slate-100 shadow-sm">
        <div>
          <h2 className="text-xl font-bold text-slate-800 flex items-center">
            <Building2 className="w-5 h-5 mr-2 text-blue-600" />
            Manufacturing Plant Directory
          </h2>
          <p className="text-xs text-slate-400 mt-1 font-medium">
            Manage Dana India production factories, regional directories, and local contact details.
          </p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="mt-4 md:mt-0 enterprise-btn-primary flex items-center cursor-pointer"
        >
          <Plus className="w-4 h-4 mr-2" />
          Register New Plant
        </button>
      </div>

      {/* Search and Filters */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 bg-white p-4 rounded-xl border border-slate-100 shadow-sm">
        <div className="relative md:col-span-2">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
          <input
            type="text"
            placeholder="Search plants by name, code, or city..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-xs border border-slate-200 rounded-lg outline-none focus:border-blue-600 transition-all bg-slate-50/50"
          />
        </div>
        <div>
          <select
            value={regionFilter}
            onChange={(e) => setRegionFilter(e.target.value)}
            className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg outline-none focus:border-blue-600 transition-all bg-slate-50/50"
          >
            <option value="">All Regions</option>
            {regions.map((r) => (
              <option key={r} value={r}>
                {r} Region
              </option>
            ))}
          </select>
        </div>
      </div>

      {loading ? (
        <div className="flex py-20 justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      ) : error ? (
        <div className="p-4 bg-rose-50 border border-rose-100 rounded-xl text-rose-600 text-xs">
          {error}
        </div>
      ) : (
        <div className="space-y-8">
          {regions
            .filter((region) => !regionFilter || region === regionFilter)
            .map((region) => {
              const plantsInRegion = filteredPlants.filter((p) => p.region === region);
              if (plantsInRegion.length === 0) return null;
              
              return (
                <div key={region} className="space-y-4">
                  <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center">
                    <Compass className="w-4 h-4 mr-1.5 text-slate-400" />
                    {region} Operations ({plantsInRegion.length} Active Plants)
                  </h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {plantsInRegion.map((plant) => (
                      <div key={plant.id} className="enterprise-card p-5 flex flex-col justify-between hover:shadow-md transition-shadow">
                        <div>
                          <div className="flex justify-between items-start mb-3">
                            <span className="px-2 py-0.5 rounded bg-blue-50 border border-blue-100 text-blue-600 text-[10px] font-bold">
                              {plant.id}
                            </span>
                            <span className={`px-2 py-0.5 rounded text-[10px] font-semibold border ${
                              plant.status === 'active' 
                                ? 'bg-emerald-50 text-emerald-600 border-emerald-100' 
                                : 'bg-slate-50 text-slate-400 border-slate-100'
                            }`}>
                              {plant.status}
                            </span>
                          </div>
                          
                          <h4 className="text-sm font-bold text-slate-800">{plant.name}</h4>
                          <p className="text-[10px] text-slate-400 mt-1 font-semibold flex items-center">
                            <MapPin className="w-3.5 h-3.5 mr-1" />
                            {plant.location}, {plant.state}
                          </p>
                          
                          <div className="mt-4 pt-3 border-t border-slate-100 space-y-2">
                            <div className="flex items-center text-xs text-slate-600">
                              <Mail className="w-4 h-4 mr-2 text-slate-400" />
                              <span className="truncate">{plant.contact_email}</span>
                            </div>
                            {plant.contact_phone && (
                              <p className="text-xs text-slate-600 pl-6">{plant.contact_phone}</p>
                            )}
                          </div>
                        </div>
                        
                        <div className="flex justify-end space-x-2 pt-4 mt-4 border-t border-slate-100/50">
                          <button
                            onClick={() => handleOpenDetails(plant)}
                            className="enterprise-btn-secondary py-1 px-2.5 flex items-center text-[10px] cursor-pointer"
                          >
                            <Eye className="w-3.5 h-3.5 mr-1.5" />
                            Operations Panel
                          </button>
                          <button
                            onClick={() => handleDeletePlant(plant.id)}
                            className="text-rose-600 hover:bg-rose-50 p-1.5 rounded-lg transition-colors cursor-pointer"
                            title="Delete Plant"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
        </div>
      )}

      {/* REGISTER NEW PLANT MODAL */}
      {showAddModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-filter backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl border border-slate-100 shadow-xl w-full max-w-md animate-fade-in">
            <div className="flex items-center justify-between p-4 border-b border-slate-100">
              <h3 className="text-sm font-semibold text-slate-800">Register Manufacturing Plant</h3>
              <button onClick={() => setShowAddModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-4 h-4" />
              </button>
            </div>
            
            <form onSubmit={handleCreatePlant} className="p-4 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-semibold text-slate-400 uppercase mb-1">Plant Code *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. PL009"
                    value={newPlant.id}
                    onChange={(e) => setNewPlant({ ...newPlant, id: e.target.value })}
                    className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg outline-none focus:border-blue-600"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-semibold text-slate-400 uppercase mb-1">Plant Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Noida Plant"
                    value={newPlant.name}
                    onChange={(e) => setNewPlant({ ...newPlant, name: e.target.value })}
                    className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg outline-none focus:border-blue-600"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div className="col-span-2">
                  <label className="block text-[10px] font-semibold text-slate-400 uppercase mb-1">State *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Uttar Pradesh"
                    value={newPlant.state}
                    onChange={(e) => setNewPlant({ ...newPlant, state: e.target.value })}
                    className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg outline-none focus:border-blue-600"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-semibold text-slate-400 uppercase mb-1">Location *</label>
                  <input
                    type="text"
                    required
                    placeholder="City"
                    value={newPlant.location}
                    onChange={(e) => setNewPlant({ ...newPlant, location: e.target.value })}
                    className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg outline-none focus:border-blue-600"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-semibold text-slate-400 uppercase mb-1">Region *</label>
                  <select
                    value={newPlant.region}
                    onChange={(e) => setNewPlant({ ...newPlant, region: e.target.value })}
                    className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg outline-none focus:border-blue-600"
                  >
                    <option value="West">West</option>
                    <option value="South">South</option>
                    <option value="North">North</option>
                    <option value="East">East</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] font-semibold text-slate-400 uppercase mb-1">Phone</label>
                  <input
                    type="text"
                    placeholder="Contact number"
                    value={newPlant.contact_phone}
                    onChange={(e) => setNewPlant({ ...newPlant, contact_phone: e.target.value })}
                    className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg outline-none focus:border-blue-600"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-semibold text-slate-400 uppercase mb-1">Contact Email *</label>
                <input
                  type="email"
                  required
                  placeholder="manager.noida@dana-demo.com"
                  value={newPlant.contact_email}
                  onChange={(e) => setNewPlant({ ...newPlant, contact_email: e.target.value })}
                  className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg outline-none focus:border-blue-600"
                />
              </div>

              <div className="flex justify-end space-x-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="enterprise-btn-secondary"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="enterprise-btn-primary"
                >
                  Register Plant
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* PLANT OPERATIONS DETAILS PANEL MODAL */}
      {selectedPlant && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-filter backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl border border-slate-100 shadow-xl w-full max-w-4xl max-h-[90vh] overflow-y-auto animate-fade-in">
            <div className="flex items-center justify-between p-5 border-b border-slate-100 sticky top-0 bg-white z-10">
              <div>
                <h3 className="text-sm font-semibold text-slate-800 flex items-center">
                  <Building2 className="w-4 h-4 mr-2 text-blue-600" />
                  {selectedPlant.name} Operations Overview
                </h3>
                <p className="text-[10px] text-slate-400 mt-0.5">
                  Code: {selectedPlant.id} | Location: {selectedPlant.location}, {selectedPlant.state} | Region: {selectedPlant.region}
                </p>
              </div>
              <button onClick={() => setSelectedPlant(null)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            {loadingDetail ? (
              <div className="flex py-20 justify-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              </div>
            ) : plantDetailData ? (
              <div className="p-6 space-y-6">
                {/* Stats Summary */}
                <div className="grid grid-cols-3 gap-4">
                  <div className="p-4 bg-blue-50/50 border border-blue-100 rounded-xl">
                    <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Active Workforce</span>
                    <span className="text-xl font-bold text-blue-700 mt-1 block">
                      {plantDetailData.workforce.length} Personnel
                    </span>
                  </div>
                  <div className="p-4 bg-emerald-50/50 border border-emerald-100 rounded-xl">
                    <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Filed Reports</span>
                    <span className="text-xl font-bold text-emerald-700 mt-1 block">
                      {plantDetailData.reports.length} Reports
                    </span>
                  </div>
                  <div className="p-4 bg-purple-50/50 border border-purple-100 rounded-xl">
                    <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Technical Documents</span>
                    <span className="text-xl font-bold text-purple-700 mt-1 block">
                      {plantDetailData.documents.length} Docs
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Operations Reports Log */}
                  <div className="space-y-3">
                    <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center">
                      <TrendingUp className="w-4 h-4 mr-1.5 text-slate-500" />
                      Operations Report Log
                    </h4>
                    <div className="border border-slate-100 rounded-xl overflow-hidden text-xs max-h-60 overflow-y-auto">
                      <table className="w-full text-left">
                        <thead>
                          <tr className="bg-slate-50 border-b border-slate-100 text-slate-400">
                            <th className="px-4 py-2 font-bold uppercase text-[9px]">Period</th>
                            <th className="px-4 py-2 font-bold uppercase text-[9px]">Revenue</th>
                            <th className="px-4 py-2 font-bold uppercase text-[9px]">Quality</th>
                            <th className="px-4 py-2 font-bold uppercase text-[9px]">Status</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50">
                          {plantDetailData.reports.length === 0 ? (
                            <tr>
                              <td colSpan={4} className="px-4 py-6 text-center text-slate-400">No reports submitted</td>
                            </tr>
                          ) : (
                            plantDetailData.reports.map((rep: any) => (
                              <tr key={rep.id}>
                                <td className="px-4 py-2.5 font-semibold text-slate-800">
                                  {rep.month}/{rep.year}
                                </td>
                                <td className="px-4 py-2.5 text-slate-600 font-bold">{formatINR(rep.revenue)}</td>
                                <td className="px-4 py-2.5 text-emerald-600 font-bold">{rep.quality_score}%</td>
                                <td className="px-4 py-2.5">
                                  <span className={`inline-flex px-1.5 py-0.5 rounded text-[9px] font-bold ${
                                    rep.status === 'Approved' 
                                      ? 'bg-emerald-50 text-emerald-600 border border-emerald-100'
                                      : rep.status === 'Rejected'
                                      ? 'bg-rose-50 text-rose-600 border border-rose-100'
                                      : 'bg-amber-50 text-amber-600 border border-amber-100'
                                  }`}>
                                    {rep.status}
                                  </span>
                                </td>
                              </tr>
                            ))
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  {/* Documents Directory */}
                  <div className="space-y-3">
                    <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center">
                      <FileText className="w-4 h-4 mr-1.5 text-slate-500" />
                      Document Directory
                    </h4>
                    <div className="border border-slate-100 rounded-xl p-4 bg-slate-50/50 max-h-60 overflow-y-auto space-y-2">
                      {plantDetailData.documents.length === 0 ? (
                        <p className="text-xs text-slate-400 text-center py-10">No technical documents uploaded</p>
                      ) : (
                        plantDetailData.documents.map((doc: any) => (
                          <div key={doc.id} className="p-2.5 bg-white border border-slate-100 rounded-lg flex items-center justify-between text-xs">
                            <div className="min-w-0 flex-1 pr-2">
                              <p className="font-semibold text-slate-800 truncate" title={doc.file_name}>
                                {doc.file_name}
                              </p>
                              <span className="text-[9px] text-slate-400 block mt-0.5 uppercase font-bold">
                                {doc.category} | {doc.file_type}
                              </span>
                            </div>
                            <a
                              href={`${api.defaults.baseURL}/documents/download/${doc.id}`}
                              className="text-[10px] text-blue-600 hover:text-blue-700 font-bold"
                            >
                              Download
                            </a>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="p-6 text-center text-slate-400 text-xs">Failed to load plant details.</div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default Plants;
