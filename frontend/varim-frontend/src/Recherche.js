import React, { useState } from 'react';
import { Search, X } from 'lucide-react';
import './Recherche.css';

function Recherche({ musiques, allerVers }) {
  const [query, setQuery] = useState('');
  const [resultats, setResultats] = useState([]);
  const [ouvert, setOuvert] = useState(false);

  const handleRecherche = (e) => {
    const valeur = e.target.value;
    setQuery(valeur);

    if (valeur.length < 2) {
      setResultats([]);
      return;
    }

    const resultatsFiltrés = musiques.filter(m =>
      m.titre.toLowerCase().includes(valeur.toLowerCase()) ||
      m.nom_artiste.toLowerCase().includes(valeur.toLowerCase()) ||
      (m.genre && m.genre.toLowerCase().includes(valeur.toLowerCase()))
    );

    setResultats(resultatsFiltrés.slice(0, 6));
  };

  const effacer = () => {
    setQuery('');
    setResultats([]);
    setOuvert(false);
  };

  return (
    <div className="recherche-container">
      <div className="recherche-input-wrapper">
        <Search size={16} className="recherche-icone" />
        <input
          type="text"
          placeholder="Rechercher une musique, un artiste..."
          value={query}
          onChange={handleRecherche}
          onFocus={() => setOuvert(true)}
          className="recherche-input"
        />
        {query && (
          <button className="recherche-effacer" onClick={effacer}>
            <X size={16} />
          </button>
        )}
      </div>

      {ouvert && resultats.length > 0 && (
        <div className="recherche-resultats">
          {resultats.map(musique => (
            <div
              key={musique.id}
              className="recherche-item"
              onClick={() => {
                if (musique.type === 'album') {
                  allerVers('album_' + musique.id);
                } else {
                  allerVers('achat_' + musique.id);
                }
                effacer();
              }}
            >
              {musique.pochette_url ? (
                <img src={musique.pochette_url} alt={musique.titre} className="recherche-pochette" />
              ) : (
                <div className="recherche-pochette-defaut">♪</div>
              )}
              <div className="recherche-info">
                <span className="recherche-titre">{musique.titre}</span>
                <span className="recherche-artiste"
                  onClick={(e) => {
                    e.stopPropagation();
                    allerVers('profil_' + musique.artiste_id);
                    effacer();
                  }}
                >
                  {musique.nom_artiste}
                </span>
              </div>
              <span className="recherche-type">{musique.type}</span>
              <span className="recherche-prix">{musique.prix} FCFA</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default Recherche;