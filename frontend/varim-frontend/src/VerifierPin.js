import React, { useState, useRef, useEffect } from 'react';
import { Lock, AlertCircle, CheckCircle } from 'lucide-react';
import './VerifierPin.css';

function VerifierPin({ utilisateur, onSuccess, onCancel, titre }) {
  const [pin, setPin] = useState(['', '', '', '']);
  const [message, setMessage] = useState({ texte: '', type: '' });
  const [chargement, setChargement] = useState(false);
  const [tentatives, setTentatives] = useState(0);
  const inputsRef = useRef([]);

  useEffect(() => {
    inputsRef.current[0]?.focus();
  }, []);

  const handleChange = (index, valeur) => {
    if (!/^\d?$/.test(valeur)) return;
    const nouveau = [...pin];
    nouveau[index] = valeur;
    setPin(nouveau);
    if (valeur && index < 3) {
      inputsRef.current[index + 1]?.focus();
    }
    // Auto-valider quand les 4 chiffres sont saisis
    if (valeur && index === 3) {
      const pinComplet = [...nouveau].join('');
      if (pinComplet.length === 4) setTimeout(() => verifier(pinComplet), 100);
    }
  };

  const handleKeyDown = (index, e) => {
    if (e.key === 'Backspace' && !pin[index] && index > 0) {
      inputsRef.current[index - 1]?.focus();
    }
    if (e.key === 'Enter') {
      const pinComplet = pin.join('');
      if (pinComplet.length === 4) verifier(pinComplet);
    }
  };

  const verifier = async (pinCode) => {
    const code = pinCode || pin.join('');
    if (code.length !== 4) {
      setMessage({ texte: 'Entrez les 4 chiffres de votre PIN.', type: 'erreur' });
      return;
    }
    setChargement(true);
    setMessage({ texte: '', type: '' });
    try {
      const reponse = await fetch('/api/auth/verifier-pin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ utilisateur_id: utilisateur.id, pin: code })
      });
      if (reponse.ok) {
        setMessage({ texte: 'PIN correct !', type: 'succes' });
        setTimeout(() => onSuccess(), 400);
      } else {
        const nouvellesTentatives = tentatives + 1;
        setTentatives(nouvellesTentatives);
        setPin(['', '', '', '']);
        inputsRef.current[0]?.focus();
        if (nouvellesTentatives >= 3) {
          setMessage({ texte: 'Trop de tentatives incorrectes. Réessayez plus tard.', type: 'erreur' });
        } else {
          setMessage({ texte: `PIN incorrect. ${3 - nouvellesTentatives} tentative${3 - nouvellesTentatives > 1 ? 's' : ''} restante${3 - nouvellesTentatives > 1 ? 's' : ''}.`, type: 'erreur' });
        }
      }
    } catch {
      setMessage({ texte: 'Impossible de contacter le serveur.', type: 'erreur' });
    }
    setChargement(false);
  };

  const bloque = tentatives >= 3;

  return (
    <div className="vpin-overlay">
      <div className="vpin-modal">
        <div className="vpin-icone">
          <Lock size={28} />
        </div>

        <h2 className="vpin-titre">{titre || 'Vérification PIN'}</h2>
        <p className="vpin-sous-titre">Entrez votre code PIN à 4 chiffres pour continuer</p>

        {message.texte && (
          <div className={`vpin-message ${message.type}`}>
            {message.type === 'succes' ? <CheckCircle size={14} /> : <AlertCircle size={14} />}
            {message.texte}
          </div>
        )}

        {/* 4 cases PIN */}
        <div className="vpin-cases">
          {pin.map((chiffre, i) => (
            <input
              key={i}
              ref={el => inputsRef.current[i] = el}
              type="password"
              inputMode="numeric"
              maxLength={1}
              value={chiffre}
              onChange={e => handleChange(i, e.target.value)}
              onKeyDown={e => handleKeyDown(i, e)}
              className={`vpin-case ${chiffre ? 'remplie' : ''} ${bloque ? 'bloquee' : ''}`}
              disabled={bloque || chargement}
            />
          ))}
        </div>

        <button
          className="vpin-btn"
          onClick={() => verifier()}
          disabled={chargement || bloque || pin.join('').length !== 4}
        >
          {chargement ? 'Vérification...' : 'Confirmer'}
        </button>

        <button className="vpin-btn-annuler" onClick={onCancel}>
          Annuler
        </button>
      </div>
    </div>
  );
}

export default VerifierPin;