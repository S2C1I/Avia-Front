import { Calendar, TrendingUp, Clock, AlertCircle } from 'lucide-react';

const weekData = [
  { day: 'Lun', present: 63, absent: 4, late: 0 },
  { day: 'Mar', present: 65, absent: 1, late: 1 },
  { day: 'Mer', present: 64, absent: 2, late: 1 },
  { day: 'Jeu', present: 66, absent: 0, late: 1 },
  { day: 'Ven', present: 62, absent: 3, late: 2 },
];

const recentAbsences = [
  { student: 'Pierre Martin', track: 'Mécanique', date: '24/05/2026', reason: 'Maladie', justified: true },
  { student: 'Claire Moreau', track: 'Pilote', date: '23/05/2026', reason: 'Rendez-vous médical', justified: true },
  { student: 'Luc Durand', track: 'Steward', date: '22/05/2026', reason: 'Non justifié', justified: false },
  { student: 'Sophie Bernard', track: 'Pilote', date: '21/05/2026', reason: 'Problème familial', justified: true },
  { student: 'Jean Dupont', track: 'Mécanique', date: '20/05/2026', reason: 'Transport', justified: false },
];

export function Attendance() {
  const totalPresent = weekData.reduce((sum, day) => sum + day.present, 0);
  const totalAbsent = weekData.reduce((sum, day) => sum + day.absent, 0);
  const totalLate = weekData.reduce((sum, day) => sum + day.late, 0);
  const total = totalPresent + totalAbsent + totalLate;
  const attendanceRate = ((totalPresent / total) * 100).toFixed(1);

  return (
    <div className="p-6 space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white rounded-xl p-6 shadow-lg">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 rounded-lg bg-green-100 flex items-center justify-center">
              <TrendingUp className="w-6 h-6 text-green-600" />
            </div>
          </div>
          <p className="text-slate-500 text-sm">Taux de Présence</p>
          <p className="text-3xl font-bold text-[#0a1929] mt-2">{attendanceRate}%</p>
          <p className="text-green-600 text-sm mt-2">Cette semaine</p>
        </div>

        <div className="bg-white rounded-xl p-6 shadow-lg">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 rounded-lg bg-blue-100 flex items-center justify-center">
              <Calendar className="w-6 h-6 text-blue-600" />
            </div>
          </div>
          <p className="text-slate-500 text-sm">Présents</p>
          <p className="text-3xl font-bold text-[#0a1929] mt-2">{totalPresent}</p>
          <p className="text-slate-500 text-sm mt-2">Sur {total} étudiants</p>
        </div>

        <div className="bg-white rounded-xl p-6 shadow-lg">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 rounded-lg bg-yellow-100 flex items-center justify-center">
              <Clock className="w-6 h-6 text-yellow-600" />
            </div>
          </div>
          <p className="text-slate-500 text-sm">Retards</p>
          <p className="text-3xl font-bold text-[#0a1929] mt-2">{totalLate}</p>
          <p className="text-slate-500 text-sm mt-2">Cette semaine</p>
        </div>

        <div className="bg-white rounded-xl p-6 shadow-lg">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 rounded-lg bg-red-100 flex items-center justify-center">
              <AlertCircle className="w-6 h-6 text-red-600" />
            </div>
          </div>
          <p className="text-slate-500 text-sm">Absences</p>
          <p className="text-3xl font-bold text-[#0a1929] mt-2">{totalAbsent}</p>
          <p className="text-slate-500 text-sm mt-2">Cette semaine</p>
        </div>
      </div>

      <div className="bg-white rounded-xl p-6 shadow-lg">
        <h3 className="text-lg font-semibold text-[#0a1929] mb-6">Présence de la Semaine</h3>
        <div className="grid grid-cols-5 gap-4">
          {weekData.map((day, index) => {
            const dayTotal = day.present + day.absent + day.late;
            const presentPercent = (day.present / dayTotal) * 100;
            const latePercent = (day.late / dayTotal) * 100;
            const absentPercent = (day.absent / dayTotal) * 100;

            return (
              <div key={index} className="text-center">
                <p className="text-sm font-medium text-slate-600 mb-3">{day.day}</p>
                <div className="h-48 bg-slate-100 rounded-lg overflow-hidden flex flex-col-reverse">
                  <div
                    className="bg-green-500 transition-all"
                    style={{ height: `${presentPercent}%` }}
                    title={`Présents: ${day.present}`}
                  ></div>
                  <div
                    className="bg-yellow-500 transition-all"
                    style={{ height: `${latePercent}%` }}
                    title={`Retards: ${day.late}`}
                  ></div>
                  <div
                    className="bg-red-500 transition-all"
                    style={{ height: `${absentPercent}%` }}
                    title={`Absents: ${day.absent}`}
                  ></div>
                </div>
                <div className="mt-3 space-y-1">
                  <div className="flex items-center justify-center gap-2 text-xs">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    <span className="text-slate-600">{day.present}</span>
                  </div>
                  <div className="flex items-center justify-center gap-2 text-xs">
                    <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
                    <span className="text-slate-600">{day.late}</span>
                  </div>
                  <div className="flex items-center justify-center gap-2 text-xs">
                    <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                    <span className="text-slate-600">{day.absent}</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="bg-white rounded-xl p-6 shadow-lg">
        <h3 className="text-lg font-semibold text-[#0a1929] mb-4">Absences Récentes</h3>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="px-6 py-4 text-left text-sm font-semibold text-slate-700">Étudiant</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-slate-700">Filière</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-slate-700">Date</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-slate-700">Raison</th>
                <th className="px-6 py-4 text-center text-sm font-semibold text-slate-700">Statut</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {recentAbsences.map((absence, index) => (
                <tr key={index} className="hover:bg-slate-50">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[var(--color-accent)] to-[var(--color-accent-soft)] flex items-center justify-center border border-[var(--color-border)] shadow-sm">
                        <span className="text-[var(--color-text)] font-semibold text-sm">
                          {absence.student.split(' ').map(n => n[0]).join('')}
                        </span>
                      </div>
                      <span className="font-medium text-[#0a1929]">{absence.student}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                      absence.track === 'Pilote' ? 'bg-blue-100 text-blue-700' :
                      absence.track === 'Steward' ? 'bg-yellow-100 text-yellow-700' :
                      'bg-green-100 text-green-700'
                    }`}>
                      {absence.track}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-slate-600">{absence.date}</td>
                  <td className="px-6 py-4 text-sm text-slate-600">{absence.reason}</td>
                  <td className="px-6 py-4 text-center">
                    {absence.justified ? (
                      <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-green-100 text-green-700">
                        Justifié
                      </span>
                    ) : (
                      <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-red-100 text-red-700">
                        Non justifié
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
