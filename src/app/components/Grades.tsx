import { useEffect, useMemo, useState, type ReactNode } from 'react';
import { BookOpen, ChevronDown, RefreshCcw, Save, Users } from 'lucide-react';
import { api, normalizeApiId, type GradePayload, type GradeRecord, type ProgramRecord, type StudentRecord, type SubjectRecord } from '../lib/api';

const fallbackYearLevels = ['1st', '2nd', '3rd', '4th'];

const normalizeProgram = (entry: any) => ({
  ...entry,
  id: normalizeApiId(entry?.id ?? entry?._id ?? ''),
  name: String(entry?.name ?? entry?.label ?? `Filière ${entry?.id ?? ''}`),
  subjects: Array.isArray(entry?.subjects) ? entry.subjects.map((subjectId: any) => normalizeApiId(subjectId)).filter(Boolean) : [],
}) as ProgramRecord;

const normalizeSubject = (entry: any) => ({
  ...entry,
  id: normalizeApiId(entry?.id ?? entry?._id ?? ''),
  name: String(entry?.name ?? entry?.title ?? entry?.label ?? 'Matière'),
}) as SubjectRecord;

const normalizeStudent = (entry: any) => ({
  ...entry,
  id: normalizeApiId(entry?.id ?? entry?._id ?? ''),
  fullName: String(entry?.fullName ?? entry?.name ?? 'Étudiant'),
  programId: normalizeApiId(entry?.programId ?? entry?.program?.id ?? entry?.program?._id ?? ''),
  yearLevel: String(entry?.yearLevel ?? entry?.year ?? entry?.level ?? ''),
  classGroup: String(entry?.classGroup ?? entry?.class ?? entry?.group ?? ''),
  cne: String(entry?.cne ?? ''),
}) as StudentRecord;

const normalizeGrade = (entry: any) => {
  const averageValue = Number(entry?.average ?? entry?.exam ?? entry?.grade ?? entry?.note ?? 0);
  return {
    ...entry,
    id: normalizeApiId(entry?.id ?? entry?._id ?? ''),
    studentId: normalizeApiId(entry?.studentId ?? entry?.student?.id ?? entry?.student?._id ?? ''),
    subjectId: normalizeApiId(entry?.subjectId ?? entry?.moduleId ?? entry?.subject?.id ?? entry?.subject?._id ?? ''),
    moduleId: normalizeApiId(entry?.moduleId ?? entry?.subjectId ?? entry?.subject?.id ?? ''),
    module: String(entry?.module ?? entry?.moduleName ?? entry?.subject?.name ?? entry?.name ?? ''),
    exam: Number.isFinite(Number(entry?.exam)) ? Number(entry?.exam) : averageValue,
    average: Number.isFinite(averageValue) ? averageValue : 0,
    isValidated: typeof entry?.isValidated === 'boolean' ? entry.isValidated : averageValue >= 10,
    isRetake: typeof entry?.isRetake === 'boolean' ? entry.isRetake : averageValue < 10,
    createdAt: String(entry?.createdAt ?? ''),
    updatedAt: String(entry?.updatedAt ?? ''),
  } as GradeRecord;
};

const uniqueSorted = (values: Array<string | null | undefined>) => Array.from(new Set(values.map((value) => String(value ?? '').trim()).filter(Boolean))).sort((left, right) => left.localeCompare(right));

const parseGradeInput = (value: string) => {
  const normalized = String(value ?? '').trim().replace(',', '.');
  if (!normalized) return null;
  const numericValue = Number(normalized);
  return Number.isFinite(numericValue) ? numericValue : null;
};

const getGradeValue = (grade: GradeRecord | undefined) => {
  if (!grade) return '';
  const value = grade.average ?? grade.exam;
  return Number.isFinite(Number(value)) ? String(value) : '';
};

const isNewerGrade = (left: GradeRecord, right: GradeRecord) => {
  const leftDate = Date.parse(String(left.updatedAt ?? left.createdAt ?? ''));
  const rightDate = Date.parse(String(right.updatedAt ?? right.createdAt ?? ''));
  if (Number.isFinite(leftDate) && Number.isFinite(rightDate)) return leftDate > rightDate;
  return String(left.id) > String(right.id);
};

