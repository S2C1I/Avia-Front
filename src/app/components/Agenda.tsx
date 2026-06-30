import { Calendar, dateFnsLocalizer, Views } from 'react-big-calendar';
import { format, parse, startOfWeek, getDay, setHours, setMinutes } from 'date-fns';
import { fr } from 'date-fns/locale';
import 'react-big-calendar/lib/css/react-big-calendar.css';

// Localizer configuration
const locales = { 'fr': fr };
const localizer = dateFnsLocalizer({
  format,
  parse,
  startOfWeek,
  getDay,
  locales,
});

// Setting the min time to 8:00 AM and max time to 10:00 PM
const minTime = setMinutes(setHours(new Date(), 8), 0);
const maxTime = setMinutes(setHours(new Date(), 21), 0);

const myEventsList = [
  {
    title: 'Cours de Mathématiques',
    start: new Date(2026, 5, 11, 10, 0),
    end: new Date(2026, 5, 11, 12, 0),
  },
];

export function Agenda() {
  return (
    <div className="p-8" style={{ backgroundColor: '#fdf5f5', minHeight: '100vh' }}>
      <h1 className="text-2xl mb-6 text-[#0e1f12]" style={{ fontFamily: 'Georgia, serif', fontWeight: 700 }}>
        Agenda de la semaine
      </h1>
      
      <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-200">
        <Calendar
          localizer={localizer}
          events={myEventsList}
          defaultView={Views.WEEK}
          views={[Views.WEEK, Views.DAY]}
          style={{ height: 600 }}
          // Restrict hours here
          min={minTime}
          max={maxTime}
          // Styling consistent with your existing application
          eventPropGetter={() => ({
            style: {
              backgroundColor: '#006233',
              borderRadius: '8px',
              border: 'none',
            },
          })}
        />
      </div>
    </div>
  );
}