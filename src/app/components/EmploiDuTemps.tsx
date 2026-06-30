import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  api,
  normalizeApiId,
  type ProgramRecord,
  type TeacherRecord,
  type SubjectRecord,
  type YearLevel,
  type ClassGroup,
  type ScheduleDay,
  type ScheduleSlot,
} from '../lib/api';

const DAYS: ScheduleDay['day'][] = [
  'monday',
  'tuesday',
  'wednesday',
  'thursday',
  'friday',
  'saturday',
];

const DAY_LABELS: Record<ScheduleDay['day'], string> = {
  monday: 'Lundi',
  tuesday: 'Mardi',
  wednesday: 'Mercredi',
  thursday: 'Jeudi',
  friday: 'Vendredi',
  saturday: 'Samedi',
};

const YEAR_OPTIONS: YearLevel[] = ['1st', '2nd'];
const CLASS_OPTIONS: ClassGroup[] = ['A', 'B'];

// Normalize a free-form year value to the API's expected "1st" | "2nd" (lowercase, no leading zero).
const normalizeYearLevel = (value: string): YearLevel | null => {
  const v = String(value ?? '').trim().toLowerCase();
  if (v === '1st' || v === '1' || v === '1ere' || v === '1ère') return '1st';
  if (v === '2nd' || v === '2' || v === '2eme' || v === '2ème') return '2nd';
  return null;
};

// Normalize a free-form class value to "A" | "B" (uppercase, single letter).
const normalizeClassGroup = (value: string): ClassGroup | null => {
  const v = String(value ?? '').trim().toUpperCase();
  if (v === 'A' || v === 'B') return v;
  return null;
};

const isNotFoundError = (err: unknown): boolean => {
  if (!err || typeof err !== 'object') return false;
  const message = (err as { message?: string }).message ?? '';
  return /not\s*found/i.test(message) || /404/.test(message);
};

const newDay = (day: ScheduleDay['day']): ScheduleDay => ({ day, slots: [] });

const newSlot = (): ScheduleSlot => ({ time: '', subjectId: '', teacherId: '', room: '' });

