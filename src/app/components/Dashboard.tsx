import { Users, TrendingUp, Calendar, FileText, Plane, Briefcase, Wrench } from 'lucide-react';
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

const statsData = [
  { month: 'Jan', students: 45, average: 14.5 },
  { month: 'Fév', students: 52, average: 15.2 },
  { month: 'Mar', students: 58, average: 14.8 },
  { month: 'Avr', students: 61, average: 15.6 },
  { month: 'Mai', students: 67, average: 15.3 },
];

const trackDistribution = [
  { name: 'Pilote', value: 28, color: '#3b82f6' },
  { name: 'Steward', value: 21, color: '#d4af37' },
  { name: 'Mécanique', value: 18, color: '#10b981' },
];

export function Dashboard() {
  return (
    <div className="p-6 space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white rounded-xl p-6 shadow-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-slate-500 text-sm">Total Étudiants</p>
              <p className="text-3xl font-bold text-[#0a1929] mt-1">67</p>
              <p className="text-green-600 text-sm mt-2">+8% ce mois</p>
            </div>
            <div className="w-12 h-12 rounded-lg bg-blue-100 flex items-center justify-center">
              <Users className="w-6 h-6 text-blue-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl p-6 shadow-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-slate-500 text-sm">Moyenne Générale</p>
              <p className="text-3xl font-bold text-[#0a1929] mt-1">15.3</p>
              <p className="text-green-600 text-sm mt-2">+0.5 points</p>
            </div>
            <div className="w-12 h-12 rounded-lg bg-[#d4af37]/20 flex items-center justify-center">
              <TrendingUp className="w-6 h-6 text-[#d4af37]" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl p-6 shadow-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-slate-500 text-sm">Taux de Présence</p>
              <p className="text-3xl font-bold text-[#0a1929] mt-1">94%</p>
              <p className="text-green-600 text-sm mt-2">+2% ce mois</p>
            </div>
            <div className="w-12 h-12 rounded-lg bg-green-100 flex items-center justify-center">
              <Calendar className="w-6 h-6 text-green-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl p-6 shadow-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-slate-500 text-sm">Documents Émis</p>
              <p className="text-3xl font-bold text-[#0a1929] mt-1">142</p>
              <p className="text-slate-500 text-sm mt-2">Ce trimestre</p>
            </div>
            <div className="w-12 h-12 rounded-lg bg-purple-100 flex items-center justify-center">
              <FileText className="w-6 h-6 text-purple-600" />
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white rounded-xl p-6 shadow-lg">
          <h3 className="text-lg font-semibold text-[#0a1929] mb-4">Évolution des Étudiants & Notes</h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={statsData}>
              <CartesianGrid key="grid" strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis key="xaxis" dataKey="month" stroke="#64748b" />
              <YAxis key="yaxis" stroke="#64748b" />
              <Tooltip
                key="tooltip"
                contentStyle={{
                  backgroundColor: '#ffffff',
                  border: '1px solid #e2e8f0',
                  borderRadius: '8px'
                }}
              />
              <Line key="line-students" type="monotone" dataKey="students" stroke="#3b82f6" strokeWidth={3} name="Étudiants" />
              <Line key="line-average" type="monotone" dataKey="average" stroke="#d4af37" strokeWidth={3} name="Moyenne" />
            </LineChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-white rounded-xl p-6 shadow-lg">
          <h3 className="text-lg font-semibold text-[#0a1929] mb-4">Répartition par Filière</h3>
          <ResponsiveContainer width="100%" height={200}>
            <PieChart>
              <Pie
                key="pie"
                data={trackDistribution}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={80}
                paddingAngle={5}
                dataKey="value"
              >
                {trackDistribution.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip key="tooltip" />
            </PieChart>
          </ResponsiveContainer>
          <div className="space-y-2 mt-4">
            {trackDistribution.map((track) => (
              <div key={track.name} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: track.color }}></div>
                  <span className="text-sm text-slate-600">{track.name}</span>
                </div>
                <span className="text-sm font-semibold text-[#0a1929]">{track.value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl p-6 shadow-lg text-white">
          <div className="flex items-center justify-between mb-4">
            <Plane className="w-8 h-8" />
            <span className="text-2xl font-bold">28</span>
          </div>
          <h4 className="font-semibold text-lg">Filière Pilote</h4>
          <p className="text-blue-100 text-sm mt-1">Formation pilotage professionnel</p>
        </div>

        <div className="bg-gradient-to-br from-[#d4af37] to-[#e5c158] rounded-xl p-6 shadow-lg text-[#0a1929]">
          <div className="flex items-center justify-between mb-4">
            <Briefcase className="w-8 h-8" />
            <span className="text-2xl font-bold">21</span>
          </div>
          <h4 className="font-semibold text-lg">Filière Steward</h4>
          <p className="text-[#0a1929]/70 text-sm mt-1">Personnel navigant commercial</p>
        </div>

        <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-xl p-6 shadow-lg text-white">
          <div className="flex items-center justify-between mb-4">
            <Wrench className="w-8 h-8" />
            <span className="text-2xl font-bold">18</span>
          </div>
          <h4 className="font-semibold text-lg">Filière Mécanique</h4>
          <p className="text-green-100 text-sm mt-1">Maintenance aéronautique</p>
        </div>
      </div>

      <div className="bg-white rounded-xl p-6 shadow-lg">
        <h3 className="text-lg font-semibold text-[#0a1929] mb-4">Activité Récente</h3>
        <div className="space-y-4">
          {[
            { action: 'Nouvelle inscription', student: 'Marie Dubois', track: 'Pilote', time: 'Il y a 2h' },
            { action: 'Attestation générée', student: 'Pierre Martin', track: 'Mécanique', time: 'Il y a 4h' },
            { action: 'Notes ajoutées', student: 'Sophie Bernard', track: 'Steward', time: 'Il y a 6h' },
            { action: 'Présence validée', student: 'Luc Durand', track: 'Pilote', time: 'Il y a 1j' },
          ].map((activity, index) => (
            <div key={index} className="flex items-center justify-between py-3 border-b border-slate-100 last:border-0">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[var(--color-accent)] to-[var(--color-accent-soft)] flex items-center justify-center border border-[var(--color-border)] shadow-sm">
                  <FileText className="w-5 h-5 text-[var(--color-text)]" />
                </div>
                <div>
                  <p className="font-medium text-[#0a1929]">{activity.action}</p>
                  <p className="text-sm text-slate-500">{activity.student} - {activity.track}</p>
                </div>
              </div>
              <span className="text-sm text-slate-400">{activity.time}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
