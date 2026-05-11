import React, { useState, useEffect } from 'react';
import {
  Music, ShoppingCart, TrendingUp, ArrowDownToLine, Bell,
  Clock, Upload, LayoutDashboard, Disc, AlertCircle,
  CheckCircle, XCircle, ChevronRight, Users, Trophy, Star
} from 'lucide-react';
import NavMobile from './NavMobile';
import VerifierPin from './VerifierPin';
import './Dashboard.css';

function Dashboard({ allerVers, utilisateur, handleDeconnexion }) {
  const [donnees, setDonnees] = useState(null);
  const [chargement, setChargement] = useState(true);
  const [onglet, setOnglet] = useState('musiques');
  const [pinVerifie, setPinVerifie] = useState(false);

  useEffect(() => {
    if (!utilisateur || utilisateur.role !== 'artiste') { allerVers('accueil'); return; }
    fetch(`/api/dashboard/${utilisateur.id}`)
      .then(res => res.json())
      .then(data => { setDonnees(data); setChargement(false); })
      .catch(() => setChargement(false));
  }, [utilisateur]);

  if (!pinVerifie) {
    return <VerifierPin utilisateur={utilisateur} titre="Accès Dashboard" onSuccess={() => setPinVerifie(true)} onCancel={() => allerVers('accueil')} />;
  }

  if (chargement) return (
    <div className="dash-page">
      <div className="dash-chargement">Chargement...</div>
    </div>
  );

  // Meilleure musique
  const meilleureMusique = donnees?.musiques?.find(m => m.nb_ventes_reel > 0);

  const onglets = [
    { id: 'musiques', label: 'Mes titres', icone: <Music size={15} /> },
    { id: 'ventes', label: 'Ventes', icone: <ShoppingCart size={15} /> },
    { id: 'retraits', label: 'Retraits', icone: <Clock size={15} /> },
  ];

  return (
    <div className="dash-page">

      {/* HEADER */}
      <header className="dash-header">
        <div className="dash-header-logo" onClick={() => allerVers('accueil')}>
          <img src="/logo.png" alt="Varim Music" className="dash-logo-img" />
          <span>Varim Music</span>
        </div>
        <NavMobile utilisateur={utilisateur} allerVers={allerVers} handleDeconnexion={handleDeconnexion} />
      </header>

      <div className="dash-contenu">

        {/* TITRE + BOUTON PUBLIER */}
        <div className="dash-titre-wrapper">
          <div>
            <h1 className="dash-titre">Dashboard</h1>
            <p className="dash-sous-titre">Bonjour, {utilisateur?.prenom} 👋</p>
          </div>
          <button className="dash-btn-publier" onClick={() => allerVers('upload')}>
            <Upload size={15} /> Publier
          </button>
        </div>

        {/* 4 STATS CARDS */}
        <div className="dash-stats">
          <div className="dash-stat-card">
            <div className="dash-stat-icone musiques"><Music size={16} /></div>
            <p className="dash-stat-val">{donnees?.musiques?.length || 0}</p>
            <p className="dash-stat-label">Titres</p>
          </div>
          <div className="dash-stat-card">
            <div className="dash-stat-icone ventes"><ShoppingCart size={16} /></div>
            <p className="dash-stat-val">{donnees?.totaux?.total_ventes || 0}</p>
            <p className="dash-stat-label">Ventes</p>
          </div>
          <div className="dash-stat-card">
            <div className="dash-stat-icone abonnes"><Users size={16} /></div>
            <p className="dash-stat-val">{donnees?.nb_abonnes || 0}</p>
            <p className="dash-stat-label">Abonnés</p>
          </div>
          <div className="dash-stat-card gains" onClick={() => allerVers('retrait')}>
            <div className="dash-stat-icone gains-ic"><TrendingUp size={16} /></div>
            <p className="dash-stat-val gains-val">{donnees?.totaux?.total_revenus_nets || 0}</p>
            <p className="dash-stat-label">FCFA dispo</p>
          </div>
        </div>

        {/* MEILLEURE MUSIQUE */}
        {meilleureMusique && (
          <div className="dash-best">
            <div className="dash-best-header">
              <Trophy size={14} className="dash-best-ic" />
              <span>Meilleure performance</span>
            </div>
            <div className="dash-best-contenu">
              <div className="dash-best-pochette">
                {meilleureMusique.pochette_url
                  ? <img src={meilleureMusique.pochette_url} alt={meilleureMusique.titre} />
                  : <div className="dash-pochette-vide"><Music size={20} /></div>
                }
              </div>
              <div className="dash-best-info">
                <p className="dash-best-titre">{meilleureMusique.titre}</p>
                <p className="dash-best-meta">{meilleureMusique.type} · {meilleureMusique.genre}</p>
                <div className="dash-best-chiffres">
                  <span><ShoppingCart size={11} /> {meilleureMusique.nb_ventes_reel} ventes</span>
                  <span className="dash-best-gains"><TrendingUp size={11} /> {meilleureMusique.revenus_total} FCFA</span>
                </div>
              </div>
              <Star size={18} className="dash-best-star" />
            </div>
          </div>
        )}

        {/* SOLDES OPÉRATEURS */}
        <div className="dash-soldes">
          <div className="dash-solde mtn">
            <span className="dash-op-badge mtn">MTN</span>
            <div>
              <p className="dash-solde-montant">{donnees?.totaux?.solde_mtn || 0} FCFA</p>
              {!utilisateur?.numero_mtn && <p className="dash-solde-warning"><AlertCircle size={10} /> Non configuré</p>}
            </div>
          </div>
          <div className="dash-solde airtel">
            <span className="dash-op-badge airtel">Airtel</span>
            <div>
              <p className="dash-solde-montant">{donnees?.totaux?.solde_airtel || 0} FCFA</p>
              {!utilisateur?.numero_airtel && <p className="dash-solde-warning"><AlertCircle size={10} /> Non configuré</p>}
            </div>
          </div>
        </div>

        {/* BOUTON RETRAIT */}
        <button className="dash-btn-retrait" onClick={() => allerVers('retrait')}>
          <ArrowDownToLine size={16} /> Faire un retrait
        </button>

        {/* ONGLETS */}
        <div className="dash-onglets">
          {onglets.map(o => (
            <button key={o.id} className={`dash-onglet ${onglet === o.id ? 'actif' : ''}`} onClick={() => setOnglet(o.id)}>
              {o.icone} {o.label}
            </button>
          ))}
        </div>

        {/* MES TITRES — avec stats par musique */}
        {onglet === 'musiques' && (
          <div className="dash-section">
            {donnees?.musiques?.length === 0 ? (
              <div className="dash-vide">
                <Music size={40} className="dash-vide-icone" />
                <p>Aucune musique publiée.</p>
                <button className="dash-btn-publier-grand" onClick={() => allerVers('upload')}>
                  <Upload size={15} /> Publier ma première musique
                </button>
              </div>
            ) : (
              <div className="dash-musiques-liste">
                {donnees?.musiques?.map((m, i) => (
                  <div key={m.id} className="dash-musique-ligne">
                    {/* RANG */}
                    <span className={`dash-rang ${i === 0 && m.nb_ventes_reel > 0 ? 'or' : ''}`}>
                      {i + 1}
                    </span>

                    {/* POCHETTE */}
                    <div className="dash-musique-pochette">
                      {m.pochette_url
                        ? <img src={m.pochette_url} alt={m.titre} />
                        : <div className="dash-pochette-vide">{m.type === 'album' ? <Disc size={16} /> : <Music size={16} />}</div>
                      }
                    </div>

                    {/* INFOS */}
                    <div className="dash-musique-info">
                      <p className="dash-musique-titre">{m.titre}</p>
                      <p className="dash-musique-meta">{m.type === 'album' ? 'Album' : 'Single'} · {m.genre}</p>
                      <p className="dash-musique-prix">{m.prix} FCFA</p>
                    </div>

                    {/* STATS PAR MUSIQUE */}
                    <div className="dash-musique-stats">
                      <div className="dash-mini-stat">
                        <span className="dash-mini-val">{m.nb_ventes_reel || 0}</span>
                        <span className="dash-mini-label">ventes</span>
                      </div>
                      <div className="dash-mini-stat">
                        <span className="dash-mini-val gains-val">{m.revenus_total || 0}</span>
                        <span className="dash-mini-label">FCFA</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* DERNIÈRES VENTES */}
        {onglet === 'ventes' && (
          <div className="dash-section">
            {donnees?.dernieresVentes?.length === 0 ? (
              <div className="dash-vide">
                <ShoppingCart size={40} className="dash-vide-icone" />
                <p>Aucune vente pour l'instant.</p>
              </div>
            ) : (
              <div className="dash-ventes-liste">
                {donnees?.dernieresVentes?.map(v => (
                  <div key={v.id} className="dash-vente-ligne">
                    <div className="dash-vente-info">
                      <p className="dash-vente-titre">{v.titre}</p>
                      <p className="dash-vente-acheteur">
                        par {v.acheteur_prenom} ·{' '}
                        <span className={`dash-badge-op ${v.operateur}`}>{v.operateur?.toUpperCase()}</span>
                      </p>
                      <p className="dash-vente-date">{new Date(v.date_achat).toLocaleDateString('fr-FR')}</p>
                    </div>
                    <p className="dash-vente-revenu">+{v.revenu_artiste} FCFA</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* HISTORIQUE RETRAITS */}
        {onglet === 'retraits' && (
          <div className="dash-section">
            <button className="dash-btn-retrait-section" onClick={() => allerVers('retrait')}>
              <ArrowDownToLine size={15} /> Nouveau retrait
            </button>
            {donnees?.historiqueRetraits?.length === 0 ? (
              <div className="dash-vide">
                <Clock size={40} className="dash-vide-icone" />
                <p>Aucun retrait effectué.</p>
              </div>
            ) : (
              <div className="dash-retraits-liste">
                {donnees?.historiqueRetraits?.map(r => (
                  <div key={r.id} className="dash-retrait-ligne">
                    <div className="dash-retrait-gauche">
                      <span className={`dash-badge-op ${r.operateur}`}>{r.operateur?.toUpperCase()}</span>
                      <div>
                        <p className="dash-retrait-numero">+242 {r.numero_retrait}</p>
                        <p className="dash-retrait-date">{new Date(r.date_demande).toLocaleDateString('fr-FR')}</p>
                      </div>
                    </div>
                    <div className="dash-retrait-droite">
                      <p className="dash-retrait-montant">{r.montant} FCFA</p>
                      <span className={`dash-retrait-statut ${r.statut}`}>
                        {r.statut === 'en_attente' && <><Clock size={10} /> En attente</>}
                        {r.statut === 'traite'     && <><CheckCircle size={10} /> Traité</>}
                        {r.statut === 'annule'     && <><XCircle size={10} /> Annulé</>}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default Dashboard;