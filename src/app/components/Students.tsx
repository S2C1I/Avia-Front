import { useEffect, useMemo, useState, type FormEvent } from 'react';
import { Plus, Edit, Trash2, Eye, Phone, Search } from 'lucide-react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from './ui/alert-dialog';
import { api, ProgramRecord, StudentPayload, StudentRecord } from '../lib/api';

interface StudentsProps {
  onSelectStudent: (studentId: StudentRecord['id']) => void;
}

const YEAR_LEVEL_OPTIONS = [
  { value: '1st', label: '1ère année' },
  { value: '2nd', label: '2ème année' },
];

const CLASS_GROUP_OPTIONS = [
  { value: 'A', label: 'Classe A' },
  { value: 'B', label: 'Classe B' },
];

const PAGE_SIZE_OPTIONS = [4, 8, 12, 16, 24, 32];

export function Students({ onSelectStudent }: StudentsProps) {
  const [students, setStudents] = useState<StudentRecord[]>([]);
  const [programs, setPrograms] = useState<ProgramRecord[]>([]);
  const [filterProgramId, setFilterProgramId] = useState<string>('all');
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingStudent, setEditingStudent] = useState<StudentRecord | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [studentsPerPage, setStudentsPerPage] = useState(8);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [cneError, setCneError] = useState<string | null>(null);
  const [phoneError, setPhoneError] = useState<string | null>(null);

  const loadStudents = async (isMountedRef?: { current: boolean }) => {
    try {
      setIsLoading(true);
      setError(null);
      const [studentDataRaw, programDataRaw] = await Promise.all([
        api.getStudents(),
        api.getPrograms(),
      ]);
      if (isMountedRef && !isMountedRef.current) return;

      const normalizeArray = (val: unknown) => {
        if (Array.isArray(val)) return val;
        if (val && typeof val === 'object') {
          const obj = val as Record<string, unknown>;
          if (Array.isArray(obj.data)) return obj.data;
          if (Array.isArray(obj.students)) return obj.students;
          if (Array.isArray(obj.items)) return obj.items;
        }
        return [];
      };

      const studentData = normalizeArray(studentDataRaw).map((entry) => {
        const record = entry as StudentRecord & { _id?: string; programId?: unknown; parent?: unknown };
        return {
          ...record,
          id: record.id ?? record._id ?? '',
          programId: record.programId ?? '',
        } as StudentRecord;
      }) as StudentRecord[];
      const programData = normalizeArray(programDataRaw) as ProgramRecord[];

      if (!Array.isArray(studentDataRaw)) console.warn('api.getStudents returned non-array, normalized to array', studentDataRaw);
      if (!Array.isArray(programDataRaw)) console.warn('api.getPrograms returned non-array, normalized to array', programDataRaw);

      setStudents(studentData);
      setPrograms(programData);
    } catch (loadError) {
      if (isMountedRef && !isMountedRef.current) return;
      setError(loadError instanceof Error ? loadError.message : 'Impossible de charger les étudiants.');
    } finally {
      if (!isMountedRef || isMountedRef.current) {
        setIsLoading(false);
      }
    }
  };

  useEffect(() => {
    const isMounted = { current: true };
    void loadStudents(isMounted);

    return () => {
      isMounted.current = false;
    };
  }, []);

  const getProgramLabel = (programId: StudentRecord['programId'] | unknown) => {
    if (programId == null) return '';
    if (typeof programId === 'object') {
      const obj = programId as Record<string, any>;
      if (typeof obj.name === 'string' && obj.name.trim()) return obj.name;
      if (obj.id != null) programId = obj.id;
    }
    const program = programs.find((entry) => String(entry.id) === String(programId));
    return program?.name ?? String(programId ?? '');
  };

  const getYearLevelLabel = (yearLevel: unknown) => {
    const match = YEAR_LEVEL_OPTIONS.find((opt) => opt.value === String(yearLevel ?? ''));
    return match?.label ?? (yearLevel ? String(yearLevel) : 'N/A');
  };

  const getClassGroupLabel = (classGroup: unknown) => {
    const match = CLASS_GROUP_OPTIONS.find((opt) => opt.value === String(classGroup ?? ''));
    return match?.label ?? (classGroup ? String(classGroup) : 'N/A');
  };

  const getStatValue = (student: StudentRecord, key: string) => {
    const stats = student.stats as Record<string, unknown> | undefined;
    const aliases: Record<string, string[]> = {
      modulesValides: ['validatedModules', 'modulesValides', 'validated', 'validated_module_count'],
      matieresARattraper: ['retakeModules', 'matieresARattraper', 'retake', 'retake_module_count'],
      absences: ['absences', 'absenceCount', 'unjustifiedAbsences', 'unjustified_absences'],
    };

    const candidateKeys = [key, ...(aliases[key] ?? [])];
    for (const candidateKey of candidateKeys) {
      const value = stats?.[candidateKey];
      if (value !== undefined && value !== null && value !== '') {
        const numericValue = Number(value);
        return Number.isFinite(numericValue) ? numericValue : 0;
      }
    }

    return 0;
  };

  const normalizeGender = (gender: unknown) => {
    const value = String(gender ?? '').toLowerCase();
    return value === 'other' ? 'other' : 'male';
  };

  const getProgramValue = (program: ProgramRecord) => {
    const record = program as ProgramRecord & { _id?: string };
    return String(record.id ?? record._id ?? '');
  };

  const getStudentSortValue = (student: StudentRecord) => {
    const createdAtValue = student.createdAt ? Date.parse(student.createdAt) : NaN;
    if (Number.isFinite(createdAtValue)) return createdAtValue;

    const idValue = String(student.id ?? '');
    const numericId = Number(idValue);
    if (Number.isFinite(numericId)) return numericId;

    return idValue;
  };

  const sortedStudents = [...students].sort((left, right) => {
    const leftValue = getStudentSortValue(left);
    const rightValue = getStudentSortValue(right);

    if (typeof leftValue === 'number' && typeof rightValue === 'number') {
      return rightValue - leftValue;
    }

    return String(rightValue).localeCompare(String(leftValue));
  });

  const getStudentProgramId = (student: StudentRecord) => {
    const pid = student.programId;
    if (pid == null) return '';
    if (typeof pid === 'object') {
      const obj = pid as Record<string, unknown>;
      return String(obj.id ?? obj._id ?? '');
    }
    return String(pid);
  };

  const filteredStudents = sortedStudents
    .filter((student) => filterProgramId === 'all' || getStudentProgramId(student) === filterProgramId)
    .filter((student) => {
      const haystack = [student.fullName, student.cne, student.email, student.phone, getProgramLabel(student.programId), student.yearLevel, student.classGroup]
        .join(' ')
        .toLowerCase();
      return haystack.includes(searchTerm.toLowerCase());
    });

  const indexOfLastStudent = currentPage * studentsPerPage;
  const indexOfFirstStudent = indexOfLastStudent - studentsPerPage;
  const currentStudents = filteredStudents.slice(indexOfFirstStudent, indexOfLastStudent);

  const handleEdit = (student: StudentRecord) => {
    setEditingStudent(student);
    setShowAddModal(true);
  };

  const handleDelete = async (studentId: StudentRecord['id']) => {
    await api.deleteStudent(studentId);
    setStudents((prev) => prev.filter((student) => String(student.id) !== String(studentId)));
    void loadStudents();
  };

  const handleSave = async (student: StudentPayload, studentId?: StudentRecord['id']) => {
    const savedStudent = studentId
      ? await api.updateStudent(studentId, student)
      : await api.createStudent(student);

    setStudents((prev) => {
      if (studentId) {
        return prev.map((entry) => String(entry.id) === String(studentId) ? savedStudent : entry);
      }
      return [savedStudent, ...prev];
    });

    setShowAddModal(false);
    setEditingStudent(null);
    void loadStudents();
  };

  const normalizePhone = (val: string | undefined) => String(val ?? '').replace(/\D/g, '');

  const checkDuplicate = (field: 'cne' | 'phone', value: string) => {
    const val = String(value ?? '').trim();
    if (!val) return false;
    if (field === 'phone') {
      const norm = normalizePhone(val);
      return students.some((s) => normalizePhone(String(s.phone ?? '')) === norm && String(s.id) !== String(editingStudent?.id ?? ''));
    }
    return students.some((s) => String(s.cne ?? '').trim() === val && String(s.id) !== String(editingStudent?.id ?? ''));
  };

  const handleFormSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const data = Object.fromEntries(formData.entries());
    const studentData: StudentPayload = {
      fullName: data.fullName as string,
      cne: data.cne as string,
      programId: String(data.programId as string).trim(),
      yearLevel: data.yearLevel ? String(data.yearLevel) : undefined,
      classGroup: data.classGroup ? String(data.classGroup) : undefined,
      gender: normalizeGender(data.gender),
      address: data.address as string,
      email: data.email as string,
      phone: data.phone as string,
      parent: {
        fullName: data.parent as string,
        phone: data.parentPhone as string,
      },
    };
    void handleSave(studentData, editingStudent?.id);
  };

  useEffect(() => {
    if (showAddModal) {
      setCneError(null);
      setPhoneError(null);
    }
  }, [showAddModal, editingStudent]);

  const totalPages = useMemo(() => Math.max(Math.ceil(filteredStudents.length / studentsPerPage), 1), [filteredStudents.length, studentsPerPage]);

  return (
    <div className="p-6 space-y-6 min-h-screen" style={{ backgroundColor: '#fdf5f5' }}>
      {/* Top Banner Toolbar */}
      <div className="flex items-center justify-between gap-4 flex-wrap bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
        <div>
          <h2 className="text-3xl font-bold tracking-tight text-[#0e1f12]" style={{ fontFamily: 'Georgia, serif' }}>
            Étudiants
          </h2>
          <p className="text-slate-500 text-sm mt-1">Connecté au backend sur http://localhost:5000</p>
        </div>
        <div className="flex items-center gap-3 flex-wrap">
          <select
            value={filterProgramId}
            onChange={(e) => setFilterProgramId(e.target.value)}
            className="px-4 py-2 bg-white text-slate-700 font-medium rounded-xl border border-slate-200 shadow-sm focus:outline-none focus:ring-2 focus:ring-[#006233] focus:border-transparent transition-all text-sm"
          >
            <option value="all">Toutes les filières</option>
            {programs.map((program, idx) => (
              <option key={getProgramValue(program) || `program-${idx}`} value={getProgramValue(program)}>
                {program.name ?? `Filière ${idx + 1}`}
              </option>
            ))}
          </select>
          <div className="relative">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Rechercher un étudiant, CNE, email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 pr-4 py-2 w-64 bg-white text-slate-800 rounded-xl border border-slate-200 shadow-sm focus:outline-none focus:ring-2 focus:ring-[#006233] focus:border-transparent transition-all text-sm"
            />
          </div>
          <button
            onClick={() => setShowAddModal(true)}
            className="px-5 py-2 text-white rounded-xl transition-all flex items-center gap-2 shadow-md font-semibold text-sm hover:opacity-90"
            style={{ background: '#006233' }}
            aria-label="Ajouter un étudiant"
          >
            <Plus className="w-4 h-4 stroke-[2.5]" />
            Ajouter un étudiant
          </button>
        </div>
      </div>

      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-red-700 font-medium shadow-sm">
          {error}
        </div>
      )}

      {/* Main Corporate Design Table */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead style={{ background: '#0d1b2a' }}>
              <tr>
                <th className="px-6 py-4 text-xs font-semibold uppercase text-white/80 tracking-wider">Nom</th>
                <th className="px-6 py-4 text-xs font-semibold uppercase text-white/80 tracking-wider">Filière</th>
                <th className="px-6 py-4 text-xs font-semibold uppercase text-white/80 tracking-wider">Année</th>
                <th className="px-6 py-4 text-xs font-semibold uppercase text-white/80 tracking-wider">Classe</th>
                <th className="px-6 py-4 text-xs font-semibold uppercase text-white/80 tracking-wider">Contact</th>
                <th className="px-6 py-4 text-xs font-semibold uppercase text-white/80 tracking-wider">Modules Validés</th>
                <th className="px-6 py-4 text-xs font-semibold uppercase text-white/80 tracking-wider">Matières à Rattraper</th>
                <th className="px-6 py-4 text-xs font-semibold uppercase text-white/80 tracking-wider">Absences</th>
                <th className="px-6 py-4 text-right text-xs font-semibold uppercase text-white/80 tracking-wider rounded-tr-2xl">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-sm text-slate-700">
              {!isLoading && currentStudents.map((student) => (
                <tr
                  key={student.id ?? `${student.fullName ?? 'student'}-${Math.random().toString(36).slice(2,6)}`}
                  className="transition-colors hover:bg-[#fdf5f5]"
                >
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl flex items-center justify-center text-white font-bold shadow-sm" style={{ background: '#006233' }}>
                        <span>
                          {(student.fullName ?? '').split(' ').map((namePart) => (namePart ? namePart[0] : '')).join('')}
                        </span>
                      </div>
                      <div>
                        <p className="font-semibold text-[#0e1f12]">{student.fullName}</p>
                        <p className="text-[11px] font-mono text-slate-400 mt-0.5">CNE: {student.cne || 'N/A'}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className="px-3 py-1 rounded-lg text-xs font-bold text-white uppercase tracking-wider" style={{ background: '#0d1b2a' }}>
                      {getProgramLabel(student.programId)}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span className="px-3 py-1 rounded-lg text-xs font-bold text-white tracking-wider" style={{ background: '#006233' }}>
                      {getYearLevelLabel(student.yearLevel)}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span className="px-3 py-1 rounded-lg text-xs font-bold text-white tracking-wider" style={{ background: '#C1272D' }}>
                      {getClassGroupLabel(student.classGroup)}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="space-y-1 text-xs">
                      <div className="flex items-center gap-1.5 text-slate-600">
                        <Phone className="w-3.5 h-3.5 text-slate-400" />
                        <span className="font-medium">Perso :</span> {student.phone}
                      </div>
                      <div className="flex items-center gap-1.5 text-slate-500">
                        <Phone className="w-3.5 h-3.5 text-slate-400" />
                        <span className="font-medium">Parent :</span> {typeof student.parent === 'object' ? (student.parent as any).phone ?? (student.parent as any).fullName ?? 'N/A' : String(student.parent ?? 'N/A')}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 font-mono font-medium text-slate-600 pl-8">{getStatValue(student, 'modulesValides')}</td>
                  <td className="px-6 py-4 font-mono font-medium text-slate-600 pl-8">{getStatValue(student, 'matieresARattraper')}</td>
                  <td className="px-6 py-4 font-mono font-medium text-slate-600 pl-8">{getStatValue(student, 'absences')}</td>
                  <td className="px-6 py-4">
                    <div className="flex items-center justify-end gap-1.5">
                      <button
                        onClick={() => onSelectStudent(student.id)}
                        className="p-2 hover:bg-slate-100 hover:text-[#006233] rounded-lg transition-all"
                        title="Voir détails"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleEdit(student)}
                        className="p-2 hover:bg-slate-100 hover:text-[#006233] rounded-lg transition-all"
                        title="Modifier"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <button className="p-2 hover:bg-red-50 hover:text-[#C1272D] rounded-lg transition-all" title="Supprimer">
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </AlertDialogTrigger>
                        <AlertDialogContent className="rounded-2xl">
                          <AlertDialogHeader>
                            <AlertDialogTitle style={{ fontFamily: 'Georgia, serif' }}>Êtes-vous sûr de vouloir supprimer cet étudiant ?</AlertDialogTitle>
                            <AlertDialogDescription>
                              Cette action est irréversible.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel className="rounded-xl">Annuler</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={() => handleDelete(student.id)}
                              className="rounded-xl text-white hover:opacity-90"
                              style={{ background: '#C1272D' }}
                            >
                              Supprimer
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </td>
                </tr>
              ))}
              {isLoading && (
                <tr>
                  <td colSpan={9} className="px-6 py-12 text-center text-slate-400 font-medium">
                    Chargement des données étudiants...
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Alignment Footer Controls */}
        {filteredStudents.length > 0 && (
          <div className="p-4 flex items-center justify-between border-t border-slate-100 bg-slate-50/50">
            <div className="flex items-center gap-2">
              <span className="text-xs font-medium text-slate-500">
                Page {currentPage} sur {totalPages}
              </span>
              <span className="text-slate-300">|</span>
              <label className="text-xs font-medium text-slate-500">Afficher</label>
              <input
                type="number"
                min={1}
                value={studentsPerPage}
                onChange={(e) => {
                  const val = Math.max(1, parseInt(e.target.value, 10) || 1);
                  setStudentsPerPage(val);
                  setCurrentPage(1);
                }}
                className="w-14 px-2 py-1 bg-white border border-slate-200 rounded-lg text-xs font-semibold text-slate-600 shadow-sm focus:outline-none focus:ring-2 focus:ring-[#006233] text-center"
              />
              <span className="text-xs font-medium text-slate-500">par page</span>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setCurrentPage(p => Math.max(p - 1, 1))}
                disabled={currentPage === 1}
                className="px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-semibold text-slate-600 disabled:opacity-50 shadow-sm transition-colors hover:bg-slate-50"
              >
                Précédent
              </button>
              <button
                onClick={() => setCurrentPage(p => Math.min(p + 1, totalPages))}
                disabled={currentPage === totalPages}
                className="px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-semibold text-slate-600 disabled:opacity-50 shadow-sm transition-colors hover:bg-slate-50"
              >
                Suivant
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Styled Creation and Modification Modals */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 animate-fade-in p-4" onClick={() => { setShowAddModal(false); setEditingStudent(null); }}>
          <div className="bg-white rounded-2xl p-8 max-w-4xl w-full shadow-2xl max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-2xl font-bold text-[#0d1b2a] mb-6" style={{ fontFamily: 'Georgia, serif' }}>
              {editingStudent ? 'Modifier' : 'Ajouter'} un étudiant
            </h3>
            <form className="space-y-4" onSubmit={handleFormSubmit}>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-2">Nom complet</label>
                  <input name="fullName" type="text" className="w-full px-4 py-2 border border-slate-200 rounded-xl bg-slate-50/50 focus:outline-none focus:ring-2 focus:ring-[#006233] text-sm" placeholder="Jean Dupont" defaultValue={editingStudent?.fullName} required />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-2">CNE</label>
                  <input
                    name="cne"
                    type="text"
                    className="w-full px-4 py-2 border border-slate-200 rounded-xl bg-slate-50/50 focus:outline-none focus:ring-2 focus:ring-[#006233] text-sm"
                    placeholder="G123456789"
                    defaultValue={editingStudent?.cne}
                    onInput={(e) => {
                      const val = (e.currentTarget as HTMLInputElement).value;
                      setCneError(checkDuplicate('cne', val) ? 'CNE déjà utilisé par un autre étudiant' : null);
                    }}
                    required
                  />
                  {cneError && <p className="mt-1 text-xs font-semibold text-[#C1272D]">{cneError}</p>}
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-2">Filière</label>
                  <select name="programId" className="w-full px-4 py-2 border border-slate-200 rounded-xl bg-slate-50/50 focus:outline-none focus:ring-2 focus:ring-[#006233] text-sm" defaultValue={String(editingStudent?.programId ?? '')} required>
                    <option value="">-- Sélectionner une filière --</option>
                    {programs.map((program, idx) => (
                      <option key={getProgramValue(program) || `program-modal-${idx}`} value={getProgramValue(program)}>{program.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-2">Sexe</label>
                  <select name="gender" className="w-full px-4 py-2 border border-slate-200 rounded-xl bg-slate-50/50 focus:outline-none focus:ring-2 focus:ring-[#006233] text-sm" defaultValue={normalizeGender(editingStudent?.gender)} required>
                    <option value="male">Homme</option>
                    <option value="female">Femme</option>
                    <option value="other">Autre</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-2">Année</label>
                  <select name="yearLevel" className="w-full px-4 py-2 border border-slate-200 rounded-xl bg-slate-50/50 focus:outline-none focus:ring-2 focus:ring-[#006233] text-sm" defaultValue={String(editingStudent?.yearLevel ?? '')}>
                    <option value="">-- Sélectionner l'année --</option>
                    {YEAR_LEVEL_OPTIONS.map((opt) => (
                      <option key={opt.value} value={opt.value}>{opt.label}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-2">Classe</label>
                  <select name="classGroup" className="w-full px-4 py-2 border border-slate-200 rounded-xl bg-slate-50/50 focus:outline-none focus:ring-2 focus:ring-[#006233] text-sm" defaultValue={String(editingStudent?.classGroup ?? '')}>
                    <option value="">-- Sélectionner la classe --</option>
                    {CLASS_GROUP_OPTIONS.map((opt) => (
                      <option key={opt.value} value={opt.value}>{opt.label}</option>
                    ))}
                  </select>
                </div>
                <div className="md:col-span-2">
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-2">Adresse</label>
                  <textarea name="address" className="w-full px-4 py-2 border border-slate-200 rounded-xl bg-slate-50/50 focus:outline-none focus:ring-2 focus:ring-[#006233] text-sm h-20" placeholder="123 Rue de l'Exemple, Paris" defaultValue={editingStudent?.address} required></textarea>
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-2">Email</label>
                  <input name="email" type="email" className="w-full px-4 py-2 border border-slate-200 rounded-xl bg-slate-50/50 focus:outline-none focus:ring-2 focus:ring-[#006233] text-sm" placeholder="email@example.com" defaultValue={editingStudent?.email} required />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-2">Téléphone personnel</label>
                  <input
                    name="phone"
                    type="tel"
                    className="w-full px-4 py-2 border border-slate-200 rounded-xl bg-slate-50/50
 focus:ring-[#006233] text-sm"
                    placeholder="+33 6 12 34 56 78"
                    defaultValue={editingStudent?.phone}
                    onInput={(e) => {
                      const val = (e.currentTarget as HTMLInputElement).value;
                      setPhoneError(checkDuplicate('phone', val) ? 'Ce numéro est déjà utilisé par un autre étudiant' : null);
                    }}
                    required
                  />
                  {phoneError && <p className="mt-1 text-xs font-semibold text-[#C1272D]">{phoneError}</p>}
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-2">Nom complet du parent</label>
                  <input
                    name="parent"
                    type="text"
                    className="w-full px-4 py-2 border border-slate-200 rounded-xl bg-slate-50/50 focus:outline-none focus:ring-2 focus:ring-[#006233] text-sm"
                    placeholder="Michel Dupont"
                    defaultValue={typeof editingStudent?.parent === 'object' ? (editingStudent.parent as { fullName?: string }).fullName ?? '' : String(editingStudent?.parent ?? '')}
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-2">Numéro du parent</label>
                  <input name="parentPhone" type="tel" className="w-full px-4 py-2 border border-slate-200 rounded-xl bg-slate-50/50 focus:outline-none focus:ring-2 focus:ring-[#006233] text-sm" placeholder="+212 6 12 34 56 78" defaultValue={typeof editingStudent?.parent === 'object' ? (editingStudent.parent as { phone?: string }).phone ?? '' : ''} required />
                </div>
              </div>

              <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => { setShowAddModal(false); setEditingStudent(null); }}
                  className="px-5 py-2 border border-slate-200 text-slate-600 rounded-xl hover:bg-slate-50 transition-all font-semibold text-sm"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  disabled={!!cneError || !!phoneError}
                  className={`px-5 py-2 text-white font-semibold text-sm rounded-xl transition-all ${
                    cneError || phoneError ? 'bg-slate-300 text-slate-500 cursor-not-allowed' : 'hover:opacity-90 shadow-md'
                  }`}
                  style={!(cneError || phoneError) ? { background: '#006233' } : {}}
                >
                  {editingStudent ? 'Enregistrer' : 'Ajouter'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}