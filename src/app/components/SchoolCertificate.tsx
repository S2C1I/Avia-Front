import React from 'react';

// 1. Define the TypeScript structure for your student object payload
export interface StudentData {
  nom: string;
  prenom: string;
  dateNaissance: string;
  lieuNaissance: string;
  cinMassar: string;
  nationalite: string;
  niveauClasse: string;
  sectionFiliere: string;
  numInscription: string;
  objetAttestation: string;
  dateEtablissement: string;
  dateFaitA: string;
}

// 2. Define the Component properties type mapping
interface SchoolCertificateProps {
  studentData?: StudentData;
}

// 3. Implement forwardRef with designated element targets (HTMLDivElement) and explicit types
const SchoolCertificate = React.forwardRef<HTMLDivElement, SchoolCertificateProps>(
  ({ studentData }, ref) => {
    
    // Default values fallback typed precisely to our interface structure
    const data: StudentData = studentData || {
      nom: "__________________________",
      prenom: "__________________________",
      dateNaissance: "__ / __ / ________",
      lieuNaissance: "__________________________",
      cinMassar: "__________________________",
      nationalite: "__________________________",
      niveauClasse: "__________________________",
      sectionFiliere: "__________________________",
      numInscription: "__________________________",
      objetAttestation: "__________________________________________________",
      dateEtablissement: "_______ / _______ / _________",
      dateFaitA: "_______________"
    };

    return (
      <>
        {/* Scope the styles tightly inside a style tag so it doesn't leak into the rest of your React app */}
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

          .corner-tl {
            position: absolute;
            top: 0; left: 0;
            width: 56px; height: 56px;
            background: var(--yellow);
            clip-path: polygon(0 0, 100% 0, 0 100%);
          }
          .corner-br {
            position: absolute;
            bottom: 0; right: 0;
            width: 56px; height: 56px;
            background: var(--navy);
            clip-path: polygon(100% 0, 100% 100%, 0 100%);
          }

          .top-bar {
            height: 6px;
            background: var(--blue);
            width: 100%;
          }

          .header {
            background: var(--navy);
            padding: 28px 40px 24px;
            display: flex;
            align-items: center;
            gap: 24px;
            position: relative;
          }

          .logo-mark {
            flex-shrink: 0;
            width: 68px;
            height: 68px;
            background: var(--blue);
            border: 3px solid var(--yellow);
            display: flex;
            align-items: center;
            justify-content: center;
          }
          .logo-mark svg { width: 36px; height: 36px; }

          .header-text { flex: 1; }
          .school-name {
            font-family: 'Cinzel', serif;
            font-weight: 800;
            font-size: 17px;
            color: var(--white);
            letter-spacing: .06em;
            text-transform: uppercase;
            line-height: 1.25;
          }
          .school-sub {
            font-family: 'Manrope', sans-serif;
            font-weight: 500;
            font-size: 11px;
            color: rgba(255,255,255,.60);
            margin-top: 4px;
            letter-spacing: .04em;
          }

          .header-badge { text-align: right; }
          .badge-label {
            font-size: 9px;
            font-weight: 700;
            letter-spacing: .12em;
            text-transform: uppercase;
            color: var(--yellow);
          }
          .badge-num {
            font-family: 'Cinzel', serif;
            font-weight: 700;
            font-size: 13px;
            color: rgba(255,255,255,.70);
            margin-top: 2px;
          }

          .stripe { height: 4px; background: var(--yellow); }

          .title-band {
            background: var(--bg-light);
            border-bottom: 1px solid var(--border);
            padding: 20px 40px 16px;
            text-align: center;
            position: relative;
          }
          .title-band::before, .title-band::after {
            content: '';
            display: block;
            width: 40px;
            height: 2px;
            background: var(--yellow);
            position: absolute;
            top: 50%;
            transform: translateY(-50%);
          }
          .title-band::before { left: 40px; }
          .title-band::after  { right: 40px; }

          .doc-title {
            font-family: 'Cinzel', serif;
            font-weight: 700;
            font-size: 22px;
            letter-spacing: .12em;
            text-transform: uppercase;
            color: var(--navy);
          }
          .doc-subtitle {
            font-size: 11px;
            color: var(--blue);
            margin-top: 4px;
            letter-spacing: .06em;
          }

          .body {
            flex: 1;
            padding: 32px 40px 28px;
            display: flex;
            flex-direction: column;
            gap: 22px;
          }

          .intro-block {
            background: var(--blue-soft);
            border-left: 4px solid var(--blue);
            padding: 14px 18px;
          }
          .intro-text {
            font-size: 12.5px;
            font-weight: 500;
            line-height: 1.75;
            color: var(--text-dark2);
          }
          .intro-text strong { color: var(--navy); font-weight: 800; }

          .section-label {
            display: flex;
            align-items: center;
            gap: 10px;
            margin-bottom: 10px;
          }
          .section-label .pip {
            width: 8px; height: 8px;
            background: var(--yellow);
            transform: rotate(45deg);
            flex-shrink: 0;
          }
          .section-label span {
            font-family: 'Cinzel', serif;
            font-weight: 700;
            font-size: 10px;
            letter-spacing: .14em;
            text-transform: uppercase;
            color: var(--blue);
          }

          .info-grid {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 10px 24px;
          }
          .info-field { display: flex; flex-direction: column; gap: 3px; }
          .field-label {
            font-size: 9px;
            font-weight: 700;
            letter-spacing: .14em;
            text-transform: uppercase;
            color: var(--blue);
          }
          .field-value {
            font-size: 13px;
            font-weight: 600;
            color: var(--text-dark);
            border-bottom: 1.5px solid var(--border);
            padding-bottom: 5px;
            min-height: 28px;
          }
          .field-value.accent { color: var(--navy); font-weight: 800; font-size: 14px; }
          .info-field.full { grid-column: 1 / -1; }

          .mention-block {
            background: var(--yellow-soft);
            border: 1.5px solid rgba(193,39,45,.35);
            padding: 16px 20px;
            display: flex;
            align-items: flex-start;
            gap: 14px;
          }
          .mention-icon {
            flex-shrink: 0;
            width: 32px; height: 32px;
            background: var(--yellow);
            display: flex;
            align-items: center;
            justify-content: center;
          }
          .mention-text { font-size: 11.5px; font-weight: 500; line-height: 1.7; color: var(--text-dark2); }
          .mention-text strong { font-weight: 800; color: var(--navy); }

          .divider { height: 1px; background: var(--border); }
          .validity { font-size: 10.5px; font-weight: 500; color: rgba(23,32,51,.55); font-style: italic; text-align: center; }

          .sig-row { display: grid; grid-template-columns: 1fr 1fr; gap: 24px; margin-top: 4px; }
          .sig-box { display: flex; flex-direction: column; gap: 4px; }
          .sig-title { font-size: 9px; font-weight: 700; letter-spacing: .14em; text-transform: uppercase; color: var(--blue); }
          .sig-area { border: 1.5px solid var(--border); height: 70px; background: var(--bg-light); position: relative; }
          .sig-area::after {
            content: 'Signature & Cachet';
            position: absolute;
            bottom: 6px; left: 0; right: 0;
            text-align: center; font-size: 9px;
            color: rgba(23,32,51,.30); font-style: italic;
          }
          .sig-date { font-size: 10.5px; font-weight: 500; color: var(--text-dark2); margin-top: 2px; }

          .stamp-area { display: flex; flex-direction: column; align-items: flex-end; gap: 4px; }
          .stamp-circle {
            width: 88px; height: 88px;
            border: 2px dashed var(--border);
            display: flex; align-items: center; justify-content: center;
            border-radius: 50%;
          }
          .stamp-circle span { font-size: 9px; color: rgba(23,32,51,.30); text-align: center; font-style: italic; }

          .footer { background: var(--navy); padding: 12px 40px; display: flex; align-items: center; justify-content: space-between; }
          .footer-left { font-size: 9px; font-weight: 500; color: rgba(255,255,255,.45); letter-spacing: .04em; }
          .footer-right { font-family: 'Cinzel', serif; font-size: 9px; font-weight: 600; color: var(--yellow); letter-spacing: .1em; }
        `}</style>

        <div className="pdf-page-wrapper">
          <div className="page" ref={ref}>
            <div className="corner-tl"></div>
            <div className="corner-br"></div>
            <div className="top-bar"></div>

            <header className="header">
              <div className="logo-mark">
                <svg viewBox="0 0 36 36" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <rect x="6" y="5" width="15" height="20" rx="1" fill="none" stroke="#C1272D" strokeWidth={2}/>
                  <rect x="15" y="5" width="15" height="20" rx="1" fill="none" stroke="rgba(255,255,255,.5)" strokeWidth={2}/>
                  <line x1="9" y1="11" x2="18" y2="11" stroke="#C1272D" strokeWidth={1.5}/>
                  <line x1="9" y1="15" x2="18" y2="15" stroke="rgba(255,255,255,.4)" strokeWidth={1.5}/>
                  <line x1="9" y1="19" x2="14" y2="19" stroke="rgba(255,255,255,.4)" strokeWidth={1.5}/>
                  <circle cx="27" cy="27" r="5" fill="#C1272D"/>
                  <path d="M25.5 27.5 L26.8 28.8 L29 26" stroke="#1a2e1e" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </div>

              <div className="header-text">
                <div className="school-name">Établissement Scolaire Ibn Khaldoun</div>
                <div className="school-sub">Académie Régionale d'Éducation et de Formation — Tanger-Tétouan-Al Hoceïma</div>
              </div>

              <div className="header-badge">
                <div className="badge-label">Réf. Document</div>
                <div className="badge-num">ATT-2025-____</div>
              </div>
            </header>

            <div className="stripe"></div>

            <div className="title-band">
              <div className="doc-title">Attestation Scolaire</div>
              <div className="doc-subtitle">Année Scolaire 2024 – 2025</div>
            </div>

            <main className="body">
              <div className="intro-block">
                <p className="intro-text">
                  Le soussigné, <strong>Directeur de l'Établissement Scolaire Ibn Khaldoun</strong>, certifie que l'élève
                  dont les informations figurent ci-dessous est régulièrement inscrit(e) et suit assidûment les cours
                  au sein de notre établissement pour l'année scolaire en cours.
                </p>
              </div>

              <div>
                <div className="section-label">
                  <div className="pip"></div>
                  <span>Informations de l'Élève</span>
                </div>

                <div className="info-grid">
                  <div className="info-field">
                    <div className="field-label">Nom</div>
                    <div className="field-value accent">{data.nom}</div>
                  </div>
                  <div className="info-field">
                    <div className="field-label">Prénom</div>
                    <div className="field-value accent">{data.prenom}</div>
                  </div>
                  <div className="info-field">
                    <div className="field-label">Date de Naissance</div>
                    <div className="field-value">{data.dateNaissance}</div>
                  </div>
                  <div className="info-field">
                    <div className="field-label">Lieu de Naissance</div>
                    <div className="field-value">{data.lieuNaissance}</div>
                  </div>
                  <div className="info-field">
                    <div className="field-label">CIN / MASSAR</div>
                    <div className="field-value">{data.cinMassar}</div>
                  </div>
                  <div className="info-field">
                    <div className="field-label">Nationalité</div>
                    <div className="field-value">{data.nationalite}</div>
                  </div>
                </div>
              </div>

              <div>
                <div className="section-label">
                  <div className="pip"></div>
                  <span>Informations de Scolarité</span>
                </div>

                <div className="info-grid">
                  <div className="info-field">
                    <div className="field-label">Niveau / Classe</div>
                    <div className="field-value accent">{data.niveauClasse}</div>
                  </div>
                  <div className="info-field">
                    <div className="field-label">Section / Filière</div>
                    <div className="field-value accent">{data.sectionFiliere}</div>
                  </div>
                  <div className="info-field">
                    <div className="field-label">N° d'Inscription</div>
                    <div className="field-value">{data.numInscription}</div>
                  </div>
                  <div className="info-field">
                    <div className="field-label">Établissement</div>
                    <div className="field-value">Ibn Khaldoun</div>
                  </div>
                  <div className="info-field full">
                    <div className="field-label">Objet de l'Attestation</div>
                    <div className="field-value" style={{ minHeight: '36px' }}>{data.objetAttestation}</div>
                  </div>
                </div>
              </div>

              <div className="mention-block">
                <div className="mention-icon">
                  <svg viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M8 1.5C4.41 1.5 1.5 4.41 1.5 8S4.41 14.5 8 14.5 14.5 11.59 14.5 8 11.59 1.5 8 1.5zm.75 10H7.25v-5.5h1.5v5.5zm0-7H7.25v-1.5h1.5v1.5z" fill="#1a2e1e"/>
                  </svg>
                </div>
                <p className="mention-text">
                  La présente attestation est délivrée à l'intéressé(e) pour servir et valoir ce que de droit.
                  Elle est établie sur sa demande et ne préjuge en rien des résultats scolaires.
                  <strong>Ce document est valable uniquement pour l'année scolaire 2024-2025.</strong>
                </p>
              </div>

              <div className="divider"></div>

              <p className="validity">
                Document établi le {data.dateEtablissement} &nbsp;|&nbsp; Valable jusqu'à la fin de l'année scolaire en cours
              </p>

              <div className="sig-row">
                <div className="sig-box">
                  <div className="sig-title">Le Directeur / La Directrice</div>
                  <div className="sig-area"></div>
                  <div className="sig-date">Fait à Tanger, le : {data.dateFaitA}</div>
                </div>

                <div className="stamp-area">
                  <div className="sig-title" style={{ alignSelf: 'flex-end' }}>Cachet Officiel</div>
                  <div className="stamp-circle"><span>Cachet<br/>de<br/>l'Établissement</span></div>
                </div>
              </div>
            </main>

            <footer className="footer">
              <div className="footer-left">
                Établissement Ibn Khaldoun &nbsp;·&nbsp; Tanger, Maroc &nbsp;·&nbsp; Tél : +212 5xx-xxxxxx
              </div>
              <div className="footer-right">Ministère de l'Éducation Nationale</div>
            </footer>
          </div>
        </div>
      </>
    );
  }
);

SchoolCertificate.displayName = 'SchoolCertificate';

export default SchoolCertificate;