import React, { useState } from 'react';
import { Phone, Lock, AlertCircle, CheckCircle } from 'lucide-react';
import './Login.css';

function Login({ allerVers, setUtilisateur }) {
  const [telephone, setTelephone] = useState('');
  const [motDePasse, setMotDePasse] = useState('');
  const [message, setMessage] = useState({ texte: '', type: '' });
  const [chargement, setChargement] = useState(false);

  const handleConnexion = async () => {
    setChargement(true);
    setMessage({ texte: '', type: '' });
    try {
      const reponse = await fetch('http://localhost:5000/api/auth/connexion', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ telephone, mot_de_passe: motDePasse })
      });
      const donnees = await reponse.json();
      if (reponse.ok) {
        localStorage.setItem('token', donnees.token);
        localStorage.setItem('utilisateur', JSON.stringify(donnees.utilisateur));
        if (setUtilisateur) setUtilisateur(donnees.utilisateur);
        setMessage({ texte: donnees.message, type: 'succes' });
        setTimeout(() => allerVers('accueil'), 1000);
      } else {
        setMessage({ texte: donnees.message, type: 'erreur' });
      }
    } catch {
      setMessage({ texte: 'Impossible de contacter le serveur', type: 'erreur' });
    }
    setChargement(false);
  };

  const handleKeyDown = (e) => { if (e.key === 'Enter') handleConnexion(); };

  return (
    <div className="auth-page">
      <div className="auth-box">
        <div className="auth-logo" onClick={() => allerVers('accueil')}>
          <img src="/logo.png" alt="Varim Music" className="auth-logo-img" />
          <span>Varim Music</span>
        </div>

        <h2 className="auth-titre">Connexion</h2>
        <p className="auth-sous-titre">Entrez votre numéro de téléphone</p>

        {message.texte && (
          <div className={`auth-message ${message.type}`}>
            {message.type === 'succes' ? <CheckCircle size={14} /> : <AlertCircle size={14} />}
            {message.texte}
          </div>
        )}

        <div className="auth-champ">
          <label>Numéro de téléphone</label>
          <div className="auth-input-wrapper">
            <Phone size={15} className="auth-input-ic" />
            <input type="tel" placeholder="Ex: 06 123 45 67" value={telephone} onChange={e => setTelephone(e.target.value)} onKeyDown={handleKeyDown} />
          </div>
        </div>

        <div className="auth-champ">
          <label>Mot de passe</label>
          <div className="auth-input-wrapper">
            <Lock size={15} className="auth-input-ic" />
            <input type="password" placeholder="Votre mot de passe" value={motDePasse} onChange={e => setMotDePasse(e.target.value)} onKeyDown={handleKeyDown} />
          </div>
        </div>

        <button className="auth-btn" onClick={handleConnexion} disabled={chargement}>
          {chargement ? 'Connexion...' : 'Se connecter'}
        </button>

        <p className="auth-lien">
          Pas encore de compte ? <a href="#" onClick={() => allerVers('register')}>S'inscrire</a>
        </p>
      </div>
    </div>
  );
}

export default Login;