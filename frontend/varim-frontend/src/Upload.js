import React, { useState } from 'react';
import { Music, Disc, Image, Plus, X, Upload as UploadIcon, CheckCircle, AlertCircle, ChevronLeft } from 'lucide-react';
import './Upload.css';

function Upload({ allerVers, utilisateur }) {
  const [titre, setTitre] = useState('');
  const [genre, setGenre] = useState('');
  const [type, setType] = useState('single');
  const [pochette, setPochette] = useState(null);
  const [pochettePreview, setPochettePreview] = useState(null);
  const [fichierSingle, setFichierSingle] = useState(null);
  const [pistes, setPistes] = useState([{ titre: '', fichier: null }]);
  const [message, setMessage] = useState({ texte: '', type: '' });
  const [chargement, setChargement] = useState(false);
  const [progression, setProgression] = useState(0);

  const handlePochette = (e) => {
    const f = e.target.files[0];
    if (f) { setPochette(f); setPochettePreview(URL.createObjectURL(f)); }
  };

  const ajouterPiste = () => { if (pistes.length < 15) setPistes([...pistes, { titre: '', fichier: null }]); };
  const supprimerPiste = (i) => setPistes(pistes.filter((_, idx) => idx !== i));
  const modifierPiste = (i, champ, val) => { const p = [...pistes]; p[i][champ] = val; setPistes(p); };

  const handleUpload = async () => {
    if (!titre) { setMessage({ texte: 'Entrez un titre.', type: 'erreur' }); return; }
    if (!genre) { setMessage({ texte: 'Choisissez un genre.', type: 'erreur' }); return; }
    if (type === 'single' && !fichierSingle) { setMessage({ texte: 'Ajoutez le fichier MP3.', type: 'erreur' }); return; }

    setChargement(true);
    setProgression(0);
    setMessage({ texte: '', type: '' });

    try {
      const formData = new FormData();
      formData.append('titre', titre);
      formData.append('genre', genre);
      formData.append('type', type);
      formData.append('artiste_id', utilisateur.id);
      if (pochette) formData.append('pochette', pochette);

      if (type === 'single') {
        formData.append('fichier', fichierSingle);
      } else {
        pistes.forEach((piste, i) => {
          if (piste.fichier) {
            formData.append(`piste_fichier_${i}`, piste.fichier);
            formData.append(`piste_titre_${i}`, piste.titre);
          }
        });
        formData.append('nombre_pistes', pistes.length);
      }

      // Upload avec XMLHttpRequest pour avoir la progression réelle
      await new Promise((resolve, reject) => {
        const xhr = new XMLHttpRequest();

        xhr.upload.onprogress = (e) => {
          if (e.lengthComputable) {
            // L'envoi vers le serveur = 70% max
            // Les 30% restants = traitement Cloudinary côté serveur
            const pct = Math.round((e.loaded / e.total) * 70);
            setProgression(pct);
          }
        };

        xhr.upload.onload = () => {
          // Fichiers bien reçus par le serveur, Cloudinary traite maintenant
          // Animation de pulsation entre 70% et 85%
          setProgression(75);
          let p = 75;
          const interval = setInterval(() => {
            p += 1;
            if (p <= 85) setProgression(p);
            else clearInterval(interval);
          }, 200);
        };

        xhr.onload = () => {
          try {
            const data = JSON.parse(xhr.responseText);
            if (xhr.status >= 200 && xhr.status < 300) {
              setProgression(100);
              setMessage({ texte: data.message, type: 'succes' });
              setTimeout(() => allerVers('dashboard'), 2000);
              resolve();
            } else {
              setMessage({ texte: data.message, type: 'erreur' });
              setChargement(false);
              reject();
            }
          } catch {
            setMessage({ texte: 'Erreur inattendue', type: 'erreur' });
            setChargement(false);
            reject();
          }
        };

        xhr.onerror = () => {
          setMessage({ texte: 'Impossible de contacter le serveur', type: 'erreur' });
          setChargement(false);
          reject();
        };

        xhr.open('POST', '/api/musiques/upload');
        xhr.send(formData);
      });

    } catch {}

    setChargement(false);
  };

  // Calcul du cercle SVG
  const rayon = 54;
  const circonf = 2 * Math.PI * rayon;
  const offset = circonf - (progression / 100) * circonf;

  return (
    <div className="upl-page">
      <div className="upl-box">
        <div className="upl-logo" onClick={() => allerVers('accueil')}>
          <img src="/logo.png" alt="Varim Music" className="upl-logo-img" />
          <span>Varim Music</span>
        </div>

        <button className="upl-retour" onClick={() => allerVers('dashboard')}>
          <ChevronLeft size={15} /> Dashboard
        </button>

        <h2 className="upl-titre">Publier ma musique</h2>

        {message.texte && (
          <div className={`upl-message ${message.type}`}>
            {message.type === 'succes' ? <CheckCircle size={14} /> : <AlertCircle size={14} />}
            {message.texte}
          </div>
        )}

        {/* CHARGEMENT CIRCULAIRE */}
        {chargement && (
          <div className="upl-progress-wrapper">
            <svg className={`upl-progress-svg ${progression >= 70 && progression < 100 ? 'en-attente' : ''}`} viewBox="0 0 120 120">
              <circle cx="60" cy="60" r={rayon} fill="none" stroke="#1e2a4a" strokeWidth="8" />
              <circle
                cx="60" cy="60" r={rayon}
                fill="none" stroke="#4f9cf9" strokeWidth="8"
                strokeLinecap="round"
                strokeDasharray={circonf}
                strokeDashoffset={offset}
                transform="rotate(-90 60 60)"
                style={{ transition: 'stroke-dashoffset 0.3s ease' }}
              />
            </svg>
            <div className="upl-progress-pct">{progression}%</div>
        <p className="upl-progress-label">
          {progression < 70 ? 'Envoi des fichiers...' : progression < 100 ? 'Traitement sur le serveur...' : 'Publication réussie !'}
        </p>
          </div>
        )}

        {!chargement && (
          <>
            {/* TYPE */}
            <div className="upl-champ">
              <label>Type de publication</label>
              <div className="upl-types">
                <div className={`upl-type-carte ${type === 'single' ? 'active' : ''}`} onClick={() => setType('single')}>
                  <Music size={20} />
                  <span>Single</span>
                  <small>500 FCFA</small>
                </div>
                <div className={`upl-type-carte ${type === 'album' ? 'active' : ''}`} onClick={() => setType('album')}>
                  <Disc size={20} />
                  <span>Album</span>
                  <small>5 000 FCFA</small>
                </div>
              </div>
            </div>

            {/* TITRE */}
            <div className="upl-champ">
              <label>Titre</label>
              <input type="text" placeholder="Titre de votre musique" value={titre} onChange={e => setTitre(e.target.value)} className="upl-input" />
            </div>

            {/* GENRE */}
            <div className="upl-champ">
              <label>Genre</label>
              <select value={genre} onChange={e => setGenre(e.target.value)} className="upl-input">
                <option value="">Choisir un genre</option>
                {['Afrobeat','Coupé-Décalé','Ndombolo','Afropop','Hip-Hop Africain','Gospel','Zouk','Bikutsi','Rumba Congolaise','Autre'].map(g => (
                  <option key={g} value={g}>{g}</option>
                ))}
              </select>
            </div>

            {/* POCHETTE */}
            <div className="upl-champ">
              <label>Pochette</label>
              <label className="upl-fichier-label">
                {pochettePreview
                  ? <img src={pochettePreview} alt="Pochette" className="upl-pochette-preview" />
                  : <><Image size={22} /><span>Choisir une image</span></>
                }
                <input type="file" accept="image/*" onChange={handlePochette} hidden />
              </label>
              {pochette && <p className="upl-nom-fichier">{pochette.name}</p>}
            </div>

            {/* FICHIER SINGLE */}
            {type === 'single' && (
              <div className="upl-champ">
                <label>Fichier MP3</label>
                <label className="upl-fichier-label">
                  <Music size={22} />
                  <span>{fichierSingle ? fichierSingle.name : 'Choisir un fichier audio'}</span>
                  <input type="file" accept="audio/*" onChange={e => setFichierSingle(e.target.files[0])} hidden />
                </label>
              </div>
            )}

            {/* PISTES ALBUM */}
            {type === 'album' && (
              <div className="upl-champ">
                <label>Pistes de l'album ({pistes.length}/15)</label>
                <div className="upl-pistes">
                  {pistes.map((piste, i) => (
                    <div key={i} className="upl-piste">
                      <span className="upl-piste-num">{i + 1}</span>
                      <div className="upl-piste-droite">
                        <input
                          type="text"
                          placeholder={`Titre piste ${i + 1}`}
                          value={piste.titre}
                          onChange={e => modifierPiste(i, 'titre', e.target.value)}
                          className="upl-input upl-piste-titre"
                        />
                        <label className="upl-piste-fichier-label">
                          <Music size={13} />
                          <span>{piste.fichier ? piste.fichier.name : 'Audio'}</span>
                          <input type="file" accept="audio/*" onChange={e => modifierPiste(i, 'fichier', e.target.files[0])} hidden />
                        </label>
                      </div>
                      {pistes.length > 1 && (
                        <button className="upl-piste-suppr" onClick={() => supprimerPiste(i)}><X size={14} /></button>
                      )}
                    </div>
                  ))}
                  {pistes.length < 15 && (
                    <button className="upl-btn-ajouter" onClick={ajouterPiste}>
                      <Plus size={15} /> Ajouter une piste
                    </button>
                  )}
                </div>
              </div>
            )}

            <button className="upl-btn" onClick={handleUpload}>
              <UploadIcon size={16} /> Publier ma musique
            </button>
          </>
        )}
      </div>
    </div>
  );
}

export default Upload;