import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';
import { safeDate } from '../../utils/date';
import {
  Users,
  Search,
  Plus,
  Edit,
  Trash2,
  X
} from 'lucide-react';


interface EmployeeItem {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  department: string;
  designation: string;
  status: string;
  joining_date: string;
  plant_id: string;
  plant_name?: string;
}

interface PlantItem {
  id: string;
  name: string;
}

const designationsByDept: Record<string, string[]> = {
  "Assembly & Machining": ["Machinist", "Assembly Technician", "Production Supervisor"],
  "Quality Assurance (QA)": ["QA Inspector", "QA Lead", "Quality Auditor"],
  "Logistics & Supply Chain": ["Logistics Coordinator", "Warehouse Specialist", "Dispatcher"],
  "Plant Engineering": ["Plant Director", "Maintenance Technician", "Automation Engineer"],
  "EH&S (Safety)": ["EHS Specialist", "Safety Inspector"]
};

const Workforce: React.FC = () => {
  const { user } = useAuth();
  const isAdmin = user?.role === 'Enterprise Admin';

  const [workforce, setWorkforce] = useState<EmployeeItem[]>([]);
  const [plants, setPlants] = useState<PlantItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [search, setSearch] = useState('');
  const [plantFilter, setPlantFilter] = useState('');
  const [deptFilter, setDeptFilter] = useState('');

  // Onboarding Modal
  const [showModal, setShowModal] = useState(false);
  const [modalMode, setModalMode] = useState<'create' | 'edit'>('create');
  const [currentEmployee, setCurrentEmployee] = useState<any>({
    id: '',
    first_name: '',
    last_name: '',
    email: '',
    department: 'Assembly & Machining',
    designation: 'Machinist',
    status: 'active',
    joining_date: '',
    plant_id: ''
  });

  const fetchWorkforce = async () => {
    setLoading(true);
    setError(null);
    try {
      const plantParam = plantFilter ? `&plant_id=${plantFilter}` : '';
      const res = await api.get(`/workforce/?${plantParam}`);
      setWorkforce(res.data);
    } catch (err) {
      console.error(err);
      setError('Failed to fetch workforce database.');
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
      console.error('Failed to load plants', err);
    }
  };

  useEffect(() => {
    fetchWorkforce();
  }, [plantFilter]);

  useEffect(() => {
    fetchPlants();
  }, []);

  const handleOpenAdd = () => {
    setModalMode('create');
    setCurrentEmployee({
      id: '',
      first_name: '',
      last_name: '',
      email: '',
      department: 'Assembly & Machining',
      designation: 'Machinist',
      status: 'active',
      joining_date: new Date().toISOString().split('T')[0],
      plant_id: isAdmin ? '' : user?.plant_id
    });
    setShowModal(true);
  };

  const handleOpenEdit = (emp: EmployeeItem) => {
    setModalMode('edit');
    setCurrentEmployee({
      ...emp,
      joining_date: emp.joining_date.split('T')[0]
    });
    setShowModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentEmployee.first_name || !currentEmployee.last_name || !currentEmployee.email || !currentEmployee.designation || !currentEmployee.plant_id) {
      alert('Please fill in all required fields.');
      return;
    }

    try {
      if (modalMode === 'create') {
        await api.post('/workforce/', currentEmployee);
      } else {
        await api.put(`/workforce/${currentEmployee.id}`, currentEmployee);
      }
      setShowModal(false);
      fetchWorkforce();
    } catch (err: any) {
      console.error(err);
      alert(err.response?.data?.detail || 'Operation failed. Please verify parameters.');
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (confirm(`Are you sure you want to delete personnel ${name}?`)) {
      try {
        await api.delete(`/workforce/${id}`);
        fetchWorkforce();
      } catch (err) {
        console.error(err);
        alert('Failed to delete personnel.');
      }
    }
  };

  const filteredWorkforce = workforce.filter((emp) => {
    const matchesSearch =
      `${emp.first_name} ${emp.last_name}`.toLowerCase().includes(search.toLowerCase()) ||
      emp.email.toLowerCase().includes(search.toLowerCase()) ||
      emp.designation.toLowerCase().includes(search.toLowerCase());
      
    const matchesDept = deptFilter ? emp.department === deptFilter : true;
    return matchesSearch && matchesDept;
  });

  return (
    <div className="p-6 space-y-6 animate-fade-in">
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between bg-white p-6 rounded-xl border border-slate-100 shadow-sm">
        <div>
          <h2 className="text-xl font-bold text-slate-800 flex items-center">
            <Users className="w-5 h-5 mr-2 text-blue-600" />
            Plant Workforce Directory
          </h2>
          <p className="text-xs text-slate-400 mt-1 font-medium">
            Manage assembly technicians, quality assurance inspectors, safety specialists, and operational personnel.
          </p>
        </div>
        <button
          onClick={handleOpenAdd}
          className="mt-4 md:mt-0 enterprise-btn-primary flex items-center cursor-pointer"
        >
          <Plus className="w-4 h-4 mr-2" />
          Onboard Personnel
        </button>
      </div>

      {/* Filter and Search Panel */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 bg-white p-4 rounded-xl border border-slate-100 shadow-sm">
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
          <input
            type="text"
            placeholder="Search by name, designation, or email..."
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
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
          </div>
        )}

        <div className={!isAdmin ? 'md:col-span-2' : ''}>
          <select
            value={deptFilter}
            onChange={(e) => setDeptFilter(e.target.value)}
            className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg outline-none focus:border-blue-600 transition-all bg-slate-50/50"
          >
            <option value="">All Departments</option>
            {Object.keys(designationsByDept).map((dept) => (
              <option key={dept} value={dept}>
                {dept}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Workforce Grid Table */}
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
                  <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-wider">Name</th>
                  {isAdmin && <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-wider">Plant Location</th>}
                  <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-wider">Department</th>
                  <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-wider">Designation</th>
                  <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-wider">Onboarding Date</th>
                  <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-wider text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {filteredWorkforce.length === 0 ? (
                  <tr>
                    <td colSpan={isAdmin ? 7 : 6} className="px-6 py-10 text-center text-xs text-slate-400">
                      No personnel match the search filters.
                    </td>
                  </tr>
                ) : (
                  filteredWorkforce.map((emp) => (
                    <tr key={emp.id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="px-6 py-4">
                        <div>
                          <p className="text-xs font-bold text-slate-800 leading-none">
                            {emp.first_name} {emp.last_name}
                          </p>
                          <span className="text-[10px] text-slate-400 block mt-1">{emp.email}</span>
                        </div>
                      </td>
                      {isAdmin && (
                        <td className="px-6 py-4">
                          <span className="text-xs text-slate-600 font-semibold">{emp.plant_name}</span>
                        </td>
                      )}
                      <td className="px-6 py-4">
                        <span className="text-xs text-slate-600 font-medium">{emp.department}</span>
                      </td>
                      <td className="px-6 py-4">
                        <span className="inline-flex px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-600 border border-slate-200">
                          {emp.designation}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-xs text-slate-500">
                        {safeDate(emp.joining_date).toLocaleDateString([], {
                          dateStyle: 'medium'
                        })}
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex px-2 py-0.5 rounded text-[10px] font-semibold border ${
                          emp.status === 'active' 
                            ? 'bg-emerald-50 text-emerald-600 border-emerald-100' 
                            : 'bg-slate-50 text-slate-400 border-slate-100'
                        }`}>
                          {emp.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right space-x-2">
                        <button
                          onClick={() => handleOpenEdit(emp)}
                          className="text-blue-600 hover:bg-blue-50 p-1.5 rounded-lg transition-colors cursor-pointer inline-flex"
                          title="Edit Details"
                        >
                          <Edit className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDelete(emp.id, `${emp.first_name} ${emp.last_name}`)}
                          className="text-rose-600 hover:bg-rose-50 p-1.5 rounded-lg transition-colors cursor-pointer inline-flex"
                          title="Offboard Personnel"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* CRUD MODAL FOR ONBOARDING AND EDIT */}
      {showModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-filter backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl border border-slate-100 shadow-xl w-full max-w-md animate-fade-in">
            <div className="flex items-center justify-between p-4 border-b border-slate-100">
              <h3 className="text-sm font-semibold text-slate-800">
                {modalMode === 'create' ? 'Onboard Plant Personnel' : 'Modify Personnel details'}
              </h3>
              <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-4 h-4" />
              </button>
            </div>
            
            <form onSubmit={handleSubmit} className="p-4 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-semibold text-slate-400 uppercase mb-1">First Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="John"
                    value={currentEmployee.first_name}
                    onChange={(e) => setCurrentEmployee({ ...currentEmployee, first_name: e.target.value })}
                    className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg outline-none focus:border-blue-600"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-semibold text-slate-400 uppercase mb-1">Last Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="Doe"
                    value={currentEmployee.last_name}
                    onChange={(e) => setCurrentEmployee({ ...currentEmployee, last_name: e.target.value })}
                    className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg outline-none focus:border-blue-600"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-semibold text-slate-400 uppercase mb-1">Email *</label>
                <input
                  type="email"
                  required
                  placeholder="john.doe@dana-demo.com"
                  value={currentEmployee.email}
                  onChange={(e) => setCurrentEmployee({ ...currentEmployee, email: e.target.value })}
                  className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg outline-none focus:border-blue-600"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-semibold text-slate-400 uppercase mb-1">Department *</label>
                  <select
                    value={currentEmployee.department}
                    onChange={(e) => {
                      const newDept = e.target.value;
                      setCurrentEmployee({ 
                        ...currentEmployee, 
                        department: newDept,
                        designation: designationsByDept[newDept][0]
                      });
                    }}
                    className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg outline-none focus:border-blue-600"
                  >
                    {Object.keys(designationsByDept).map((dept) => (
                      <option key={dept} value={dept}>{dept}</option>
                    ))}
                  </select>
                </div>
                
                <div>
                  <label className="block text-[10px] font-semibold text-slate-400 uppercase mb-1">Designation *</label>
                  <select
                    value={currentEmployee.designation}
                    onChange={(e) => setCurrentEmployee({ ...currentEmployee, designation: e.target.value })}
                    className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg outline-none focus:border-blue-600"
                  >
                    {designationsByDept[currentEmployee.department]?.map((desg) => (
                      <option key={desg} value={desg}>{desg}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-semibold text-slate-400 uppercase mb-1">Onboarding Date *</label>
                  <input
                    type="date"
                    required
                    value={currentEmployee.joining_date}
                    onChange={(e) => setCurrentEmployee({ ...currentEmployee, joining_date: e.target.value })}
                    className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg outline-none focus:border-blue-600"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-semibold text-slate-400 uppercase mb-1">Status</label>
                  <select
                    value={currentEmployee.status}
                    onChange={(e) => setCurrentEmployee({ ...currentEmployee, status: e.target.value })}
                    className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg outline-none focus:border-blue-600"
                  >
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-semibold text-slate-400 uppercase mb-1">Manufacturing Plant Assignment *</label>
                {isAdmin ? (
                  <select
                    value={currentEmployee.plant_id}
                    onChange={(e) => setCurrentEmployee({ ...currentEmployee, plant_id: e.target.value })}
                    className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg outline-none focus:border-blue-600"
                  >
                    <option value="">Select Plant Location</option>
                    {plants.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name}
                      </option>
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

              <div className="flex justify-end space-x-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="enterprise-btn-secondary"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="enterprise-btn-primary"
                >
                  {modalMode === 'create' ? 'Onboard' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Workforce;
