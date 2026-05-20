import React, { useState, useEffect } from 'react';
import { Heart, Music, Play, Pause, User, Disc, ChevronLeft, ShoppingCart } from 'lucide-react';
import NavMobile from './NavMobile';
import Lecteur from './Lecteur';
import './Favoris.css';

function Favoris({ allerVers, utilisateur, handleDeconnexion }) {
  const [favoris, setFavoris] = useState([]);
  const [chargement, setChargement] = useState(true);
  const [pisteActive, setPisteActive] = useState(null);
  const [playlist, setPlaylist] = useState([]);
  const [filtre, setFiltre] = useState('tous');

  useEffect(() => {
    if (!utilisateur) { allerVers('login'); return; }
    chargerFavoris();
  }, [utilisateur]);

  const chargerFavoris = () => {
    fetch('https://varim-music.onrender.com/api/favoris/${utilisateur.id}`)
      .then(res => res.json())
      .then(data => { setFavoris(data.favoris || []); setChargement(false); })
      .catch(() => setChargement(false));
  };

  const retirerFavori = async (favori) => {
    await fetch('https://varim-music.onrender.com/api/favoris', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        utilisateur_id: utilisateur.id,
        musique_id: favori.musique_id,
        piste_id: favori.piste_id || null
      })
    });
    setFavoris(prev => prev.filter(f => f.favori_id !== favori.favori_id));
    if (pisteActive?.id === (favori.piste_id || favori.musique_id)) {
      setPisteActive(null); setPlaylist([]);
    }
  };

  const jouer = (favori) => {
    const jouables = favorisFiltres.filter(f => f.fichier_url);
    setPlaylist(jouables.map(f => ({
      url: f.fichier_url,
      titre: f.titre,
      artiste: f.nom_artiste,
      pochette: f.pochette_url,
      id: f.piste_id || f.musique_id,
      estPisteAlbum: f.type === 'piste'
    })));
    setPisteActive({
      url: favori.fichier_url,
      titre: favori.titre,
      artiste: favori.nom_artiste,
      pochette: favori.pochette_url,
      id: favori.piste_id || favori.musique_id,
      estPisteAlbum: favori.type === 'piste'
    });
  };

  const favorisFiltres = favoris.filter(f => {
    if (filtre === 'tous') return true;
    if (filtre === 'singles') return f.type === 'single';
    if (filtre === 'albums') return f.type === 'album';
    if (filtre === 'pistes') return f.type === 'piste';
    return true;
  });

  const estEnLecture = (f) => pisteActive?.id === (f.piste_id || f.musique_id);

  return (
    <div className="fav-page">
      <header className="fav-header">
        <div className="fav-header-logo" onClick={() => allerVers('accueil')}>
          <img src="/logo.png" alt="Varim Music" className="fav-logo-img" />
          <span>Varim Music</span>
        </div>
        <NavMobile utilisateur={utilisateur} allerVers={allerVers} handleDeconnexion={handleDeconnexion} />
      </header>

      <div className="fav-contenu">
        {/* TITRE */}
        <div className="fav-titre-wrapper">
          <Heart size={20} className="fav-titre-ic" fill="#ff4d6d" />
          <div>
            <h1 className="fav-titre">Mes Favoris</h1>
            <p className="fav-sous-titre">{favoris.length} titre{favoris.length > 1 ? 's' : ''}</p>
          </div>
        </div>

        {/* FILTRES */}
        <div className="fav-filtres">
          {[
            { id: 'tous', label: 'Tous' },
            { id: 'singles', label: 'Singles' },
            { id: 'albums', label: 'Albums' },
            { id: 'pistes', label: 'Pistes' },
          ].map(f => (
            <button key={f.id} className={`fav-filtre-btn ${filtre === f.id ? 'actif' : ''}`} onClick={() => setFiltre(f.id)}>
              {f.label}
            </button>
          ))}
        </div>

        {chargement ? (
          <div className="fav-chargement">Chargement...</div>
        ) : favorisFiltres.length === 0 ? (
          <div className="fav-vide">
            <Heart size={52} className="fav-vide-ic" />
            <h2>{favoris.length === 0 ? 'Aucun favori' : 'Aucun résultat'}</h2>
            <p>{favoris.length === 0
              ? 'Appuyez sur le cœur dans le lecteur pour ajouter une musique à vos favoris.'
              : 'Essayez un autre filtre.'
            }</p>
            {favoris.length === 0 && (
              <button className="fav-btn-catalogue" onClick={() => allerVers('catalogue')}>
                Découvrir le catalogue
              </button>
            )}
          </div>
        ) : (
          <div className="fav-liste">
            {favorisFiltres.map(f => (
              <div key={f.favori_id} className={`fav-ligne ${estEnLecture(f) ? 'en-lecture' : ''}`}>
                {/* POCHETTE */}
                <div className="fav-pochette" onClick={() => f.fichier_url && jouer(f)}>
                  {f.pochette_url
                    ? <img src={f.pochette_url} alt={f.titre} />
                    : <div className="fav-pochette-vide">{f.type === 'album' ? <Disc size={20} /> : <Music size={20} />}</div>
                  }
                  {f.fichier_url && (
                    <div className="fav-play-overlay">
                      {estEnLecture(f) ? <Pause size={18} /> : <Play size={18} />}
                    </div>
                  )}
                </div>

                {/* INFOS */}
                <div className="fav-infos">
                  <p className="fav-info-titre">{f.titre}</p>
                  <p className="fav-info-artiste" onClick={() => allerVers('profil_' + f.artiste_id)}>
                    <User size={11} /> {f.nom_artiste}
                  </p>
                  {f.titre_album && (
                    <p className="fav-info-album"><Disc size={10} /> {f.titre_album}</p>
                  )}
                  <div className="fav-info-bas">
                    <span className={`fav-type-badge ${f.type}`}>{f.type}</span>
                    {f.prix && <span className="fav-prix">{f.prix} FCFA</span>}
                  </div>
                </div>

                {/* ACTIONS */}
                <div className="fav-actions">
                  {f.fichier_url && (
                    <button className={`fav-btn-play ${estEnLecture(f) ? 'actif' : ''}`} onClick={() => jouer(f)}>
                      {estEnLecture(f) ? <Pause size={16} /> : <Play size={16} />}
                    </button>
                  )}
                  {f.type !== 'piste' && (
                    <button className="fav-btn-acheter" onClick={() => allerVers('achat_' + f.musique_id)}>
                      <ShoppingCart size={14} />
                    </button>
                  )}
                  <button className="fav-btn-retirer" onClick={() => retirerFavori(f)}>
                    <Heart size={16} fill="#ff4d6d" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {pisteActive && (
        <Lecteur
          piste={pisteActive}
          playlist={playlist}
          onPisteChange={setPisteActive}
          onFermer={() => { setPisteActive(null); setPlaylist([]); }}
        />
      )}
    </div>
  );
}

export default Favoris;