import React, { useState, useEffect } from 'react';
import { Camera, Save, Eye, Settings, AlertCircle, CheckCircle, ChevronLeft } from 'lucide-react';
import NavMobile from './NavMobile';
import VerifierPin from './VerifierPin';
import './MonCompte.css';

function MonCompte({ allerVers, utilisateur, setUtilisateur, handleDeconnexion }) {
  const [nomArtiste, setNomArtiste] = useState('');
  const [bio, setBio] = useState('');
  const [photo, setPhoto] = useState(null);
  const [photoPreview, setPhotoPreview] = useState(null);
  const [numeroMtn, setNumeroMtn] = useState('');
  const [numeroAirtel, setNumeroAirtel] = useState('');
  const [message, setMessage] = useState({ texte: '', type: '' });
  const [chargement, setChargement] = useState(false);
  const [pinVerifie, setPinVerifie] = useState(false);

  useEffect(() => {
    if (utilisateur) {
      setNomArtiste(utilisateur.nom_artiste || utilisateur.prenom);
      setBio(utilisateur.bio || '');
      setPhotoPreview(utilisateur.photo_profil || null);
      setNumeroMtn(utilisateur.numero_mtn || '');
      setNumeroAirtel(utilisateur.numero_airtel || '');
    }
  }, [utilisateur]);

  const validerNumero = (numero, operateur) => {
    const propre = numero.replace(/\s/g, '').replace('+242', '');
    if (operateur === 'mtn' && !propre.startsWith('06')) return 'Le numéro MTN doit commencer par 06.';
    if (operateur === 'airtel' && !propre.startsWith('05') && !propre.startsWith('04')) return 'Le numéro Airtel doit commencer par 05 ou 04.';
    if (propre.length < 8 || propre.length > 9) return 'Numéro invalide (8 ou 9 chiffres après +242).';
    return null;
  };

  const handlePhoto = (e) => {
    const fichier = e.target.files[0];
    setPhoto(fichier);
    setPhotoPreview(URL.createObjectURL(fichier));
  };

  const handleSauvegarder = async () => {
    setMessage({ texte: '', type: '' });
    if (numeroMtn) { const err = validerNumero(numeroMtn, 'mtn'); if (err) { setMessage({ texte: err, type: 'erreur' }); return; } }
    if (numeroAirtel) { const err = validerNumero(numeroAirtel, 'airtel'); if (err) { setMessage({ texte: err, type: 'erreur' }); return; } }
    setChargement(true);
    try {
      const formData = new FormData();
      formData.append('utilisateur_id', utilisateur.id);
      formData.append('nom_artiste', nomArtiste);
      formData.append('bio', bio);
      formData.append('numero_mtn', numeroMtn);
      formData.append('numero_airtel', numeroAirtel);
      if (photo) formData.append('photo', photo);
      const reponse = await fetch('/api/profil/modifier', { method: 'PUT', body: formData });
      const donnees = await reponse.json();
      if (reponse.ok) {
        setMessage({ texte: 'Profil mis à jour avec succès !', type: 'succes' });
        const nouvelUtilisateur = { ...utilisateur, ...donnees.utilisateur };
        localStorage.setItem('utilisateur', JSON.stringify(nouvelUtilisateur));
        setUtilisateur(nouvelUtilisateur);
      } else {
        setMessage({ texte: donnees.message, type: 'erreur' });
      }
    } catch { setMessage({ texte: 'Impossible de contacter le serveur.', type: 'erreur' }); }
    setChargement(false);
  };

  if (!pinVerifie) {
    return <VerifierPin utilisateur={utilisateur} titre="Accès Mon Compte" onSuccess={() => setPinVerifie(true)} onCancel={() => allerVers('accueil')} />;
  }

  return (
    <div className="mc-page">
      <header className="mc-header">
        <div className="mc-header-logo" onClick={() => allerVers('accueil')}>
          <img src="/logo.png" alt="Varim Music" className="mc-logo-img" />
          <span>Varim Music</span>
        </div>
        <NavMobile utilisateur={utilisateur} allerVers={allerVers} handleDeconnexion={handleDeconnexion} />
      </header>

      <div className="mc-contenu">
        <button className="mc-retour" onClick={() => allerVers('dashboard')}>
          <ChevronLeft size={16} /> Dashboard
        </button>

        <div className="mc-titre-wrapper">
          <Settings size={20} className="mc-titre-ic" />
          <h1 className="mc-titre">Mon Compte</h1>
        </div>

        {/* PHOTO */}
        <div className="mc-photo-section">
          <div className="mc-photo-cercle">
            {photoPreview
              ? <img src={photoPreview} alt="Profil" />
              : <div className="mc-photo-initiale">{(utilisateur?.nom_artiste || utilisateur?.prenom)?.[0]?.toUpperCase()}</div>
            }
            <label className="mc-photo-overlay">
              <Camera size={20} />
              <input type="file" accept="image/*" onChange={handlePhoto} hidden />
            </label>
          </div>
          <div className="mc-photo-infos">
            <p className="mc-photo-nom">{utilisateur?.nom_artiste || utilisateur?.prenom}</p>
            <p className="mc-photo-tel">{utilisateur?.telephone}</p>
            <button className="mc-btn-voir-profil" onClick={() => allerVers('profil_' + utilisateur.id)}>
              <Eye size={13} /> Voir mon profil public
            </button>
          </div>
        </div>

        {/* MESSAGE */}
        {message.texte && (
          <div className={`mc-message ${message.type}`}>
            {message.type === 'succes' ? <CheckCircle size={14} /> : <AlertCircle size={14} />}
            {message.texte}
          </div>
        )}

        {/* FORMULAIRE */}
        <div className="mc-section">
          <h2 className="mc-section-titre">Informations artiste</h2>

          <div className="mc-champ">
            <label>Nom d'artiste</label>
            <input type="text" placeholder="Votre nom d'artiste" value={nomArtiste} onChange={e => setNomArtiste(e.target.value)} />
          </div>

          <div className="mc-champ">
            <label>Bio</label>
            <textarea placeholder="Parlez de vous à vos fans..." value={bio} onChange={e => setBio(e.target.value)} rows={3} />
          </div>
        </div>

        <div className="mc-section">
          <h2 className="mc-section-titre">Numéros Mobile Money</h2>
          <div className="mc-avertissement">
            <AlertCircle size={14} /> Ces numéros servent à recevoir vos gains. Vérifiez qu'ils sont corrects.
          </div>

          <div className="mc-champ">
            <label><span className="mc-op-badge mtn">MTN</span> Numéro MTN Mobile Money</label>
            <div className="mc-input-indicatif">
              <span className="mc-indicatif">+242</span>
              <input type="tel" placeholder="06XXXXXXX" value={numeroMtn} onChange={e => setNumeroMtn(e.target.value)} />
            </div>
            <span className="mc-aide">Commence par 06</span>
          </div>

          <div className="mc-champ">
            <label><span className="mc-op-badge airtel">Airtel</span> Numéro Airtel Money</label>
            <div className="mc-input-indicatif">
              <span className="mc-indicatif">+242</span>
              <input type="tel" placeholder="05XXXXXXX ou 04XXXXXXX" value={numeroAirtel} onChange={e => setNumeroAirtel(e.target.value)} />
            </div>
            <span className="mc-aide">Commence par 05 ou 04</span>
          </div>
        </div>

        <button className="mc-btn-sauvegarder" onClick={handleSauvegarder} disabled={chargement}>
          <Save size={16} /> {chargement ? 'Sauvegarde...' : 'Sauvegarder'}
        </button>
      </div>
    </div>
  );
}

export default MonCompte;