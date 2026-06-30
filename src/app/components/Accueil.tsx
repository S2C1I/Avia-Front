import { Users, GraduationCap, Calendar, TrendingUp, Award, Clock, Plane, Briefcase, Wrench } from 'lucide-react';
import { AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const enrollmentData = [
  { month: 'Sep', count: 45 },
  { month: 'Oct', count: 52 },
  { month: 'Nov', count: 58 },
  { month: 'Dec', count: 61 },
  { month: 'Jan', count: 64 },
  { month: 'Fév', count: 67 },
];

const upcomingEvents = [
  { title: 'Examen de Navigation', date: '28 Mai 2026', track: 'Pilote', time: '09:00' },
  { title: 'Présentation Service Client', date: '29 Mai 2026', track: 'Steward', time: '14:00' },
  { title: 'TP Maintenance', date: '30 Mai 2026', track: 'Mécanique', time: '10:00' },
  { title: 'Réunion Pédagogique', date: '31 Mai 2026', track: 'Tous', time: '16:00' },
];

export function Accueil() {
  return (
    <div className="p-8 space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground mb-2">Bienvenue sur Aviation École</h1>
          <p className="text-slate-600">Tableau de bord général - Lundi 25 Mai 2026</p>
        </div>
        <div className="flex items-center gap-4">
          <div className="text-right">
            <p className="text-slate-600 text-sm">Année Académique</p>
            <p className="text-foreground font-semibold">2025-2026</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-gradient-to-br from-white to-slate-50 rounded-2xl p-6 shadow-xl border border-slate-200">
          <div className="flex items-center justify-between mb-4">
            <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center shadow-lg">
              <GraduationCap className="w-7 h-7 text-white" />
            </div>
          </div>
          <p className="text-slate-600 text-sm font-medium mb-1">Total Étudiants</p>
          <p className="text-4xl font-bold text-[#1e293b] mb-2">67</p>
          <div className="flex items-center gap-2 text-sm">
            <span className="text-green-600 font-medium">↗ +8%</span>
            <span className="text-slate-500">vs mois dernier</span>
          </div>
        </div>

        <div className="bg-gradient-to-br from-white to-slate-50 rounded-2xl p-6 shadow-xl border border-slate-200">
          <div className="flex items-center justify-between mb-4">
            <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-[#D4AF37] to-[#E8D88A] flex items-center justify-center shadow-lg">
              <TrendingUp className="w-7 h-7 text-[#1e293b]" />
            </div>
          </div>
          <p className="text-slate-600 text-sm font-medium mb-1">Moyenne Générale</p>
          <p className="text-4xl font-bold text-[#1e293b] mb-2">15.9</p>
          <div className="flex items-center gap-2 text-sm">
            <span className="text-green-600 font-medium">↗ +0.6</span>
            <span className="text-slate-500">points</span>
          </div>
        </div>

        <div className="bg-gradient-to-br from-white to-slate-50 rounded-2xl p-6 shadow-xl border border-slate-200">
          <div className="flex items-center justify-between mb-4">
            <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-green-500 to-green-600 flex items-center justify-center shadow-lg">
              <Award className="w-7 h-7 text-white" />
            </div>
          </div>
          <p className="text-slate-600 text-sm font-medium mb-1">Taux de Réussite</p>
          <p className="text-4xl font-bold text-[#1e293b] mb-2">94%</p>
          <div className="flex items-center gap-2 text-sm">
            <span className="text-green-600 font-medium">↗ +3%</span>
            <span className="text-slate-500">aux examens</span>
          </div>
        </div>

        <div className="bg-gradient-to-br from-white to-slate-50 rounded-2xl p-6 shadow-xl border border-slate-200">
          <div className="flex items-center justify-between mb-4">
            <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-purple-500 to-purple-600 flex items-center justify-center shadow-lg">
              <Users className="w-7 h-7 text-white" />
            </div>
          </div>
          <p className="text-slate-600 text-sm font-medium mb-1">Professeurs Actifs</p>
          <p className="text-4xl font-bold text-[#1e293b] mb-2">18</p>
          <div className="flex items-center gap-2 text-sm">
            <span className="text-slate-500">12 matières</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white rounded-2xl p-6 shadow-xl border border-slate-200">
          <h3 className="text-xl font-bold text-[#1e293b] mb-6">Évolution des Inscriptions</h3>
          <ResponsiveContainer width="100%" height={320}>
            <AreaChart data={enrollmentData}>
              <defs>
                <linearGradient id="colorCountGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#D4AF37" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="#D4AF37" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid key="grid" strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis key="xaxis" dataKey="month" stroke="#64748b" />
              <YAxis key="yaxis" stroke="#64748b" />
              <Tooltip
                key="tooltip"
                contentStyle={{
                  backgroundColor: '#ffffff',
                  border: '1px solid #e2e8f0',
                  borderRadius: '12px',
                  boxShadow: '0 4px 6px rgba(0,0,0,0.1)'
                }}
              />
              <Area key="area" type="monotone" dataKey="count" stroke="#D4AF37" strokeWidth={3} fillOpacity={1} fill="url(#colorCountGradient)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-white rounded-2xl p-6 shadow-xl border border-slate-200">
          <h3 className="text-xl font-bold text-[#1e293b] mb-6">Événements à Venir</h3>
          <div className="space-y-4">
            {upcomingEvents.map((event, index) => (
              <div key={index} className="flex gap-3 p-3 bg-slate-50 rounded-xl hover:bg-slate-100 transition-colors">
                <div className="flex-shrink-0">
                  <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-[#D4AF37] to-[#E8D88A] flex items-center justify-center">
                    <Calendar className="w-6 h-6 text-[#1e293b]" />
                  </div>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-[#1e293b] text-sm truncate">{event.title}</p>
                  <p className="text-xs text-slate-500 mt-1">{event.track}</p>
                  <div className="flex items-center gap-2 mt-2">
                    <Clock className="w-3 h-3 text-slate-400" />
                    <span className="text-xs text-slate-600">{event.date} • {event.time}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-gradient-to-br from-[#1a2e1e] via-[#123826] to-[#006233] rounded-2xl p-6 shadow-xl text-white relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16"></div>
          <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/10 rounded-full -ml-12 -mb-12"></div>
          <div className="relative">
            <Plane className="w-12 h-12 mb-4 opacity-90" />
            <h4 className="text-2xl font-bold mb-2">Filière Pilote</h4>
            <p className="text-white/80 text-sm mb-4">Formation pilotage professionnel</p>
            <div className="flex items-end justify-between">
              <div>
                <p className="text-3xl font-bold">28</p>
                <p className="text-white/70 text-xs mt-1">Étudiants actifs</p>
              </div>
              <div className="text-right">
                <p className="text-lg font-semibold">16.2</p>
                <p className="text-white/70 text-xs">Moyenne</p>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-[#C1272D] via-[#d93f46] to-[#e85259] rounded-2xl p-6 shadow-xl text-white relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-white/20 rounded-full -mr-16 -mt-16"></div>
          <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/20 rounded-full -ml-12 -mb-12"></div>
          <div className="relative">
            <Briefcase className="w-12 h-12 mb-4 opacity-90" />
            <h4 className="text-2xl font-bold mb-2">Filière Steward</h4>
            <p className="text-white/80 text-sm mb-4">Personnel navigant commercial</p>
            <div className="flex items-end justify-between">
              <div>
                <p className="text-3xl font-bold">21</p>
                <p className="text-white/70 text-xs mt-1">Étudiants actifs</p>
              </div>
              <div className="text-right">
                <p className="text-lg font-semibold">15.8</p>
                <p className="text-white/70 text-xs">Moyenne</p>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-[#006233] via-[#0d7342] to-[#1a8a50] rounded-2xl p-6 shadow-xl text-white relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16"></div>
          <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/10 rounded-full -ml-12 -mb-12"></div>
          <div className="relative">
            <Wrench className="w-12 h-12 mb-4 opacity-90" />
            <h4 className="text-2xl font-bold mb-2">Filière Mécanique</h4>
            <p className="text-white/80 text-sm mb-4">Maintenance aéronautique</p>
            <div className="flex items-end justify-between">
              <div>
                <p className="text-3xl font-bold">18</p>
                <p className="text-white/70 text-xs mt-1">Étudiants actifs</p>
              </div>
              <div className="text-right">
                <p className="text-lg font-semibold">15.5</p>
                <p className="text-white/70 text-xs">Moyenne</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
