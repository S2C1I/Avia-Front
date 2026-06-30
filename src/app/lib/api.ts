const API_BASE_URL = 'https://edu-back-z0um.onrender.com';

export type ApiId = string | number;

export interface StudentStats {
  [key: string]: string | number | boolean | null | undefined;
}

export interface StudentPayload {
  fullName: string;
  cne: string;
  programId: ApiId;
  yearLevel?: string;
  classGroup?: string;
  gender: string;
  address: string;
  email: string;
  phone: string;
  parent: string | { fullName: string; phone: string };
  stats?: StudentStats;
}

export interface StudentRecord extends StudentPayload {
  id: ApiId;
  createdAt?: string;
  updatedAt?: string;
}

export interface GradePayload {
  studentId: ApiId;
  subjectId: ApiId;
  module: string;
  moduleId?: ApiId;
  exam: number;
  average: number;
  isValidated: boolean;
  isRetake: boolean;
}

export interface GradeRecord extends GradePayload {
  id: ApiId;
  createdAt?: string;
  updatedAt?: string;
}

export interface TeacherPayload {
  fullName: string;
  specialty: string;
  email: string;
  phone: string;
  cne: string;
  cnss: string;
}

export interface TeacherRecord extends TeacherPayload {
  id: ApiId;
}

export interface SubjectPayload {
  name: string;
  teacherIds: ApiId[];
}

export interface SubjectRecord extends SubjectPayload {
  id: ApiId;
}

export interface ProgramPayload {
  name: string;
  subjects: ApiId[];
}

export interface ProgramRecord extends ProgramPayload {
  id: ApiId;
}

export interface AttendancePayload {
  studentId: ApiId;
  subjectId?: ApiId;
  type: string;
  justified: boolean;
  date: string;
}

export interface AttendanceRecord extends AttendancePayload {
  id: ApiId;
}

export type YearLevel = '1st' | '2nd';
export type ClassGroup = 'A' | 'B';

export interface ScheduleSlot {
  time: string;
  subjectId: ApiId;
  teacherId: ApiId;
  room: string;
}

export interface ScheduleDay {
  day: 'monday' | 'tuesday' | 'wednesday' | 'thursday' | 'friday' | 'saturday';
  slots: ScheduleSlot[];
}

export interface SchedulePayload {
  programId: ApiId;
  yearLevel: YearLevel;
  classGroup: ClassGroup;
  schedule: ScheduleDay[];
  isValidated?: boolean;
}

export interface ScheduleRecord extends SchedulePayload {
  id?: ApiId;
  isValidated?: boolean;
}

export interface ScheduleListResponse {
  status?: string;
  results?: number;
  data: ScheduleRecord[];
}

export type PVStatus = 'adoptee' | 'rejetee' | 'en_attente';

export interface PVAgendaItem {
  text: string;
}

export interface PVDeliberationItem {
  text: string;
}

export interface PVResolutionItem {
  text: string;
  status: PVStatus;
}

export interface PVPayload {
  number: string;
  title: string;
  date: string;
  lieu?: string;
  president?: string;
  participants?: string;
  agenda?: PVAgendaItem[];
  deliberations?: PVDeliberationItem[];
  resolutions?: PVResolutionItem[];
}

export interface PVRecord extends PVPayload {
  id: ApiId;
  createdAt?: string;
  updatedAt?: string;
}

export interface PVListResponse {
  status?: string;
  results?: number;
  data: PVRecord[];
}

const unwrapArrayPayload = (value: unknown): unknown[] => {
  if (Array.isArray(value)) return value;
  if (!value || typeof value !== 'object') return [];

  const obj = value as Record<string, unknown>;
  const candidates = [obj.data, obj.results, obj.items, obj.moduleGrades, obj.grades, obj.notes, obj.modules];

  for (const candidate of candidates) {
    if (Array.isArray(candidate)) return candidate;
  }

  if (obj.data && typeof obj.data === 'object') {
    return unwrapArrayPayload(obj.data);
  }

  return [];
};

