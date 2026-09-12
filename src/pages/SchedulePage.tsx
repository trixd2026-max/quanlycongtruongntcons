import { useApp } from '../contexts/AppContext';
import { CalendarClock } from 'lucide-react';

const SHIFTS = [
  { key: 'sang', label: 'Ca Sáng (06:00-14:00)' },
  { key: 'chieu', label: 'Ca Chiều (14:00-22:00)' },
  { key: 'dem', label: 'Ca Đêm (22:00-06:00)' },
];

export function SchedulePage() {
  const { project, selectedWeek, getWeekRange } = useApp();
  const weekRange = getWeekRange(selectedWeek);
  if (!project) return null;
  const shiftsToShow = SHIFTS.slice(0, project.shiftsPerDay);

  return (
    <div className="space-y-4">
      <div className="bg-white rounded-xl shadow-sm p-4">
        <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
          <CalendarClock className="text-primary" /> Nhật ký ca & Phân công
        </h2>
        <p className="text-sm text-gray-500 mt-1">Tuần {selectedWeek}: {weekRange.startDate} → {weekRange.endDate}</p>
      </div>
      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm border-collapse">
            <thead>
              <tr className="bg-primary text-white">
                <th className="px-3 py-3 text-left sticky left-0 bg-primary">Ca / Ngày</th>
                {weekRange.days.map(d => (
                  <th key={d.date} className="px-3 py-3 text-center min-w-[120px]">
                    <div>{d.label.split(' ')[0]}</div>
                    <div className="text-xs font-normal opacity-80">{d.date.slice(5)}</div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {shiftsToShow.map(shift => (
                <tr key={shift.key} className="border-t">
                  <td className="px-3 py-4 font-medium bg-gray-50 sticky left-0 border-r">{shift.label}</td>
                  {weekRange.days.map(d => (
                    <td key={d.date} className="px-2 py-2 border-l border-gray-100 align-top">
                      <div className="min-h-[60px] p-2 bg-blue-50 rounded text-xs text-gray-600">
                        <span className="text-gray-400 italic">Chưa phân công</span>
                      </div>
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