function SelectCard({ icon, label, value, onChange, options, disabled = false }: {
  icon: ReactNode;
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: Array<{ value: string; label: string }>;
  disabled?: boolean;
}) {
  return (
    <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm">
      <div className="mb-3 flex items-center gap-2.5 text-slate-400">
        <div className="text-[#0d1b2a]">{icon}</div>
        <span className="text-xs font-semibold tracking-wide uppercase text-slate-400" style={{ fontFamily: 'Inter, sans-serif' }}>{label}</span>
      </div>
      <div className="relative">
        <select
          value={value}
          onChange={(event) => onChange(event.target.value)}
          disabled={disabled}
          className="w-full appearance-none rounded-xl border border-slate-200 bg-slate-50/50 px-4 py-2 pr-10 text-sm text-[#0e1f12] focus:outline-none focus:ring-2 focus:ring-[#006233] disabled:cursor-not-allowed disabled:opacity-60"
        >
          <option value="">Tous</option>
          {options.map((option) => (
            <option key={option.value} value={option.value}>{option.label}</option>
          ))}
        </select>
        <ChevronDown className="pointer-events-none absolute right-3 top-1/2 w-4 h-4 -translate-y-1/2 text-slate-400" />
      </div>
    </div>
  );
}

export function Grades() {
  const [programs, setPrograms] = useState<ProgramRecord[]>([]);
  const [subjects, setSubjects] = useState<SubjectRecord[]>([]);
  const [students, setStudents] = useState<StudentRecord[]>([]);
  const [grades, setGrades] = useState<GradeRecord[]>([]);
  const [selectedProgramId, setSelectedProgramId] = useState('');
  const [selectedYearLevel, setSelectedYearLevel] = useState('');
  const [selectedClassGroup, setSelectedClassGroup] = useState('');
  const [selectedSubjectId, setSelectedSubjectId] = useState('');
  const [draftGrades, setDraftGrades] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saveMessage, setSaveMessage] = useState<string | null>(null);

  const refreshData = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const [programData, subjectData, studentData, gradeData] = await Promise.all([
        api.getPrograms(),
        api.getSubjects(),
        api.getStudents(),
        api.getGrades(),
      ]);
      console.log("RAW programData:", programData);
      setPrograms(
        Array.isArray(programData)
          ? programData.map(normalizeProgram).filter((p) => Boolean(p.id))
          : programData?.data?.map(normalizeProgram).filter((p) => Boolean(p.id)) ?? []
      );
      setSubjects(
        Array.isArray(subjectData)
          ? subjectData.map(normalizeSubject).filter((s) => Boolean(s.id))
          : subjectData?.data?.map(normalizeSubject).filter((s) => Boolean(s.id)) ?? []
      );
      setStudents(
        Array.isArray(studentData)
          ? studentData.map(normalizeStudent).filter((s) => Boolean(s.id))
          : studentData?.data?.map(normalizeStudent).filter((s) => Boolean(s.id)) ?? []
      );
      setGrades(
        Array.isArray(gradeData)
          ? gradeData.map(normalizeGrade).filter((g) => Boolean(g.id))
          : gradeData?.data?.map(normalizeGrade).filter((g) => Boolean(g.id)) ?? []
      );
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : 'Impossible de charger les notes.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    void refreshData();
  }, []);

  useEffect(() => {
    if (!selectedProgramId && programs.length > 0) {
      setSelectedProgramId(String(programs[0].id));
    }
  }, [programs, selectedProgramId]);

  const selectedProgram = useMemo(() => programs.find((program) => String(program.id) === String(selectedProgramId)) ?? null, [programs, selectedProgramId]);

  const programStudents = useMemo(() => {
    if (!selectedProgramId) return students;
    return students.filter((student) => String(student.programId ?? '') === String(selectedProgramId));
  }, [selectedProgramId, students]);

  const yearOptions = useMemo(() => {
    const values = uniqueSorted(programStudents.map((student) => student.yearLevel));
    return values.length > 0 ? values : fallbackYearLevels;
  }, [programStudents]);

  useEffect(() => {
    if (!selectedYearLevel || !yearOptions.includes(selectedYearLevel)) {
      setSelectedYearLevel(yearOptions[0] ?? '');
    }
  }, [selectedYearLevel, yearOptions]);

  const studentsForYear = useMemo(() => {
    if (!selectedYearLevel) return programStudents;
    return programStudents.filter((student) => String(student.yearLevel ?? '') === String(selectedYearLevel));
  }, [programStudents, selectedYearLevel]);

  const classOptions = useMemo(() => {
    const values = uniqueSorted(studentsForYear.map((student) => student.classGroup));
    return values.length > 0 ? values : uniqueSorted(programStudents.map((student) => student.classGroup));
  }, [programStudents, studentsForYear]);

  useEffect(() => {
    if (!selectedClassGroup || !classOptions.includes(selectedClassGroup)) {
      setSelectedClassGroup(classOptions[0] ?? '');
    }
  }, [classOptions, selectedClassGroup]);

  const availableSubjects = useMemo(() => {
    if (!selectedProgram) return subjects;
    const subjectIds = Array.isArray(selectedProgram.subjects) ? selectedProgram.subjects.map(String) : [];
    if (subjectIds.length === 0) return subjects;
    const mappedSubjects = subjects.filter((subject) => subjectIds.includes(String(subject.id)));
    return mappedSubjects.length > 0 ? mappedSubjects : subjects;
  }, [selectedProgram, subjects]);

  useEffect(() => {
    if (!availableSubjects.length) {
      setSelectedSubjectId('');
      return;
    }
    if (!selectedSubjectId || !availableSubjects.some((subject) => String(subject.id) === String(selectedSubjectId))) {
      setSelectedSubjectId(String(availableSubjects[0].id));
    }
  }, [availableSubjects, selectedSubjectId]);

  const selectedSubject = useMemo(() => availableSubjects.find((subject) => String(subject.id) === String(selectedSubjectId)) ?? null, [availableSubjects, selectedSubjectId]);

  const filteredStudents = useMemo(() => {
    return students
      .filter((student) => !selectedProgramId || String(student.programId ?? '') === String(selectedProgramId))
      .filter((student) => !selectedYearLevel || String(student.yearLevel ?? '') === String(selectedYearLevel))
      .filter((student) => !selectedClassGroup || String(student.classGroup ?? '') === String(selectedClassGroup))
      .sort((left, right) => String(left.fullName ?? '').localeCompare(String(right.fullName ?? '')));
  }, [selectedClassGroup, selectedProgramId, selectedYearLevel, students]);

  const gradesForSelectedSubject = useMemo(() => {
    if (!selectedSubjectId) return [] as GradeRecord[];
    return grades.filter((grade) => String(grade.subjectId ?? grade.moduleId ?? '') === String(selectedSubjectId));
  }, [grades, selectedSubjectId]);

  const gradeByStudentId = useMemo(() => {
    const map = new Map<string, GradeRecord>();
    for (const grade of gradesForSelectedSubject) {
      const key = String(grade.studentId);
      const existing = map.get(key);
      if (!existing || isNewerGrade(grade, existing)) {
        map.set(key, grade);
      }
    }
    return map;
  }, [gradesForSelectedSubject]);

  useEffect(() => {
    const nextDraftGrades: Record<string, string> = {};
    for (const student of filteredStudents) {
      nextDraftGrades[String(student.id)] = getGradeValue(gradeByStudentId.get(String(student.id)));
    }
    setDraftGrades(nextDraftGrades);
    setSaveMessage(null);
  }, [filteredStudents, gradeByStudentId, selectedProgramId, selectedYearLevel, selectedClassGroup, selectedSubjectId]);

  const validatedCount = filteredStudents.filter((student) => {
    const parsed = parseGradeInput(draftGrades[String(student.id)] ?? '');
    return parsed != null && parsed >= 10;
  }).length;

  const gradeCompletion = filteredStudents.length > 0
    ? Math.round((filteredStudents.filter((student) => String(draftGrades[String(student.id)] ?? '').trim() !== '').length / filteredStudents.length) * 100)
    : 0;

  const handleSaveGrades = async () => {
    if (!selectedSubject) {
      setError('Sélectionnez une matière avant d’enregistrer.');
      return;
    }

    setIsSaving(true);
    setError(null);
    setSaveMessage(null);

    try {
      for (const student of filteredStudents) {
        const studentKey = String(student.id);
        const rawValue = String(draftGrades[studentKey] ?? '').trim();
        const existingGrade = gradeByStudentId.get(studentKey);

        if (!rawValue) {
          if (existingGrade?.id) {
            await api.deleteGrade(existingGrade.id);
          }
          continue;
        }

        const numericGrade = parseGradeInput(rawValue);
        if (numericGrade == null) {
          throw new Error(`Note invalide pour ${student.fullName}.`);
        }

        const payload: GradePayload = {
          studentId: student.id,
          subjectId: selectedSubject.id,
          moduleId: selectedSubject.id,
          module: selectedSubject.name,
          exam: numericGrade,
          average: numericGrade,
          isValidated: numericGrade >= 10,
          isRetake: numericGrade < 10,
        };

        await api.upsertGrade(payload, existingGrade?.id);
      }

      await refreshData();
      setSaveMessage(`Les notes de ${selectedSubject.name} ont été enregistrées.`);
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : 'Impossible d’enregistrer les notes.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="p-6 space-y-6 min-h-screen" style={{ backgroundColor: '#fdf5f5' }}>
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>

          <h2 className="text-3xl font-bold tracking-tight text-[#0e1f12]" style={{ fontFamily: 'Georgia, serif' }}>Notes des étudiants</h2>
          <p className="text-slate-500 text-sm mt-2">Sélectionnez la filière, l’année, la classe et la matière avant de saisir les notes.</p>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => void refreshData()}
            className="px-4 py-2 border border-slate-200 rounded-xl text-slate-700 bg-white hover:bg-slate-50 transition-colors focus:outline-none focus:ring-2 focus:ring-[#006233] text-sm font-semibold"
          >
            <RefreshCcw className="w-4 h-4 inline mr-2" />
            Rafraîchir
          </button>
          <button
            type="button"
            onClick={() => void handleSaveGrades()}
            className="px-5 py-2 text-white font-semibold text-sm rounded-xl transition-all hover:opacity-90 shadow-md disabled:cursor-not-allowed disabled:opacity-60" style={{ background: '#006233' }}
            disabled={isLoading || isSaving || !selectedSubject || filteredStudents.length === 0}
          >
            <Save className="w-4 h-4 inline mr-2" />
            {isSaving ? 'Enregistrement...' : 'Enregistrer les notes'}
          </button>
        </div>
      </div>

      {(error || saveMessage) && (
        <div className={`rounded-xl border px-4 py-3 font-medium shadow-sm ${error ? 'border-red-200 bg-red-50 text-red-700' : 'border-emerald-200 bg-emerald-50 text-[#006233]'}`}>
          {error ?? saveMessage}
        </div>
      )}

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-4">
        <SelectCard
          icon={<Users className="w-5 h-5" />}
          label="Filière"
          value={selectedProgramId}
          onChange={setSelectedProgramId}
          options={programs.map((program) => ({ value: String(program.id), label: program.name }))}
          disabled={programs.length === 0}
        />

        <SelectCard
          icon={<BookOpen className="w-5 h-5" />}
          label="Année"
          value={selectedYearLevel}
          onChange={setSelectedYearLevel}
          options={yearOptions.map((year) => ({ value: year, label: year }))}
          disabled={yearOptions.length === 0}
        />

        <SelectCard
          icon={<Users className="w-5 h-5" />}
          label="Classe"
          value={selectedClassGroup}
          onChange={setSelectedClassGroup}
          options={classOptions.map((classGroup) => ({ value: classGroup, label: classGroup }))}
          disabled={classOptions.length === 0}
        />

        <SelectCard
          icon={<BookOpen className="w-5 h-5" />}
          label="Matière"
          value={selectedSubjectId}
          onChange={setSelectedSubjectId}
          options={availableSubjects.map((subject) => ({ value: String(subject.id), label: subject.name }))}
          disabled={availableSubjects.length === 0}
        />
      </div>

      <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-lg font-bold text-[#0d1b2a]" style={{ fontFamily: 'Georgia, serif' }}>Table des étudiants</h3>
            <p className="text-xs text-slate-400 mt-0.5">
              {selectedProgram?.name ?? 'Toutes les filières'} • {selectedYearLevel || 'Toutes les années'} • {selectedClassGroup || 'Toutes les classes'}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-[#006233]/10 flex items-center justify-center">
              <BookOpen className="w-4 h-4 text-[#006233]" />
            </div>
            <span className="font-semibold text-[#0e1f12] text-sm">{selectedSubject?.name ?? 'Choisissez une matière'}</span>
          </div>
        </div>

        <div className="overflow-hidden rounded-xl border border-slate-200">
          <table className="w-full text-left border-collapse">
            <thead style={{ background: '#0d1b2a' }}>
              <tr>
                <th className="px-6 py-4 text-xs font-semibold uppercase text-white/80 tracking-wider">Nom</th>
                <th className="px-6 py-4 text-xs font-semibold uppercase text-white/80 tracking-wider">CNE</th>
                <th className="px-6 py-4 text-xs font-semibold uppercase text-white/80 tracking-wider">Note /20</th>
                <th className="px-6 py-4 text-right text-xs font-semibold uppercase text-white/80 tracking-wider rounded-tr-2xl">Statut</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-sm text-slate-700">
              {isLoading && (
                <tr>
                  <td colSpan={4} className="px-6 py-10 text-center text-slate-400 font-medium">Chargement des données...</td>
                </tr>
              )}

              {!isLoading && filteredStudents.length === 0 && (
                <tr>
                  <td colSpan={4} className="px-6 py-10 text-center text-slate-400 font-medium">
                    Aucun étudiant trouvé pour cette combinaison.
                  </td>
                </tr>
              )}

              {!isLoading && filteredStudents.map((student, index) => {
                const value = draftGrades[String(student.id)] ?? '';
                const numericValue = parseGradeInput(value);
                const hasGrade = numericValue != null;
                const isValid = hasGrade && numericValue >= 10;

                return (
                  <tr key={String(student.id ?? `student-${index}`)} className="transition-colors hover:bg-[#fdf5f5]">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl flex items-center justify-center text-white font-bold shadow-sm" style={{ background: '#006233' }}>
                          <span>
                            {String(student.fullName ?? '')
                              .split(' ')
                              .map((part) => (part ? part[0] : ''))
                              .join('')
                              .slice(0, 2)
                              .toUpperCase() || 'ET'}
                          </span>
                        </div>
                        <div>
                          <p className="font-semibold text-[#0e1f12]">{student.fullName}</p>
                          <p className="text-[11px] font-mono text-slate-400 mt-0.5">CNE: {student.cne || 'N/A'}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-slate-500 text-sm font-medium">{student.cne || '—'}</td>
                    <td className="px-6 py-4">
                      <input
                        type="number"
                        min="0"
                        max="20"
                        step="0.25"
                        inputMode="decimal"
                        value={value}
                        onChange={(event) => setDraftGrades((previous) => ({ ...previous, [String(student.id)]: event.target.value }))}
                        placeholder="0 - 20"
                        className="px-4 py-2 border border-slate-200 rounded-xl bg-slate-50/50 focus:outline-none focus:ring-2 focus:ring-[#006233] text-sm text-[#0e1f12] w-32"
                      />
                    </td>
                    <td className="px-6 py-4 text-right">
                      {hasGrade ? (
                        <span className={`px-3 py-1 rounded-lg text-xs font-bold tracking-wider ${isValid ? 'text-white' : 'text-white'}`} style={{ background: isValid ? '#006233' : '#C1272D' }}>
                          {isValid ? 'Validé' : 'Rattrapage'}
                        </span>
                      ) : (
                        <span className="text-slate-400 text-sm font-medium">—</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}




