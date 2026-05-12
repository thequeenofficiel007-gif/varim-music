import React, { useState } from 'react';
import { Phone, Lock, User, Headphones, Mic2, ShieldCheck, AlertCircle, CheckCircle } from 'lucide-react';
import './Login.css';
import './Register.css';

function Register({ allerVers }) {
  const [etape, setEtape] = useState(1);
  const [prenom, setPrenom] = useState('');
  const [telephone, setTelephone] = useState('');
  const [motDePasse, setMotDePasse] = useState('');
  const [confirmationMotDePasse, setConfirmationMotDePasse] = useState('');
  const [pin, setPin] = useState('');
  const [confirmationPin, setConfirmationPin] = useState('');
  const [role, setRole] = useState('acheteur');
  const [message, setMessage] = useState({ texte: '', type: '' });
  const [chargement, setChargement] = useState(false);

  const handleEtape1 = () => {
    setMessage({ texte: '', type: '' });
    if (!prenom || !telephone || !motDePasse || !confirmationMotDePasse) {
      setMessage({ texte: 'Remplissez tous les champs.', type: 'erreur' }); return;
    }
    if (motDePasse !== confirmationMotDePasse) {
      setMessage({ texte: 'Les mots de passe ne correspondent pas.', type: 'erreur' }); return;
    }
    if (motDePasse.length < 6) {
      setMessage({ texte: 'Le mot de passe doit contenir au moins 6 caractères.', type: 'erreur' }); return;
    }
    setEtape(2);
  };

  const handleEtape2 = () => {
    setMessage({ texte: '', type: '' });
    if (!/^\d{4}$/.test(pin)) {
      setMessage({ texte: 'Le PIN doit contenir exactement 4 chiffres.', type: 'erreur' }); return;
    }
    if (pin !== confirmationPin) {
      setMessage({ texte: 'Les codes PIN ne correspondent pas.', type: 'erreur' }); return;
    }
    handleInscription();
  };

  const handleInscription = async () => {
    setChargement(true);
    try {
      const reponse = await fetch('https://varim-music.onrender.com/api/auth/inscription', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prenom, telephone, mot_de_passe: motDePasse, confirmation_mot_de_passe: confirmationMotDePasse, pin, role })
      });
      const donnees = await reponse.json();
      if (reponse.ok) {
        setMessage({ texte: donnees.message, type: 'succes' });
        setTimeout(() => allerVers('login'), 2000);
      } else {
        setMessage({ texte: donnees.message, type: 'erreur' });
      }
    } catch {
      setMessage({ texte: 'Impossible de contacter le serveur', type: 'erreur' });
    }
    setChargement(false);
  };

  return (
    <div className="auth-page">
      <div className="auth-box">
        <div className="auth-logo" onClick={() => allerVers('accueil')}>
          <img src="/logo.png" alt="Varim Music" className="auth-logo-img" />
          <span>Varim Music</span>
        </div>

        {/* ÉTAPES */}
        <div className="reg-etapes">
          <div className={`reg-etape ${etape >= 1 ? 'active' : ''}`}>
            <span className="reg-etape-num">1</span>
            <span className="reg-etape-label">Infos</span>
          </div>
          <div className="reg-etape-trait" />
          <div className={`reg-etape ${etape >= 2 ? 'active' : ''}`}>
            <span className="reg-etape-num">2</span>
            <span className="reg-etape-label">PIN</span>
          </div>
        </div>

        {message.texte && (
          <div className={`auth-message ${message.type}`}>
            {message.type === 'succes' ? <CheckCircle size={14} /> : <AlertCircle size={14} />}
            {message.texte}
          </div>
        )}

        {etape === 1 && (
          <>
            <h2 className="auth-titre">Créer un compte</h2>
            <p className="auth-sous-titre">Rejoignez la communauté musicale africaine</p>

            <div className="auth-champ">
              <label>Prénom</label>
              <div className="auth-input-wrapper">
                <User size={15} className="auth-input-ic" />
                <input type="text" placeholder="Votre prénom" value={prenom} onChange={e => setPrenom(e.target.value)} />
              </div>
            </div>

            <div className="auth-champ">
              <label>Numéro de téléphone</label>
              <div className="auth-input-wrapper">
                <Phone size={15} className="auth-input-ic" />
                <input type="tel" placeholder="Ex: 06 123 45 67" value={telephone} onChange={e => setTelephone(e.target.value)} />
              </div>
            </div>

            <div className="auth-champ">
              <label>Je suis un</label>
              <div className="reg-roles">
                <div className={`reg-role-carte ${role === 'acheteur' ? 'active' : ''}`} onClick={() => setRole('acheteur')}>
                  <Headphones size={20} />
                  <span>Acheteur</span>
                  <small>J'achète de la musique</small>
                </div>
                <div className={`reg-role-carte ${role === 'artiste' ? 'active' : ''}`} onClick={() => setRole('artiste')}>
                  <Mic2 size={20} />
                  <span>Artiste</span>
                  <small>Je publie ma musique</small>
                </div>
              </div>
            </div>

            <div className="auth-champ">
              <label>Mot de passe</label>
              <div className="auth-input-wrapper">
                <Lock size={15} className="auth-input-ic" />
                <input type="password" placeholder="Minimum 6 caractères" value={motDePasse} onChange={e => setMotDePasse(e.target.value)} />
              </div>
            </div>

            <div className="auth-champ">
              <label>Confirmer le mot de passe</label>
              <div className="auth-input-wrapper">
                <Lock size={15} className="auth-input-ic" />
                <input type="password" placeholder="Répétez votre mot de passe" value={confirmationMotDePasse} onChange={e => setConfirmationMotDePasse(e.target.value)} />
              </div>
            </div>

            <button className="auth-btn" onClick={handleEtape1}>Continuer</button>
            <p className="auth-lien">Déjà un compte ? <a href="#" onClick={() => allerVers('login')}>Se connecter</a></p>
          </>
        )}

        {etape === 2 && (
          <>
            <h2 className="auth-titre">Code PIN secret</h2>
            <p className="auth-sous-titre">Ce code protège votre compte et vos gains</p>

            <div className="reg-pin-avertissement">
              <ShieldCheck size={16} />
              <p>Votre PIN est confidentiel. Il protège votre dashboard et vos retraits. Ne le communiquez à personne.</p>
            </div>

            <div className="auth-champ">
              <label>Code PIN (4 chiffres)</label>
              <div className="auth-input-wrapper">
                <Lock size={15} className="auth-input-ic" />
                <input type="password" placeholder="••••" maxLength={4} value={pin} onChange={e => setPin(e.target.value)} className="reg-pin-input" />
              </div>
            </div>

            <div className="auth-champ">
              <label>Confirmer le code PIN</label>
              <div className="auth-input-wrapper">
                <Lock size={15} className="auth-input-ic" />
                <input type="password" placeholder="••••" maxLength={4} value={confirmationPin} onChange={e => setConfirmationPin(e.target.value)} className="reg-pin-input" />
              </div>
            </div>

            <button className="auth-btn" onClick={handleEtape2} disabled={chargement}>
              {chargement ? 'Création en cours...' : 'Créer mon compte'}
            </button>
            <p className="auth-lien"><a href="#" onClick={() => setEtape(1)}>← Retour</a></p>
          </>
        )}
      </div>
    </div>
  );
}

export default Register;