import { Search, Bell, User } from 'lucide-react';

interface HeaderProps {
  title: string;
  searchQuery: string;
  onSearchChange: (query: string) => void;
}

export function Header({ title, searchQuery, onSearchChange }: HeaderProps) {
  return (
    <header className="bg-[#0f172a] border-b border-white/10 px-6 py-4">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-semibold text-white">{title}</h2>

        <div className="flex items-center gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder="Rechercher un étudiant..."
              className="pl-10 pr-4 py-2 bg-[#1e293b] border border-white/10 rounded-lg text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#d4af37] w-80"
            />
          </div>

          <button className="relative p-2 rounded-lg hover:bg-[#1e3a5f] transition-all">
            <Bell className="w-5 h-5 text-slate-300" />
            <span className="absolute top-1 right-1 w-2 h-2 bg-[#d4af37] rounded-full"></span>
          </button>

          <div className="flex items-center gap-3 pl-4 border-l border-white/10">
            <div className="text-right">
              <p className="text-sm font-medium text-white">Admin</p>
              <p className="text-xs text-slate-400">Administrateur</p>
            </div>
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[var(--color-accent)] to-[var(--color-accent-soft)] flex items-center justify-center border border-[var(--color-border)] shadow-sm">
              <User className="w-5 h-5 text-[var(--color-text)]" />
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
