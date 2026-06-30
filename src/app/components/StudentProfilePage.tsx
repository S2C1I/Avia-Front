import { ArrowLeft, Mail, Phone, Calendar, Award, FileText, Users, Home, User, Edit, Plus, Trash2, CheckCircle2, AlertCircle } from 'lucide-react';
import { useEffect, useState } from 'react';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from './ui/alert-dialog';
import { api, StudentPayload, StudentRecord, ApiId, normalizeApiId } from '../lib/api';

interface Absence {
  id: string | number;
  date: string;
  justified: boolean;
}

interface Retard {
  id: string | number;
  date: string;
  justified?: boolean;
}

interface Student {
  id: StudentRecord['id'];
  name: string;
  cne: string;
  programId: StudentRecord['programId'] | '';
  track: string;
  sexe: string;
  adresse: string;
  email: string;
  phone: string;
  parentName: string;
  parentPhone: string;
  enrollment: string;
  yearLevel: string;
  classGroup: string;
  average: number;
  attendance: number;
  status: string;
  modulesValides: number;
  matieresARattraper: number;
  absences: number;
  absencesNonJustifiees: number;
  retards: Retard[];
  absenceRecords: Absence[];
  moduleGrades: ModuleGrade[];
}

interface ModuleGrade {
  name: string;
  grade: string | number;
  isValid?: boolean;
}

interface StudentProfilePageProps {
  studentId: ApiId;
  onBack: () => void;
  onUpdateStudent: (student: Student) => void;
}

const extractProgramModuleNames = (programData: Record<string, unknown> | null, subjectsRaw: unknown): string[] => {
  if (!programData) return [];
  const subjectLookup = new Map<string, string>();
  const subjectsArr = Array.isArray(subjectsRaw) ? subjectsRaw : [];
  subjectsArr.forEach((subject: any, index: number) => {
    const subjectId = normalizeApiId(subject?.id ?? subject?._id ?? subject);
    const subjectName = String(subject?.name ?? subject?.title ?? subject?.subject ?? subject?.matiere ?? subject?.module ?? subject?.label ?? `Module ${index + 1}`).trim();
    if (subjectId) subjectLookup.set(subjectId, subjectName);
  });

  const rawSubjects = Array.isArray(programData.subjects)
    ? programData.subjects
    : Array.isArray((programData as any).modules)
      ? (programData as any).modules
      : Array.isArray((programData as any).subjectsIds)
        ? (programData as any).subjectsIds
        : Array.isArray((programData as any).data?.subjects)
          ? (programData as any).data.subjects
          : Array.isArray((programData as any).program?.subjects)
            ? (programData as any).program.subjects
            : [];

  return rawSubjects
    .map((entry: any, index: number) => {
      if (typeof entry === 'string' || typeof entry === 'number') {
        const entryId = normalizeApiId(entry);
        return subjectLookup.get(entryId) ?? entryId ?? `Module ${index + 1}`;
      }
      if (entry && typeof entry === 'object') {
        const entryId = normalizeApiId(entry.id ?? entry._id ?? entry);
        const entryName = String(entry.name ?? entry.title ?? entry.subject ?? entry.matiere ?? entry.module ?? entry.label ?? '').trim();
        return entryName || subjectLookup.get(entryId) || entryId || `Module ${index + 1}`;
      }
      return `Module ${index + 1}`;
    })
    .filter((name: string) => name.trim().length > 0);
};

const unwrapMaybeData = (value: unknown): Record<string, unknown> | null => {
  if (!value || typeof value !== 'object') return null;
  const obj = value as Record<string, unknown>;
  if (obj.data && typeof obj.data === 'object') return obj.data as Record<string, unknown>;
  if (obj.program && typeof obj.program === 'object') return obj.program as Record<string, unknown>;
  return obj;
};

const unwrapArrayResponse = (value: unknown): any[] => {
  if (Array.isArray(value)) return value;
  if (!value || typeof value !== 'object') return [];
  const obj = value as Record<string, unknown>;
  if (Array.isArray(obj.data)) return obj.data as any[];
  if (Array.isArray(obj.results)) return obj.results as any[];
  if (Array.isArray(obj.items)) return obj.items as any[];
  return [];
};

const isAbsenceType = (value: unknown) => String(value ?? '').toLowerCase().includes('absence');
const isDelayType = (value: unknown) => {
  const type = String(value ?? '').toLowerCase();
  return type.includes('ret') || type.includes('delay');
};

const mapAttendanceRows = (rows: any[], kind: 'absence' | 'delay') => {
  const filter = kind === 'absence' ? isAbsenceType : isDelayType;
  return rows
    .filter((row: any) => filter(row?.type))
    .map((row: any) => ({
      id: normalizeApiId(row?.id ?? row?._id ?? row),
      date: row?.date,
      justified: !!row?.justified,
    }));
};

