import React, { useState, useEffect } from 'react';
import './PageIntrouvable.css';

function PageIntrouvable({ allerVers }) {
  const [compte, setCompte] = useState(10);

  useEffect(() => {
    if (compte <= 0) { allerVers('accueil'); return; }
    const t = setTimeout(() => setCompte(c => c - 1), 1000);
    return () => clearTimeout(t);
  }, [compte]);

  return (
    <div className="p404-page">
      {/* Particules */}
      <div className="p404-particules">
        {[...Array(12)].map((_, i) => (
          <div key={i} className={`p404-particule p404-p${i + 1}`} />
        ))}
      </div>

      {/* Logo */}
      <div className="p404-logo" onClick={() => allerVers('accueil')}>
        <img src="/logo.png" alt="Varim Music" />
        <span>Varim Music</span>
      </div>

      {/* Contenu central */}
      <div className="p404-centre">
        {/* Grand 404 avec dégradé */}
        <div className="p404-nombre">404</div>

        {/* Note de musique animée */}
        <div className="p404-note">♪</div>

        <h1 className="p404-titre">Cette page n'existe pas</h1>
        <p className="p404-texte">
          On dirait que cette page s'est perdue dans les notes de musique...
        </p>

        {/* Barre de progression compte à rebours */}
        <div className="p404-compte-wrapper">
          <p className="p404-compte-texte">
            Retour à l'accueil dans <span>{compte}s</span>
          </p>
          <div className="p404-barre">
            <div
              className="p404-barre-fill"
              style={{ width: `${(compte / 10) * 100}%` }}
            />
          </div>
        </div>

        {/* Boutons */}
        <div className="p404-btns">
          <button className="p404-btn-primary" onClick={() => allerVers('accueil')}>
            Retourner à l'accueil
          </button>
          <button className="p404-btn-secondary" onClick={() => allerVers('catalogue')}>
            Voir le catalogue
          </button>
        </div>
      </div>
    </div>
  );
}

export default PageIntrouvable;