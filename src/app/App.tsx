import { useEffect, useState } from 'react';
import { SidebarV2 } from './components/SidebarV2';
import { Accueil } from './components/Accueil';
import { Students } from './components/Students';
import { StudentProfilePage } from './components/StudentProfilePage';
import {DocumentsV2} from './components/DocumentsV2';
import { Professeurs } from './components/Professeurs';
import { EmploiDuTemps } from './components/EmploiDuTemps';
import { Administration } from './components/Administration';
import { Matieres } from './components/Matieres';
import { Grades } from './components/Grades';
import { PV } from './components/Pv';
import { Agenda } from './components/Agenda';
import { ApiId } from './lib/api';

interface Student {
  id: number;
  name: string;
  track: 'Pilote' | 'Steward' | 'Mécanique';
  email: string;
  phone: string;
  enrollment: string;
  average: number;
  attendance: number;
  status: 'Active' | 'Inactive';
}

export default function App() {
  const [currentPage, setCurrentPage] = useState('accueil');
  const [selectedStudentId, setSelectedStudentId] = useState<ApiId | null>(null);
  useEffect(() => {
    // Always use the Morocco theme
    if (typeof document !== 'undefined') {
      document.documentElement.setAttribute('data-theme', 'morocco');
    }
  }, []);

  const handleNavigate = (page: string) => {
    setSelectedStudentId(null);
    setCurrentPage(page);
  };

  const renderPage = () => {
    switch (currentPage) {
      case 'accueil':
        return <Accueil />;
      case 'scolarite-students':
        return <Students onSelectStudent={setSelectedStudentId} />;
      case 'matieres':
        return <Matieres />;
      case 'grades':
        return <Grades />;
      case 'documents':
        return <DocumentsV2 />;
      case 'professeurs':
        return <Professeurs />;
      case 'emploi-du-temps':
        return <EmploiDuTemps />;
      case 'administration':
        return <Administration onNavigate={handleNavigate} />;
      case 'pv':
        return <PV />;
      case 'agenda':
        return <Agenda />;
      default:
        return <Accueil />;
    }
  };

  return (
    <div className="size-full flex bg-background">
      {/* Morocco theme only; theme switch removed */}

      <SidebarV2 currentPage={currentPage} onNavigate={handleNavigate} />

      <div className="flex-1 overflow-y-auto">
        {selectedStudentId !== null ? (
          <StudentProfilePage studentId={selectedStudentId} onBack={() => setSelectedStudentId(null)} onUpdateStudent={() => {}} />
        ) : (
          renderPage()
        )}
      </div>
    </div>
  );
}