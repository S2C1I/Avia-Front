import React from 'react';

// Définition de l'interface pour un module de cours
export interface ModuleData {
  name: string;
  code: string;
  ects: number;
  note: string;
  status: 'Validé' | 'Non validé' | string;
}

// Définition de l'interface pour les données de l'étudiant
export interface StudentTranscriptProps {
  studentData?: {
    nom: string;
    prenom: string;
    matricule: string;
    programme: string;
    dateEtablissement: string;
    modules?: ModuleData[];
  };
}

// forwardRef typé avec HTMLDivElement pour la capture par html2pdf
const StudentTranscript = React.forwardRef<HTMLDivElement, StudentTranscriptProps>(
  ({ studentData }, ref) => {
    // Valeurs par défaut si aucune donnée n'est transmise
    const data = studentData || {
      nom: "__________________________",
      prenom: "__________________________",
      matricule: "__________________________",
      programme: "__________________________",
      dateEtablissement: "__ / __ / ____",
      modules: []
    };

    // Liste des modules par défaut
    const modulesList: ModuleData[] = data.modules && data.modules.length > 0 ? data.modules : [
      { name: "Principes de Navigation Aérienne", code: "NAV101", ects: 6, note: "15,0", status: "Validé" },
      { name: "Météorologie pour l'Aviation", code: "MET102", ects: 4, note: "13,5", status: "Validé" },
      { name: "Systèmes Avioniques et Instrumentation", code: "AVS110", ects: 5, note: "11,0", status: "Non validé" },
      { name: "Réglementation Aérienne & Sécurité", code: "LAW120", ects: 3, note: "14,0", status: "Validé" },
      { name: "Physique du Vol", code: "PHY130", ects: 4, note: "12,0", status: "Validé" }
    ];

    // Calculs dynamiques typés
    const totalEctsSemestre = modulesList.reduce((acc: number, curr: ModuleData) => acc + (Number(curr.ects) || 0), 0);
    const totalEctsAcquis = modulesList.reduce((acc: number, curr: ModuleData) => curr.status === "Validé" ? acc + (Number(curr.ects) || 0) : acc, 0);
    const totalValidations = modulesList.filter((curr: ModuleData) => curr.status === "Validé").length;

    return (
      <>
        <style>{`
          :root {
            --blue:        #006233;
            --yellow:      #C1272D;
            --navy:        #1a2e1e;
            --white:       #FFFFFF;
            --bg-light:    #fdf5f5;
            --text-dark:   #0e1f12;
            --text-dark2:  #172618;
            --yellow-soft: rgba(193,39,45,.08);
            --blue-soft:   rgba(0,98,51,.08);
            --border:      rgba(0,98,51,.20);
          }

          .pdf-page-wrapper {
            background: var(--bg-light);
            font-family: 'Manrope', sans-serif;
            color: var(--text-dark);
            padding: 10px;
            display: flex;
            justify-content: center;
          }

          .page {
            width: 210mm;
            min-height: 297mm;
            background: var(--white);
            position: relative;
            overflow: hidden;
            display: flex;
            flex-direction: column;
            box-shadow: 0 4px 10px rgba(0,0,0,0.05);
          }

          .border-frame {
            position: absolute;
            inset: 10px;
            border: 2px solid var(--border);
            pointer-events: none;
            z-index: 5;
          }
          .border-frame::before {
            content: '';
            position: absolute;
            inset: 4px;
            border: 1px solid rgba(193,39,45,.30);
          }

          .top-bar { height: 6px; background: var(--blue); width: 100%; }

          .header {
            background: var(--navy);
            padding: 22px 48px 20px;
            display: flex;
            align-items: center;
            gap: 20px;
            position: relative;
            z-index: 10;
          }
          .logo-mark {
            flex-shrink: 0;
            width: 62px; height: 62px;
            background: var(--blue);
            border: 3px solid var(--yellow);
            display: flex;
            align-items: center;
            justify-content: center;
          }
          .logo-mark svg { width: 34px; height: 34px; }
          .header-text { flex: 1; }
          .school-name {
            font-family: 'Cinzel', serif;
            font-weight: 800;
            font-size: 16px;
            color: var(--white);
            letter-spacing: .06em;
            text-transform: uppercase;
          }
          .school-sub {
            font-size: 10.5px;
            font-weight: 500;
            color: rgba(255,255,255,.55);
            margin-top: 4px;
            letter-spacing: .03em;
          }
          .header-badge { text-align: right; }
          .badge-label {
            font-size: 8.5px;
            font-weight: 700;
            letter-spacing: .12em;
            text-transform: uppercase;
            color: var(--yellow);
          }
          .badge-num {
            font-family: 'Cinzel', serif;
            font-weight: 700;
            font-size: 12px;
            color: rgba(255,255,255,.65);
            margin-top: 2px;
          }

          .stripe { height: 4px; background: var(--yellow); position: relative; z-index: 10; }

          .hero {
            padding: 32px 52px 24px;
            text-align: center;
            display: flex;
            flex-direction: column;
            align-items: center;
            gap: 0;
            position: relative;
            z-index: 10;
          }

          .ornament-line {
            display: flex;
            align-items: center;
            gap: 12px;
            width: 100%;
            justify-content: center;
            margin-bottom: 18px;
          }
          .ornament-line .line {
            flex: 1;
            height: 1px;
            background: var(--border);
            max-width: 90px;
          }
          .ornament-line .diamond {
            width: 8px; height: 8px;
            background: var(--yellow);
            transform: rotate(45deg);
          }
          .ornament-line .diamond-sm {
            width: 5px; height: 5px;
            background: var(--blue);
            transform: rotate(45deg);
          }

          .seal {
            width: 88px; height: 88px;
            background: var(--navy);
            border: 4px solid var(--yellow);
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            margin-bottom: 22px;
            position: relative;
            clip-path: polygon(50% 0%, 61% 35%, 98% 35%, 68% 57%, 79% 91%, 50% 70%, 21% 91%, 32% 57%, 2% 35%, 39% 35%);
          }
          .seal svg { width: 36px; height: 36px; }

          .cert-eyebrow {
            font-family: 'Manrope', sans-serif;
            font-weight: 700;
            font-size: 9px;
            letter-spacing: .22em;
            text-transform: uppercase;
            color: var(--blue);
            margin-bottom: 8px;
          }

          .cert-title {
            font-family: 'Cinzel', serif;
            font-weight: 800;
            font-size: 28px;
            color: var(--navy);
            letter-spacing: .08em;
            text-transform: uppercase;
            line-height: 1.15;
            margin-bottom: 4px;
          }
          .cert-title-sub {
            font-family: 'Cinzel', serif;
            font-weight: 600;
            font-size: 13px;
            color: var(--blue);
            letter-spacing: .14em;
            text-transform: uppercase;
            margin-bottom: 22px;
          }

          .declaration {
            background: var(--bg-light);
            border-top: 3px solid var(--yellow);
            border-bottom: 3px solid var(--yellow);
            padding: 20px 52px;
            text-align: center;
            position: relative;
            z-index: 10;
          }
          .decl-intro {
            font-size: 11px;
            font-weight: 500;
            color: rgba(23,32,51,.60);
            letter-spacing: .06em;
            text-transform: uppercase;
            margin-bottom: 6px;
          }
          .decl-name {
            font-family: 'Cinzel', serif;
            font-weight: 800;
            font-size: 24px;
            color: var(--navy);
            letter-spacing: .06em;
            border-bottom: 2px solid var(--yellow);
            display: inline-block;
            padding-bottom: 4px;
            margin-bottom: 4px;
            text-transform: uppercase;
          }
          .decl-dob {
            font-size: 11px;
            font-weight: 500;
            color: rgba(23,32,51,.55);
          }

          .body {
            padding: 22px 52px 20px;
            display: flex;
            flex-direction: column;
            gap: 18px;
            flex: 1;
            position: relative;
            z-index: 10;
          }

          .para-text { font-size: 12px; font-weight: 500; line-height: 1.85; color: var(--text-dark2); text-align: justify; }

          .details-grid { display: grid; grid-template-columns: 1fr 1fr 1fr; border: 1.5px solid var(--border); background: var(--white); }
          .detail-cell { padding: 12px 16px; border-right: 1.5px solid var(--border); display: flex; flex-direction: column; gap: 4px; }
          .detail-cell:last-child { border-right: none; }
          .detail-label { font-size: 9px; font-weight: 700; color: var(--blue); text-transform: uppercase; }
          .detail-value { font-family: 'Cinzel', serif; font-weight: 700; font-size: 12px; color: var(--navy); margin-top: 2px; }
          .detail-sub { font-size: 10px; color: rgba(23,32,51,.50); margin-top: 2px; }

          .section-label { display: flex; align-items: center; gap: 10px; }
          .section-label .pip { width: 8px; height: 8px; background: var(--yellow); transform: rotate(45deg); }
          .section-label span { font-family: 'Cinzel', serif; font-weight: 700; color: var(--blue); text-transform: uppercase; font-size: 11px; }

          .transcript-table { width: 100%; border-collapse: collapse; margin-top: 4px; background: var(--white); }
          .transcript-table thead th { background: var(--navy); color: var(--white); padding: 9px 12px; font-weight: 700; font-size: 11px; text-align: left; }
          .transcript-table td { padding: 9px 12px; border-bottom: 1px solid var(--border); color: var(--text-dark2); font-size: 11.5px; }
          .transcript-table tbody tr:last-child td { border-bottom: 1.5px solid var(--navy); }
          .transcript-table tfoot td { padding: 10px 12px; font-weight: 700; font-size: 11px; color: var(--navy); background: rgba(0,98,51,.04); }
          .center { text-align: center; }

          .sig-row { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 16px; margin-top: 4px; }
          .sig-box { display: flex; flex-direction: column; gap: 4px; }
          .sig-title { font-size: 9px; font-weight: 700; color: var(--blue); text-transform: uppercase; letter-spacing: 0.04em; }
          .sig-area { height: 64px; border: 1.5px solid var(--border); background: var(--bg-light); position: relative; }
          .sig-name, .sig-date { font-size: 10px; color: var(--text-dark2); margin-top: 2px; }

          .divider { height: 1px; background: var(--border); margin-top: 4px; }

          .footer { background: var(--navy); padding: 14px 48px; display: flex; justify-content: space-between; color: var(--white); position: relative; z-index: 10; }
          .footer-left { font-size: 10px; color: rgba(255,255,255,.85); }
          .footer-right { font-family: 'Cinzel', serif; font-size: 10px; color: var(--yellow); font-weight: 700; }
        `}</style>

        <div className="pdf-page-wrapper">
          <div className="page" ref={ref}>
            <div className="border-frame"></div>
            <div className="top-bar"></div>

            <header className="header">
              <div className="logo-mark">
                <svg viewBox="0 0 36 36" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <rect x="6" y="5" width="15" height="20" rx="1" fill="none" stroke="#C1272D" strokeWidth="2"/>
                  <rect x="15" y="5" width="15" height="20" rx="1" fill="none" stroke="rgba(255,255,255,.5)" strokeWidth="2"/>
                  <line x1="9" y1="11" x2="18" y2="11" stroke="#C1272D" strokeWidth="1.5"/>
                  <line x1="9" y1="15" x2="18" y2="15" stroke="rgba(255,255,255,.4)" strokeWidth="1.5"/>
                  <line x1="9" y1="19" x2="14" y2="19" stroke="rgba(255,255,255,.4)" strokeWidth="1.5"/>
                  <circle cx="27" cy="27" r="5" fill="#C1272D"/>
                  <path d="M25.5 27.5 L26.8 28.8 L29 26" stroke="#1a2e1e" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </div>
              <div className="header-text">
                <div className="school-name">École Privée d'Études Supérieures d'Aviation</div>
                <div className="school-sub">Programme: Licence / Master Professionnel — Formation Pilote</div>
              </div>
              <div className="header-badge">
                <div className="badge-label">Réf. Document</div>
                <div className="badge-num">RN-2025-AV-{data.matricule ? data.matricule.split('-').pop() : "____"}</div>
              </div>
            </header>

            <div className="stripe"></div>

            <div className="hero">
              <div className="ornament-line">
                <div className="line"></div>
                <div className="diamond-sm"></div>
                <div className="diamond"></div>
                <div className="diamond-sm"></div>
                <div className="line"></div>
              </div>0

              <div className="cert-eyebrow">Relevé Officiel — École d'Aviation</div>
              <div className="cert-title">Relevé de Notes</div>
              <div className="cert-title-sub">Année Académique 2024–2025</div>

              <div className="ornament-line" style={{ marginBottom: 0, marginTop: '4px' }}>
                <div className="line"></div>
                <div className="diamond-sm"></div>
                <div className="diamond"></div>
                <div className="diamond-sm"></div>
                <div className="line"></div>
              </div>
            </div>

            <div className="declaration">
              <div className="decl-intro">Détails de l'étudiant</div>
              <div className="decl-name">{data.prenom} {data.nom}</div>
              <div className="decl-dob">Matricule: {data.matricule} &nbsp;·&nbsp; Programme: {data.programme}</div>
            </div>

            <main className="body">
              <p className="para-text">
                Le présent relevé contient les résultats des modules suivis durant le semestre indiqué. 
                Les modules sont exprimés en crédits ECTS et la colonne "Validation" précise si le module est 
                validé selon les règles pédagogiques de l'établissement.
              </p>

              <div className="section-label" style={{ marginTop: 0 }}>
                <div className="pip"></div>
                <span>Semestre 1 — Modules</span>
              </div>

              <table className="transcript-table">
                <thead>
                  <tr>
                    <th style={{ width: '46%' }}>Module</th>
                    <th style={{ width: '14%' }} className="center">Code</th>
                    <th style={{ width: '12%' }} className="center">ECTS</th>
                    <th style={{ width: '14%' }} className="center">Note</th>
                    <th style={{ width: '14%' }} className="center">Validation</th>
                  </tr>
                </thead>
                <tbody>
                  {modulesList.map((mod, index) => (
                    <tr key={index}>
                      <td>{mod.name}</td>
                      <td className="center">{mod.code}</td>
                      <td className="center">{mod.ects}</td>
                      <td className="center">{mod.note}</td>
                      <td className="center" style={{ 
                        fontWeight: '700', 
                        color: mod.status === "Validé" ? 'var(--blue)' : 'var(--yellow)' 
                      }}>{mod.status}</td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr>
                    <td colSpan={2}>Total ECTS semestre</td>
                    <td className="center">{totalEctsSemestre}</td>
                    <td colSpan={2}></td>
                  </tr>
                </tfoot>
              </table>

              <div className="details-grid" style={{ marginTop: '4px' }}>
                <div className="detail-cell">
                  <div className="detail-label">Programme</div>
                  <div className="detail-value" style={{ fontSize: '10.5px', fontFamily: 'sans-serif' }}>{data.programme}</div>
                  <div className="detail-sub">Niveau / Année 1</div>
                </div>
                <div className="detail-cell">
                  <div className="detail-label">ECTS acquis (ce semestre)</div>
                  <div className="detail-value">{totalEctsAcquis}</div>
                  <div className="detail-sub">Sur {totalEctsSemestre}</div>
                </div>
                <div className="detail-cell">
                  <div className="detail-label">Statut</div>
                  <div className="detail-value">Inscrit</div>
                  <div className="detail-sub">Validations: {totalValidations} / {modulesList.length}</div>
                </div>
              </div>

              <div className="divider"></div>

              <div>
                <div className="section-label" style={{ marginBottom: '10px' }}>
                  <div className="pip"></div>
                  <span>Authentification &amp; Signatures Officielles</span>
                </div>
                <div className="sig-row">
                  <div className="sig-box">
                    <div className="sig-title">Responsable Scolarité</div>
                    <div className="sig-area"></div>
                    <div className="sig-name">Nom : ___________________</div>
                    <div className="sig-date">Date : {data.dateEtablissement}</div>
                  </div>
                  <div className="sig-box">
                    <div className="sig-title">Chef Instructeur</div>
                    <div className="sig-area"></div>
                    <div className="sig-name">Nom : ___________________</div>
                    <div className="sig-date">Date : {data.dateEtablissement}</div>
                  </div>
                  <div className="sig-box">
                    <div className="sig-title">Cachet Officiel de l'Établissement</div>
                    <div className="sig-area" style={{ display: 'flex', alignItems: 'center', justifyCenter: 'center' } as React.CSSProperties}>
                      <span style={{ fontSize: '9px', color: 'rgba(23,32,51,.28)', fontStyle: 'italic', textAlign: 'center' }}>
                        Cachet<br/>de l'Établissement
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </main>

            <footer className="footer">
              <div className="footer-left">École Privée d'Études Supérieures d'Aviation &nbsp;·&nbsp; Tanger, Maroc</div>
              <div className="footer-right">Document émis le: {data.dateEtablissement}</div>
            </footer>
          </div>
        </div>
      </>
    );
  }
);

StudentTranscript.displayName = 'StudentTranscript';

export default StudentTranscript;