export function EmploiDuTemps() {
  const [programs, setPrograms] = useState<ProgramRecord[]>([]);
  const [teachers, setTeachers] = useState<TeacherRecord[]>([]);
  const [subjects, setSubjects] = useState<SubjectRecord[]>([]);

  const [selectedProgramId, setSelectedProgramId] = useState('');
  const [selectedYearLevel, setSelectedYearLevel] = useState<YearLevel | ''>('');
  const [selectedClassGroup, setSelectedClassGroup] = useState<ClassGroup | ''>('');

  const [loadingMeta, setLoadingMeta] = useState(true);
  const [scheduleLoading, setScheduleLoading] = useState(false);
  const [scheduleError, setScheduleError] = useState<string | null>(null);
  const [notFound, setNotFound] = useState(false);

  const [schedule, setSchedule] = useState<ScheduleDay[]>(DAYS.map(newDay));
  const [isValidated, setIsValidated] = useState(false);
  const [saving, setSaving] = useState(false);
  const [validating, setValidating] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  // Load programs, teachers and subjects (used by the editor lookups) on mount.
  useEffect(() => {
    async function loadMeta() {
      setLoadingMeta(true);
      try {
        const [p, t, s] = await Promise.all([
          api.getPrograms(),
          api.getTeachers().catch(() => [] as TeacherRecord[]),
          api.getSubjects().catch(() => [] as SubjectRecord[]),
        ]);

        const rawPrograms = Array.isArray(p) ? p : (p as any).data || [];
        setPrograms(
          rawPrograms.map((prog: any) => ({
            ...prog,
            id: normalizeApiId(prog?.id ?? prog?._id ?? ''),
          })),
        );

        const rawTeachers = Array.isArray(t) ? t : (t as any).data || [];
        setTeachers(
          rawTeachers.map((tch: any) => ({
            ...tch,
            id: normalizeApiId(tch?.id ?? tch?._id ?? ''),
          })),
        );

        const rawSubjects = Array.isArray(s) ? s : (s as any).data || [];
        setSubjects(
          rawSubjects.map((sub: any) => ({
            ...sub,
            id: normalizeApiId(sub?.id ?? sub?._id ?? ''),
          })),
        );
      } catch (err) {
        console.error('Error loading schedule metadata:', err);
      } finally {
        setLoadingMeta(false);
      }
    }
    loadMeta();
  }, []);

  const programOptions = useMemo(
    () => programs.map((p) => ({ value: String(p.id ?? ''), label: p.name })),
    [programs],
  );

  const yearOptions = useMemo(() => [...YEAR_OPTIONS], []);
  const classOptions = useMemo(() => [...CLASS_OPTIONS], []);

  // Reset child selections whenever a parent changes.
  useEffect(() => {
    setSelectedYearLevel('');
    setSelectedClassGroup('');
  }, [selectedProgramId]);

  useEffect(() => {
    setSelectedClassGroup('');
  }, [selectedYearLevel]);

  // Reset schedule view when the (program/year/class) triple is incomplete.
  useEffect(() => {
    if (!selectedProgramId || !selectedYearLevel || !selectedClassGroup) {
      setSchedule(DAYS.map(newDay));
      setIsValidated(false);
      setScheduleError(null);
      setNotFound(false);
    }
  }, [selectedProgramId, selectedYearLevel, selectedClassGroup]);

  // Fetch the schedule for the selected (program/year/class). Also re-runs
  // every time `reloadKey` changes, so we can force a refetch (e.g. after
  // a successful save) without having to change the (program, year, class) triple.
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    if (!selectedProgramId || !selectedYearLevel || !selectedClassGroup) {
      console.log('[EmploiDuTemps] load skipped: triple incomplete', {
        selectedProgramId, selectedYearLevel, selectedClassGroup,
      });
      return;
    }

    const fetchUrl = `/api/schedules/program/${encodeURIComponent(normalizeApiId(selectedProgramId) || String(selectedProgramId))}/year/${encodeURIComponent(String(selectedYearLevel))}/class/${encodeURIComponent(String(selectedClassGroup))}`;
    console.log('[EmploiDuTemps] load START', { selectedProgramId, selectedYearLevel, selectedClassGroup, fetchUrl });

    let cancelled = false;
    async function loadSchedule() {
      setScheduleLoading(true);
      setScheduleError(null);
      setNotFound(false);
      try {
        const record = await api.getScheduleByClass(
          selectedProgramId,
          selectedYearLevel as YearLevel,
          selectedClassGroup as ClassGroup,
        );
        if (cancelled) return;

        console.log('[EmploiDuTemps] load RAW response', record);

        // The backend wraps the schedule record in either:
        //   1) the record itself (has `.schedule`),
        //   2) `{ status, data: <the record> }`.
        // We unwrap defensively so both shapes work.
        const recordAny = record as any;
        const inner = recordAny?.data && typeof recordAny.data === 'object' && Array.isArray(recordAny.data.schedule)
          ? recordAny.data
          : recordAny?.data && typeof recordAny.data === 'object' && !Array.isArray(recordAny.schedule)
            ? recordAny.data
            : recordAny;
        const days: any[] = Array.isArray(inner?.schedule) ? inner.schedule : [];
        const validated = Boolean((inner as any)?.isValidated);
        console.log('[EmploiDuTemps] load parsed days', days);
        // Ensure every weekday is present in a consistent order.
        const merged = DAYS.map((d) => {
          const found = days.find((day: any) => day?.day === d);
          return found
            ? {
                day: d,
                slots: (Array.isArray(found.slots) ? found.slots : []).map((s: any) => ({
                  time: String(s?.time ?? ''),
                  subjectId: normalizeApiId(s?.subjectId),
                  teacherId: normalizeApiId(s?.teacherId),
                  room: String(s?.room ?? ''),
                })),
              }
            : newDay(d);
        });
        setSchedule(merged);
        setIsValidated(validated);
      } catch (err) {
        if (cancelled) return;
        console.log('[EmploiDuTemps] load ERROR', err);
        if (isNotFoundError(err)) {
          // The backend has no record for this (program, year, class) yet.
          // We mark it as `notFound` so the grid can show a friendly hint, but
          // we do NOT wipe the local schedule: the editor below the grid is
          // still usable and the user can create the schedule for this class.
          setNotFound(true);
          setIsValidated(false);
        } else {
          console.error('Error loading class schedule:', err);
          setScheduleError(
            (err as { message?: string })?.message ?? "Impossible de charger l'emploi du temps.",
          );
        }
      } finally {
        if (!cancelled) setScheduleLoading(false);
      }
    }
    loadSchedule();

    return () => {
      cancelled = true;
    };
  }, [selectedProgramId, selectedYearLevel, selectedClassGroup, reloadKey]);

  const subjectById = useMemo(() => {
    const map = new Map<string, SubjectRecord>();
    subjects.forEach((s) => map.set(String(s.id), s));
    return map;
  }, [subjects]);

  const teacherById = useMemo(() => {
    const map = new Map<string, TeacherRecord>();
    teachers.forEach((t) => map.set(String(t.id), t));
    return map;
  }, [teachers]);

  // For every subject, the list of teachers tied to it. The Matieres API stores
  // teacherIds as raw values, but the backend may return them either as plain
  // string IDs, as ObjectId objects, or as populated teacher objects, so we
  // normalize each entry through `normalizeApiId` before resolving it.
  const teachersBySubjectId = useMemo(() => {
    const map = new Map<string, TeacherRecord[]>();
    for (const subject of subjects) {
      const sid = String(subject.id);
      const teacherRefs = Array.isArray(subject.teacherIds) ? subject.teacherIds : [];
      const resolved: TeacherRecord[] = [];
      const seen = new Set<string>();
      for (const ref of teacherRefs) {
        const tid = normalizeApiId((ref as any)?.id ?? (ref as any)?._id ?? ref);
        if (!tid || seen.has(tid)) continue;
        seen.add(tid);
        const t = teacherById.get(tid);
        if (t) resolved.push(t);
      }
      map.set(sid, resolved);
    }
    return map;
  }, [subjects, teacherById]);

  // -------- Editor handlers --------
  const updateDaySlot = useCallback(
    (dayIdx: number, slotIdx: number, field: keyof ScheduleSlot, value: string) => {
      setSchedule((prev) => {
        const next = prev.map((d) => ({ ...d, slots: d.slots.map((s) => ({ ...s })) }));
        const slot = next[dayIdx]?.slots?.[slotIdx];
        if (!slot) return prev;
        (slot as any)[field] = value;

        // When the subject changes, auto-resolve the teacher from the subject's
        // own teachers (Matieres API ties each subject to one or more teachers).
        if (field === 'subjectId') {
          const subject = subjectById.get(String(value));
          const linked = subject ? teachersBySubjectId.get(String(subject.id)) ?? [] : [];
          const currentTeacherId = String(slot.teacherId ?? '');
          const stillValid = linked.some((t) => String(t.id) === currentTeacherId);
          if (linked.length === 0) {
            slot.teacherId = '';
          } else if (!stillValid) {
            slot.teacherId = String(linked[0].id);
          }
        }

        return next;
      });
    },
    [subjectById, teachersBySubjectId],
  );

  const addSlot = useCallback((dayIdx: number) => {
    setSchedule((prev) => {
      const next = prev.map((d) => ({ ...d, slots: [...d.slots] }));
      next[dayIdx] = { ...next[dayIdx], slots: [...next[dayIdx].slots, newSlot()] };
      return next;
    });
  }, []);

  const removeSlot = useCallback((dayIdx: number, slotIdx: number) => {
    setSchedule((prev) => {
      const next = prev.map((d) => ({ ...d, slots: d.slots.slice() }));
      next[dayIdx] = {
        ...next[dayIdx],
        slots: next[dayIdx].slots.filter((_, i) => i !== slotIdx),
      };
      return next;
    });
  }, []);

  const handleSave = useCallback(async () => {
    if (!selectedProgramId || !selectedYearLevel || !selectedClassGroup) return;
    setSaving(true);
    setSaveError(null);
    try {
      const payload = {
        programId: normalizeApiId(selectedProgramId) || selectedProgramId,
        yearLevel: selectedYearLevel as YearLevel,
        classGroup: selectedClassGroup as ClassGroup,
        // The backend only accepts Mon..Fri, so we never send "saturday".
        // For every kept day, we also re-resolve teacherId from the subject's
        // own teachers to guarantee a valid Mongo ObjectId is sent.
        schedule: schedule
          .filter((d) => d.day !== 'saturday')
          .map((d) => ({
            day: d.day,
            slots: d.slots
              .filter((s) => s.time || s.subjectId || s.teacherId || s.room)
              .map((s) => {
                const subj = subjectById.get(String(s.subjectId));
                const linked = subj ? teachersBySubjectId.get(String(subj.id)) ?? [] : [];
                const resolvedTeacherId = (() => {
                  if (s.teacherId && linked.some((t) => String(t.id) === String(s.teacherId))) {
                    return String(s.teacherId);
                  }
                  if (linked.length > 0) return String(linked[0].id);
                  return String(s.teacherId ?? '');
                })();
                return {
                  time: s.time,
                  subjectId: s.subjectId,
                  teacherId: resolvedTeacherId,
                  room: s.room,
                } as ScheduleSlot;
              }),
          })),
      };
      const record = await api.upsertSchedule(payload);
      // Backend resets isValidated to false on upsert.
      setIsValidated(Boolean(record?.isValidated ?? false));
      setNotFound(false);
      // Re-fetch the canonical state from the server so the grid + editor
      // reflect exactly what was stored, with consistent IDs.
      setReloadKey((k) => k + 1);
    } catch (err) {
      console.error('Error saving schedule:', err);
      setSaveError(
        (err as { message?: string })?.message ?? "Impossible d'enregistrer l'emploi du temps.",
      );
    } finally {
      setSaving(false);
    }
  }, [selectedProgramId, selectedYearLevel, selectedClassGroup, schedule, subjectById, teachersBySubjectId]);

  const handleValidate = useCallback(async () => {
    if (!selectedProgramId || !selectedYearLevel || !selectedClassGroup) return;
    setValidating(true);
    setSaveError(null);
    try {
      const record = await api.validateSchedule(
        selectedProgramId,
        selectedYearLevel as YearLevel,
        selectedClassGroup as ClassGroup,
      );
      setIsValidated(Boolean(record?.isValidated));
    } catch (err) {
      console.error('Error validating schedule:', err);
      setSaveError(
        (err as { message?: string })?.message ?? "Impossible de valider l'emploi du temps.",
      );
    } finally {
      setValidating(false);
    }
  }, [selectedProgramId, selectedYearLevel, selectedClassGroup]);

  if (loadingMeta) {
    return (
      <div className="p-8">
        <p className="text-gray-500">Chargement...</p>
      </div>
    );
  }

  const showScheduleView = Boolean(selectedProgramId && selectedYearLevel && selectedClassGroup);

  return (
    <div className="p-8 space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 bg-white p-6 rounded-xl shadow">
        <select
          value={selectedProgramId}
          onChange={(e) => setSelectedProgramId(e.target.value)}
          className="border rounded px-3 py-2"
        >
          <option value="">Sélectionner une filière</option>
          {programOptions.map((o) => (
            <option key={`prog-${o.value}`} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>

        <select
          value={selectedYearLevel}
          onChange={(e) => {
            const norm = normalizeYearLevel(e.target.value);
            setSelectedYearLevel((norm ?? '') as YearLevel | '');
          }}
          disabled={!selectedProgramId}
          className="border rounded px-3 py-2 disabled:bg-gray-100"
        >
          <option value="">Sélectionner une année</option>
          {yearOptions.map((o) => (
            <option key={`year-${o}`} value={o}>
              {o}
            </option>
          ))}
        </select>

        <select
          value={selectedClassGroup}
          onChange={(e) => {
            const norm = normalizeClassGroup(e.target.value);
            setSelectedClassGroup((norm ?? '') as ClassGroup | '');
          }}
          disabled={!selectedYearLevel}
          className="border rounded px-3 py-2 disabled:bg-gray-100"
        >
          <option value="">Sélectionner une classe</option>
          {classOptions.map((o) => (
            <option key={`class-${o}`} value={o}>
              {o}
            </option>
          ))}
        </select>
      </div>

      {showScheduleView && (
        <div className="bg-white p-6 rounded-xl shadow space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-bold">
              Emploi du temps — {selectedYearLevel} {selectedClassGroup}
            </h3>
            <div className="flex items-center gap-2">
              {isValidated && (
                <span className="text-green-600 text-sm font-medium">Validé</span>
              )}
              <button
                type="button"
                onClick={handleValidate}
                disabled={validating || saving}
                className="bg-green-600 text-white px-4 py-2 rounded disabled:opacity-50"
              >
                {validating ? 'Validation...' : 'Valider'}
              </button>
              <button
                type="button"
                onClick={handleSave}
                disabled={saving || validating}
                className="bg-blue-600 text-white px-4 py-2 rounded disabled:opacity-50"
              >
                {saving ? 'Enregistrement...' : 'Enregistrer'}
              </button>
            </div>
          </div>

          {saveError && (
            <p className="text-red-600 text-sm">{saveError}</p>
          )}

          {scheduleLoading ? (
            <p className="text-gray-500">Chargement de l'emploi du temps...</p>
          ) : (
            <>
              {scheduleError && (
                <div className="p-3 border border-red-200 bg-red-50 rounded text-sm text-red-700">
                  {scheduleError}
                </div>
              )}
              {notFound && !scheduleError && (
                <div className="p-3 border border-dashed rounded text-sm text-gray-600">
                  Aucun emploi du temps n'a encore été enregistré pour cette classe.
                  Utilisez le formulaire ci-dessous pour en créer un, puis cliquez sur « Enregistrer ».
                </div>
              )}
              <div className="overflow-x-auto">
              <table className="min-w-full border-collapse">
                <thead>
                  <tr>
                    <th className="border p-2 text-left bg-gray-50 w-32">Horaire</th>
                    {schedule.map((d) => (
                      <th key={`head-${d.day}`} className="border p-2 text-left bg-gray-50">
                        {DAY_LABELS[d.day]}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {Array.from(
                    new Set(
                      schedule.flatMap((d) => d.slots.map((s) => s.time).filter(Boolean)),
                    ),
                  )
                    .sort((a, b) => a.localeCompare(b))
                    .map((time) => (
                      <tr key={`row-${time}`}>
                        <td className="border p-2 font-mono text-sm">{time}</td>
                        {schedule.map((d) => {
                          const slotsAtTime = d.slots.filter((s) => s.time === time);
                          return (
                            <td key={`cell-${d.day}-${time}`} className="border p-2 align-top">
                              {slotsAtTime.length === 0 ? (
                                <span className="text-gray-300">—</span>
                              ) : (
                                slotsAtTime.map((slot, idx) => {
                                  const subj = subjectById.get(String(slot.subjectId));
                                  const linkedTeachers = subj
                                    ? teachersBySubjectId.get(String(subj.id)) ?? []
                                    : [];
                                  const teach =
                                    teacherById.get(String(slot.teacherId)) ??
                                    linkedTeachers[0] ??
                                    null;
                                  return (
                                    <div
                                      key={`slot-${d.day}-${time}-${idx}`}
                                      className="text-sm space-y-0.5"
                                    >
                                      <div className="font-medium">
                                        {subj?.name ?? 'Matière ?'}
                                      </div>
                                      <div className="text-gray-600">
                                        {teach?.fullName ?? 'Enseignant ?'}
                                      </div>
                                      <div className="text-gray-500">{slot.room || '—'}</div>
                                    </div>
                                  );
                                })
                              )}
                            </td>
                          );
                        })}
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
            </>
          )}

          {!scheduleLoading && (
            <div className="space-y-4 pt-4 border-t">
              <h4 className="font-semibold">Éditer les créneaux</h4>
              {schedule.map((dayEntry, dayIdx) => (
                <div key={`editor-${dayEntry.day}`} className="border rounded p-3 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-medium">{DAY_LABELS[dayEntry.day]}</span>
                    <button
                      type="button"
                      onClick={() => addSlot(dayIdx)}
                      className="text-sm bg-gray-100 hover:bg-gray-200 px-2 py-1 rounded"
                    >
                      + Ajouter un créneau
                    </button>
                  </div>
                  {dayEntry.slots.length === 0 ? (
                    <p className="text-sm text-gray-400">Aucun créneau.</p>
                  ) : (
                    dayEntry.slots.map((slot, slotIdx) => {
                      const subj = subjectById.get(String(slot.subjectId ?? ''));
                      const linkedTeachers = subj
                        ? teachersBySubjectId.get(String(subj.id)) ?? []
                        : [];
                      const resolvedTeacher =
                        teacherById.get(String(slot.teacherId ?? '')) ??
                        linkedTeachers[0] ??
                        null;
                      return (
                        <div
                          key={`editor-slot-${dayEntry.day}-${slotIdx}`}
                          className="grid grid-cols-1 md:grid-cols-5 gap-2 items-center"
                        >
                          <input
                            type="time"
                            value={slot.time ?? ''}
                            onChange={(e) => updateDaySlot(dayIdx, slotIdx, 'time', e.target.value)}
                            className="border rounded px-2 py-1 text-sm"
                            placeholder="08:00"
                          />
                          <select
                            value={String(slot.subjectId ?? '')}
                            onChange={(e) => updateDaySlot(dayIdx, slotIdx, 'subjectId', e.target.value)}
                            className="border rounded px-2 py-1 text-sm"
                          >
                            <option value="">— Matière —</option>
                            {subjects.map((s) => (
                              <option key={`subj-${s.id}`} value={String(s.id)}>
                                {s.name}
                              </option>
                            ))}
                          </select>
                          {linkedTeachers.length > 1 ? (
                            <select
                              value={String(resolvedTeacher?.id ?? '')}
                              onChange={(e) =>
                                updateDaySlot(dayIdx, slotIdx, 'teacherId', e.target.value)
                              }
                              className="border rounded px-2 py-1 text-sm"
                              title="Enseignants rattachés à cette matière"
                            >
                              {linkedTeachers.map((t) => (
                                <option key={`teach-${t.id}`} value={String(t.id)}>
                                  {t.fullName}
                                </option>
                              ))}
                            </select>
                          ) : (
                            <div
                              className="border rounded px-2 py-1 text-sm bg-gray-50 text-gray-700 truncate"
                              title={
                                !subj
                                  ? 'Sélectionnez d\'abord une matière'
                                  : linkedTeachers.length === 0
                                    ? 'Aucun enseignant n\'est rattaché à cette matière'
                                    : `Enseignant auto-défini depuis la matière : ${resolvedTeacher?.fullName ?? '—'}`
                              }
                            >
                              {resolvedTeacher?.fullName ?? (subj ? '—' : 'Choisir une matière')}
                            </div>
                          )}
                          <input
                            type="text"
                            value={slot.room ?? ''}
                            onChange={(e) => updateDaySlot(dayIdx, slotIdx, 'room', e.target.value)}
                            className="border rounded px-2 py-1 text-sm"
                            placeholder="Salle (ex: CS-101)"
                          />
                          <button
                            type="button"
                            onClick={() => removeSlot(dayIdx, slotIdx)}
                            className="text-sm text-red-600 hover:underline"
                          >
                            Supprimer
                          </button>
                        </div>
                      );
                    })
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
