import React, { useState, useEffect } from 'react';
import { Play, Pause, Search, X, Music, Disc, BookOpen, ChevronDown, ChevronUp, User } from 'lucide-react';
import NavMobile from './NavMobile';
import Lecteur from './Lecteur';
import './Bibliotheque.css';

function Bibliotheque({ allerVers, utilisateur, handleDeconnexion }) {
  const [achats, setAchats] = useState([]);
  const [chargement, setChargement] = useState(true);
  const [pisteActive, setPisteActive] = useState(null);
  const [playlist, setPlaylist] = useState([]);
  const [pistesAlbum, setPistesAlbum] = useState({});
  const [filtre, setFiltre] = useState('tous');
  const [recherche, setRecherche] = useState('');

  useEffect(() => {
    if (!utilisateur) { allerVers('login'); return; }
    fetch(`https://varim-music.onrender.com/api/achats/mes-achats/${utilisateur.id}`)
      .then(res => res.json())
      .then(data => { setAchats(data.achats); setChargement(false); })
      .catch(() => setChargement(false));
  }, [utilisateur]);

  const achatsFiltres = achats.filter(a => {
    const matchFiltre = filtre === 'tous' || a.type === filtre;
    const matchRecherche = a.titre.toLowerCase().includes(recherche.toLowerCase()) ||
      a.nom_artiste.toLowerCase().includes(recherche.toLowerCase());
    return matchFiltre && matchRecherche;
  });

  const jouerSingle = (achat) => {
    const singles = achatsFiltres.filter(a => a.type === 'single' && a.fichier_url);
    setPlaylist(singles.map(a => ({
      url: a.fichier_url,
      titre: a.titre,
      artiste: a.nom_artiste,
      pochette: a.pochette_url,
      id: a.musique_id,
      musiqueId: a.musique_id,
      estPisteAlbum: false
    })));
    setPisteActive({
      url: achat.fichier_url,
      titre: achat.titre,
      artiste: achat.nom_artiste,
      pochette: achat.pochette_url,
      id: achat.musique_id,
      musiqueId: achat.musique_id,
      estPisteAlbum: false
    });
  };

  const togglePistesAlbum = async (musiqueId) => {
    if (pistesAlbum[musiqueId]) { setPistesAlbum(prev => ({ ...prev, [musiqueId]: null })); return; }
    const res = await fetch(`https://varim-music.onrender.com/api/musiques/${musiqueId}/pistes?utilisateur_id=${utilisateur?.id}`);
    const data = await res.json();
    setPistesAlbum(prev => ({ ...prev, [musiqueId]: data.pistes }));
  };

  const jouerPiste = (piste, toutes, achat) => {
    setPlaylist(toutes.map(p => ({
      url: p.fichier_url,
      titre: p.titre,
      artiste: achat?.nom_artiste || '',
      pochette: achat?.pochette_url || null,
      id: p.id,
      musiqueId: achat?.musique_id,
      estPisteAlbum: true
    })));
    setPisteActive({
      url: piste.fichier_url,
      titre: piste.titre,
      artiste: achat?.nom_artiste || '',
      pochette: achat?.pochette_url || null,
      id: piste.id,
      musiqueId: achat?.musique_id,
      estPisteAlbum: true
    });
  };

  return (
    <div className="bib-page">
      <header className="bib-header">
        <div className="bib-header-logo" onClick={() => allerVers('accueil')}>
          <img src="/logo.png" alt="Varim Music" className="bib-logo-img" />
          <span>Varim Music</span>
        </div>
        <NavMobile utilisateur={utilisateur} allerVers={allerVers} handleDeconnexion={handleDeconnexion} />
      </header>

      <div className="bib-contenu">
        <div className="bib-titre-wrapper">
          <BookOpen size={20} className="bib-titre-ic" />
          <h1 className="bib-titre">Ma Bibliothèque</h1>
        </div>

        {/* RECHERCHE */}
        <div className="bib-recherche">
          <Search size={15} className="bib-recherche-ic" />
          <input type="text" placeholder="Rechercher dans ma bibliothèque..." value={recherche} onChange={e => setRecherche(e.target.value)} />
          {recherche && <button className="bib-effacer" onClick={() => setRecherche('')}><X size={14} /></button>}
        </div>

        {/* FILTRES */}
        <div className="bib-filtres">
          {['tous', 'single', 'album'].map(f => (
            <button key={f} className={`bib-filtre-btn ${filtre === f ? 'actif' : ''}`} onClick={() => setFiltre(f)}>
              {f === 'tous' ? 'Tous' : f === 'single' ? 'Singles' : 'Albums'}
            </button>
          ))}
        </div>

        {chargement ? (
          <div className="bib-chargement">Chargement...</div>
        ) : achatsFiltres.length === 0 ? (
          <div className="bib-vide">
            <BookOpen size={48} className="bib-vide-ic" />
            <p>{recherche ? 'Aucun résultat.' : 'Votre bibliothèque est vide.'}</p>
            {!recherche && <button className="bib-btn-catalogue" onClick={() => allerVers('catalogue')}>Découvrir le catalogue</button>}
          </div>
        ) : (
          <div className="bib-liste">
            {achatsFiltres.map(achat => (
              <div key={achat.id} className="bib-carte">
                <div className="bib-carte-main">
                  {/* POCHETTE */}
                  <div className="bib-pochette" onClick={() => achat.type === 'single' ? jouerSingle(achat) : togglePistesAlbum(achat.musique_id)}>
                    {achat.pochette_url
                      ? <img src={achat.pochette_url} alt={achat.titre} />
                      : <div className="bib-pochette-vide">{achat.type === 'album' ? <Disc size={22} /> : <Music size={22} />}</div>
                    }
                    {achat.type === 'single' && (
                      <div className="bib-play-overlay">
                        {pisteActive?.id === achat.id ? <Pause size={20} /> : <Play size={20} />}
                      </div>
                    )}
                    <span className="bib-type-badge">{achat.type}</span>
                  </div>

                  {/* INFOS */}
                  <div className="bib-infos">
                    <p className="bib-info-titre">{achat.titre}</p>
                    <p className="bib-info-artiste" onClick={() => allerVers('profil_' + achat.artiste_id)}>
                      <User size={11} /> {achat.nom_artiste}
                    </p>
                  </div>

                  {/* ACTION */}
                  <div className="bib-action">
                    {achat.type === 'single' ? (
                      <button className={`bib-btn-jouer ${pisteActive?.id === achat.id ? 'actif' : ''}`} onClick={() => jouerSingle(achat)}>
                        {pisteActive?.id === achat.id ? <Pause size={16} /> : <Play size={16} />}
                      </button>
                    ) : (
                      <button className="bib-btn-album" onClick={() => togglePistesAlbum(achat.musique_id)}>
                        {pistesAlbum[achat.musique_id] ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                      </button>
                    )}
                  </div>
                </div>

                {/* PISTES ALBUM */}
                {achat.type === 'album' && pistesAlbum[achat.musique_id] && (
                  <div className="bib-pistes">
                    {pistesAlbum[achat.musique_id].map(piste => (
                      <div key={piste.id} className={`bib-piste-ligne ${pisteActive?.id === piste.id ? 'en-lecture' : ''}`}>
                        <span className="bib-piste-num">{piste.numero_ordre}</span>
                        <span className="bib-piste-titre">{piste.titre}</span>
                        <button className="bib-btn-piste" onClick={() => jouerPiste(piste, pistesAlbum[achat.musique_id], achat)}>
                          {pisteActive?.id === piste.id ? <Pause size={13} /> : <Play size={13} />}
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {pisteActive && (
        <Lecteur piste={pisteActive} playlist={playlist} onPisteChange={setPisteActive} onFermer={() => { setPisteActive(null); setPlaylist([]); }} />
      )}
    </div>
  );
}

export default Bibliotheque;