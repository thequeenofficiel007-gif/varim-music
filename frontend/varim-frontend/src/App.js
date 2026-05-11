import React, { useState, useEffect } from 'react';
import './App.css';
import Login from './Login';
import Register from './Register';
import Upload from './Upload';
import Catalogue from './Catalogue';
import AlbumDetail from './AlbumDetail';
import Achat from './Achat';
import Bibliotheque from './Bibliotheque';
import Dashboard from './Dashboard';
import Nouveautes from './Nouveautes';
import TopVentes from './TopVentes';
import ProfilArtiste from './ProfilArtiste';
import MonCompte from './MonCompte';
import Admin from './Admin';
import Retrait from './Retrait';
import MusiqueDetail from './MusiqueDetail';
import SingleDetail from './SingleDetail';
import Favoris from './Favoris';
import Enregistrements from './Enregistrements';
import PageIntrouvable from './PageIntrouvable';
import NavMobile from './NavMobile';
import { LayoutDashboard, Settings, BookOpen, Shield, LogOut, User, X } from 'lucide-react';

function App() {
  const [page, setPage] = useState('accueil');
  const [utilisateur, setUtilisateur] = useState(null);
  const [menuOuvert, setMenuOuvert] = useState(false);
  const [chargementInitial, setChargementInitial] = useState(true);

  useEffect(() => {
    const u = localStorage.getItem('utilisateur');
    if (u) setUtilisateur(JSON.parse(u));

    // Détecter les paramètres URL pour les liens partagés
    const params = new URLSearchParams(window.location.search);
    const musiqueId = params.get('musique');
    const singleId = params.get('single');
    const albumId = params.get('album');
    const profilId = params.get('profil');
    if (singleId) setPage('single_' + singleId);
    else if (albumId) setPage('album_' + albumId);
    else if (musiqueId) setPage('musique_' + musiqueId);
    else if (profilId) setPage('profil_' + profilId);

    // Fin du chargement initial après un court délai
    setTimeout(() => setChargementInitial(false), 1200);
  }, []);

  const handleDeconnexion = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('utilisateur');
    setUtilisateur(null);
    setPage('accueil');
    setMenuOuvert(false);
  };

  if (chargementInitial) return (
    <div className="app-chargement">
      <div className="app-chargement-logo">
        <img src="/logo.png" alt="Varim Music" className="app-chargement-img" />
        <span>Varim Music</span>
      </div>
      <div className="app-chargement-dots">
        <span /><span /><span />
      </div>
    </div>
  );

  if (page === 'login') return <Login allerVers={setPage} setUtilisateur={setUtilisateur} />;
  if (page === 'register') return <Register allerVers={setPage} />;
  if (page === 'upload') return <Upload allerVers={setPage} utilisateur={utilisateur} />;
  if (page === 'catalogue') return <Catalogue allerVers={setPage} utilisateur={utilisateur} handleDeconnexion={handleDeconnexion} />;
  if (page === 'bibliotheque') return <Bibliotheque allerVers={setPage} utilisateur={utilisateur} handleDeconnexion={handleDeconnexion} />;
  if (page === 'dashboard') return <Dashboard allerVers={setPage} utilisateur={utilisateur} handleDeconnexion={handleDeconnexion} />;
  if (page === 'nouveautes') return <Nouveautes allerVers={setPage} utilisateur={utilisateur} handleDeconnexion={handleDeconnexion} />;
  if (page === 'topventes') return <TopVentes allerVers={setPage} utilisateur={utilisateur} handleDeconnexion={handleDeconnexion} />;
  if (page === 'mon-compte') return <MonCompte allerVers={setPage} utilisateur={utilisateur} setUtilisateur={setUtilisateur} handleDeconnexion={handleDeconnexion} />;
  if (page === 'admin') return <Admin allerVers={setPage} utilisateur={utilisateur} handleDeconnexion={handleDeconnexion} />;
  if (page === 'retrait') return <Retrait allerVers={setPage} utilisateur={utilisateur} handleDeconnexion={handleDeconnexion} />;
  if (page === 'favoris') return <Favoris allerVers={setPage} utilisateur={utilisateur} handleDeconnexion={handleDeconnexion} />;
  if (page === 'enregistrements') return <Enregistrements allerVers={setPage} utilisateur={utilisateur} handleDeconnexion={handleDeconnexion} />;
  if (page && page.startsWith('musique_')) {
    const musiqueId = page.split('_')[1];
    return <MusiqueDetail allerVers={setPage} utilisateur={utilisateur} musiqueId={musiqueId} handleDeconnexion={handleDeconnexion} />;
  }
  if (page && page.startsWith('profil_')) {
    const artisteId = page.split('_')[1];
    return <ProfilArtiste allerVers={setPage} utilisateur={utilisateur} artisteId={artisteId} handleDeconnexion={handleDeconnexion} />;
  }
  if (page && page.startsWith('single_')) {
    const singleId = page.split('_')[1];
    return <SingleDetail allerVers={setPage} utilisateur={utilisateur} musiqueId={singleId} handleDeconnexion={handleDeconnexion} />;
  }
  if (page && page.startsWith('album_')) {
    const albumId = page.split('_')[1];
    return <AlbumDetail allerVers={setPage} utilisateur={utilisateur} albumId={albumId} handleDeconnexion={handleDeconnexion} />;
  }
  if (page && page.startsWith('achat_')) {
    const musiqueId = page.split('_')[1];
    return <Achat allerVers={setPage} utilisateur={utilisateur} musiqueId={musiqueId} />;
  }

  // Page inconnue → 404
  if (page && page !== 'accueil') {
    return <PageIntrouvable allerVers={setPage} />;
  }

  return (
    <div className="app">
      <header className="header">
        <div className="logo" onClick={() => setPage('accueil')}>
          <img src="/logo.png" alt="Varim Music" />
          <span>Varim Music</span>
        </div>

        <div className="auth-buttons">
          {utilisateur && (
            <span className="user-prenom desktop-only">{utilisateur.prenom}</span>
          )}
          {utilisateur?.role === 'artiste' && (
            <button className="btn-dashboard btn-publier-desktop" onClick={() => setPage('upload')}>
              + Publier
            </button>
          )}
          <NavMobile
            utilisateur={utilisateur}
            allerVers={setPage}
            handleDeconnexion={handleDeconnexion}
          />
        </div>
      </header>

      <main className="hero">
        {/* Orbes de lumière */}
        <div className="hero-orb hero-orb-1" />
        <div className="hero-orb hero-orb-2" />

        {/* Particules — générées via CSS */}
        <div className="hero-particules">
          {[...Array(16)].map((_, i) => (
            <div key={i} className={`hero-particule hero-particule-${i + 1}`} />
          ))}
        </div>

        <div className="hero-contenu">
          {/* Logo animé avec fumées */}
          <div className="hero-logo-wrapper">
            <div className="hero-fume hero-fume-1" />
            <div className="hero-fume hero-fume-2" />
            <div className="hero-fume hero-fume-3" />
            <div className="hero-fume hero-fume-4" />
            <img src="/logo.png" alt="Varim Music" className="hero-logo-img" />
          </div>

          {/* Titre */}
          <h1 className="hero-titre">
            <span className="hero-titre-blanc">La révolution ?</span>
            <br />
            <span className="hero-titre-degrade">ça commence maintenant</span>
          </h1>

          <p className="hero-sous-titre">Découvrez, écoutez et soutenez les artistes africains</p>

          <div className="hero-boutons">
            <button className="btn-explore" onClick={() => setPage('catalogue')}>
              Explorer la musique
            </button>
            {utilisateur && (
              <button className="btn-bibliotheque-hero" onClick={() => setPage('bibliotheque')}>
                Ma Bibliothèque
              </button>
            )}
            {!utilisateur && (
              <button className="btn-bibliotheque-hero" onClick={() => setPage('register')}>
                Créer un compte
              </button>
            )}
          </div>
        </div>
      </main>

      {utilisateur && (
        <div className="menu-flottant">
          {menuOuvert && (
            <div className="menu-flottant-items">
              <div className="menu-flottant-prenom">
                <User size={14} /> {utilisateur.prenom}
              </div>
              {utilisateur.role === 'artiste' && (
                <>
                  <div className="menu-flottant-item" onClick={() => { setPage('dashboard'); setMenuOuvert(false); }}>
                    <LayoutDashboard size={15} /> Dashboard
                  </div>
                  <div className="menu-flottant-item" onClick={() => { setPage('mon-compte'); setMenuOuvert(false); }}>
                    <Settings size={15} /> Mon Compte
                  </div>
                </>
              )}
              {utilisateur.role === 'acheteur' && (
                <div className="menu-flottant-item" onClick={() => { setPage('bibliotheque'); setMenuOuvert(false); }}>
                  <BookOpen size={15} /> Ma Bibliothèque
                </div>
              )}
              {utilisateur.role === 'admin' && (
                <div className="menu-flottant-item" onClick={() => { setPage('admin'); setMenuOuvert(false); }}>
                  <Shield size={15} /> Panel Admin
                </div>
              )}
              <div className="menu-flottant-item deconnexion" onClick={handleDeconnexion}>
                <LogOut size={15} /> Déconnexion
              </div>
            </div>
          )}
          <button className="btn-flottant" onClick={() => setMenuOuvert(!menuOuvert)}>
            {menuOuvert ? <X size={20} /> : <User size={20} />}
          </button>
        </div>
      )}
    </div>
  );

}

export default App;