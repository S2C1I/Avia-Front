import { FileText, Download, Award, GraduationCap, Search, Calendar } from 'lucide-react';
import { useRef, useState, useEffect } from 'react';

import html2pdf from 'html2pdf.js';
import SchoolCertificate, { StudentData } from './SchoolCertificate';
import StudentTranscript, { ModuleData } from './StudentTranscript';
import { api, StudentRecord, normalizeApiId, GradeRecord, SubjectRecord } from '../lib/api';

const documentTypes = [
  {
    id: 'attestation',
    name: 'Attestation Scolaire',
    description: "Certificat officiel confirmant l'inscription d'un étudiant",
    icon: FileText,
    headerBg: '#0d1b2a',
    count: 45,
  },
  {
    id: 'certificat',
    name: 'Certificat de Réussite',
    description: "Document attestant la réussite d'un examen ou d'une formation",
    icon: Award,
    headerBg: '#006233',
    count: 12,
  },
  {
    id: 'releve',
    name: 'Relevé de Notes',
    description: 'Document officiel présentant les résultats académiques détaillés',
    icon: GraduationCap,
    headerBg: '#C1272D',
    count: 67,
  },
];

export function DocumentsV2() {
  const [selectedDocType, setSelectedDocType] = useState<string | null>(null);
  const [showGenerateModal, setShowGenerateModal] = useState(false);
  const [selectedStudentId, setSelectedStudentId] = useState<string>('');
  
  const [students, setStudents] = useState<StudentRecord[]>([]);
  const [grades, setGrades] = useState<GradeRecord[]>([]);
  const [subjects, setSubjects] = useState<SubjectRecord[]>([]);
  
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [issueDate, setIssueDate] = useState<string>('');
  const [comments, setComments] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState<string>('');

  const certificateContainerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const today = new Date();
    const YYYY = today.getFullYear();
    const MM = String(today.getMonth() + 1).padStart(2, '0');
    const DD = String(today.getDate()).padStart(2, '0');
    setIssueDate(`${YYYY}-${MM}-${DD}`);
  }, []);

  // Chargement centralisé des Étudiants, Notes et Matières
  useEffect(() => {
    let active = true;
    const fetchAllData = async () => {
      try {
        setIsLoading(true);
        setError(null);
        
        console.log("DocumentsV2 [API] : Chargement des données...");
        const [resStudents, resGrades, resSubjects] = await Promise.all([
          api.getStudents(),
          api.getGrades(),
          api.getSubjects()
        ]);
        
        console.log("DocumentsV2 [API] : Réponses reçues", { resStudents, resGrades, resSubjects });

        if (active) {
          // 1. Extraction des Étudiants
          let studentArray: StudentRecord[] = [];
          if (resStudents && Array.isArray(resStudents.data)) {
            studentArray = resStudents.data;
          } else if (Array.isArray(resStudents)) {
            studentArray = resStudents;
          }
          setStudents(studentArray);

          // 2. Extraction des Notes
          let gradeArray: GradeRecord[] = [];
          if (resGrades && Array.isArray(resGrades.data)) {
            gradeArray = resGrades.data;
          } else if (Array.isArray(resGrades)) {
            gradeArray = resGrades;
          }
          setGrades(gradeArray);

          // 3. Extraction des Matières
          let subjectArray: SubjectRecord[] = [];
          if (resSubjects && Array.isArray(resSubjects.data)) {
            subjectArray = resSubjects.data;
          } else if (Array.isArray(resSubjects)) {
            subjectArray = resSubjects;
          }
          setSubjects(subjectArray);

          if (studentArray.length > 0) {
            const firstId = normalizeApiId(studentArray[0].id || (studentArray[0] as any)._id);
            setSelectedStudentId(firstId);
          }
        }
      } catch (err) {
        console.error("DocumentsV2 [API] : Erreur lors du chargement général :", err);
        if (active) {
          setError(err instanceof Error ? err.message : 'Impossible de charger les données.');
        }
      } finally {
        if (active) {
          setIsLoading(false);
        }
      }
    };

    fetchAllData();
    return () => {
      active = false;
    };
  }, []);

  const handleGenerateClick = (docType: string) => {
    setSelectedDocType(docType);
    if (students.length > 0 && !selectedStudentId) {
      const initialId = normalizeApiId(students[0].id || (students[0] as any)._id);
      setSelectedStudentId(initialId);
    }
    setShowGenerateModal(true);
  };

  const formatDateFrench = (dateStr: string) => {
    if (!dateStr) return '';
    const parts = dateStr.split('-');
    if (parts.length === 3) {
      return `${parts[2]} / ${parts[1]} / ${parts[0]}`;
    }
    return dateStr;
  };

  const selectedStudent = students.find(s => {
    const sId = normalizeApiId(s.id || (s as any)._id);
    return sId === selectedStudentId;
  }) || students[0];

  let selectedStudentProfile: StudentData | undefined = undefined;
  let transcriptData: any = undefined;

  if (selectedStudent) {
    const parts = (selectedStudent.fullName || '').trim().split(/\s+/);
    const prenom = parts[0] || '';
    const nom = parts.slice(1).join(' ') || '';

    const programObj = selectedStudent.programId && typeof selectedStudent.programId === 'object'
      ? selectedStudent.programId as any
      : null;
    const programName = programObj?.name || selectedStudent.classGroup || 'Aviation de Ligne';
    const idStr = normalizeApiId(selectedStudent.id || (selectedStudent as any)._id);
    const formattedIssueDate = formatDateFrench(issueDate);

    // Profil de base pour l'Attestation Scolaire
    selectedStudentProfile = {
      nom: nom || selectedStudent.fullName || 'Nom',
      prenom: prenom || 'Prénom',
      dateNaissance: (selectedStudent as any).dateNaissance || '12 / 04 / 2005',
      lieuNaissance: (selectedStudent as any).lieuNaissance || 'Tanger',
      cinMassar: selectedStudent.cne || 'IK-' + idStr.slice(-6),
      nationalite: (selectedStudent as any).nationalite || 'Marocaine',
      niveauClasse: selectedStudent.yearLevel || 'Cycle Supérieur',
      sectionFiliere: programName,
      numInscription: 'IK-2026-' + idStr.slice(-4).toUpperCase(),
      objetAttestation: comments || "Constitution de dossier d'équivalence administrative.",
      dateEtablissement: formattedIssueDate,
      dateFaitA: formattedIssueDate
    };

    // Extraction filtrée pour l'étudiant sélectionné
    const studentGrades = grades.filter(g => normalizeApiId(g.studentId) === idStr);
    
    const formattedModules: ModuleData[] = studentGrades.map(grade => {
      const subjectMatch = subjects.find(s => normalizeApiId(s.id || (s as any)._id) === normalizeApiId(grade.subjectId));
      
      const targetGradeValue = (grade as any).exam ?? (grade as any).value;
      const noteNum = Number(targetGradeValue);
      
      // Gestion dynamique du statut de validation incluant isRetake
      let validationStatus = 'Non validé';
      if ((grade as any).isRetake === true) {
        validationStatus = 'Rattrapage';
      } else if (!isNaN(noteNum) && noteNum >= 10) {
        validationStatus = 'Validé';
      }

      return {
        name: subjectMatch ? (subjectMatch.name || (subjectMatch as any).title) : "Module Académique",
        code: subjectMatch ? (subjectMatch.id ? `MOD-${normalizeApiId(subjectMatch.id).slice(-3).toUpperCase()}` : "NAV101") : "NAV101",
        ects: 4, 
        note: !isNaN(noteNum) ? String(noteNum.toFixed(2)).replace('.', ',') : "0,00",
        status: validationStatus
      };
    });

    // Profil structuré pour le modèle StudentTranscript
    transcriptData = {
      nom: nom || selectedStudent.fullName || 'Nom',
      prenom: prenom || 'Prénom',
      matricule: selectedStudent.cne || 'IK-' + idStr.slice(-6),
      programme: programName + ' — ' + (selectedStudent.yearLevel || 'Cycle Supérieur'),
      dateEtablissement: formattedIssueDate,
      modules: formattedModules.length > 0 ? formattedModules : undefined
    };
  }

  const handleDownloadPDF = (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedStudentProfile) {
      alert("Veuillez sélectionner un étudiant valide.");
      return;
    }

    setShowGenerateModal(false);

    setTimeout(() => {
      const element = certificateContainerRef.current;
      if (!element) {
        alert("Erreur: Le document n'est pas prêt à être capturé.");
        return;
      }

      const labelDoc = selectedDocType === 'attestation' ? 'Attestation_Scolaire' : selectedDocType === 'releve' ? 'Releve_de_Notes' : 'Certificat_de_Reussite';
      const filename = `${labelDoc}_${selectedStudentProfile.nom.replace(/\s+/g, '_')}.pdf`;

      const options = {
        margin:       0,
        filename:     filename,
        image:        { type: 'jpeg', quality: 0.98 },
        html2canvas:  { 
          scale: 2, 
          useCORS: true, 
          logging: false,
          letterRendering: true
        },
        jsPDF:        { unit: 'mm', format: 'a4', orientation: 'portrait' }
      };

      html2pdf().set(options).from(element).save();
    }, 250);
  };

  const filteredStudents = students.filter(student => 
    student.fullName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    student.classGroup?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="p-8 space-y-6">
      <div>
        <h1 className="text-2xl text-[#0e1f12]" style={{ fontFamily: 'Georgia, serif', fontWeight: 700 }}>Documents Officiels</h1>
        <p className="text-slate-500 text-sm mt-1">Génération et téléchargement de documents certifiés</p>
      </div>

      {/* Cartes supérieures */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {documentTypes.map((docType) => {
          const Icon = docType.icon;
          return (
            <div
              key={docType.id}
              className="bg-white rounded-2xl shadow-sm border border-slate-200/80 overflow-hidden hover:shadow-md transition-all group"
            >
              <div style={{ background: docType.headerBg }} className="p-6 text-white relative overflow-hidden">
                <div className="absolute top-0 right-0 w-24 h-24 bg-white/5 rounded-full -mr-12 -mt-12"></div>
                <div className="relative">
                  <Icon className="w-10 h-10 mb-3 opacity-90" />
                  <h3 className="text-lg mb-1" style={{ fontFamily: 'Georgia, serif', fontWeight: 700 }}>{docType.name}</h3>
                  <p className="text-white/60 text-xs leading-relaxed">{docType.description}</p>
                </div>
              </div>
              <div className="p-5">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <p className="text-slate-400 text-xs uppercase tracking-wider font-semibold">Documents générés</p>
                    <p className="text-3xl text-[#0e1f12] mt-1" style={{ fontFamily: 'Georgia, serif', fontWeight: 700 }}>{docType.count}</p>
                  </div>
                  <div className="w-12 h-12 rounded-xl flex items-center justify-center bg-[#fdf5f5]">
                    <FileText className="w-6 h-6 text-slate-400" />
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => handleGenerateClick(docType.id)}
                  className="w-full py-2.5 text-white rounded-xl hover:opacity-90 transition-all flex items-center justify-center gap-2 text-sm font-semibold shadow-md cursor-pointer"
                  style={{ background: docType.headerBg }}
                >
                  <FileText className="w-4 h-4" />
                  Générer le document
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Modale */}
      {showGenerateModal && (
        <div className="fixed inset-0 bg-[#0d1b2a]/60 flex items-center justify-center z-50 backdrop-blur-sm" onClick={() => setShowGenerateModal(false)}>
          <div className="bg-white rounded-2xl p-8 max-w-2xl w-full mx-4 shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: '#0d1b2a' }}>
                <FileText className="w-5 h-5 text-white" />
              </div>
              <div>
                <h3 className="text-xl text-[#0e1f12]" style={{ fontFamily: 'Georgia, serif', fontWeight: 700 }}>
                  Générer {documentTypes.find(d => d.id === selectedDocType)?.name}
                </h3>
                <p className="text-slate-400 text-sm">Remplir les informations requises</p>
              </div>
            </div>
            
            <form className="space-y-4" onSubmit={handleDownloadPDF}>
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-2 uppercase tracking-wider">Sélectionner un étudiant</label>
                <select 
                  value={selectedStudentId}
                  onChange={(e) => setSelectedStudentId(e.target.value)}
                  required
                  className="w-full px-4 py-3 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#006233] text-[#0e1f12] text-sm bg-white"
                >
                  {students.length === 0 ? (
                    <option value="">Aucun étudiant disponible</option>
                  ) : (
                    students.map((student) => {
                      const idStr = normalizeApiId(student.id || (student as any)._id);
                      const progObj = student.programId && typeof student.programId === 'object' ? (student.programId as any) : null;
                      return (
                        <option 
                          key={idStr} 
                          value={idStr}
                        >
                          {student.fullName || 'Sans nom'} ({progObj?.name || student.classGroup || 'Aviation'})
                        </option>
                      );
                    })
                  )}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-2 uppercase tracking-wider">Date d'émission</label>
                <input
                  type="date"
                  className="w-full px-4 py-3 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#006233] text-[#0e1f12] text-sm"
                  value={issueDate}
                  onChange={(e) => setIssueDate(e.target.value)}
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-2 uppercase tracking-wider">Objet / Notes libres</label>
                <textarea
                  className="w-full px-4 py-3 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#006233] text-[#0e1f12] text-sm"
                  rows={3}
                  placeholder="Notes additionnelles..."
                  value={comments}
                  onChange={(e) => setComments(e.target.value)}
                ></textarea>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowGenerateModal(false)}
                  className="px-6 py-2.5 border border-slate-200 text-slate-600 rounded-lg hover:bg-slate-50 transition-all text-sm font-medium cursor-pointer"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 text-white rounded-lg transition-all flex items-center gap-2 text-sm font-semibold shadow-md cursor-pointer"
                  style={{ background: '#006233' }}
                >
                  <Download className="w-4 h-4" /> Confirmer & Imprimer
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Zone de rendu d'impression masquée */}
      <div style={{ position: 'absolute', top: '-9999px', left: '-9999px', overflow: 'hidden', width: '210mm' }}>
        <div ref={certificateContainerRef}>
          {selectedDocType === 'attestation' && selectedStudentProfile && (
            <SchoolCertificate studentData={selectedStudentProfile} />
          )}
          {selectedDocType === 'releve' && transcriptData && (
            <StudentTranscript studentData={transcriptData} />
          )}
          {selectedDocType === 'certificat' && selectedStudentProfile && (
            <div style={{ padding: '40px', textAlign: 'center', fontFamily: 'Manrope, sans-serif' }}>
              <h2 style={{ fontFamily: 'Cinzel, serif', fontSize: '24px', color: '#1a2e1e' }}>Certificat de Réussite Académique</h2>
              <p style={{ marginTop: '20px' }}>Décerné officiellement à {selectedStudentProfile.prenom} {selectedStudentProfile.nom}</p>
              <p style={{ fontSize: '14px', color: '#666' }}>Pour sa réussite au sein du programme {selectedStudentProfile.sectionFiliere}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}