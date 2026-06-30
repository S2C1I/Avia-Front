import { useState } from 'react';
import { FileText, Users, ClipboardList, Loader, ExternalLink } from 'lucide-react';

export function Administration({ onNavigate }: { onNavigate?: (page: string) => void }) {
  const [isLoading, setIsLoading] = useState(false);

  const documents = [
    {
      id: 'registration',
      title: 'Formulaire d\'Inscription',
      description: 'Document officiel pour l\'inscription des étudiants',
      icon: FileText,
      gradient: 'linear-gradient(135deg, #1a2e1e 0%, #006233 100%)',
      iconColor: '#006233',
      iconBg: 'rgba(0, 98, 51, 0.10)',
      count: 0,
    },
    {
      id: 'certificate',
      title: 'Attestation de Travail',
      description: 'Certificat officiel attestant la participation d\'un étudiant',
      icon: Users,
      gradient: 'linear-gradient(135deg, #C1272D 0%, #e85259 100%)',
      iconColor: '#C1272D',
      iconBg: 'rgba(193, 39, 45, 0.10)',
      count: 0,
    },
    {
      id: 'pv',
      title: 'Procès-Verbal (PV)',
      description: 'Document officiel enregistrant les résultats d\'examens ou réunions',
      icon: ClipboardList,
      gradient: 'linear-gradient(135deg, #006233 0%, #1a8a50 100%)',
      iconColor: '#006233',
      iconBg: 'rgba(0, 98, 51, 0.10)',
      count: 0,
    },
  ];

  const handleCardClick = (docId: string) => {
    if (docId === 'pv' && onNavigate) {
      onNavigate('pv');
    }
  };

  const downloadPDF = async (docId: string) => {
    if (docId !== 'registration') return;

    setIsLoading(true);
    try {
      const response = await fetch('/formulaire-inscription.pdf');
      if (!response.ok) {
        throw new Error('Failed to download PDF');
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = 'formulaire-inscription-2025-2026.pdf';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error downloading PDF:', error);
      alert('Erreur: Impossible de télécharger le document');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="p-8 space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground mb-2">Documents Administratifs</h1>
        <p className="text-slate-600">Génération et téléchargement de documents officiels</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {documents.map((doc) => {
          const IconComponent = doc.icon;
          const isPV = doc.id === 'pv';
          return (
            <div
              key={doc.id}
              onClick={() => handleCardClick(doc.id)}
              className={`bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden hover:shadow-2xl transition-all cursor-pointer group ${isPV ? 'ring-2 ring-[#006233]/20 hover:ring-[#006233]/40' : ''}`}
            >
              {/* Card Header with Gradient */}
              <div className="p-8 text-white relative overflow-hidden" style={{ background: doc.gradient }}>
                <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16"></div>
                <div className="relative">
                  <IconComponent className="w-12 h-12 mb-4" />
                  <h3 className="text-2xl font-bold mb-2 flex items-center gap-2">
                    {doc.title}
                    {isPV && <ExternalLink className="w-5 h-5 opacity-70" />}
                  </h3>
                  <p className="text-white/80 text-sm">{doc.description}</p>
                </div>
              </div>

              {/* Card Body */}
              <div className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <p className="text-slate-600 text-sm">Documents générés</p>
                    <p className="text-2xl font-bold text-[#1e293b]">{doc.count}</p>
                  </div>
                  <div className="w-12 h-12 rounded-xl flex items-center justify-center" style={{ backgroundColor: doc.iconBg }}>
                    <FileText className="w-6 h-6" style={{ color: doc.iconColor }} />
                  </div>
                </div>

                {/* Button */}
                {isPV ? (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onNavigate?.('pv');
                    }}
                    className="w-full py-3 rounded-xl text-white hover:shadow-lg transition-all flex items-center justify-center gap-2 font-semibold"
                    style={{ background: 'linear-gradient(135deg, #006233 0%, #1a8a50 100%)' }}
                  >
                    <ClipboardList className="w-5 h-5" />
                    Ouvrir les Procès-Verbaux
                  </button>
                ) : (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      downloadPDF(doc.id);
                    }}
                    disabled={isLoading && doc.id === 'registration'}
                    className="w-full py-3 rounded-xl text-white hover:shadow-lg transition-all flex items-center justify-center gap-2 font-semibold disabled:opacity-50"
                    style={{ background: 'linear-gradient(135deg, #C1272D 0%, #e85259 100%)' }}
                  >
                    {isLoading && doc.id === 'registration' ? (
                      <>
                        <Loader className="w-5 h-5 animate-spin" />
                        Téléchargement...
                      </>
                    ) : (
                      <>
                        <FileText className="w-5 h-5" />
                        Générer le document
                      </>
                    )}
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
