import React, { useState, useEffect } from 'react';
import { Bookmark, Music, Disc, User, ShoppingCart, Trash2 } from 'lucide-react';
import NavMobile from './NavMobile';
import './Enregistrements.css';

function Enregistrements({ allerVers, utilisateur, handleDeconnexion }) {
  const [enregistrements, setEnregistrements] = useState([]);
  const [chargement, setChargement] = useState(true);

  useEffect(() => {
    if (!utilisateur) { allerVers('login'); return; }
    fetch(`/api/enregistrements/${utilisateur.id}`)
      .then(r => r.json())
      .then(d => { setEnregistrements(d.enregistrements || []); setChargement(false); })
      .catch(() => setChargement(false));
  }, [utilisateur]);

  const retirer = async (enregistrement) => {
    await fetch('/api/enregistrements', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ utilisateur_id: utilisateur.id, musique_id: enregistrement.musique_id })
    });
    setEnregistrements(prev => prev.filter(e => e.enregistrement_id !== enregistrement.enregistrement_id));
  };

  return (
    <div className="enr-page">
      <header className="enr-header">
        <div className="enr-header-logo" onClick={() => allerVers('accueil')}>
          <img src="/logo.png" alt="Varim Music" className="enr-logo-img" />
          <span>Varim Music</span>
        </div>
        <NavMobile utilisateur={utilisateur} allerVers={allerVers} handleDeconnexion={handleDeconnexion} />
      </header>

      <div className="enr-contenu">
        <div className="enr-titre-wrapper">
          <Bookmark size={20} className="enr-titre-ic" />
          <div>
            <h1 className="enr-titre">Mes Enregistrements</h1>
            <p className="enr-sous-titre">{enregistrements.length} titre{enregistrements.length > 1 ? 's' : ''} à acheter plus tard</p>
          </div>
        </div>

        {chargement ? (
          <div className="enr-chargement">Chargement...</div>
        ) : enregistrements.length === 0 ? (
          <div className="enr-vide">
            <Bookmark size={52} className="enr-vide-ic" />
            <h2>Aucun enregistrement</h2>
            <p>Appuyez sur l'icône marque-page sur une musique ou un album pour l'enregistrer ici et l'acheter plus tard.</p>
            <button className="enr-btn-catalogue" onClick={() => allerVers('catalogue')}>
              Découvrir le catalogue
            </button>
          </div>
        ) : (
          <div className="enr-liste">
            {enregistrements.map(e => (
              <div key={e.enregistrement_id} className="enr-ligne">
                <div className="enr-pochette" onClick={() => allerVers((e.type === 'album' ? 'album_' : 'single_') + e.musique_id)}>
                  {e.pochette_url
                    ? <img src={e.pochette_url} alt={e.titre} />
                    : <div className="enr-pochette-vide">{e.type === 'album' ? <Disc size={20} /> : <Music size={20} />}</div>
                  }
                  <span className="enr-type-badge">{e.type}</span>
                </div>

                <div className="enr-infos">
                  <p className="enr-info-titre">{e.titre}</p>
                  <p className="enr-info-artiste" onClick={() => allerVers('profil_' + e.artiste_id)}>
                    <User size={11} /> {e.nom_artiste}
                  </p>
                  <p className="enr-info-prix">{e.prix} FCFA</p>
                </div>

                <div className="enr-actions">
                  <button className="enr-btn-acheter" onClick={() => allerVers('achat_' + e.musique_id)}>
                    <ShoppingCart size={15} />
                    <span>Acheter</span>
                  </button>
                  <button className="enr-btn-retirer" onClick={() => retirer(e)} title="Retirer">
                    <Trash2 size={15} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default Enregistrements;