const normalizeModuleGrade = (name: string, value: any): ModuleGrade | null => {
  const moduleName = String(name ?? '').trim();
  if (!moduleName) return null;

  if (value && typeof value === 'object') {
    const rawGrade = value.grade ?? value.note ?? value.value ?? value.score ?? value.mark ?? value.result ?? value.average ?? value.moyenne ?? value.grades?.average ?? value.grades?.note ?? value.grades?.score ?? value.grades?.value ?? '';
    const numericGrade = Number(rawGrade);
    const isValid = typeof value.isValid === 'boolean'
      ? value.isValid
      : typeof value.valid === 'boolean'
        ? value.valid
        : typeof value.validated === 'boolean'
          ? value.validated
          : typeof value.isValidated === 'boolean'
            ? value.isValidated
            : typeof value.isRetake === 'boolean'
              ? !value.isRetake
              : Number.isFinite(numericGrade)
                ? numericGrade >= 10
                : String(value.status ?? '').toLowerCase().includes('valid');

    return {
      name: String(value.name ?? value.module ?? value.subject ?? value.matiere ?? value.label ?? moduleName),
      grade: rawGrade === '' || rawGrade == null ? 'N/A' : rawGrade,
      isValid,
    };
  }

  return {
    name: moduleName,
    grade: value === '' || value == null ? 'N/A' : value,
  };
};

