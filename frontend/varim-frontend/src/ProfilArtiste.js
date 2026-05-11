import React, { useState, useEffect, useRef } from 'react';
import { Share2, UserPlus, UserCheck, Play, Pause, ShoppingCart, Music, Disc, ChevronLeft } from 'lucide-react';
import NavMobile from './NavMobile';
import Partager from './Partager';
import './ProfilArtiste.css';

function ProfilArtiste({ allerVers, utilisateur, artisteId, handleDeconnexion }) {
  const [artiste, setArtiste] = useState(null);
  const [musiques, setMusiques] = useState([]);
  const [nbAbonnes, setNbAbonnes] = useState(0);
  const [estAbonne, setEstAbonne] = useState(false);
  const [chargement, setChargement] = useState(true);
  const [lecteurActif, setLecteurActif] = useState(null);
  const [filtreType, setFiltreType] = useState('tous');
  const [partagerOuvert, setPartagerOuvert] = useState(false);
  const audioRef = useRef(null);

  useEffect(() => {
    fetch(`/api/profil/${artisteId}`)
      .then(res => res.json())
      .then(data => {
        setArtiste(data.artiste);
        setMusiques(data.musiques || []);
        setNbAbonnes(data.nb_abonnes);
        setChargement(false);
      })
      .catch(() => setChargement(false));

    if (utilisateur) {
      fetch(`/api/profil/${artisteId}/abonnements?abonne_id=${utilisateur.id}`)
        .then(res => res.json())
        .then(data => setEstAbonne(data.estAbonne));
    }
  }, [artisteId, utilisateur]);

  const handleAbonnement = async () => {
    if (!utilisateur) { allerVers('login'); return; }
    const route = estAbonne ? '/api/profil/desabonner' : '/api/profil/abonner';
    await fetch(route, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ abonne_id: utilisateur.id, artiste_id: parseInt(artisteId) })
    });
    setEstAbonne(!estAbonne);
    setNbAbonnes(prev => estAbonne ? prev - 1 : parseInt(prev) + 1);
  };

  const jouerExtrait = (musique) => {
    if (lecteurActif === musique.id) {
      audioRef.current?.pause();
      setLecteurActif(null);
    } else {
      audioRef.current?.pause();
      audioRef.current = new Audio(musique.fichier_url);
      audioRef.current.play();
      setLecteurActif(musique.id);
      setTimeout(() => { audioRef.current?.pause(); setLecteurActif(null); }, 20000);
    }
  };

  const totalVentes = musiques.reduce((acc, m) => acc + (m.nb_ventes || 0), 0);
  const musiquesFiltrees = filtreType === 'tous' ? musiques : musiques.filter(m => m.type === filtreType);

  if (chargement) return (
    <div className="profil-page">
      <div className="profil-chargement">Chargement du profil...</div>
    </div>
  );

  return (
    <div className="profil-page">

      {/* HEADER */}
      <header className="profil-header">
        <div className="profil-header-logo" onClick={() => allerVers('accueil')}>
          <img src="/logo.png" alt="Varim Music" className="profil-logo-img" />
          <span>Varim Music</span>
        </div>
        <NavMobile utilisateur={utilisateur} allerVers={allerVers} handleDeconnexion={handleDeconnexion} />
      </header>

      {/* BOUTON RETOUR */}
      <button className="profil-retour" onClick={() => allerVers('catalogue')}>
        <ChevronLeft size={16} /> Catalogue
      </button>

      {/* HERO PROFIL */}
      <div className="profil-hero">
        {/* Fond flouté avec photo */}
        <div className="profil-hero-bg">
          {artiste?.photo_profil && <img src={artiste.photo_profil} alt="" />}
        </div>

        <div className="profil-hero-contenu">
          {/* Avatar */}
          <div className="profil-avatar">
            {artiste?.photo_profil
              ? <img src={artiste.photo_profil} alt={artiste.prenom} />
              : <div className="profil-avatar-initiale">{(artiste?.nom_artiste || artiste?.prenom)?.[0]?.toUpperCase()}</div>
            }
          </div>

          {/* Nom & bio */}
          <h1 className="profil-nom">{artiste?.nom_artiste || artiste?.prenom}</h1>
          {artiste?.bio && <p className="profil-bio">{artiste.bio}</p>}

          {/* Stats */}
          <div className="profil-stats">
            <div className="profil-stat">
              <span className="stat-val">{musiques.length}</span>
              <span className="stat-lab">Titres</span>
            </div>
            <div className="profil-stat-sep" />
            <div className="profil-stat">
              <span className="stat-val">{nbAbonnes}</span>
              <span className="stat-lab">Abonnés</span>
            </div>
            <div className="profil-stat-sep" />
            <div className="profil-stat">
              <span className="stat-val">{totalVentes}</span>
              <span className="stat-lab">Ventes</span>
            </div>
          </div>

          {/* Actions */}
          <div className="profil-actions">
            {utilisateur && utilisateur.id !== parseInt(artisteId) && (
              <button className={`profil-btn-abonner ${estAbonne ? 'abonne' : ''}`} onClick={handleAbonnement}>
                {estAbonne ? <><UserCheck size={15} /> Abonné</> : <><UserPlus size={15} /> S'abonner</>}
              </button>
            )}
            <button className="profil-btn-partager" onClick={() => setPartagerOuvert(true)}>
              <Share2 size={15} />
            </button>
          </div>
        </div>
      </div>

      {/* FILTRES */}
      <div className="profil-filtres">
        {['tous', 'single', 'album'].map(f => (
          <button
            key={f}
            className={`profil-filtre-btn ${filtreType === f ? 'actif' : ''}`}
            onClick={() => setFiltreType(f)}
          >
            {f === 'tous' ? 'Tous' : f === 'single' ? 'Singles' : 'Albums'}
          </button>
        ))}
      </div>

      {/* DISCOGRAPHIE */}
      <div className="profil-discographie">
        {musiquesFiltrees.length === 0 ? (
          <div className="profil-vide">Aucune musique publiée.</div>
        ) : (
          <div className="profil-grille">
            {musiquesFiltrees.map(musique => (
              <div key={musique.id} className="profil-carte">
                <div className="profil-carte-pochette" onClick={() => musique.type === 'album' ? allerVers('album_' + musique.id) : allerVers('single_' + musique.id)}>
                  {musique.pochette_url
                    ? <img src={musique.pochette_url} alt={musique.titre} />
                    : <div className="profil-pochette-vide"><Music size={28} /></div>
                  }
                  <span className="profil-carte-type">{musique.type}</span>
                  {musique.type === 'single' && (
                    <div className="profil-play-overlay">
                      {lecteurActif === musique.id ? <Pause size={22} /> : <Play size={22} />}
                    </div>
                  )}
                </div>
                <div className="profil-carte-infos">
                  <p className="profil-carte-titre">{musique.titre}</p>
                  <p className="profil-carte-genre">{musique.genre}</p>
                  <div className="profil-carte-bas">
                    <span className="profil-carte-prix">{musique.prix} FCFA</span>
                    <button className="profil-btn-acheter" onClick={() => allerVers('achat_' + musique.id)}>
                      <ShoppingCart size={13} />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {partagerOuvert && (
        <Partager
          lien={`${window.location.origin}?profil=${artisteId}`}
          titre={`${artiste?.nom_artiste || artiste?.prenom} sur Varim Music`}
          onFermer={() => setPartagerOuvert(false)}
        />
      )}
    </div>
  );
}

export default ProfilArtiste;