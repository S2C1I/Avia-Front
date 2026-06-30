import { useEffect, useMemo, useState } from 'react';
import { Plus, Mail, Phone, Award, BookOpen, Edit, Trash2, Search, Hash, IdCard } from 'lucide-react';
import { api, normalizeApiId, SubjectRecord, TeacherPayload, TeacherRecord } from '../lib/api';

const professorColors = ['#0d1b2a', '#006233', '#C1272D', '#0d1b2a'];

export function Professeurs() {
  const [professors, setProfessors] = useState<TeacherRecord[]>([]);
  const [subjects, setSubjects] = useState<SubjectRecord[]>([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingTeacher, setEditingTeacher] = useState<TeacherRecord | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const normalizeTeacher = (t: any) => ({
    ...t,
    id: normalizeApiId(t?.id ?? t?._id ?? ''),
    fullName: String(t?.fullName ?? t?.name ?? ''),
    specialty: String(t?.specialty ?? ''),
    email: String(t?.email ?? ''),
    phone: String(t?.phone ?? ''),
    cne: String(t?.cne ?? ''),
    cnss: String(t?.cnss ?? ''),
    subjects: Array.isArray(t?.subjects) ? t.subjects : [],
  }) as TeacherRecord;

  const normalizeSubject = (s: any) => ({
    ...s,
    id: normalizeApiId(s?.id ?? s?._id ?? ''),
    name: String(s?.name ?? ''),
    teacherIds: Array.isArray(s?.teacherIds)
      ? s.teacherIds.map((teacherRef: any) => normalizeApiId(teacherRef?.id ?? teacherRef?._id ?? teacherRef)).filter(Boolean)
      : [],
  }) as SubjectRecord;

  const refreshData = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const [teacherData, subjectData] = await Promise.all([api.getTeachers(), api.getSubjects()]);
      const normalizedTeachers = Array.isArray(teacherData)
        ? teacherData.map(normalizeTeacher).filter((t) => Boolean(String(t.id ?? '')))
        : [];
      const normalizedSubjects = Array.isArray(subjectData)
        ? subjectData.map(normalizeSubject)
        : [];
      setProfessors(normalizedTeachers.slice().reverse());
      setSubjects(normalizedSubjects);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : 'Impossible de charger les professeurs.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    let active = true;
    void (async () => {
      if (!active) return;
      await refreshData();
    })();

    return () => { active = false; };
  }, []);

  const filteredProfessors = useMemo(() => {
    const q = String(searchQuery ?? '').toLowerCase();
    return (Array.isArray(professors) ? professors : []).filter((professor) => {
      const name = String((professor as any)?.fullName ?? '');
      const spec = String((professor as any)?.specialty ?? '');
      const cne = String((professor as any)?.cne ?? '');
      const cnss = String((professor as any)?.cnss ?? '');
      return name.toLowerCase().includes(q)
        || spec.toLowerCase().includes(q)
        || cne.toLowerCase().includes(q)
        || cnss.toLowerCase().includes(q);
    });
  }, [professors, searchQuery]);

  const professorSubjectsMap = useMemo(() => {
    const map = new Map<string, string[]>();
    for (const subject of subjects) {
      const subjectName = String((subject as any)?.name ?? '').trim();
      if (!subjectName) continue;
      const teacherIds = Array.isArray((subject as any)?.teacherIds) ? (subject as any).teacherIds : [];
      for (const teacherRef of teacherIds) {
        const teacherId = normalizeApiId(teacherRef?.id ?? teacherRef?._id ?? teacherRef);
        if (!teacherId) continue;
        const prev = map.get(teacherId) ?? [];
        if (!prev.includes(subjectName)) {
          prev.push(subjectName);
          map.set(teacherId, prev);
        }
      }
    }
    return map;
  }, [subjects]);

  const handleSave = async (payload: TeacherPayload, teacherId?: TeacherRecord['id']) => {
    try {
      if (teacherId) {
        await api.updateTeacher(teacherId, payload);
      } else {
        await api.createTeacher(payload);
      }
      await refreshData();
      setShowAddModal(false);
      setEditingTeacher(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    }
  };

  const handleDelete = async (teacherId: TeacherRecord['id']) => {
    const normalizedId = normalizeApiId(teacherId);
    if (!normalizedId) { setError('Impossible de supprimer : identifiant manquant.'); return; }
    try {
      await api.deleteTeacher(normalizedId);
      await refreshData();
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    }
  };

  const openEdit = (teacher: TeacherRecord) => {
    setEditingTeacher(teacher);
    setShowAddModal(true);
  };

  return (
    <div className="p-8 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl text-[#0e1f12]" style={{ fontFamily: 'Georgia, serif', fontWeight: 700 }}>Corps Enseignant</h1>
          <p className="text-slate-500 text-sm mt-1">Gestion et suivi des professeurs via l'API</p>
        </div>
        <button
          onClick={() => { setEditingTeacher(null); setShowAddModal(true); }}
          className="px-5 py-2.5 text-white rounded-xl transition-all flex items-center gap-2 text-sm font-semibold shadow-md"
          style={{ background: '#006233' }}
        >
          <Plus className="w-4 h-4" />
          Ajouter un Professeur
        </button>
      </div>

      {/* Alerte Erreur */}
      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-xs font-medium text-[#C1272D]">
          {error}
        </div>
      )}

      {/* Section Statistiques */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Total Professeurs', value: professors.length, icon: Award, bg: '#0d1b2a' },
          { label: 'Matieres Enseignees', value: subjects.length, icon: BookOpen, bg: '#006233' },
          { label: 'Professeurs Actifs', value: professors.length, icon: Award, bg: '#0d1b2a' },
        ].map((stat, i) => {
          const Icon = stat.icon;
          return (
            <div key={i} className="bg-white rounded-xl p-5 shadow-sm border border-slate-200/80 hover:shadow-md transition-shadow">
              <div className="w-11 h-11 rounded-xl flex items-center justify-center mb-3" style={{ background: stat.bg }}>
                <Icon className="w-5 h-5 text-white" />
              </div>
              <p className="text-slate-500 text-xs uppercase tracking-wider font-semibold">{stat.label}</p>
              <p className="text-2xl text-[#0e1f12] mt-1" style={{ fontFamily: 'Georgia, serif', fontWeight: 700 }}>{stat.value}</p>
            </div>
          );
        })}
      </div>

      {/* Liste des professeurs */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200/80">
        <div className="flex items-center justify-between p-6 border-b border-slate-100">
          <div>
            <h3 className="text-[#0e1f12]" style={{ fontFamily: 'Georgia, serif', fontWeight: 600, fontSize: '1.125rem' }}>Liste des Professeurs</h3>
            <p className="text-slate-400 text-xs mt-0.5">{filteredProfessors.length} membre{filteredProfessors.length > 1 ? 's' : ''} du corps enseignant</p>
          </div>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Rechercher..."
              className="pl-9 pr-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#006233] w-64 text-sm text-[#0e1f12]"
            />
          </div>
        </div>

        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {!isLoading && filteredProfessors.map((professor, idx) => (
              <div key={String(professor.id ?? `prof-${idx}`)} className="border border-slate-200 rounded-xl p-6 hover:shadow-md transition-all hover:border-slate-300 bg-white">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-4">
                    <div className="w-14 h-14 rounded-xl flex items-center justify-center shadow-md flex-shrink-0"
                      style={{ background: professorColors[idx % professorColors.length] }}>
                      <span className="text-white font-bold text-lg" style={{ fontFamily: 'Georgia, serif' }}>
                        {String(professor.fullName ?? '').trim().split(/\s+/).filter(Boolean).map((namePart) => namePart[0]).join('').slice(0, 2) || 'PR'}
                      </span>
                    </div>
                    <div>
                      <h4 className="text-[#0e1f12] font-semibold" style={{ fontFamily: 'Georgia, serif' }}>{professor.fullName}</h4>
                      <p className="text-xs font-semibold mt-0.5" style={{ color: professorColors[idx % professorColors.length] }}>{professor.specialty}</p>
                    </div>
                  </div>
                  <div className="flex gap-1">
                    <button onClick={() => openEdit(professor)} className="p-2 hover:bg-slate-100 rounded-lg transition-all">
                      <Edit className="w-4 h-4 text-slate-500" />
                    </button>
                    <button onClick={() => void handleDelete(professor.id)} className="p-2 hover:bg-red-50 rounded-lg transition-all">
                      <Trash2 className="w-4 h-4 text-[#C1272D]" />
                    </button>
                  </div>
                </div>

                <div className="space-y-2 mb-4">
                  <div className="flex items-center gap-2 text-xs text-slate-500">
                    <Mail className="w-3.5 h-3.5" />
                    {professor.email}
                  </div>
                  <div className="flex items-center gap-2 text-xs text-slate-500">
                    <Phone className="w-3.5 h-3.5" />
                    {professor.phone}
                  </div>
                  <div className="flex items-center gap-2 text-xs text-slate-500">
                    <IdCard className="w-3.5 h-3.5" />
                    <span className="font-semibold text-slate-600">CNE :</span>
                    <span>{professor.cne || '—'}</span>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-slate-500">
                    <Hash className="w-3.5 h-3.5" />
                    <span className="font-semibold text-slate-600">CNSS :</span>
                    <span>{professor.cnss || '—'}</span>
                  </div>
                </div>

                <div>
                  <p className="text-xs text-slate-400 mb-2 uppercase tracking-wider font-semibold">Matieres</p>
                  <div className="flex flex-wrap gap-1.5">
                    {(professorSubjectsMap.get(String(professor.id)) ?? []).length > 0
                      ? (professorSubjectsMap.get(String(professor.id)) ?? []).map((subject: string, index: number) => (
                          <span
                            key={String(subject ?? index)}
                            className="px-2.5 py-1 rounded-md text-xs font-medium border"
                            style={{ background: '#fdf5f5', color: '#0e1f12', borderColor: '#e2e8f0' }}
                          >
                            {String(subject)}
                          </span>
                        ))
                      : <span className="px-2.5 py-1 rounded-md text-xs font-medium border border-slate-100 bg-slate-50 text-slate-400">Aucune matiere assignee</span>
                    }
                  </div>
                </div>
              </div>
            ))}
            {isLoading && <p className="text-slate-400 text-sm">Chargement des professeurs...</p>}
          </div>
        </div>
      </div>

      {/* Modal d'ajout / modification */}
      {showAddModal && (
        <div className="fixed inset-0 bg-[#0d1b2a]/60 flex items-center justify-center z-50 backdrop-blur-sm" onClick={() => { setShowAddModal(false); setEditingTeacher(null); }}>
          <div className="bg-white rounded-2xl p-8 max-w-2xl w-full mx-4 shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: '#0d1b2a' }}>
                <Plus className="w-5 h-5 text-white" />
              </div>
              <div>
                <h3 className="text-xl text-[#0e1f12]" style={{ fontFamily: 'Georgia, serif', fontWeight: 700 }}>
                  {editingTeacher ? 'Modifier' : 'Ajouter'} un Professeur
                </h3>
                <p className="text-slate-400 text-sm">Informations du membre du corps enseignant</p>
              </div>
            </div>

            <form className="space-y-4" onSubmit={(e) => {
              e.preventDefault();
              const formData = new FormData(e.currentTarget);
              const payload: TeacherPayload = {
                fullName: String(formData.get('fullName') ?? ''),
                specialty: String(formData.get('specialty') ?? ''),
                email: String(formData.get('email') ?? ''),
                phone: String(formData.get('phone') ?? ''),
                cne: String(formData.get('cne') ?? ''),
                cnss: String(formData.get('cnss') ?? ''),
              };
              void handleSave(payload, editingTeacher?.id);
            }}>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-2 uppercase tracking-wider">Nom complet</label>
                  <input
                    name="fullName"
                    type="text"
                    className="w-full px-4 py-2.5 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#006233] text-[#0e1f12] text-sm"
                    placeholder="Mohamed El Idrissi"
                    defaultValue={editingTeacher?.fullName}
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-2 uppercase tracking-wider">Specialite</label>
                  <input
                    name="specialty"
                    type="text"
                    className="w-full px-4 py-2.5 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#006233] text-[#0e1f12] text-sm"
                    placeholder="Mathematics"
                    defaultValue={editingTeacher?.specialty}
                    required
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-2 uppercase tracking-wider">Email</label>
                  <input
                    name="email"
                    type="email"
                    className="w-full px-4 py-2.5 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#006233] text-[#0e1f12] text-sm"
                    placeholder="email@school.ma"
                    defaultValue={editingTeacher?.email}
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-2 uppercase tracking-wider">Telephone</label>
                  <input
                    name="phone"
                    type="tel"
                    className="w-full px-4 py-2.5 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#006233] text-[#0e1f12] text-sm"
                    placeholder="+212600000000"
                    defaultValue={editingTeacher?.phone}
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-2 uppercase tracking-wider">CNE</label>
                  <input
                    name="cne"
                    type="text"
                    className="w-full px-4 py-2.5 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#006233] text-[#0e1f12] text-sm"
                    placeholder="CNE-12345"
                    defaultValue={editingTeacher?.cne}
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-2 uppercase tracking-wider">CNSS</label>
                  <input
                    name="cnss"
                    type="text"
                    className="w-full px-4 py-2.5 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#006233] text-[#0e1f12] text-sm"
                    placeholder="CNSS-98765"
                    defaultValue={editingTeacher?.cnss}
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => { setShowAddModal(false); setEditingTeacher(null); }}
                  className="px-6 py-2.5 border border-slate-200 text-slate-600 rounded-lg hover:bg-slate-50 transition-all text-sm font-medium"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 text-white rounded-lg transition-all text-sm font-semibold shadow-md"
                  style={{ background: '#006233' }}
                >
                  {editingTeacher ? 'Enregistrer' : 'Ajouter'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