const normalizeStudent = (studentData: Record<string, unknown>): Student => {
  const parentValue = studentData.parent;
  const parentObject = parentValue && typeof parentValue === 'object' ? parentValue as Record<string, unknown> : null;
  const statsObj = (studentData.stats && typeof studentData.stats === 'object' ? studentData.stats as Record<string, unknown> : {}) as Record<string, unknown>;

  const extractId = (val: unknown) => {
    if (val == null) return '';
    if (typeof val === 'string' || typeof val === 'number') {
      const s = String(val);
      const match = s.match(/ObjectId\(['"]?([0-9a-fA-F]{8,})['"]?\)/);
      if (match) return match[1];
      return s;
    }
    if (typeof val === 'object') {
      const obj = val as Record<string, any>;
      if (obj.id != null) return String(obj.id);
      if (obj._id != null) return String(obj._id);
      if (obj.$oid != null) return String(obj.$oid);
      try {
        const s = String(obj);
        if (s === '[object Object]') return '';
        return s;
      } catch { return '' }
    }
    return '';
  };

  const programObj = (studentData.program && typeof studentData.program === 'object')
    ? studentData.program as Record<string, unknown>
    : (studentData.programId && typeof studentData.programId === 'object' ? studentData.programId as Record<string, unknown> : {});

  const programIdVal = extractId(studentData.programId ?? programObj.id ?? programObj._id ?? programObj);

  const getStatNumber = (...keys: string[]) => {
    for (const k of keys) {
      if (k in statsObj) {
        const v = statsObj[k];
        const n = Number(v as any);
        if (Number.isFinite(n)) return n;
      }
      if (k in studentData) {
        const v = studentData[k as keyof typeof studentData];
        const n = Number(v as any);
        if (Number.isFinite(n)) return n;
      }
    }
    return 0;
  };

  const findAbsenceRecords = () => {
    const candidates = ['absenceRecords', 'absence_records', 'attendanceRecords', 'attendances', 'absencesList'];
    for (const c of candidates) {
      const v = (studentData as any)[c];
      if (Array.isArray(v)) return v as Absence[];
    }
    return [] as Absence[];
  };

  const findModuleGrades = () => {
    const candidates = [
      (studentData as any).moduleGrades,
      (studentData as any).grades,
      (studentData as any).notes,
      (studentData as any).modules,
      (statsObj as any).moduleGrades,
      (statsObj as any).grades,
      (statsObj as any).notes,
      (statsObj as any).modules,
    ];

    for (const candidate of candidates) {
      if (Array.isArray(candidate)) {
        const rows = candidate
          .map((item: any, index: number) => {
            const moduleName = String(item.name ?? item.module ?? item.subject ?? item.matiere ?? item.label ?? `Module ${index + 1}`);
            return normalizeModuleGrade(moduleName, item);
          })
          .filter(Boolean) as ModuleGrade[];
        if (rows.length) return rows;
      }

      if (candidate && typeof candidate === 'object') {
        const rows = Object.entries(candidate as Record<string, any>)
          .flatMap(([key, value]) => {
            if (key === 'length' || key === 'count' || key === 'total') return [];
            if (Array.isArray(value)) {
              return value
                .map((item: any, index: number) => normalizeModuleGrade(String(item?.name ?? item?.module ?? item?.subject ?? `${key} ${index + 1}`), item))
                .filter(Boolean) as ModuleGrade[];
            }
            return [normalizeModuleGrade(key, value)].filter(Boolean) as ModuleGrade[];
          });
        if (rows.length) return rows;
      }
    }
    return [] as ModuleGrade[];
  };

  const absenceRecords = findAbsenceRecords();
  const moduleGrades = findModuleGrades();

  return {
    id: (studentData.id as StudentRecord['id']) ?? (studentData._id as StudentRecord['id']) ?? (extractId((studentData as any)._id) || 0),
    name: String(studentData.fullName ?? studentData.name ?? ''),
    cne: String(studentData.cne ?? ''),
    programId: programIdVal,
    track: String(programObj.name ?? studentData.track ?? studentData.programName ?? ''),
    sexe: String(studentData.gender ?? studentData.sexe ?? ''),
    adresse: String(studentData.address ?? studentData.adresse ?? ''),
    email: String(studentData.email ?? ''),
    phone: String(studentData.phone ?? ''),
    parentName: String(parentObject?.fullName ?? parentObject?.name ?? parentValue ?? studentData.parentName ?? ''),
    parentPhone: String(parentObject?.phone ?? studentData.parentPhone ?? ''),
    enrollment: String(studentData.enrollment ?? ''),
    yearLevel: String(studentData.yearLevel ?? ''),
    classGroup: String(studentData.classGroup ?? ''),
    average: getStatNumber('average', 'avg', 'moyenne'),
    attendance: getStatNumber('attendance', 'presence', 'attended'),
    status: String(studentData.status ?? 'Active'),
    modulesValides: getStatNumber('modulesValides', 'validatedModules', 'validated', 'validated_module_count', 'validatedModulesCount', 'validModules', 'modulesValidated', 'modulesValidees', 'matieresValidees'),
    matieresARattraper: getStatNumber('matieresARattraper', 'retakeModules', 'retake', 'retake_module_count', 'retakeModulesCount', 'modulesARattraper', 'modulesToRetake', 'modulesRetake'),
    absences: getStatNumber('absences', 'absenceCount', 'unjustifiedAbsences', 'unjustified_absences') || absenceRecords.length,
    absencesNonJustifiees: getStatNumber('absencesNonJustifiees', 'unjustifiedAbsences', 'absencesNonJustifiees') || absenceRecords.filter(a => !a.justified).length,
    retards: Array.isArray(studentData.retards) ? studentData.retards as Retard[] : [],
    absenceRecords: absenceRecords,
    moduleGrades,
  };
};

const InfoCard = ({ icon, label, value }: { icon: React.ReactNode, label: string, value: string | number }) => (
  <div className="bg-white rounded-2xl p-4 border border-slate-200/60 shadow-sm transition-all hover:shadow-md">
    <div className="flex items-center gap-2.5 text-slate-400 mb-2">
      <div className="text-[#0d1b2a]">{icon}</div>
      <span className="text-xs font-semibold tracking-wide uppercase text-slate-400" style={{ fontFamily: 'Inter, sans-serif' }}>{label}</span>
    </div>
    <p className="text-[#0e1f12] text-sm font-semibold truncate" style={{ fontFamily: 'Inter, sans-serif' }}>{value || '—'}</p>
  </div>
);

export function StudentProfilePage({ studentId, onBack, onUpdateStudent }: StudentProfilePageProps) {
  const [student, setStudent] = useState<Student | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editedStudent, setEditedStudent] = useState<Student | null>(null);
  const [showAbsenceModal, setShowAbsenceModal] = useState(false);
  const [showRetardModal, setShowRetardModal] = useState(false);
  const [programModuleNames, setProgramModuleNames] = useState<string[]>([]);

  // Modals Local Form States
  const [newAbsenceDate, setNewAbsenceDate] = useState('');
  const [newAbsenceJustified, setNewAbsenceJustified] = useState(false);
  const [newRetardDate, setNewRetardDate] = useState('');

  useEffect(() => {
    let active = true;
    const loadStudent = async () => {
      try {
        setIsLoading(true);
        setError(null);
        let studentData = await api.getStudentFullData(studentId) as unknown;
        if (studentData && typeof studentData === 'object') {
          const obj = studentData as Record<string, unknown>;
          if (obj.data && typeof obj.data === 'object') studentData = obj.data;
          else if (obj.student && typeof obj.student === 'object') studentData = obj.student;
        }
        if (!active) return;
        let normalizedStudentSource = studentData as Record<string, unknown>;

        let normalizedStudent = normalizeStudent(normalizedStudentSource);
        try {
          const resolvedProgramId = normalizeApiId(normalizedStudent.programId);
          if (resolvedProgramId) {
            const [programResp, subjectsResp] = await Promise.all([api.getProgram(resolvedProgramId), api.getSubjects()]);
            const programData = unwrapMaybeData(programResp);
            const subjectsData = Array.isArray(subjectsResp) ? subjectsResp : unwrapMaybeData(subjectsResp)?.subjects ?? unwrapMaybeData(subjectsResp)?.data as unknown;
            setProgramModuleNames(extractProgramModuleNames(programData, subjectsData));
          } else {
            setProgramModuleNames([]);
          }
        } catch {
          setProgramModuleNames([]);
        }
        try {
          const attendanceResp = await api.getAttendanceByStudent(studentId);
          const attendanceArr = unwrapArrayResponse(attendanceResp);
          const mappedAbs = mapAttendanceRows(attendanceArr, 'absence');
          const mappedDelays = mapAttendanceRows(attendanceArr, 'delay');
          normalizedStudent = {
            ...normalizedStudent,
            absenceRecords: mappedAbs,
            absences: mappedAbs.length,
            absencesNonJustifiees: mappedAbs.filter(a => !a.justified).length,
            retards: mappedDelays,
          };
        } catch (e) {}
        setStudent(normalizedStudent);
        setEditedStudent(normalizedStudent);
      } catch (loadError) {
        if (active) {
          setError(loadError instanceof Error ? loadError.message : 'Impossible de charger le profil.');
          setStudent(null);
          setEditedStudent(null);
        }
      } finally {
        if (active) setIsLoading(false);
      }
    };
    void loadStudent();
    return () => { active = false; };
  }, [studentId]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setEditedStudent((prev) => prev ? { ...prev, [name]: value } : prev);
  };

  const handleSave = async () => {
    if (!editedStudent) return;
    try {
      const payload: StudentPayload = {
        fullName: editedStudent.name,
        cne: editedStudent.cne,
        programId: normalizeApiId(editedStudent.programId) || '',
        yearLevel: editedStudent.yearLevel || undefined,
        classGroup: editedStudent.classGroup || undefined,
        gender: editedStudent.sexe,
        address: editedStudent.adresse,
        email: editedStudent.email,
        phone: editedStudent.phone,
        parent: { fullName: editedStudent.parentName, phone: editedStudent.parentPhone },
        stats: {
          modulesValides: editedStudent.modulesValides,
          matieresARattraper: editedStudent.matieresARattraper,
          absences: editedStudent.absences,
          absencesNonJustifiees: editedStudent.absencesNonJustifiees,
          attendance: editedStudent.attendance,
          average: editedStudent.average,
        },
      };
      const savedStudent = await api.updateStudent(editedStudent.id, payload);
      let savedPayload: unknown = savedStudent as unknown;
      if (savedPayload && typeof savedPayload === 'object') {
        const obj = savedPayload as Record<string, unknown>;
        if (obj.data && typeof obj.data === 'object') savedPayload = obj.data;
        else if (obj.student && typeof obj.student === 'object') savedPayload = obj.student;
      }
      let normalizedStudent = normalizeStudent(savedPayload as Record<string, unknown>);
      normalizedStudent = {
        ...normalizedStudent,
        absenceRecords: editedStudent.absenceRecords ?? normalizedStudent.absenceRecords,
        absences: editedStudent.absences ?? normalizedStudent.absences,
        absencesNonJustifiees: editedStudent.absencesNonJustifiees ?? normalizedStudent.absencesNonJustifiees,
        retards: editedStudent.retards ?? normalizedStudent.retards,
      };
      setStudent(normalizedStudent);
      setEditedStudent(normalizedStudent);
      try { onUpdateStudent(normalizedStudent); } catch {}
      setShowEditModal(false);
    } catch (err) {
      alert('Échec de l\'enregistrement.');
    }
  };

  const addAbsence = () => {
    if (!newAbsenceDate || !student) return;
    const newRecord: Absence = { id: Date.now(), date: newAbsenceDate, justified: newAbsenceJustified };
    const updated = [...(student.absenceRecords || []), newRecord];
    updateAbsencesInState(updated);
    setNewAbsenceDate('');
    setNewAbsenceJustified(false);
  };

  const removeAbsence = (id: string | number) => {
    if (!student) return;
    const updated = (student.absenceRecords || []).filter(a => a.id !== id);
    updateAbsencesInState(updated);
  };

  const updateAbsencesInState = (newAbsences: Absence[]) => {
    const justified = newAbsences.filter(a => a.justified).length;
    const nonJustified = newAbsences.length - justified;
    const patch = { absenceRecords: newAbsences, absences: newAbsences.length, absencesNonJustifiees: nonJustified };
    setEditedStudent(prev => prev ? { ...prev, ...patch } : prev);
    setStudent(prev => prev ? { ...prev, ...patch } : prev);
  };

  const addRetard = () => {
    if (!newRetardDate || !student) return;
    const newRecord: Retard = { id: Date.now(), date: newRetardDate, justified: false };
    const updated = [...(student.retards || []), newRecord];
    updateRetardsInState(updated);
    setNewRetardDate('');
  };

  const removeRetard = (id: string | number) => {
    if (!student) return;
    const updated = (student.retards || []).filter(r => r.id !== id);
    updateRetardsInState(updated);
  };

  const updateRetardsInState = (newRetards: Retard[]) => {
    const patch = { retards: newRetards };
    setEditedStudent(prev => prev ? { ...prev, ...patch } : prev);
    setStudent(prev => prev ? { ...prev, ...patch } : prev);
  };

  if (isLoading || !student) {
    return (
      <div className="min-h-screen bg-[#fdf5f5] p-6">
        <button onClick={onBack} className="flex items-center gap-2 text-slate-500 hover:text-[#0d1b2a] mb-6 font-medium">
          <ArrowLeft className="w-4 h-4" /> Retour
        </button>
        <div className="text-center py-12 bg-white rounded-2xl border border-slate-200/60 shadow-sm">
          {isLoading ? <p className="text-slate-400 font-medium">Chargement du profil académique...</p> : <p className="text-[#C1272D] font-semibold">{error ?? 'Étudiant introuvable'}</p>}
        </div>
      </div>
    );
  }

  const currentStudentData = student;
  const displayModulesValides = Number(currentStudentData.modulesValides ?? 0) || 0;
  const displayMatieresARattraper = Number(currentStudentData.matieresARattraper ?? 0) || 0;
  const displayTotalModules = displayModulesValides + displayMatieresARattraper;
  const displayAbsences = Number(currentStudentData.absences ?? 0) || 0;
  const displayAbsencesNonJustifiees = Number(currentStudentData.absencesNonJustifiees ?? 0) || 0;
  const displayRetards = Array.isArray(currentStudentData.retards) ? currentStudentData.retards.length : Number(currentStudentData.retards ?? 0) || 0;
  const fallbackModuleAverage = currentStudentData.average;

  const moduleGradeRows = currentStudentData.moduleGrades.length > 0
    ? currentStudentData.moduleGrades
    : programModuleNames.map((name, index) => ({
        name,
        grade: fallbackModuleAverage > 0 ? fallbackModuleAverage.toFixed(1) : (index < displayModulesValides ? '12.0' : '8.5'),
        isValid: index < displayModulesValides,
      }));

  return (
    <div className="min-h-screen bg-[#fdf5f5] w-full text-[#0e1f12]">
      {/* Dynamic Header Block */}
      <div className="bg-white border-b border-slate-200/80 p-6 sticky top-0 z-20 shadow-sm">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <button onClick={onBack} className="p-2.5 bg-slate-50 border border-slate-200 hover:bg-[#fdf5f5] rounded-xl transition-all shadow-sm">
              <ArrowLeft className="w-4 h-4 text-[#0d1b2a]" />
            </button>
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-[#0d1b2a] tracking-tight" style={{ fontFamily: 'Georgia, serif' }}>
                {currentStudentData.name}
              </h1>
              <p className="text-xs font-mono text-slate-400 mt-0.5">Filière d'élite: <span className="text-[#006233] font-bold">{currentStudentData.track || 'Non assignée'}</span></p>
            </div>
          </div>

          <div className="flex items-center gap-2 self-end sm:self-auto">
            <button
              onClick={() => { setEditedStudent(student); setShowEditModal(true); }}
              className="px-4 py-2 bg-[#006233] text-white rounded-xl hover:opacity-90 transition-all flex items-center gap-2 text-xs font-bold shadow-sm"
            >
              <Edit className="w-3.5 h-3.5" />
              Modifier la fiche
            </button>
          </div>
        </div>
      </div>

      {/* Main Dashboard Canvas Container */}
      <div className="max-w-6xl mx-auto p-4 sm:p-6 space-y-6">
        
        {/* Information Grid System */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
          <InfoCard icon={<Mail className="w-4 h-4" />} label="Adresse Email" value={currentStudentData.email} />
          <InfoCard icon={<Phone className="w-4 h-4" />} label="Téléphone portable" value={currentStudentData.phone} />
          <InfoCard icon={<Calendar className="w-4 h-4" />} label="Année" value={currentStudentData.yearLevel === '1st' ? '1ère année' : currentStudentData.yearLevel === '2nd' ? '2ème année' : currentStudentData.yearLevel} />
          <InfoCard icon={<Award className="w-4 h-4" />} label="Spécialité / Track" value={currentStudentData.track} />
          <InfoCard icon={<FileText className="w-4 h-4" />} label="Code National (CNE)" value={currentStudentData.cne} />
          <InfoCard icon={<Users className="w-4 h-4" />} label="Classe" value={currentStudentData.classGroup} />
          <InfoCard icon={<Home className="w-4 h-4" />} label="Adresse" value={currentStudentData.adresse} />
          <InfoCard icon={<User className="w-4 h-4" />} label="Tuteur légal (Parent)" value={currentStudentData.parentName} />
          <InfoCard icon={<Phone className="w-4 h-4" />} label="Urgences parent" value={currentStudentData.parentPhone} />
        </div>

        {/* Global Overview Performance Metrics Panel */}
        <div className="bg-white border border-slate-200/70 rounded-2xl p-6 shadow-sm">
          <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 mb-6">
            <div>
              <h3 className="text-lg font-bold text-[#0d1b2a]" style={{ fontFamily: 'Georgia, serif' }}>Aperçu Global Académique</h3>
              <p className="text-xs text-slate-400 mt-0.5">Synthèse assiduité et validation de l'Aviation École</p>
            </div>
            <div className="flex gap-2">
              <button onClick={() => setShowAbsenceModal(true)} className="px-3 py-2 bg-rose-50 text-[#C1272D] rounded-xl border border-rose-100 hover:bg-rose-100/60 transition-all flex items-center gap-1.5 text-xs font-bold">
                <Plus className="w-3.5 h-3.5" /> Gérer Absences
              </button>
              <button onClick={() => setShowRetardModal(true)} className="px-3 py-2 bg-amber-50 text-amber-700 rounded-xl border border-amber-100 hover:bg-amber-100/60 transition-all flex items-center gap-1.5 text-xs font-bold">
                <Plus className="w-3.5 h-3.5" /> Gérer Retards
              </button>
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
            <div className="bg-[#fdf5f5] border border-slate-100 rounded-xl p-4 text-center">
              <p className="text-2xl font-bold text-[#0d1b2a]" style={{ fontFamily: 'Georgia, serif' }}>{displayTotalModules}</p>
              <p className="text-[10px] uppercase tracking-wider font-bold text-slate-400 mt-1">Total Modules</p>
            </div>
            <div className="bg-emerald-50/60 border border-emerald-100/50 rounded-xl p-4 text-center">
              <p className="text-2xl font-bold text-[#006233]" style={{ fontFamily: 'Georgia, serif' }}>{displayModulesValides}</p>
              <p className="text-[10px] uppercase tracking-wider font-bold text-emerald-600/80 mt-1">Modules Validés</p>
            </div>
            <div className="bg-rose-50/60 border border-rose-100/50 rounded-xl p-4 text-center">
              <p className="text-2xl font-bold text-[#C1272D]" style={{ fontFamily: 'Georgia, serif' }}>{displayMatieresARattraper}</p>
              <p className="text-[10px] uppercase tracking-wider font-bold text-rose-600/80 mt-1">À Rattraper</p>
            </div>
            <div className="bg-slate-50 border border-slate-200/60 rounded-xl p-4 text-center">
              <p className="text-2xl font-bold text-[#0d1b2a]" style={{ fontFamily: 'Georgia, serif' }}>{displayAbsences}</p>
              <p className="text-[10px] uppercase tracking-wider font-bold text-slate-400 mt-1">Absences</p>
            </div>
            <div className="bg-amber-50/60 border border-amber-100/50 rounded-xl p-4 text-center">
              <p className="text-2xl font-bold text-amber-700" style={{ fontFamily: 'Georgia, serif' }}>{displayAbsencesNonJustifiees}</p>
              <p className="text-[10px] uppercase tracking-wider font-bold text-amber-600 mt-1">Non Justifiées</p>
            </div>
            <div className="bg-slate-50 border border-slate-200/60 rounded-xl p-4 text-center">
              <p className="text-2xl font-bold text-[#0d1b2a]" style={{ fontFamily: 'Georgia, serif' }}>{displayRetards}</p>
              <p className="text-[10px] uppercase tracking-wider font-bold text-slate-400 mt-1">Retards</p>
            </div>
          </div>
        </div>

        {/* Modules & Academic Grades Data Table Sheet */}
        <div className="bg-white border border-slate-200/70 rounded-2xl p-5 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-lg font-bold text-[#0d1b2a]" style={{ fontFamily: 'Georgia, serif' }}>Bulletins des Modules & Crédits</h3>
              <p className="text-xs text-slate-400 mt-0.5">Suivi en temps réel des notes d'examens théoriques</p>
            </div>
            <span className="text-xs bg-[#fdf5f5] text-[#0d1b2a] border border-slate-200 px-3 py-1 rounded-full font-medium">Barème /20</span>
          </div>

          <div className="overflow-hidden rounded-xl border border-slate-200 shadow-sm">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-[#0d1b2a] text-white">
                  <th className="px-4 py-3 text-xs font-bold uppercase tracking-wider text-white/80">Intitulé du Module Académique</th>
                  <th className="px-4 py-3 text-xs font-bold uppercase tracking-wider text-white/80">Note Obtenue</th>
                  <th className="px-4 py-3 text-xs font-bold uppercase tracking-wider text-white/80 text-right">Statut de validation</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {moduleGradeRows.map((row, index) => {
                  const isSuccess = row.isValid !== false && (typeof row.grade === 'number' ? row.grade >= 10 : row.grade !== 'À rattraper');
                  return (
                    <tr key={`${row.name}-${index}`} className="hover:bg-[#fdf5f5] transition-colors">
                      <td className="px-4 py-3.5 text-xs font-semibold text-[#0e1f12]">{row.name}</td>
                      <td className="px-4 py-3.5 text-xs font-bold text-[#0d1b2a]">
                        {typeof row.grade === 'number' ? row.grade.toFixed(2) : row.grade}
                      </td>
                      <td className="px-4 py-3.5 text-right">
                        <span className={`inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-0.5 rounded-full ${
                          isSuccess ? 'bg-emerald-50 text-[#006233]' : 'bg-rose-50 text-[#C1272D]'
                        }`}>
                          {isSuccess ? (
                            <>
                              <CheckCircle2 className="w-3 h-3" /> Validé
                            </>
                          ) : (
                            <>
                              <AlertCircle className="w-3 h-3" /> À rattraper
                            </>
                          )}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Modale "Ajouter / Modifier un étudiant" style d'après la capture d'écran */}
      {showEditModal && editedStudent && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full p-8 border border-slate-200 shadow-2xl space-y-6">
            <h3 className="text-xl font-bold text-[#0d1b2a]" style={{ fontFamily: 'Georgia, serif' }}>
              Modifier l'étudiant
            </h3>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-left">
              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Nom Complet</label>
                <input
                  name="name"
                  type="text"
                  value={editedStudent.name}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2.5 text-xs border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#006233]"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">CNE</label>
                <input
                  name="cne"
                  type="text"
                  value={editedStudent.cne}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2.5 text-xs border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#006233]"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Filière</label>
                <input
                  name="track"
                  type="text"
                  value={editedStudent.track}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2.5 text-xs border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#006233]"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Sexe</label>
                <select
                  name="sexe"
                  value={editedStudent.sexe}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2.5 text-xs border border-slate-200 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-[#006233]"
                >
                  <option value="Homme">Homme</option>
                  <option value="Femme">Femme</option>
                </select>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Année</label>
                <select
                  name="yearLevel"
                  value={editedStudent.yearLevel}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2.5 text-xs border border-slate-200 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-[#006233]"
                >
                  <option value="">-- Sélectionner --</option>
                  <option value="1st">1ère année</option>
                  <option value="2nd">2ème année</option>
                </select>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Classe</label>
                <select
                  name="classGroup"
                  value={editedStudent.classGroup}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2.5 text-xs border border-slate-200 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-[#006233]"
                >
                  <option value="">-- Sélectionner --</option>
                  <option value="A">Classe A</option>
                  <option value="B">Classe B</option>
                </select>
              </div>

              <div className="flex flex-col gap-1.5 sm:col-span-2">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Adresse</label>
                <textarea
                  name="adresse"
                  rows={2}
                  value={editedStudent.adresse}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2.5 text-xs border border-slate-200 rounded-xl resize-none focus:outline-none focus:ring-2 focus:ring-[#006233]"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Email</label>
                <input
                  name="email"
                  type="email"
                  value={editedStudent.email}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2.5 text-xs border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#006233]"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Téléphone Personnel</label>
                <input
                  name="phone"
                  type="text"
                  value={editedStudent.phone}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2.5 text-xs border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#006233]"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Nom Complet du Parent</label>
                <input
                  name="parentName"
                  type="text"
                  value={editedStudent.parentName}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2.5 text-xs border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#006233]"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Numéro du Parent</label>
                <input
                  name="parentPhone"
                  type="text"
                  value={editedStudent.parentPhone}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2.5 text-xs border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#006233]"
                />
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-2 border-t border-slate-100">
              <button 
                onClick={() => setShowEditModal(false)} 
                className="px-6 py-2 border border-slate-200 text-slate-500 rounded-xl hover:bg-slate-50 text-xs font-bold transition-all"
              >
                Annuler
              </button>
              <button 
                onClick={handleSave} 
                className="px-6 py-2 bg-[#006233] text-white rounded-xl hover:bg-[#006233]/90 text-xs font-bold shadow-md transition-all"
              >
                Ajouter
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modale de gestion des Absences */}
      {showAbsenceModal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 border border-slate-200 shadow-2xl space-y-4">
            <div className="flex justify-between items-center border-b border-slate-100 pb-3">
              <h4 className="text-lg font-bold text-[#0d1b2a]" style={{ fontFamily: 'Georgia, serif' }}>Registre des Absences</h4>
              <button onClick={() => setShowAbsenceModal(false)} className="text-slate-400 hover:text-slate-600 text-sm">✕</button>
            </div>
            <div className="max-h-48 overflow-y-auto space-y-2 pr-1">
              {student.absenceRecords?.length === 0 ? (
                <p className="text-xs text-slate-400 text-center py-4">Aucune absence enregistrée.</p>
              ) : (
                student.absenceRecords?.map((abs, idx) => (
                  <div key={abs.id || idx} className="flex items-center justify-between p-2.5 bg-slate-50 border border-slate-100 rounded-xl">
                    <div>
                      <p className="text-xs font-semibold text-slate-700">{new Date(abs.date).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' })}</p>
                      <p className="text-[10px] text-slate-400">{abs.justified ? '✅ Justifiée' : '❌ Non justifiée'}</p>
                    </div>
                    <button onClick={() => removeAbsence(abs.id)} className="p-1.5 hover:bg-rose-50 text-[#C1272D] rounded-lg transition-colors">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))
              )}
            </div>
            <div className="pt-4 border-t border-slate-100 space-y-3">
              <h5 className="text-xs font-bold uppercase tracking-wider text-slate-400">Ajouter une absence</h5>
              <div className="grid grid-cols-1 gap-2">
                <input type="date" value={newAbsenceDate} onChange={(e) => setNewAbsenceDate(e.target.value)} className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#006233]" />
                <label className="flex items-center gap-2 text-xs font-medium text-slate-600 mt-1 cursor-pointer">
                  <input type="checkbox" checked={newAbsenceJustified} onChange={(e) => setNewAbsenceJustified(e.target.checked)} className="rounded border-slate-300 text-[#006233] focus:ring-[#006233]" />
                  L'absence est médicalement justifiée
                </label>
              </div>
              <button onClick={addAbsence} className="w-full py-2 bg-[#006233] hover:bg-[#006233]/90 text-white rounded-xl text-xs font-bold transition-all shadow-sm">
                Inscrire au registre
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modale de gestion des Retards */}
      {showRetardModal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 border border-slate-200 shadow-2xl space-y-4">
            <div className="flex justify-between items-center border-b border-slate-100 pb-3">
              <h4 className="text-lg font-bold text-[#0d1b2a]" style={{ fontFamily: 'Georgia, serif' }}>Registre des Retards</h4>
              <button onClick={() => setShowRetardModal(false)} className="text-slate-400 hover:text-slate-600 text-sm">✕</button>
            </div>
            <div className="max-h-48 overflow-y-auto space-y-2 pr-1">
              {student.retards?.length === 0 ? (
                <p className="text-xs text-slate-400 text-center py-4">Aucun retard signalé.</p>
              ) : (
                student.retards?.map((retard, idx) => (
                  <div key={retard.id || idx} className="flex items-center justify-between p-2.5 bg-slate-50 border border-slate-100 rounded-xl">
                    <p className="text-xs font-semibold text-slate-700">{new Date(retard.date).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' })}</p>
                    <button onClick={() => removeRetard(retard.id)} className="p-1.5 hover:bg-rose-50 text-[#C1272D] rounded-lg transition-colors">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))
              )}
            </div>
            <div className="pt-4 border-t border-slate-100 space-y-3">
              <h5 className="text-xs font-bold uppercase tracking-wider text-slate-400">Signaler un nouveau retard</h5>
              <input type="date" value={newRetardDate} onChange={(e) => setNewRetardDate(e.target.value)} className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#006233]" />
              <button onClick={addRetard} className="w-full py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-bold transition-all shadow-sm">
                Enregistrer le retard
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
