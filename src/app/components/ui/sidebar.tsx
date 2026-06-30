import { useState } from 'react';
import { Home, Users, BookOpen, Calendar, Settings, FileText, GraduationCap } from 'lucide-react';

interface SidebarProps {
  currentPage: string;
  onNavigate: (page: string) => void;
}

export function Sidebar({ currentPage, onNavigate }: SidebarProps) {
  const [isHovered, setIsHovered] = useState<string | null>(null);

  const menuItems = [
    { id: 'accueil', label: 'Accueil', icon: Home },
    { id: 'scolarite-students', label: 'Étudiants', icon: GraduationCap },
    { id: 'documents', label: 'Documents', icon: FileText },
    { id: 'matieres', label: 'Matières', icon: BookOpen },
    { id: 'grades', label: 'Saisie des notes', icon: BookOpen },
    { id: 'professeurs', label: 'Professeurs', icon: Users },
    { id: 'emploi-du-temps', label: 'Emploi du Temps', icon: Calendar },
    { id: 'administration', label: 'Administration', icon: Settings },
  ];

  return (
    <aside 
      className="w-64 flex flex-col h-full shadow-lg border-r transition-all duration-300"
      style={{ 
        background: 'linear-gradient(180deg, var(--color-dark, #1a2e1e) 0%, var(--color-primary, #006233) 100%)',
        borderColor: 'rgba(255, 255, 255, 0.12)' 
      }}
    >
      {/* Brand Header */}
      <div className="p-5 border-b" style={{ borderColor: 'rgba(255, 255, 255, 0.12)' }}>
        <div className="flex items-center gap-3">
          <div 
            className="w-10 h-10 rounded-xl flex items-center justify-center shadow-md transition-transform duration-300 hover:scale-105"
            style={{ 
              background: 'linear-gradient(135deg, var(--yellow, #C1272D) 0%, #e85259 100%)',
              boxShadow: '0 4px 12px rgba(193, 39, 45, 0.25)'
            }}
          >
            <span className="text-white font-black text-base" style={{ fontFamily: 'Cinzel, serif', letterSpacing: '0.05em' }}>
              RM
            </span>
          </div>
          <div>
            <h2 className="text-white text-base font-bold tracking-wide" style={{ fontFamily: 'Cinzel, serif', letterSpacing: '0.05em' }}>
              REAL MADRID
            </h2>
            <p className="text-white/60 text-[10px] tracking-widest uppercase font-semibold" style={{ fontFamily: 'Manrope, sans-serif' }}>
              École de Football
            </p>
          </div>
        </div>
      </div>

      {/* Main Navigation */}
      <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
        {menuItems.map((item) => {
          const Icon = item.icon;
          const isActive = currentPage === item.id || currentPage.startsWith(item.id + '-');
          
          return (
            <button
              key={item.id}
              onClick={() => onNavigate(item.id)}
              onMouseEnter={() => setIsHovered(item.id)}
              onMouseLeave={() => setIsHovered(null)}
              className={`
                w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 relative group
                ${isActive ? 'text-white font-bold shadow-md' : 'text-white/70 hover:text-white'}
              `}
              style={isActive ? {
                background: 'linear-gradient(135deg, var(--yellow, #C1272D) 0%, #e85259 100%)',
                boxShadow: '0 6px 16px rgba(193, 39, 45, 0.25)',
              } : {
                backgroundColor: isHovered === item.id ? 'rgba(255, 255, 255, 0.08)' : 'transparent'
              }}
            >
              {/* Left active marker indicator */}
              <span 
                className={`absolute left-0 top-1/3 bottom-1/3 w-1 rounded-r-full bg-white transition-all duration-300
                  ${isActive ? 'scale-y-100 opacity-100' : 'scale-y-0 opacity-0 group-hover:scale-y-75 group-hover:opacity-50'}
                `}
              />

              <Icon 
                className={`w-5 h-5 transition-transform duration-200 
                  ${isActive ? 'scale-105' : 'group-hover:scale-105 opacity-80 group-hover:opacity-100'}
                `} 
              />
              
              <span 
                className="text-sm tracking-wide" 
                style={{ fontFamily: 'Manrope, sans-serif', fontWeight: isActive ? 700 : 500 }}
              >
                {item.label}
              </span>
            </button>
          );
        })}
      </nav>

      {/* Profile Footer Panel */}
      <div className="p-3 border-t" style={{ borderColor: 'rgba(255, 255, 255, 0.1)' }}>
        <div 
          className="rounded-xl p-3 flex items-center gap-3 transition-colors bg-white/5 border"
          style={{ borderColor: 'rgba(255, 255, 255, 0.1)' }}
        >
          <div 
            className="w-9 h-9 rounded-full flex items-center justify-center text-white text-xs font-black shadow-inner"
            style={{ background: 'linear-gradient(135deg, var(--yellow, #C1272D), #e85259)' }}
          >
            AD
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-white text-xs font-bold truncate" style={{ fontFamily: 'Manrope, sans-serif' }}>
              Administrateur
            </p>
            <div className="flex items-center gap-1.5 text-[10px] text-white/50 font-medium mt-0.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              <span>En ligne</span>
            </div>
          </div>
        </div>
      </div>
    </aside>
  );
}