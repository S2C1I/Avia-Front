import { useEffect, useState } from 'react';
import {
  ClipboardList,
  Plus,
  Eye,
  Trash2,
  ArrowLeft,
  Calendar,
  Users,
  FileText,
  CheckSquare,
  ChevronRight,
  Save,
  Edit3,
  RefreshCw,
  AlertCircle,
} from 'lucide-react';
import {
  api,
  ApiId,
  normalizeApiId,
  PVPayload,
  PVRecord,
  PVStatus,
} from '../lib/api';

// ─── Types ────────────────────────────────────────────────────────────────────

interface AgendaItem {
  id: string;
  text: string;
}

interface Deliberation {
  id: string;
  text: string;
}

interface Resolution {
  id: string;
  text: string;
  status: PVStatus;
}

interface FormState {
  id?: ApiId;
  number: string;
  title: string;
  date: string;
  lieu: string;
  president: string;
  participants: string;
  agenda: AgendaItem[];
  deliberations: Deliberation[];
  resolutions: Resolution[];
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

const generateLocalId = () => Math.random().toString(36).slice(2, 9);

const generatePVNumber = (existing: PVRecord[]) => {
  const year = new Date().getFullYear();
  const seq = String(existing.length + 1).padStart(3, '0');
  return `PV-${year}-${seq}`;
};

const STATUS_LABELS: Record<PVStatus, string> = {
  adoptee: 'Adoptée',
  rejetee: 'Rejetée',
  en_attente: 'En attente',
};

const STATUS_STYLES: Record<PVStatus, string> = {
  adoptee: 'bg-green-100 text-green-700 border border-green-200',
  rejetee: 'bg-red-100 text-red-700 border border-red-200',
  en_attente: 'bg-amber-100 text-amber-700 border border-amber-200',
};

const toDateInputValue = (value?: string) => {
  if (!value) return new Date().toISOString().slice(0, 10);
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return value.slice(0, 10);
  return d.toISOString().slice(0, 10);
};

const toIsoDate = (value: string) => {
  if (!value) return new Date().toISOString();
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return value;
  return d.toISOString();
};

const normalizePV = (raw: unknown): PVRecord => {
  const obj = (raw ?? {}) as Record<string, any>;
  return {
    ...(obj as PVRecord),
    id: normalizeApiId(obj?.id ?? obj?._id) as ApiId,
    number: String(obj?.number ?? ''),
    title: String(obj?.title ?? ''),
    date: String(obj?.date ?? new Date().toISOString()),
    lieu: String(obj?.lieu ?? ''),
    president: String(obj?.president ?? ''),
    participants: String(obj?.participants ?? ''),
    agenda: Array.isArray(obj?.agenda)
      ? obj.agenda.map((a: any) => ({ text: String(a?.text ?? '') }))
      : [],
    deliberations: Array.isArray(obj?.deliberations)
      ? obj.deliberations.map((d: any) => ({ text: String(d?.text ?? '') }))
      : [],
    resolutions: Array.isArray(obj?.resolutions)
      ? obj.resolutions.map((r: any) => ({
          text: String(r?.text ?? ''),
          status: (r?.status ?? 'en_attente') as PVStatus,
        }))
      : [],
  };
};

const emptyForm = (existing: PVRecord[]): FormState => ({
  number: generatePVNumber(existing),
  title: '',
  date: new Date().toISOString().slice(0, 10),
  lieu: '',
  president: '',
  participants: '',
  agenda: [{ id: generateLocalId(), text: '' }],
  deliberations: [{ id: generateLocalId(), text: '' }],
  resolutions: [{ id: generateLocalId(), text: '', status: 'en_attente' }],
});

const formToPayload = (form: FormState): PVPayload => ({
  number: form.number.trim(),
  title: form.title.trim(),
  date: toIsoDate(form.date),
  lieu: form.lieu.trim() || undefined,
  president: form.president.trim() || undefined,
  participants: form.participants.trim() || undefined,
  agenda: form.agenda
    .map((a) => ({ text: a.text.trim() }))
    .filter((a) => a.text.length > 0),
  deliberations: form.deliberations
    .map((d) => ({ text: d.text.trim() }))
    .filter((d) => d.text.length > 0),
  resolutions: form.resolutions
    .map((r) => ({ text: r.text.trim(), status: r.status }))
    .filter((r) => r.text.length > 0),
});

// ─── List View ────────────────────────────────────────────────────────────────

function PVList({
  pvList,
  isLoading,
  error,
  onView,
  onDelete,
  onNew,
}: {
  pvList: PVRecord[];
  isLoading?: boolean;
  error?: string | null;
  onView: (pv: PVRecord) => void;
  onDelete: (id: ApiId) => void;
  onNew: () => void;
}) {
  return (
    <div className="p-8 space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground mb-2">Procès-Verbaux</h1>
          <p className="text-slate-600">Gestion des procès-verbaux de réunion</p>
        </div>
        <button
          onClick={onNew}
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-white font-semibold text-sm shadow-md hover:opacity-90 transition-all"
          style={{ background: 'linear-gradient(135deg, #006233 0%, #1a8a50 100%)' }}
        >
          <Plus className="w-4 h-4" />
          Nouveau PV
        </button>
      </div>

      {error && (
        <div className="flex items-center gap-3 p-4 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm">
          <AlertCircle className="w-5 h-5 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {isLoading && pvList.length === 0 && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow p-12 flex items-center justify-center gap-3 text-slate-500">
          <RefreshCw className="w-5 h-5 animate-spin" />
          <span>Chargement des procès-verbaux…</span>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[
          { label: 'Total PV', value: pvList.length, color: '#006233', bg: 'rgba(0,98,51,0.08)' },
          {
            label: 'Ce mois',
            value: pvList.filter((p) => new Date(p.date).getMonth() === new Date().getMonth()).length,
            color: '#C1272D',
            bg: 'rgba(193,39,45,0.08)',
          },
          {
            label: 'Résolutions adoptées',
            value: pvList.reduce((acc, p) => acc + (p.resolutions ?? []).filter((r) => r.status === 'adoptee').length, 0),
            color: '#006233',
            bg: 'rgba(0,98,51,0.08)',
          },
        ].map((stat) => (
          <div key={stat.label} className="bg-white rounded-2xl border border-slate-200 shadow p-5 flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0" style={{ backgroundColor: stat.bg }}>
              <ClipboardList className="w-6 h-6" style={{ color: stat.color }} />
            </div>
            <div>
              <p className="text-slate-500 text-xs font-semibold uppercase tracking-wider">{stat.label}</p>
              <p className="text-2xl font-bold text-[#1e293b]">{stat.value}</p>
            </div>
          </div>
        ))}
      </div>

      {pvList.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 shadow p-16 flex flex-col items-center justify-center gap-4 text-center">
          <div className="w-16 h-16 rounded-2xl flex items-center justify-center" style={{ background: 'rgba(0,98,51,0.08)' }}>
            <ClipboardList className="w-8 h-8 text-[#006233]" />
          </div>
          <p className="text-lg font-bold text-slate-700">Aucun procès-verbal</p>
          <p className="text-slate-500 text-sm">Créez votre premier PV en cliquant sur « Nouveau PV ».</p>
          <button
            onClick={onNew}
            className="mt-2 flex items-center gap-2 px-5 py-2.5 rounded-xl text-white font-semibold text-sm shadow hover:opacity-90 transition-all"
            style={{ background: 'linear-gradient(135deg, #006233 0%, #1a8a50 100%)' }}
          >
            <Plus className="w-4 h-4" />
            Nouveau PV
          </button>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-slate-200 shadow overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50">
                <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-wider text-slate-500">Numéro</th>
                <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-wider text-slate-500">Objet</th>
                <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-wider text-slate-500">Date</th>
                <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-wider text-slate-500">Résolutions</th>
                <th className="px-6 py-4 text-right text-xs font-bold uppercase tracking-wider text-slate-500">Actions</th>
              </tr>
            </thead>
            <tbody>
              {pvList.map((pv, i) => (
                <tr key={pv.id} className={`border-b border-slate-50 hover:bg-slate-50/70 transition-colors ${i === pvList.length - 1 ? 'border-b-0' : ''}`}>
                  <td className="px-6 py-4">
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold bg-[#006233]/10 text-[#006233]">
                      <ClipboardList className="w-3.5 h-3.5" />
                      {pv.number}
                    </span>
                  </td>
                  <td className="px-6 py-4 font-medium text-[#1e293b] max-w-xs truncate">{pv.title || <span className="text-slate-400 italic">Sans titre</span>}</td>
                  <td className="px-6 py-4 text-slate-600">{new Date(pv.date).toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric' })}</td>
                  <td className="px-6 py-4">
                    <div className="flex gap-1.5 flex-wrap">
                      {(() => {
                        const resolutions = pv.resolutions ?? [];
                        const adopted = resolutions.filter((r) => r.status === 'adoptee' && r.text).length;
                        const pending = resolutions.filter((r) => r.status === 'en_attente' && r.text).length;
                        if (adopted === 0 && pending === 0) return <span className="text-slate-400 text-xs">—</span>;
                        return (
                          <>
                            {adopted > 0 && <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-green-100 text-green-700">{adopted} adoptée{adopted > 1 ? 's' : ''}</span>}
                            {pending > 0 && <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-amber-100 text-amber-700">{pending} en attente</span>}
                          </>
                        );
                      })()}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center justify-end gap-2">
                      <button onClick={() => onView(pv)} className="p-2 rounded-lg hover:bg-[#006233]/10 text-[#006233] transition-colors" title="Voir / modifier"><Eye className="w-4 h-4" /></button>
                      <button onClick={() => onDelete(pv.id)} className="p-2 rounded-lg hover:bg-red-50 text-[#C1272D] transition-colors" title="Supprimer"><Trash2 className="w-4 h-4" /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

// ─── Dynamic list editor ───────────────────────────────────────────────────────

function ListEditor<T extends { id: string }>({ items, onChange, renderItem, addLabel, addItem }: { items: T[]; onChange: (items: T[]) => void; renderItem: (item: T, update: (updated: T) => void, remove: () => void) => React.ReactNode; addLabel: string; addItem: () => T; }) {
  return (
    <div className="space-y-3">
      {items.map((item) => (
        <div key={item.id}>{renderItem(item, (updated) => onChange(items.map((i) => (i.id === updated.id ? updated : i))), () => onChange(items.filter((i) => i.id !== item.id)))}</div>
      ))}
      <button type="button" onClick={() => onChange([...items, addItem()])} className="flex items-center gap-2 text-xs font-semibold text-[#006233] hover:text-[#004d28] transition-colors mt-1"><Plus className="w-3.5 h-3.5" />{addLabel}</button>
    </div>
  );
}

// ─── Section wrapper ───────────────────────────────────────────────────────────

function Section({ icon: Icon, title, color, children }: { icon: React.ElementType; title: string; color: string; children: React.ReactNode; }) {
  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow overflow-hidden">
      <div className="flex items-center gap-3 px-6 py-4 border-b border-slate-100" style={{ background: `${color}0d` }}>
        <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: `${color}1a` }}><Icon className="w-4 h-4" style={{ color }} /></div>
        <h3 className="font-bold text-[#1e293b] text-sm uppercase tracking-wider">{title}</h3>
      </div>
      <div className="p-6">{children}</div>
    </div>
  );
}

// ─── Profile / Detail View ────────────────────────────────────────────────────

function PVProfile({ pv: initialPV, isNew, onBack, onSave }: { pv: PVRecord; isNew: boolean; onBack: () => void; onSave: (pv: PVRecord) => void; }) {
  const [pv, setPV] = useState<PVRecord>(initialPV);
  const [saved, setSaved] = useState(false);
  const update = (fields: Partial<PVRecord>) => setPV((prev) => ({ ...prev, ...fields }));
  const handleSave = () => { onSave(pv); setSaved(true); setTimeout(() => setSaved(false), 2500); };

  const inputCls = 'w-full px-4 py-2.5 border border-slate-200 rounded-xl bg-slate-50/50 focus:outline-none focus:ring-2 focus:ring-[#006233] text-sm transition-all';
  const labelCls = 'block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5';

  return (
    <div className="p-8 space-y-6 max-w-4xl mx-auto">
      <div className="flex items-center gap-3">
        <button onClick={onBack} className="p-2 rounded-xl hover:bg-slate-100 text-slate-500 transition-colors"><ArrowLeft className="w-5 h-5" /></button>
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-bold" style={{ background: 'rgba(0,98,51,0.1)', color: '#006233' }}><ClipboardList className="w-3.5 h-3.5" />{pv.number}</span>
            {isNew && <span className="inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-bold bg-amber-100 text-amber-700">Nouveau</span>}
          </div>
          <h1 className="text-2xl font-bold text-[#1e293b] mt-1">{pv.title || 'Procès-Verbal sans titre'}</h1>
        </div>
        <button onClick={handleSave} className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-white font-semibold text-sm shadow hover:opacity-90 transition-all" style={{ background: saved ? 'linear-gradient(135deg,#006233,#1a8a50)' : 'linear-gradient(135deg,#C1272D,#e85259)' }}>
          {saved ? <><CheckSquare className="w-4 h-4" />Enregistré</> : <><Save className="w-4 h-4" />Enregistrer</>}
        </button>
      </div>

      <Section icon={FileText} title="Procès-Verbal de Réunion" color="#006233">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <div className="md:col-span-2"><label className={labelCls}>Objet / Titre de la réunion</label><input className={inputCls} placeholder="Ex : Réunion du conseil pédagogique – semestre 2" value={pv.title} onChange={(e) => update({ title: e.target.value })} /></div>
          <div><label className={labelCls}><Calendar className="inline w-3.5 h-3.5 mr-1 -mt-0.5" />Date de la réunion</label><input type="date" className={inputCls} value={pv.date} onChange={(e) => update({ date: e.target.value })} /></div>
          <div><label className={labelCls}>Lieu</label><input className={inputCls} placeholder="Ex : Salle de conférence A" value={pv.lieu} onChange={(e) => update({ lieu: e.target.value })} /></div>
          <div><label className={labelCls}>Président de séance</label><input className={inputCls} placeholder="Ex : M. El Alaoui" value={pv.president} onChange={(e) => update({ president: e.target.value })} /></div>
          <div><label className={labelCls}><Users className="inline w-3.5 h-3.5 mr-1 -mt-0.5" />Participants</label><input className={inputCls} placeholder="Ex : Directeur, chefs de département, enseignants…" value={pv.participants} onChange={(e) => update({ participants: e.target.value })} /></div>
        </div>
      </Section>

      <Section icon={ChevronRight} title="Ordre du Jour" color="#006233">
        <ListEditor<AgendaItem>
          items={(pv.agenda ?? []) as unknown as AgendaItem[]}
          onChange={(agenda) => update({ agenda })}
          addLabel="Ajouter un point"
          addItem={() => ({ id: generateLocalId(), text: '' })}
          renderItem={(item, upd, remove) => (
            <div className="flex items-start gap-2 group">
              <span className="mt-2.5 w-5 h-5 rounded-full bg-[#006233]/10 text-[#006233] flex items-center justify-center text-xs font-bold shrink-0">{(pv.agenda ?? []).indexOf(item) + 1}</span>
              <input className={`${inputCls} flex-1`} placeholder="Point à l'ordre du jour…" value={item.text} onChange={(e) => upd({ ...item, text: e.target.value })} />
              {(pv.agenda ?? []).length > 1 && <button type="button" onClick={remove} className="mt-2 p-1.5 rounded-lg opacity-0 group-hover:opacity-100 hover:bg-red-50 text-[#C1272D] transition-all"><Trash2 className="w-3.5 h-3.5" /></button>}
            </div>
          )}
        />
      </Section>

      <Section icon={Edit3} title="Délibérations & Constats" color="#C1272D">
        <ListEditor<Deliberation>
          items={(pv.deliberations ?? []) as unknown as Deliberation[]}
          onChange={(deliberations) => update({ deliberations })}
          addLabel="Ajouter une délibération"
          addItem={() => ({ id: generateLocalId(), text: '' })}
          renderItem={(item, upd, remove) => (
            <div className="flex items-start gap-2 group">
              <div className="mt-2.5 w-5 h-5 rounded-full bg-[#C1272D]/10 text-[#C1272D] flex items-center justify-center shrink-0"><ChevronRight className="w-3 h-3" /></div>
              <textarea className={`${inputCls} flex-1 resize-none h-20`} placeholder="Description de la délibération ou du constat…" value={item.text} onChange={(e) => upd({ ...item, text: e.target.value })} />
              {(pv.deliberations ?? []).length > 1 && <button type="button" onClick={remove} className="mt-2 p-1.5 rounded-lg opacity-0 group-hover:opacity-100 hover:bg-red-50 text-[#C1272D] transition-all"><Trash2 className="w-3.5 h-3.5" /></button>}
            </div>
          )}
        />
      </Section>

      <Section icon={CheckSquare} title="Résolutions Adoptées" color="#006233">
        <ListEditor<Resolution>
          items={(pv.resolutions ?? []) as unknown as Resolution[]}
          onChange={(resolutions) => update({ resolutions })}
          addLabel="Ajouter une résolution"
          addItem={() => ({ id: generateLocalId(), text: '', status: 'en_attente' })}
          renderItem={(item, upd, remove) => (
            <div className="flex items-start gap-2 group">
              <span className="mt-2.5 w-5 h-5 rounded-full bg-[#006233]/10 text-[#006233] flex items-center justify-center text-xs font-bold shrink-0">{(pv.resolutions ?? []).indexOf(item) + 1}</span>
              <div className="flex flex-col gap-2 flex-1 min-w-0">
                <textarea className={`${inputCls} w-full resize-none`} style={{ minHeight: '80px' }} placeholder="Texte de la résolution…" value={item.text} onChange={(e) => upd({ ...item, text: e.target.value })} />
                <select
                  className={`${inputCls} w-40 appearance-none bg-[url('data:image/svg+xml;charset=utf-8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20fill%3D%22none%22%20viewBox%3D%220%200%2020%2020%22%3E%3Cpath%20stroke%3D%22%2364748b%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%20stroke-width%3D%221.5%22%20d%3D%22m6%208%204%204%204-4%22%2F%3E%3C%2Fsvg%3E')] bg-[length:1.25em_1.25em] bg-[right_0.5rem_center] bg-no-repeat`}
                  value={item.status}
                  onChange={(e) => upd({ ...item, status: e.target.value as Resolution['status'] })}
                >
                  <option value="adoptee">Adoptée</option>
                  <option value="rejetee">Rejetée</option>
                  <option value="en_attente">En attente</option>
                </select>
              </div>
              {(pv.resolutions ?? []).length > 1 && <button type="button" onClick={remove} className="mt-2 p-1.5 rounded-lg opacity-0 group-hover:opacity-100 hover:bg-red-50 text-[#C1272D] transition-all"><Trash2 className="w-3.5 h-3.5" /></button>}
            </div>
          )}
        />
        {(pv.resolutions ?? []).filter((r) => r.text).length > 0 && (
          <div className="flex gap-2 mt-5 pt-5 border-t border-slate-100 flex-wrap">
            {(['adoptee', 'rejetee', 'en_attente'] as Resolution['status'][]).map((status) => {
              const count = (pv.resolutions ?? []).filter((r) => r.status === status && r.text).length;
              if (!count) return null;
              return <span key={status} className={`px-3 py-1 rounded-full text-xs font-semibold ${STATUS_STYLES[status]}`}>{count} {STATUS_LABELS[status]}{count > 1 && status === 'adoptee' ? 's' : ''}</span>;
            })}
          </div>
        )}
      </Section>

      <div className="flex justify-end pb-4">
        <button onClick={handleSave} className="flex items-center gap-2 px-6 py-3 rounded-xl text-white font-semibold shadow hover:opacity-90 transition-all" style={{ background: 'linear-gradient(135deg,#C1272D,#e85259)' }}><Save className="w-4 h-4" />Enregistrer le PV</button>
      </div>
    </div>
  );
}

export function PV() {
  const [pvList, setPVList] = useState<PVRecord[]>([]);
  const [view, setView] = useState<'list' | 'profile'>('list');
  const [activePV, setActivePV] = useState<PVRecord | null>(null);
  const [isNew, setIsNew] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;
    const loadPVs = async () => {
      try {
        setIsLoading(true);
        setError(null);
        const rows = await api.getPVs();
        if (!isMounted) return;
        setPVList(Array.isArray(rows) ? rows.map(normalizePV) : []);
      } catch (loadError) {
        if (!isMounted) return;
        setError(loadError instanceof Error ? loadError.message : 'Impossible de charger les procès-verbaux.');
      } finally {
        if (isMounted) setIsLoading(false);
      }
    };
    loadPVs();
    return () => { isMounted = false; };
  }, []);

  const handleNew = () => {
    setActivePV({ ...emptyForm(pvList), id: generateLocalId() as unknown as ApiId });
    setIsNew(true);
    setView('profile');
  };

  const handleView = (pv: PVRecord) => { setActivePV(pv); setIsNew(false); setView('profile'); };
  const handleDelete = async (id: ApiId) => {
    try { await api.deletePV(id); setPVList((prev) => prev.filter((p) => String(p.id) !== String(id))); }
    catch (deleteError) { setError(deleteError instanceof Error ? deleteError.message : 'Suppression impossible.'); }
  };

  const handleSave = async (pv: PVRecord) => {
    try {
      setError(null);
      const payload = formToPayload(pv as unknown as FormState);
      const wasCreatedLocally = isNew || !pv.id || String(pv.id).length < 6;
      const savedRecord = wasCreatedLocally ? await api.createPV(payload) : await api.updatePV(pv.id, payload);
      const normalized = normalizePV(savedRecord);
      setPVList((prev) => {
        const exists = prev.some((p) => String(p.id) === String(normalized.id));
        return exists ? prev.map((p) => (String(p.id) === String(normalized.id) ? normalized : p)) : [...prev, normalized];
      });
      setActivePV(normalized);
      setIsNew(false);
    } catch (saveError) { setError(saveError instanceof Error ? saveError.message : 'Enregistrement impossible.'); }
  };

  const handleBack = () => { setView('list'); setActivePV(null); };

  if (view === 'profile' && activePV) return <PVProfile pv={activePV} isNew={isNew} onBack={handleBack} onSave={handleSave} />;
  return <PVList pvList={pvList} isLoading={isLoading} error={error} onView={handleView} onDelete={handleDelete} onNew={handleNew} />;
}