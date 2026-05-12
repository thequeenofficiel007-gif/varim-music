import React, { useState, useEffect } from 'react';
import { TrendingUp, Music, Play, ShoppingCart, Share2, User } from 'lucide-react';
import NavMobile from './NavMobile';
import Lecteur from './Lecteur';
import Partager from './Partager';
import './TopVentes.css';

function TopVentes({ allerVers, utilisateur, handleDeconnexion }) {
  const [musiques, setMusiques] = useState([]);
  const [chargement, setChargement] = useState(true);
  const [bottomSheet, setBottomSheet] = useState(null);
  const [pisteActive, setPisteActive] = useState(null);
  const [playlist, setPlaylist] = useState([]);
  const [partagerMusique, setPartagerMusique] = useState(null);

  useEffect(() => {
    fetch('https://varim-music.onrender.com/api/musiques/top-ventes')
      .then(res => res.json())
      .then(data => { setMusiques(data.musiques || []); setChargement(false); })
      .catch(() => setChargement(false));
  }, []);

  const jouerExtrait = (musique) => {
    setBottomSheet(null);
    const singles = musiques.filter(m => m.fichier_url && m.type === 'single');
    setPlaylist(singles.map(m => ({ url: m.fichier_url, titre: m.titre, artiste: m.nom_artiste, pochette: m.pochette_url, id: m.id, estExtrait: true })));
    setPisteActive({ url: musique.fichier_url, titre: musique.titre, artiste: musique.nom_artiste, pochette: musique.pochette_url, id: musique.id, estExtrait: true });
  };

  return (
    <div className="tv-page">
      <header className="tv-header">
        <div className="tv-header-logo" onClick={() => allerVers('accueil')}>
          <img src="/logo.png" alt="Varim Music" className="tv-logo-img" />
          <span>Varim Music</span>
        </div>
        <NavMobile utilisateur={utilisateur} allerVers={allerVers} handleDeconnexion={handleDeconnexion} />
      </header>

      <div className="tv-contenu">
        <div className="tv-titre-wrapper">
          <TrendingUp size={20} className="tv-titre-ic" />
          <div>
            <h1 className="tv-titre">Top Ventes</h1>
            <p className="tv-sous-titre">Les musiques les plus achetées</p>
          </div>
        </div>

        {chargement ? (
          <div className="tv-chargement">Chargement...</div>
        ) : musiques.length === 0 ? (
          <div className="tv-vide"><TrendingUp size={48} /><p>Aucune vente pour l'instant.</p></div>
        ) : (
          <div className="tv-liste">
            {musiques.map((m, i) => (
              <div key={m.id} className="tv-ligne" onClick={() => setBottomSheet(m)}>
                <span className="tv-rang">{i + 1}</span>
                <div className="tv-pochette">
                  {m.pochette_url ? <img src={m.pochette_url} alt={m.titre} /> : <div className="tv-pochette-vide"><Music size={18} /></div>}
                  <span className="tv-type-badge">{m.type}</span>
                </div>
                <div className="tv-infos">
                  <p className="tv-info-titre">{m.titre}</p>
                  <p className="tv-info-artiste" onClick={e => { e.stopPropagation(); allerVers('profil_' + m.artiste_id); }}>
                    <User size={11} /> {m.nom_artiste}
                  </p>
                  <p className="tv-info-ventes">+{m.nb_ventes || 0} ventes</p>
                </div>
                <p className="tv-prix">{m.prix} FCFA</p>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* BOTTOM SHEET */}
      {bottomSheet && (
        <div className="tv-bs-overlay" onClick={() => setBottomSheet(null)}>
          <div className="tv-bottom-sheet" onClick={e => e.stopPropagation()}>
            <div className="tv-bs-drag" />
            <div className="tv-bs-contenu">
              <div className="tv-bs-haut">
                <div className="tv-bs-pochette">
                  {bottomSheet.pochette_url ? <img src={bottomSheet.pochette_url} alt={bottomSheet.titre} /> : <div className="tv-bs-pochette-vide"><Music size={32} /></div>}
                  <span className="tv-type-badge">{bottomSheet.type}</span>
                </div>
                <div className="tv-bs-meta">
                  <h3 className="tv-bs-titre">{bottomSheet.titre}</h3>
                  <p className="tv-bs-artiste" onClick={() => { setBottomSheet(null); allerVers('profil_' + bottomSheet.artiste_id); }}><User size={12} /> {bottomSheet.nom_artiste}</p>
                  <p className="tv-bs-ventes">+{bottomSheet.nb_ventes || 0} ventes</p>
                  <p className="tv-bs-prix">{bottomSheet.prix} FCFA</p>
                </div>
              </div>
              <div className="tv-bs-actions">
                {bottomSheet.type === 'album'
                  ? <button className="tv-bs-btn-extrait" onClick={() => { setBottomSheet(null); allerVers('album_' + bottomSheet.id); }}><Play size={15} /> Voir l'album</button>
                  : <button className="tv-bs-btn-extrait" onClick={() => () => { setBottomSheet(null); allerVers('single_' + bottomSheet.id); }}><Play size={15} /> Écouter l'extrait</button>
                }
                <button className="tv-bs-btn-acheter" onClick={() => { setBottomSheet(null); allerVers('achat_' + bottomSheet.id); }}><ShoppingCart size={15} /> Acheter — {bottomSheet.prix} FCFA</button>
                <button className="tv-bs-btn-partager" onClick={() => { setPartagerMusique(bottomSheet); setBottomSheet(null); }}><Share2 size={15} /> Partager</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {pisteActive && <Lecteur piste={pisteActive} playlist={playlist} onPisteChange={setPisteActive} onFermer={() => { setPisteActive(null); setPlaylist([]); }} />}
      {partagerMusique && <Partager lien={`${window.location.origin}?musique=${partagerMusique.id}`} titre={`${partagerMusique.titre} - ${partagerMusique.nom_artiste}`} onFermer={() => setPartagerMusique(null)} />}
    </div>
  );
}

export default TopVentes;