const unwrapGradeArrayPayload = (value: unknown): unknown[] => {
  const rows = unwrapArrayPayload(value);
  if (rows.length > 0) return rows;
  if (!value || typeof value !== 'object') return [];

  const obj = value as Record<string, unknown>;
  const candidates = [obj.grades, obj.moduleGrades, obj.notes];
  for (const candidate of candidates) {
    if (Array.isArray(candidate)) return candidate;
  }

  return [];
};

async function requestJsonWithFallbacks<T>(paths: string[], options: RequestInit = {}): Promise<T> {
  let lastError: unknown = null;

  for (const path of paths) {
    try {
      return await requestJson<T>(path, options);
    } catch (error) {
      lastError = error;
    }
  }

  throw lastError instanceof Error ? lastError : new Error('Request failed');
}

async function requestJson<T>(path: string, options: RequestInit = {}): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(options.headers ?? {}),
    },
  });
  // eslint-disable-next-line no-console
  console.log('[api.requestJson]', options.method ?? 'GET', `${API_BASE_URL}${path}`, '->', response.status);

  if (!response.ok) {
    let message = `Request failed with status ${response.status}`;
    try {
      const errorBody = await response.json();
      message = errorBody?.message ?? errorBody?.error ?? message;
    } catch {
      try {
        const errorText = await response.text();
        if (errorText) {
          message = errorText;
        }
      } catch {
        // Ignore secondary parse failures and keep the default message.
      }
    }
    throw new Error(message);
  }

  if (response.status === 204) {
    return undefined as T;
  }

  const text = await response.text();
  if (!text) {
    return undefined as T;
  }

  return JSON.parse(text) as T;
}

