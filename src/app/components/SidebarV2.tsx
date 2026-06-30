import { Home, GraduationCap, FileText, Users, Calendar, Settings, ChevronRight, BookOpen, ClipboardList } from 'lucide-react';
import { useState } from 'react';

interface SidebarV2Props {
  currentPage: string;
  onNavigate: (page: string) => void;
}

export function SidebarV2({ currentPage, onNavigate }: SidebarV2Props) {
  const [expandedMenu, setExpandedMenu] = useState<string | null>('scolarite');

  const menuItems = [
    { id: 'accueil', label: 'Accueil', icon: Home, submenu: [] },
    {
      id: 'scolarite-students',
      label: 'Étudiants',
      icon: GraduationCap,
      submenu: []
    },
    { id: 'documents', label: 'Documents', icon: FileText, submenu: [] },
    { id: 'matieres', label: 'Matières', icon: BookOpen, submenu: [] },
    { id: 'grades', label: 'Saisie des notes', icon: ClipboardList, submenu: [] },
    { id: 'professeurs', label: 'Professeurs', icon: Users, submenu: [] },
    { id: 'emploi-du-temps', label: 'Emploi du Temps', icon: Calendar, submenu: [] },
    { id: 'administration', label: 'Administration', icon: Settings, submenu: [] },
    { id: 'agenda', label: 'Agenda', icon: Calendar, submenu: [] },
  ];

  const handleMenuClick = (item: typeof menuItems[0]) => {
    if (item.submenu.length > 0) {
      setExpandedMenu(expandedMenu === item.id ? null : item.id);
    } else {
      onNavigate(item.id);
    }
  };

  return (
    <aside className="w-72 flex flex-col h-full shadow-2xl" style={{ background: '#0d1b2a' }}>
      {/* Logo / Brand */}
      <div className="p-6 border-b border-white/10">
        <div className="flex items-center gap-3 mb-1">
          <div className="w-12 h-12 rounded-xl flex items-center justify-center shadow-lg overflow-hidden"
            style={{ background: 'linear-gradient(135deg, #006233 0%, #00844a 100%)' }}>
            <span className="text-white font-black text-lg tracking-wider" style={{ fontFamily: 'Georgia, serif' }}>AÉ</span>
          </div>
          <div>
            <h1 className="text-white text-lg tracking-widest uppercase" style={{ fontFamily: 'Georgia, serif', fontWeight: 700, letterSpacing: '0.12em' }}>
              Aviation École
            </h1>
            <p className="text-[#C1272D] text-xs tracking-widest uppercase font-medium" style={{ letterSpacing: '0.15em' }}>
              École Supérieure
            </p>
          </div>
        </div>
        <div className="mt-4 h-px bg-gradient-to-r from-transparent via-white/20 to-transparent" />
      </div>

      <nav className="flex-1 p-4 overflow-y-auto">
        <p className="text-white/30 text-xs tracking-widest uppercase font-semibold px-4 mb-3" style={{ letterSpacing: '0.18em' }}>Navigation</p>
        <ul className="space-y-1">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentPage === item.id || currentPage.startsWith(item.id + '-');
            const isExpanded = expandedMenu === item.id;
            const hasSubmenu = item.submenu.length > 0;

            return (
              <li key={item.id}>
                <button
                  onClick={() => handleMenuClick(item)}
                  className={`
                    w-full flex items-center justify-between px-4 py-3 rounded-xl transition-all duration-200
                    ${isActive
                      ? 'text-white shadow-lg'
                      : 'text-white/60 hover:text-white hover:bg-white/8'
                    }
                  `}
                  style={isActive ? { background: '#006233' } : {}}
                >
                  <div className="flex items-center gap-3">
                    <Icon className="w-5 h-5 flex-shrink-0" />
                    <span className="text-sm font-medium tracking-wide">{item.label}</span>
                  </div>
                  {hasSubmenu && (
                    <ChevronRight
                      className={`w-4 h-4 transition-transform duration-200 ${isExpanded ? 'rotate-90' : ''}`}
                    />
                  )}
                </button>

                {hasSubmenu && isExpanded && (
                  <ul className="mt-1 ml-4 space-y-1 border-l border-white/15 pl-4">
                    {item.submenu.map((subitem) => {
                      const isSubActive = currentPage === subitem.id;
                      return (
                        <li key={subitem.id}>
                          <button
                            onClick={() => onNavigate(subitem.id)}
                            className={`
                              w-full text-left px-4 py-2.5 rounded-lg transition-all text-sm
                              ${isSubActive
                                ? 'text-[#006233] font-semibold bg-white/10'
                                : 'text-white/50 hover:bg-white/8 hover:text-white/80'
                              }
                            `}
                          >
                            {subitem.label}
                          </button>
                        </li>
                      );
                    })}
                  </ul>
                )}
              </li>
            );
          })}
        </ul>
      </nav>

      <div className="px-6">
        <div className="h-px bg-gradient-to-r from-transparent via-white/15 to-transparent" />
      </div>

      <div className="p-4">
        <div className="rounded-xl p-4 border border-white/10 bg-white/5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full flex items-center justify-center shadow-md"
              style={{ background: '#006233' }}>
              <span className="text-white font-bold text-sm" style={{ fontFamily: 'Georgia, serif' }}>AD</span>
            </div>
            <div className="flex-1">
              <p className="text-white text-sm font-semibold tracking-wide">Administrateur</p>
              <p className="text-[#006233] text-xs font-medium">● En ligne</p>
            </div>
          </div>
        </div>
      </div>
    </aside>
  );
}