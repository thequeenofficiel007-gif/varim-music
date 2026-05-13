import React, { useState, useEffect } from 'react';
import { Play, Pause, ShoppingCart, Share2, User, Disc, Music, ChevronLeft, CheckCircle } from 'lucide-react';
import NavMobile from './NavMobile';
import Lecteur from './Lecteur';
import Partager from './Partager';
import BoutonEnregistrement from './BoutonEnregistrement';
import './AlbumDetail.css';

function AlbumDetail({ allerVers, utilisateur, albumId, handleDeconnexion }) {
  const [album, setAlbum] = useState(null);
  const [pistes, setPistes] = useState([]);
  const [artiste, setArtiste] = useState(null);
  const [chargement, setChargement] = useState(true);
  const [pisteActive, setPisteActive] = useState(null);
  const [playlist, setPlaylist] = useState([]);
  const [dejaAchete, setDejaAchete] = useState(false);
  const [partagerOuvert, setPartagerOuvert] = useState(false);

  useEffect(() => {
    const uid = utilisateur?.id ? `?utilisateur_id=${utilisateur.id}` : '';
fetch(`https://varim-music.onrender.com/api/musiques/${albumId}/pistes${uid}`)
      .then(res => res.json())
      .then(data => {
        setAlbum(data.album);
        setPistes(data.pistes || []);
        if (data.aAchete !== undefined) setDejaAchete(data.aAchete);
        if (data.album?.artiste_id) {
          return fetch(`https://varim-music.onrender.com/api/profil/${data.album.artiste_id}`);
        }
      })
      .then(res => res?.json())
      .then(data => { if (data?.artiste) setArtiste(data.artiste); setChargement(false); })
      .catch(() => setChargement(false));
  }, [albumId, utilisateur]);

  const jouerExtrait = (piste) => {
    const playlistComplete = dejaAchete
      ? pistes.map(p => ({
          url: p.fichier_url,
          titre: p.titre,
          artiste: album?.nom_artiste || '',
          pochette: album?.pochette_url || null,
          id: p.id,
          musiqueId: parseInt(albumId),
          estPisteAlbum: true
        }))
      : [];

    setPlaylist(playlistComplete);
    setPisteActive({
      url: piste.fichier_url,
      titre: piste.titre + (piste.estExtrait ? ' (extrait 30s)' : ''),
      artiste: album?.nom_artiste || '',
      pochette: album?.pochette_url || null,
      id: piste.id,
      musiqueId: parseInt(albumId),
      estPisteAlbum: true
    });
  };

  if (chargement) return (
    <div className="al-page">
      <header className="al-header">
        <div className="al-header-logo" onClick={() => allerVers('accueil')}>
          <img src="/logo.png" alt="Varim Music" className="al-logo-img" />
          <span>Varim Music</span>
        </div>
        <NavMobile utilisateur={utilisateur} allerVers={allerVers} handleDeconnexion={handleDeconnexion} />
      </header>
      <div className="al-chargement">Chargement...</div>
    </div>
  );

  if (!album) return (
    <div className="al-page">
      <header className="al-header">
        <div className="al-header-logo" onClick={() => allerVers('accueil')}>
          <img src="/logo.png" alt="Varim Music" className="al-logo-img" />
          <span>Varim Music</span>
        </div>
        <NavMobile utilisateur={utilisateur} allerVers={allerVers} handleDeconnexion={handleDeconnexion} />
      </header>
      <div className="al-introuvable">
        <Disc size={52} className="al-introuvable-ic" />
        <h2>Album introuvable</h2>
        <p>Cet album n'existe pas ou a été supprimé.</p>
        <button className="al-btn-catalogue" onClick={() => allerVers('catalogue')}>Voir le catalogue</button>
      </div>
    </div>
  );

  return (
    <div className="al-page">
      <header className="al-header">
        <div className="al-header-logo" onClick={() => allerVers('accueil')}>
          <img src="/logo.png" alt="Varim Music" className="al-logo-img" />
          <span>Varim Music</span>
        </div>
        <NavMobile utilisateur={utilisateur} allerVers={allerVers} handleDeconnexion={handleDeconnexion} />
      </header>

      <div className="al-contenu">
        <button className="al-retour" onClick={() => allerVers('catalogue')}>
          <ChevronLeft size={16} /> Catalogue
        </button>

        {/* HERO */}
        <div className="al-hero">
          <div className="al-hero-bg">
            {album.pochette_url && <img src={album.pochette_url} alt="" />}
          </div>
          <div className="al-pochette-wrapper">
            {album.pochette_url
              ? <img src={album.pochette_url} alt={album.titre} className="al-pochette" />
              : <div className="al-pochette-vide"><Disc size={48} /></div>
            }
            <span className="al-type-badge">Album</span>
          </div>
        </div>

        {/* INFOS */}
        <div className="al-infos">
          <h1 className="al-titre">{album.titre}</h1>
          <div className="al-artiste" onClick={() => allerVers('profil_' + album.artiste_id)}>
            {artiste?.photo_profil
              ? <img src={artiste.photo_profil} alt={album.nom_artiste} className="al-artiste-photo" />
              : <div className="al-artiste-initiale">{album.nom_artiste?.[0]?.toUpperCase()}</div>
            }
            <div>
              <p className="al-artiste-nom">{album.nom_artiste}</p>
              <p className="al-artiste-label">Artiste</p>
            </div>
          </div>

          <div className="al-meta">
            {album.genre && <span className="al-meta-badge">{album.genre}</span>}
            <span className="al-meta-badge">{pistes.length} piste{pistes.length > 1 ? 's' : ''}</span>
            <span className="al-meta-badge">{album.nb_ventes || 0} ventes</span>
          </div>

          <p className="al-prix">{album.prix} FCFA</p>
        </div>

        {/* ACTIONS */}
        <div className="al-actions">
          {dejaAchete ? (
            <div className="al-deja-achete"><CheckCircle size={18} /> Vous possédez déjà cet album</div>
          ) : (
            <button className="al-btn-acheter" onClick={() => allerVers('achat_' + album.id)}>
              <ShoppingCart size={16} /> Acheter l'album — {album.prix} FCFA
            </button>
          )}
          <button className="al-btn-partager" onClick={() => setPartagerOuvert(true)}>
            <Share2 size={16} /> Partager
          </button>
          <BoutonEnregistrement utilisateur={utilisateur} musiqueId={parseInt(albumId)} style="texte" />
        </div>

        {/* PISTES */}
        <div className="al-pistes">
          <h2 className="al-pistes-titre"><Music size={16} /> Pistes de l'album</h2>
          {pistes.map(piste => (
            <div key={piste.id} className={`al-piste-ligne ${pisteActive?.id === piste.id ? 'en-lecture' : ''}`}>
              <span className="al-piste-num">{piste.numero_ordre}</span>
              <span className="al-piste-titre">{piste.titre}</span>
              <button className="al-btn-piste" onClick={() => jouerExtrait(piste)}>
                {pisteActive?.id === piste.id ? <Pause size={14} /> : <Play size={14} />}
                {pisteActive?.id === piste.id ? 'Stop' : (piste.estExtrait ? 'Extrait' : 'Écouter')}
              </button>
            </div>
          ))}
        </div>

        {/* Note si extraits */}
        {!dejaAchete && (
          <p className="al-note-extrait">
            Les extraits sont limités à 30 secondes. Achetez l'album pour écouter toutes les pistes en entier.
          </p>
        )}

        {/* ARTISTE EN BAS */}
        {artiste && (
          <div className="al-artiste-section" onClick={() => allerVers('profil_' + album.artiste_id)}>
            <div className="al-artiste-section-photo">
              {artiste.photo_profil
                ? <img src={artiste.photo_profil} alt={artiste.prenom} />
                : <div className="al-artiste-section-initiale">{(artiste.nom_artiste || artiste.prenom)?.[0]?.toUpperCase()}</div>
              }
            </div>
            <div className="al-artiste-section-infos">
              <p className="al-artiste-section-nom">{artiste.nom_artiste || artiste.prenom}</p>
              {artiste.bio && <p className="al-artiste-section-bio">{artiste.bio}</p>}
            </div>
            <ChevronLeft size={16} className="al-artiste-section-arrow" />
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

      {partagerOuvert && (
        <Partager
          lien={`${window.location.origin}?album=${album.id}`}
          titre={`${album.titre} — ${album.nom_artiste}`}
          onFermer={() => setPartagerOuvert(false)}
        />
      )}
    </div>
  );
}

export default AlbumDetail;