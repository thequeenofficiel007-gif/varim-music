import React, { useState, useEffect } from 'react';
import { Sparkles, Music, Play, ShoppingCart, Share2, User, UserPlus } from 'lucide-react';
import NavMobile from './NavMobile';
import Partager from './Partager';
import './Nouveautes.css';

const STORAGE_KEY = 'varim_nouveautes_derniere_visite';

function Nouveautes({ allerVers, utilisateur, handleDeconnexion }) {
  const [musiques, setMusiques] = useState([]);
  const [chargement, setChargement] = useState(true);
  const [bottomSheet, setBottomSheet] = useState(null);
  const [partagerMusique, setPartagerMusique] = useState(null);
  const [nouvellesIds, setNouvellesIds] = useState(new Set());

  useEffect(() => {
    if (!utilisateur) { allerVers('login'); return; }

    const derniereVisite = localStorage.getItem(STORAGE_KEY + '_' + utilisateur.id);

    fetch(`/api/musiques/suivis/${utilisateur.id}`)
      .then(res => res.json())
      .then(data => {
        const liste = data.musiques || [];
        setMusiques(liste);

        if (derniereVisite) {
          const ids = new Set(
            liste
              .filter(m => new Date(m.date_ajout) > new Date(derniereVisite))
              .map(m => m.id)
          );
          setNouvellesIds(ids);
        }

        localStorage.setItem(STORAGE_KEY + '_' + utilisateur.id, new Date().toISOString());
        localStorage.removeItem('varim_nouvelles_' + utilisateur.id);
        window.dispatchEvent(new Event('varim_badge_update'));

        setChargement(false);
      })
      .catch(() => setChargement(false));
  }, [utilisateur]);

  const formaterDate = (dateStr) => {
    const d = new Date(dateStr);
    const now = new Date();
    const diff = Math.floor((now - d) / 1000);
    if (diff < 60) return "À l'instant";
    if (diff < 3600) return `Il y a ${Math.floor(diff / 60)} min`;
    if (diff < 86400) return `Il y a ${Math.floor(diff / 3600)} h`;
    if (diff < 604800) return `Il y a ${Math.floor(diff / 86400)} j`;
    return d.toLocaleDateString('fr-FR');
  };

  return (
    <div className="nouv-page">
      <header className="nouv-header">
        <div className="nouv-header-logo" onClick={() => allerVers('accueil')}>
          <img src="/logo.png" alt="Varim Music" className="nouv-logo-img" />
          <span>Varim Music</span>
        </div>
        <NavMobile utilisateur={utilisateur} allerVers={allerVers} handleDeconnexion={handleDeconnexion} />
      </header>

      <div className="nouv-contenu">
        <div className="nouv-titre-wrapper">
          <Sparkles size={20} className="nouv-titre-ic" />
          <div>
            <h1 className="nouv-titre">Nouveautés</h1>
            <p className="nouv-sous-titre">Publications des artistes que vous suivez</p>
          </div>
        </div>

        {chargement ? (
          <div className="nouv-chargement">Chargement...</div>
        ) : musiques.length === 0 ? (
          <div className="nouv-vide">
            <UserPlus size={52} className="nouv-vide-ic" />
            <h2>Vous ne suivez aucun artiste</h2>
            <p>Abonnez-vous à des artistes pour voir leurs nouvelles publications ici.</p>
            <button className="nouv-btn-catalogue" onClick={() => allerVers('catalogue')}>
              <Music size={15} /> Découvrir le catalogue
            </button>
          </div>
        ) : (
          <div className="nouv-liste">
            {nouvellesIds.size > 0 && (
              <p className="nouv-nouvelles-label">{nouvellesIds.size} nouvelle{nouvellesIds.size > 1 ? 's' : ''} publication{nouvellesIds.size > 1 ? 's' : ''}</p>
            )}
            {musiques.map(m => (
              <div key={m.id} className={`nouv-ligne ${nouvellesIds.has(m.id) ? 'nouvelle' : ''}`} onClick={() => setBottomSheet(m)}>
                {nouvellesIds.has(m.id) && <span className="nouv-badge-new">Nouveau</span>}
                <div className="nouv-pochette">
                  {m.pochette_url ? <img src={m.pochette_url} alt={m.titre} /> : <div className="nouv-pochette-vide"><Music size={20} /></div>}
                  <span className="nouv-type-badge">{m.type}</span>
                </div>
                <div className="nouv-infos">
                  <p className="nouv-info-titre">{m.titre}</p>
                  <p className="nouv-info-artiste" onClick={e => { e.stopPropagation(); allerVers('profil_' + m.artiste_id); }}>
                    <User size={11} /> {m.nom_artiste}
                  </p>
                  <p className="nouv-info-date">{formaterDate(m.date_ajout)}</p>
                </div>
                <p className="nouv-prix">{m.prix} FCFA</p>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* BOTTOM SHEET */}
      {bottomSheet && (
        <div className="nouv-bs-overlay" onClick={() => setBottomSheet(null)}>
          <div className="nouv-bottom-sheet" onClick={e => e.stopPropagation()}>
            <div className="nouv-bs-drag" />
            <div className="nouv-bs-contenu">
              <div className="nouv-bs-haut">
                <div className="nouv-bs-pochette">
                  {bottomSheet.pochette_url ? <img src={bottomSheet.pochette_url} alt={bottomSheet.titre} /> : <div className="nouv-bs-pochette-vide"><Music size={32} /></div>}
                  <span className="nouv-type-badge">{bottomSheet.type}</span>
                </div>
                <div className="nouv-bs-meta">
                  <h3 className="nouv-bs-titre">{bottomSheet.titre}</h3>
                  <p className="nouv-bs-artiste" onClick={() => { setBottomSheet(null); allerVers('profil_' + bottomSheet.artiste_id); }}>
                    <User size={12} /> {bottomSheet.nom_artiste}
                  </p>
                  <p className="nouv-bs-date">{formaterDate(bottomSheet.date_ajout)}</p>
                  <p className="nouv-bs-prix">{bottomSheet.prix} FCFA</p>
                </div>
              </div>
              <div className="nouv-bs-actions">
                {bottomSheet.type === 'album'
                  ? <button className="nouv-bs-btn-extrait" onClick={() => { setBottomSheet(null); allerVers('album_' + bottomSheet.id); }}><Play size={15} /> Voir l'album</button>
                  : <button className="nouv-bs-btn-extrait" onClick={() => { setBottomSheet(null); allerVers('single_' + bottomSheet.id); }}><Play size={15} /> Voir le single</button>
                }
                <button className="nouv-bs-btn-acheter" onClick={() => { setBottomSheet(null); allerVers('achat_' + bottomSheet.id); }}><ShoppingCart size={15} /> Acheter — {bottomSheet.prix} FCFA</button>
                <button className="nouv-bs-btn-partager" onClick={() => { setPartagerMusique(bottomSheet); setBottomSheet(null); }}><Share2 size={15} /> Partager</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {partagerMusique && <Partager lien={`${window.location.origin}?musique=${partagerMusique.id}`} titre={`${partagerMusique.titre} - ${partagerMusique.nom_artiste}`} onFermer={() => setPartagerMusique(null)} />}
    </div>
  );
}

export default Nouveautes;