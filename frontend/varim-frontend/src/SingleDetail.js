import React, { useState, useEffect, useRef } from 'react';
import { Play, Pause, ShoppingCart, Share2, Music, ChevronLeft, CheckCircle } from 'lucide-react';
import NavMobile from './NavMobile';
import Partager from './Partager';
import BoutonEnregistrement from './BoutonEnregistrement';
import './SingleDetail.css';

function SingleDetail({ allerVers, utilisateur, musiqueId, handleDeconnexion }) {
  const [musique, setMusique] = useState(null);
  const [artiste, setArtiste] = useState(null);
  const [chargement, setChargement] = useState(true);
  const [enLecture, setEnLecture] = useState(false);
  const [dejaAchete, setDejaAchete] = useState(false);
  const [partagerOuvert, setPartagerOuvert] = useState(false);
  const audioRef = useRef(null);

  useEffect(() => {
    fetch('https://varim-music.onrender.com/api/musiques')
      .then(res => res.json())
      .then(data => {
        const m = (data.musiques || []).find(m => m.id === parseInt(musiqueId));
        if (m) {
          setMusique(m);
          return fetch('https://varim-music.onrender.com/api/profil/${m.artiste_id}`);
        }
      })
      .then(res => res?.json())
      .then(data => { if (data?.artiste) setArtiste(data.artiste); setChargement(false); })
      .catch(() => setChargement(false));

    if (utilisateur) {
      fetch('https://varim-music.onrender.com/api/achats/mes-achats/${utilisateur.id}`)
        .then(res => res.json())
        .then(data => {
          setDejaAchete((data.achats || []).some(a => a.musique_id === parseInt(musiqueId)));
        }).catch(() => {});
    }

    return () => { audioRef.current?.pause(); };
  }, [musiqueId, utilisateur]);

  const toggleExtrait = () => {
    if (!musique?.fichier_url) return;
    if (enLecture) {
      audioRef.current?.pause();
      setEnLecture(false);
    } else {
      audioRef.current = new Audio(musique.fichier_url);
      audioRef.current.play();
      setEnLecture(true);
      setTimeout(() => { audioRef.current?.pause(); setEnLecture(false); }, 20000);
      audioRef.current.onended = () => setEnLecture(false);
    }
  };

  if (chargement) return (
    <div className="sd-page">
      <header className="sd-header">
        <div className="sd-header-logo" onClick={() => allerVers('accueil')}>
          <img src="/logo.png" alt="Varim Music" className="sd-logo-img" />
          <span>Varim Music</span>
        </div>
        <NavMobile utilisateur={utilisateur} allerVers={allerVers} handleDeconnexion={handleDeconnexion} />
      </header>
      <div className="sd-chargement">Chargement...</div>
    </div>
  );

  if (!musique) return (
    <div className="sd-page">
      <header className="sd-header">
        <div className="sd-header-logo" onClick={() => allerVers('accueil')}>
          <img src="/logo.png" alt="Varim Music" className="sd-logo-img" />
          <span>Varim Music</span>
        </div>
        <NavMobile utilisateur={utilisateur} allerVers={allerVers} handleDeconnexion={handleDeconnexion} />
      </header>
      <div className="sd-introuvable">
        <Music size={52} className="sd-introuvable-ic" />
        <h2>Single introuvable</h2>
        <p>Ce titre n'existe pas ou a été supprimé.</p>
        <button className="sd-btn-catalogue" onClick={() => allerVers('catalogue')}>Voir le catalogue</button>
      </div>
    </div>
  );

  return (
    <div className="sd-page">
      <header className="sd-header">
        <div className="sd-header-logo" onClick={() => allerVers('accueil')}>
          <img src="/logo.png" alt="Varim Music" className="sd-logo-img" />
          <span>Varim Music</span>
        </div>
        <NavMobile utilisateur={utilisateur} allerVers={allerVers} handleDeconnexion={handleDeconnexion} />
      </header>

      <div className="sd-contenu">
        <button className="sd-retour" onClick={() => allerVers('catalogue')}>
          <ChevronLeft size={16} /> Catalogue
        </button>

        {/* HERO */}
        <div className="sd-hero">
          <div className="sd-hero-bg">
            {musique.pochette_url && <img src={musique.pochette_url} alt="" />}
          </div>
          <div className="sd-pochette-wrapper">
            {musique.pochette_url
              ? <img src={musique.pochette_url} alt={musique.titre} className="sd-pochette" />
              : <div className="sd-pochette-vide"><Music size={48} /></div>
            }
            <span className="sd-type-badge">Single</span>
          </div>
        </div>

        {/* INFOS */}
        <div className="sd-infos">
          <h1 className="sd-titre">{musique.titre}</h1>
          <div className="sd-artiste" onClick={() => allerVers('profil_' + musique.artiste_id)}>
            {artiste?.photo_profil
              ? <img src={artiste.photo_profil} alt={musique.nom_artiste} className="sd-artiste-photo" />
              : <div className="sd-artiste-initiale">{musique.nom_artiste?.[0]?.toUpperCase()}</div>
            }
            <div>
              <p className="sd-artiste-nom">{musique.nom_artiste}</p>
              <p className="sd-artiste-label">Artiste</p>
            </div>
          </div>
          <div className="sd-meta">
            {musique.genre && <span className="sd-meta-badge">{musique.genre}</span>}
            <span className="sd-meta-badge">{musique.nb_ventes || 0} ventes</span>
          </div>
          <p className="sd-prix">{musique.prix} FCFA</p>
        </div>

        {/* ACTIONS */}
        <div className="sd-actions">
          {dejaAchete ? (
            <div className="sd-deja-achete"><CheckCircle size={18} /> Vous possédez déjà ce titre</div>
          ) : (
            <button className="sd-btn-acheter" onClick={() => allerVers('achat_' + musique.id)}>
              <ShoppingCart size={16} /> Acheter — {musique.prix} FCFA
            </button>
          )}
          <button className={`sd-btn-extrait ${enLecture ? 'en-lecture' : ''}`} onClick={toggleExtrait}>
            {enLecture ? <Pause size={16} /> : <Play size={16} />}
            {enLecture ? 'Arrêter l\'extrait' : 'Écouter l\'extrait (20s)'}
          </button>
          <button className="sd-btn-partager" onClick={() => setPartagerOuvert(true)}>
            <Share2 size={16} /> Partager
          </button>
          <BoutonEnregistrement utilisateur={utilisateur} musiqueId={parseInt(musiqueId)} style="texte" />
        </div>

        {/* ARTISTE EN BAS */}
        {artiste && (
          <div className="sd-artiste-section" onClick={() => allerVers('profil_' + musique.artiste_id)}>
            <div className="sd-artiste-section-photo">
              {artiste.photo_profil
                ? <img src={artiste.photo_profil} alt={artiste.prenom} />
                : <div className="sd-artiste-section-initiale">{(artiste.nom_artiste || artiste.prenom)?.[0]?.toUpperCase()}</div>
              }
            </div>
            <div className="sd-artiste-section-infos">
              <p className="sd-artiste-section-nom">{artiste.nom_artiste || artiste.prenom}</p>
              {artiste.bio && <p className="sd-artiste-section-bio">{artiste.bio}</p>}
            </div>
            <ChevronLeft size={16} className="sd-artiste-section-arrow" />
          </div>
        )}
      </div>

      {partagerOuvert && (
        <Partager
          lien={`${window.location.origin}?single=${musique.id}`}
          titre={`${musique.titre} — ${musique.nom_artiste}`}
          onFermer={() => setPartagerOuvert(false)}
        />
      )}
    </div>
  );
}

export default SingleDetail;