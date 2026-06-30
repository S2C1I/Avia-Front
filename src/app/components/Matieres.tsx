import { useEffect, useMemo, useState } from 'react';
import { Plus, Pencil, Trash2, Search } from 'lucide-react';
import { Button } from './ui/button';
import { Input } from './ui/input';
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
import { api, SubjectPayload, SubjectRecord, TeacherRecord } from '../lib/api';

export function Matieres() {
  const [matieres, setMatieres] = useState<SubjectRecord[]>([]);
  const [teachers, setTeachers] = useState<TeacherRecord[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [editingMatiere, setEditingMatiere] = useState<SubjectRecord | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const normalizeSubject = (s: any) => ({
    ...s,
    id: String(s?.id ?? s?._id ?? ''),
    teacherIds: Array.isArray(s?.teacherIds)
      ? s.teacherIds.map((t: any) => (typeof t === 'object' ? String(t.id ?? t._id ?? t.fullName ?? '') : String(t)))
      : [],
  }) as SubjectRecord;

  const normalizeTeacher = (t: any) => ({
    ...t,
    id: String(t?.id ?? t?._id ?? ''),
    fullName: String(t?.fullName ?? t?.name ?? t ?? ''),
  }) as TeacherRecord;

  const refreshSubjects = async () => {
    try {
      setIsLoading(true);
      const [subjectData, teacherData] = await Promise.all([api.getSubjects(), api.getTeachers()]);
      setMatieres(Array.isArray(subjectData) ? subjectData.map(normalizeSubject) : []);
      setTeachers(Array.isArray(teacherData) ? teacherData.map(normalizeTeacher) : []);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    let active = true;
    void (async () => {
      if (!active) return;
      await refreshSubjects();
    })();
    return () => { active = false; };
  }, []);

  const getTeacherName = (teacherRef: unknown) => {
    if (teacherRef == null) return '';
    if (typeof teacherRef === 'string' || typeof teacherRef === 'number') {
      return teachers.find((teacher) => String(teacher.id) === String(teacherRef))?.fullName ?? String(teacherRef);
    }
    if (typeof teacherRef === 'object') {
      const obj = teacherRef as Record<string, any>;
      if (obj.fullName) return String(obj.fullName);
      if (obj.name) return String(obj.name);
      if (obj.id != null) return teachers.find((teacher) => String(teacher.id) === String(obj.id))?.fullName ?? String(obj.id);
    }
    return String(teacherRef);
  };

  const filteredMatieres = useMemo(() => {
    const list = Array.isArray(matieres) ? matieres : [];
    const q = searchTerm.toLowerCase();
    return list.filter((matiere) => {
      const name = String((matiere as any)?.name ?? '');
      const teacherNames = Array.isArray((matiere as any)?.teacherIds) ? (matiere as any).teacherIds.map((teacherId: unknown) => getTeacherName(teacherId)).join(' ') : '';
      return name.toLowerCase().includes(q) || teacherNames.toLowerCase().includes(q);
    });
  }, [matieres, searchTerm, teachers]);

  const handleSave = async (matiere: SubjectPayload, subjectId?: SubjectRecord['id']) => {
    const payload: SubjectPayload = {
      ...matiere,
      teacherIds: Array.isArray(matiere.teacherIds) ? matiere.teacherIds.map(String).filter(Boolean) : [],
    };

    const normalizeSubject = (s: any) => ({
      ...s,
      id: String(s?.id ?? s?._id ?? ''),
      teacherIds: Array.isArray(s?.teacherIds)
        ? s.teacherIds.map((t: any) => (typeof t === 'object' ? String(t.id ?? t._id ?? t.fullName ?? '') : String(t)))
        : [],
    }) as SubjectRecord;

    if (subjectId) {
      try {
        const savedSubject = await api.updateSubject(subjectId, payload);
        await refreshSubjects();
        setShowModal(false);
        setEditingMatiere(null);
      } catch (err) {
        setError(err instanceof Error ? err.message : String(err));
      }
      return;
    }

    const tempId = `temp-${Date.now()}`;
    const tempSubject: SubjectRecord = normalizeSubject({ ...payload, id: tempId });
    setMatieres((prev) => [...prev, tempSubject]);
    setShowModal(false);
    setEditingMatiere(null);

    try {
      const savedSubject = await api.createSubject(payload);
      await refreshSubjects();
    } catch (err) {
      setMatieres((prev) => prev.filter((entry) => String(entry.id) !== tempId));
      setError(err instanceof Error ? err.message : String(err));
    }
  };

  const handleEdit = (matiere: SubjectRecord) => {
    setEditingMatiere(matiere);
    setShowModal(true);
  };

  const handleDelete = async (matiereId: SubjectRecord['id']) => {
    if (!matiereId) {
      setError('Impossible de supprimer : identifiant manquant.');
      return;
    }
    try {
      await api.deleteSubject(matiereId);
      await refreshSubjects();
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    }
  };

  return (
    <div className="min-h-full p-8" style={{ background: '#fdf5f5' }}>
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-4xl mb-2" style={{ fontFamily: 'Georgia, serif', fontWeight: 700, color: '#0e1f12' }}>
              Gestion des Matières
            </h1>
          </div>
          <div className="flex items-center gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <Input
                type="text"
                placeholder="Rechercher une matière..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 w-80 bg-white"
              />
            </div>
            <Button
              onClick={() => { setEditingMatiere(null); setShowModal(true); }}
              className="text-white shadow-lg"
              style={{ background: '#C1272D' }}
            >
              <Plus className="w-5 h-5 mr-2" />
              Ajouter une matière
            </Button>
          </div>
        </div>

        {error && (
          <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-red-700 mb-6">
            {error}
          </div>
        )}

        <div className="bg-white rounded-xl shadow-lg overflow-hidden">
          <table className="w-full">
            <thead>
              <tr style={{ background: '#0d1b2a' }}>
                <th className="text-left px-6 py-4 text-white tracking-wide" style={{ fontWeight: 600 }}>
                  Nom de la matière
                </th>
                <th className="text-left px-6 py-4 text-white tracking-wide" style={{ fontWeight: 600 }}>
                  Professeur assigné
                </th>
                <th className="text-right px-6 py-4 text-white tracking-wide" style={{ fontWeight: 600 }}>
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {!isLoading && filteredMatieres.map((matiere, idx) => (
                <tr
                  key={String(matiere.id ?? `matiere-${idx}`)}
                  className="border-b border-gray-100 hover:bg-[#fdf5f5] transition-colors"
                >
                  <td className="px-6 py-4" style={{ color: '#0e1f12' }}>
                    {matiere.name}
                  </td>
                  <td className="px-6 py-4" style={{ color: '#C1272D' }}>
                    {Array.isArray(matiere.teacherIds) && matiere.teacherIds.length > 0
                      ? matiere.teacherIds.map((teacherId) => getTeacherName(teacherId)).join(', ')
                      : 'Aucun professeur assigné'}
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => handleEdit(matiere)}
                        className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                        title="Modifier"
                      >
                        <Pencil className="w-4 h-4" style={{ color: '#0e1f12' }} />
                      </button>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <button
                            className="p-2 hover:bg-red-50 rounded-lg transition-colors"
                            title="Supprimer"
                          >
                            <Trash2 className="w-4 h-4" style={{ color: '#C1272D' }} />
                          </button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle style={{ fontFamily: 'Georgia, serif', color: '#0e1f12' }}>
                              Êtes-vous sûr de vouloir supprimer cette matière ?
                            </AlertDialogTitle>
                            <AlertDialogDescription>Cette action est irréversible.</AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Annuler</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={() => handleDelete(matiere.id)}
                              style={{ background: '#C1272D', color: 'white' }}
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
                  <td colSpan={3} className="px-6 py-10 text-center text-slate-500">
                    Chargement des matières...
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={() => setShowModal(false)}>
          <div className="bg-white rounded-xl p-8 max-w-lg w-full mx-4 shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-2xl font-semibold mb-6" style={{ fontFamily: 'Georgia, serif', color: '#0e1f12' }}>
              {editingMatiere ? 'Modifier la matière' : 'Ajouter une nouvelle matière'}
            </h3>
            <p className="text-sm text-slate-500 mb-4">
              {editingMatiere
                ? 'Modifiez les informations de la matière ci-dessous.'
                : 'Remplissez les informations pour ajouter une nouvelle matière.'}
            </p>
            <form className="space-y-4" onSubmit={(e) => {
              e.preventDefault();
              const formData = new FormData(e.target as HTMLFormElement);
              const rawTeacher = formData.get('teacherId');
              const teacherId = rawTeacher == null ? '' : String(rawTeacher);
              const matiereData: SubjectPayload = {
                name: String(formData.get('name') ?? ''),
                teacherIds: teacherId ? [teacherId] : [],
              };
              void handleSave(matiereData, editingMatiere?.id);
            }}>
              <div className="space-y-2">
                <label htmlFor="name" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                  Nom de la matière
                </label>
                <Input
                  id="name"
                  name="name"
                  type="text"
                  placeholder="Ex: Mathématiques"
                  defaultValue={editingMatiere?.name}
                  required
                />
              </div>
              <div className="space-y-2">
                <label htmlFor="teacherId" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                  Professeur assigné
                </label>
                <select
                  id="teacherId"
                  name="teacherId"
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-70"
                  defaultValue={editingMatiere?.teacherIds?.[0] ? String(editingMatiere.teacherIds[0]) : ''}
                  required
                >
                  <option value="">-- Sélectionner un professeur --</option>
                  {teachers.map((teacher, tIdx) => (
                    <option key={String(teacher.id ?? `teacher-${tIdx}`)} value={String(teacher.id ?? '')}>
                      {teacher.fullName}
                    </option>
                  ))}
                </select>
              </div>
              <div className="flex justify-end gap-3 pt-4">
                <Button variant="outline" type="button" onClick={() => setShowModal(false)}>
                  Annuler
                </Button>
                <Button
                  type="submit"
                  className="text-white"
                  style={{ background: '#006233' }}
                >
                  {editingMatiere ? 'Enregistrer' : 'Ajouter'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}