export function normalizeApiId(id: unknown): string {
  if (id == null) return '';
  if (typeof id === 'string' || typeof id === 'number') {
    const s = String(id);
    const match = s.match(/ObjectId\(['"]?([0-9a-fA-F]{8,})['"]?\)/);
    if (match) return match[1];
    try {
      const parsed = JSON.parse(s);
      if (parsed && typeof parsed === 'object') {
        if (parsed.$oid) return String(parsed.$oid);
        if (parsed.$id) return String(parsed.$id);
        if (parsed._id) return String(parsed._id);
      }
    } catch {
      // not JSON; fallthrough
    }
    return s;
  }
  if (typeof id === 'object') {
    const obj = id as Record<string, any>;
    if (obj.$oid) return String(obj.$oid);
    if (obj.$id) return String(obj.$id);
    if (obj._id != null) {
      if (typeof obj._id === 'object') {
        if (obj._id.$oid) return String(obj._id.$oid);
        return String(obj._id);
      }
      return String(obj._id);
    }
    if (obj.id != null) return String(obj.id);
    if (obj.programId != null) return String(obj.programId);
    try {
      const s = String(obj);
      if (s === '[object Object]') return '';
      return s;
    } catch { return ''; }
  }
  return String(id);
}

export const api = {
  getStudents: () => requestJson<StudentRecord[]>('/api/students'),
  getStudent: (id: ApiId) => requestJson<StudentRecord>(`/api/students/${id}`),
  getStudentFullData: (id: ApiId) => requestJson<StudentRecord & Record<string, unknown>>(`/api/students/${id}`),
  createStudent: (payload: StudentPayload) => requestJson<StudentRecord>('/api/students', {
    method: 'POST',
    body: JSON.stringify(payload),
  }),
  updateStudent: (id: ApiId, payload: StudentPayload) => requestJson<StudentRecord>(`/api/students/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(payload),
  }),
  deleteStudent: (id: ApiId) => requestJson<void>(`/api/students/${id}`, {
    method: 'DELETE',
  }),
  getModuleGradesByStudent: async (studentId: ApiId) => {
    const sid = encodeURIComponent(normalizeApiId(studentId) || String(studentId));
    const paths = [
      `/api/module-grades/student/${sid}`,
      `/api/grades/student/${sid}`,
      `/api/notes/student/${sid}`,
      `/api/modules/student/${sid}`,
      `/api/students/${sid}/grades`,
    ];

    for (const path of paths) {
      try {
        const response = await requestJson<unknown>(path);
        const rows = unwrapArrayPayload(response);
        if (rows.length > 0) return rows as Record<string, unknown>[];
      } catch {
        // Try the next endpoint variation.
      }
    }

    return [] as Record<string, unknown>[];
  },

  getGrades: async () => {
    const response = await requestJsonWithFallbacks<unknown>([
      '/api/grades',
      '/api/module-grades',
      '/api/notes',
    ]);
    return unwrapGradeArrayPayload(response) as GradeRecord[];
  },

  getGrade: (id: ApiId) => requestJson<GradeRecord>(`/api/grades/${id}`),

  createGrade: (payload: GradePayload) => requestJsonWithFallbacks<GradeRecord>([
    '/api/grades',
    '/api/module-grades',
    '/api/notes',
  ], {
    method: 'POST',
    body: JSON.stringify(payload),
  }),

  updateGrade: (id: ApiId, payload: GradePayload) => requestJsonWithFallbacks<GradeRecord>([
    `/api/grades/${id}`,
    `/api/module-grades/${id}`,
    `/api/notes/${id}`,
  ], {
    method: 'PATCH',
    body: JSON.stringify(payload),
  }),

  deleteGrade: (id: ApiId) => requestJsonWithFallbacks<void>([
    `/api/grades/${id}`,
    `/api/module-grades/${id}`,
    `/api/notes/${id}`,
  ], {
    method: 'DELETE',
  }),

  upsertGrade: async (payload: GradePayload, id?: ApiId) => {
    if (id != null && String(id).trim() !== '') {
      try {
        return await api.updateGrade(id, payload);
      } catch {
        // Fall back to create when the backend does not expose a record-specific update route.
      }
    }

    return api.createGrade(payload);
  },

  getTeachers: async () => {
    const response = await requestJson<unknown>('/api/teachers');
    return unwrapArrayPayload(response) as TeacherRecord[];
  },
  getTeacher: (id: ApiId) => requestJson<TeacherRecord>(`/api/teachers/${id}`),
  createTeacher: (payload: TeacherPayload) => requestJson<TeacherRecord>('/api/teachers', {
    method: 'POST',
    body: JSON.stringify(payload),
  }),
  updateTeacher: (id: ApiId, payload: TeacherPayload) => requestJson<TeacherRecord>(`/api/teachers/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(payload),
  }),
  deleteTeacher: (id: ApiId) => requestJson<void>(`/api/teachers/${id}`, {
    method: 'DELETE',
  }),

  getSubjects: async () => {
    const response = await requestJson<unknown>('/api/subjects');
    return unwrapArrayPayload(response) as SubjectRecord[];
  },
  getSubject: (id: ApiId) => requestJson<SubjectRecord>(`/api/subjects/${id}`),
  createSubject: (payload: SubjectPayload) => requestJson<SubjectRecord>('/api/subjects', {
    method: 'POST',
    body: JSON.stringify(payload),
  }),
  updateSubject: (id: ApiId, payload: SubjectPayload) => requestJson<SubjectRecord>(`/api/subjects/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(payload),
  }),
  deleteSubject: (id: ApiId) => requestJson<void>(`/api/subjects/${id}`, {
    method: 'DELETE',
  }),

  getPrograms: () => requestJson<ProgramRecord[]>('/api/programs'),
  getProgram: (id: ApiId) => requestJson<ProgramRecord>(`/api/programs/${id}`),
  createProgram: (payload: ProgramPayload) => requestJson<ProgramRecord>('/api/programs', {
    method: 'POST',
    body: JSON.stringify(payload),
  }),
  updateProgram: (id: ApiId, payload: ProgramPayload) => requestJson<ProgramRecord>(`/api/programs/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(payload),
  }),
  deleteProgram: (id: ApiId) => requestJson<void>(`/api/programs/${id}`, {
    method: 'DELETE',
  }),

  createAttendance: (payload: AttendancePayload) => requestJson<AttendanceRecord>('/api/attendance', {
    method: 'POST',
    body: JSON.stringify(payload),
  }),
  updateAttendanceJustification: (id: ApiId, justified: boolean) => requestJson<AttendanceRecord>(`/api/attendance/${id}/justification`, {
    method: 'PATCH',
    body: JSON.stringify({ justified }),
  }),
  getAttendanceByStudent: (studentId: ApiId) => requestJson<AttendanceRecord[]>(`/api/attendance/student/${studentId}`),
  deleteAttendance: (id: ApiId) => requestJson<void>(`/api/attendance/${id}`, {
    method: 'DELETE',
  }),

  getSchedulesByProgram: async (programId: ApiId) => {
    const pid = encodeURIComponent(normalizeApiId(programId) || String(programId));
    try {
      const response = await requestJson<ScheduleListResponse | ScheduleRecord[]>(
        `/api/schedules/program/${pid}`,
      );
      if (Array.isArray(response)) return response as ScheduleRecord[];
      if (response && Array.isArray((response as ScheduleListResponse).data)) {
        return (response as ScheduleListResponse).data;
      }
      return [] as ScheduleRecord[];
    } catch {
      return [] as ScheduleRecord[];
    }
  },
  getScheduleByClass: async (programId: ApiId, yearLevel: YearLevel, classGroup: ClassGroup) => {
    const pid = encodeURIComponent(normalizeApiId(programId) || String(programId));
    const path = `/api/schedules/program/${pid}/year/${encodeURIComponent(yearLevel)}/class/${encodeURIComponent(classGroup)}`;
    // eslint-disable-next-line no-console
    console.log('[api.getScheduleByClass] GET', `${API_BASE_URL}${path}`);
    return requestJson<ScheduleRecord>(path);
  },
  upsertSchedule: (payload: SchedulePayload) => requestJson<ScheduleRecord>('/api/schedules', {
    method: 'POST',
    body: JSON.stringify(payload),
  }),
  validateSchedule: (programId: ApiId, yearLevel: YearLevel, classGroup: ClassGroup) => {
    const pid = encodeURIComponent(normalizeApiId(programId) || String(programId));
    return requestJson<ScheduleRecord>(
      `/api/schedules/program/${pid}/year/${encodeURIComponent(yearLevel)}/class/${encodeURIComponent(classGroup)}/validate`,
      { method: 'PATCH' },
    );
  },

  getPVs: async (filters?: { number?: string; status?: PVStatus }) => {
    const params = new URLSearchParams();
    if (filters?.number) params.set('number', filters.number);
    if (filters?.status) params.set('status', filters.status);
    const query = params.toString();
    const path = query ? `/api/pvs?${query}` : '/api/pvs';
    const response = await requestJson<unknown>(path);
    const rows = unwrapArrayPayload(response);
    return rows as PVRecord[];
  },
  getPV: (id: ApiId) => requestJson<PVRecord>(`/api/pvs/${id}`),
  createPV: (payload: PVPayload) => requestJson<PVRecord>('/api/pvs', {
    method: 'POST',
    body: JSON.stringify(payload),
  }),
  updatePV: (id: ApiId, payload: Partial<PVPayload>) => requestJson<PVRecord>(`/api/pvs/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(payload),
  }),
  deletePV: (id: ApiId) => requestJson<void>(`/api/pvs/${id}`, {
    method: 'DELETE',
  }),
};
