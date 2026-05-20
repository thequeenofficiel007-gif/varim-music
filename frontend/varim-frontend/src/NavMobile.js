import React, { useState, useEffect } from 'react';
import { Menu, X, Home, Music, TrendingUp, BookOpen, Sparkles,
         Upload, LayoutDashboard, Settings, LogOut, Shield, Heart, Bookmark } from 'lucide-react';
import './NavMobile.css';

// Clé unique partagée entre NavMobile et Nouveautes
const BADGE_KEY = 'varim_badge_nouveautes_';
const VISITE_KEY = 'varim_nouveautes_derniere_visite_';

function NavMobile({ utilisateur, allerVers, handleDeconnexion }) {
  const [ouvert, setOuvert] = useState(false);
  const [aNouveautes, setANouveautes] = useState(false);

  useEffect(() => {
    if (!utilisateur) return;

    const verifierBadge = () => {
      setANouveautes(localStorage.getItem(BADGE_KEY + utilisateur.id) === 'true');
    };

    verifierBadge();
    window.addEventListener('varim_badge_update', verifierBadge);
    return () => window.removeEventListener('varim_badge_update', verifierBadge);
  }, [utilisateur]);

  // Vérifier les nouvelles publications toutes les 5 minutes
  useEffect(() => {
    if (!utilisateur) return;

    const verifier = async () => {
      try {
        const derniereVisite = localStorage.getItem(VISITE_KEY + utilisateur.id);
        // Si jamais visité, on sauvegarde maintenant et on ne met pas de badge
        if (!derniereVisite) {
          localStorage.setItem(VISITE_KEY + utilisateur.id, new Date().toISOString());
          return;
        }
        const res = await fetch('https://varim-music.onrender.com/api/musiques/suivis/${utilisateur.id}`);
        const data = await res.json();
        const aNouvellesPublications = (data.musiques || []).some(
          m => new Date(m.date_ajout) > new Date(derniereVisite)
        );
        if (aNouvellesPublications) {
          localStorage.setItem(BADGE_KEY + utilisateur.id, 'true');
          setANouveautes(true);
          window.dispatchEvent(new Event('varim_badge_update'));
        }
      } catch {}
    };

    verifier();
    const interval = setInterval(verifier, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, [utilisateur]);

  const naviguer = (page) => {
    allerVers(page);
    setOuvert(false);
  };

  return (
    <>
      <div className="hamburger-wrapper">
        <button className="hamburger" onClick={() => setOuvert(!ouvert)}>
          {ouvert ? <X size={22} /> : <Menu size={22} />}
        </button>
        {aNouveautes && <span className="hamburger-badge" />}
      </div>

      {ouvert && (
        <div className="nav-mobile-overlay" onClick={() => setOuvert(false)}>
          <div className="nav-mobile-menu" onClick={e => e.stopPropagation()}>
            <div className="nav-mobile-header">
              {utilisateur ? (
                <div className="nav-mobile-user">
                  <div className="nav-mobile-avatar">
                    {utilisateur.photo_profil
                      ? <img src={utilisateur.photo_profil} alt={utilisateur.prenom} />
                      : <span>{utilisateur.prenom?.[0]?.toUpperCase()}</span>
                    }
                  </div>
                  <div>
                    <p className="nav-mobile-prenom">{utilisateur.prenom}</p>
                    <p className="nav-mobile-role">{utilisateur.role}</p>
                  </div>
                </div>
              ) : (
                <p className="nav-mobile-invite">Bienvenue sur Varim Music</p>
              )}
            </div>

            <nav className="nav-mobile-liens">
              <button className="nav-mobile-lien" onClick={() => naviguer('accueil')}>
                <Home size={18} /> Accueil
              </button>
              <button className="nav-mobile-lien" onClick={() => naviguer('catalogue')}>
                <Music size={18} /> Catalogue
              </button>
              <button className="nav-mobile-lien" onClick={() => naviguer('nouveautes')}>
                <Sparkles size={18} /> Nouveautés
                {aNouveautes && <span className="nav-lien-badge" />}
              </button>
              <button className="nav-mobile-lien" onClick={() => naviguer('topventes')}>
                <TrendingUp size={18} /> Top Ventes
              </button>

              {utilisateur && (
                <button className="nav-mobile-lien nav-mobile-lien-favoris" onClick={() => naviguer('favoris')}>
                  <Heart size={18} /> Mes Favoris
                </button>
              )}

              {utilisateur && (
                <button className="nav-mobile-lien nav-mobile-lien-enregistrements" onClick={() => naviguer('enregistrements')}>
                  <Bookmark size={18} /> Mes Enregistrements
                </button>
              )}

              {utilisateur && (
                <button className="nav-mobile-lien" onClick={() => naviguer('bibliotheque')}>
                  <BookOpen size={18} /> Ma Bibliothèque
                </button>
              )}

              {utilisateur?.role === 'artiste' && (
                <>
                  <div className="nav-mobile-separateur" />
                  <button className="nav-mobile-lien nav-mobile-lien-publier" onClick={() => naviguer('upload')}>
                    <Upload size={18} /> Publier une musique
                  </button>
                  <button className="nav-mobile-lien" onClick={() => naviguer('dashboard')}>
                    <LayoutDashboard size={18} /> Dashboard
                  </button>
                  <button className="nav-mobile-lien" onClick={() => naviguer('retrait')}>
                    <Settings size={18} /> Retrait
                  </button>
                </>
              )}

              {utilisateur?.role === 'admin' && (
                <>
                  <div className="nav-mobile-separateur" />
                  <button className="nav-mobile-lien" onClick={() => naviguer('admin')}>
                    <Shield size={18} /> Administration
                  </button>
                </>
              )}

              <div className="nav-mobile-separateur" />

              {utilisateur ? (
                <>
                  <button className="nav-mobile-lien" onClick={() => naviguer('mon-compte')}>
                    <Settings size={18} /> Mon Compte
                  </button>
                  <button className="nav-mobile-lien nav-mobile-lien-deconnexion" onClick={handleDeconnexion}>
                    <LogOut size={18} /> Se déconnecter
                  </button>
                </>
              ) : (
                <>
                  <button className="nav-mobile-lien" onClick={() => naviguer('login')}>
                    <LogOut size={18} /> Se connecter
                  </button>
                  <button className="nav-mobile-lien nav-mobile-lien-publier" onClick={() => naviguer('register')}>
                    <Upload size={18} /> Créer un compte
                  </button>
                </>
              )}
            </nav>
          </div>
        </div>
      )}
    </>
  );
}

export default NavMobile;