import React, { useState, useEffect } from 'react';
import { Play, ShoppingCart, Share2, User, Music, ChevronLeft, CheckCircle } from 'lucide-react';
import NavMobile from './NavMobile';
import Lecteur from './Lecteur';
import Partager from './Partager';
import './MusiqueDetail.css';

function MusiqueDetail({ allerVers, utilisateur, musiqueId, handleDeconnexion }) {
  const [musique, setMusique] = useState(null);
  const [artiste, setArtiste] = useState(null);
  const [chargement, setChargement] = useState(true);
  const [dejaAchete, setDejaAchete] = useState(false);
  const [pisteActive, setPisteActive] = useState(null);
  const [playlist, setPlaylist] = useState([]);
  const [partagerOuvert, setPartagerOuvert] = useState(false);

  useEffect(() => {
    // Charger les infos de la musique
    fetch(`/api/musiques`)
      .then(res => res.json())
      .then(data => {
        const m = (data.musiques || []).find(m => m.id === parseInt(musiqueId));
        if (m) {
          setMusique(m);
          // Charger le profil de l'artiste
          return fetch(`/api/profil/${m.artiste_id}`);
        }
      })
      .then(res => res?.json())
      .then(data => {
        if (data?.artiste) setArtiste(data.artiste);
        setChargement(false);
      })
      .catch(() => setChargement(false));

    // Vérifier si déjà acheté
    if (utilisateur) {
      fetch(`/api/achats/mes-achats/${utilisateur.id}`)
        .then(res => res.json())
        .then(data => {
          const achats = data.achats || [];
          setDejaAchete(achats.some(a => a.musique_id === parseInt(musiqueId)));
        })
        .catch(() => {});
    }
  }, [musiqueId, utilisateur]);

  const jouerExtrait = () => {
    if (!musique?.fichier_url) return;
    setPlaylist([{ url: musique.fichier_url, titre: musique.titre, artiste: musique.nom_artiste, pochette: musique.pochette_url, id: musique.id, estExtrait: true }]);
    setPisteActive({ url: musique.fichier_url, titre: musique.titre, artiste: musique.nom_artiste, pochette: musique.pochette_url, id: musique.id, estExtrait: true });
  };

  if (chargement) return (
    <div className="md-page">
      <header className="md-header">
        <div className="md-header-logo" onClick={() => allerVers('accueil')}>
          <img src="/logo.png" alt="Varim Music" className="md-logo-img" />
          <span>Varim Music</span>
        </div>
        <NavMobile utilisateur={utilisateur} allerVers={allerVers} handleDeconnexion={handleDeconnexion} />
      </header>
      <div className="md-chargement">Chargement...</div>
    </div>
  );

  if (!musique) return (
    <div className="md-page">
      <header className="md-header">
        <div className="md-header-logo" onClick={() => allerVers('accueil')}>
          <img src="/logo.png" alt="Varim Music" className="md-logo-img" />
          <span>Varim Music</span>
        </div>
        <NavMobile utilisateur={utilisateur} allerVers={allerVers} handleDeconnexion={handleDeconnexion} />
      </header>
      <div className="md-introuvable">
        <Music size={52} className="md-introuvable-ic" />
        <h2>Musique introuvable</h2>
        <p>Ce titre n'existe pas ou a été supprimé.</p>
        <button className="md-btn-catalogue" onClick={() => allerVers('catalogue')}>
          Voir le catalogue
        </button>
      </div>
    </div>
  );

  return (
    <div className="md-page">
      <header className="md-header">
        <div className="md-header-logo" onClick={() => allerVers('accueil')}>
          <img src="/logo.png" alt="Varim Music" className="md-logo-img" />
          <span>Varim Music</span>
        </div>
        <NavMobile utilisateur={utilisateur} allerVers={allerVers} handleDeconnexion={handleDeconnexion} />
      </header>

      <div className="md-contenu">
        <button className="md-retour" onClick={() => allerVers('catalogue')}>
          <ChevronLeft size={16} /> Catalogue
        </button>

        {/* POCHETTE GRANDE */}
        <div className="md-hero">
          <div className="md-hero-bg">
            {musique.pochette_url && <img src={musique.pochette_url} alt="" />}
          </div>
          <div className="md-pochette-wrapper">
            {musique.pochette_url
              ? <img src={musique.pochette_url} alt={musique.titre} className="md-pochette" />
              : <div className="md-pochette-vide"><Music size={48} /></div>
            }
            <span className="md-type-badge">{musique.type}</span>
          </div>
        </div>

        {/* INFOS */}
        <div className="md-infos">
          <h1 className="md-titre">{musique.titre}</h1>
          <div className="md-artiste" onClick={() => allerVers('profil_' + musique.artiste_id)}>
            {artiste?.photo_profil
              ? <img src={artiste.photo_profil} alt={musique.nom_artiste} className="md-artiste-photo" />
              : <div className="md-artiste-initiale">{musique.nom_artiste?.[0]?.toUpperCase()}</div>
            }
            <div>
              <p className="md-artiste-nom">{musique.nom_artiste}</p>
              <p className="md-artiste-label">Artiste</p>
            </div>
          </div>

          <div className="md-meta">
            {musique.genre && <span className="md-meta-badge">{musique.genre}</span>}
            <span className="md-meta-badge">{musique.nb_ventes || 0} ventes</span>
          </div>

          <p className="md-prix">{musique.prix} FCFA</p>
        </div>

        {/* ACTIONS */}
        <div className="md-actions">
          {dejaAchete ? (
            <div className="md-deja-achete">
              <CheckCircle size={18} />
              Vous possédez déjà ce titre
            </div>
          ) : (
            <button className="md-btn-acheter" onClick={() => allerVers('achat_' + musique.id)}>
              <ShoppingCart size={16} /> Acheter — {musique.prix} FCFA
            </button>
          )}

          {musique.type === 'album' ? (
            <button className="md-btn-extrait" onClick={() => allerVers('album_' + musique.id)}>
              <Play size={16} /> Voir l'album
            </button>
          ) : (
            <button className="md-btn-extrait" onClick={jouerExtrait}>
              <Play size={16} /> Écouter l'extrait
            </button>
          )}

          <button className="md-btn-partager" onClick={() => setPartagerOuvert(true)}>
            <Share2 size={16} /> Partager
          </button>
        </div>

        {/* ARTISTE EN BAS */}
        {artiste && (
          <div className="md-artiste-section" onClick={() => allerVers('profil_' + musique.artiste_id)}>
            <div className="md-artiste-section-photo">
              {artiste.photo_profil
                ? <img src={artiste.photo_profil} alt={artiste.prenom} />
                : <div className="md-artiste-section-initiale">{(artiste.nom_artiste || artiste.prenom)?.[0]?.toUpperCase()}</div>
              }
            </div>
            <div className="md-artiste-section-infos">
              <p className="md-artiste-section-nom">{artiste.nom_artiste || artiste.prenom}</p>
              {artiste.bio && <p className="md-artiste-section-bio">{artiste.bio}</p>}
            </div>
            <ChevronLeft size={16} className="md-artiste-section-arrow" />
          </div>
        )}
      </div>

      {pisteActive && (
        <Lecteur piste={pisteActive} playlist={playlist} onPisteChange={setPisteActive} onFermer={() => { setPisteActive(null); setPlaylist([]); }} />
      )}
      {partagerOuvert && (
        <Partager
          lien={`${window.location.origin}?musique=${musique.id}`}
          titre={`${musique.titre} — ${musique.nom_artiste}`}
          onFermer={() => setPartagerOuvert(false)}
        />
      )}
    </div>
  );
}

export default MusiqueDetail;