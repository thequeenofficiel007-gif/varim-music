import React, { useState, useEffect } from 'react';
import {
  Shield, Users, Music, ShoppingCart, TrendingUp, Wallet,
  ArrowDownToLine, Clock, CheckCircle, XCircle, Ban, Unlock,
  Mic2, Disc, AlertCircle, Calendar, ChevronRight, X, User
} from 'lucide-react';
import NavMobile from './NavMobile';
import './Admin.css';

function Admin({ allerVers, utilisateur, handleDeconnexion }) {
  const [donnees, setDonnees] = useState(null);
  const [chargement, setChargement] = useState(true);
  const [onglet, setOnglet] = useState('comptabilite');
  const [message, setMessage] = useState({ texte: '', type: '' });
  const [filtrePeriode, setFiltrePeriode] = useState('tout');
  const [dateDebut, setDateDebut] = useState('');
  const [dateFin, setDateFin] = useState('');
  const [artisteSelectionne, setArtisteSelectionne] = useState(null);

  const getFiltreDates = (periode) => {
    const now = new Date();
    const fmt = d => d.toISOString().split('T')[0];
    if (periode === 'jour') return { debut: fmt(now), fin: fmt(now) };
    if (periode === 'semaine') { const d = new Date(now); d.setDate(d.getDate() - 7); return { debut: fmt(d), fin: fmt(now) }; }
    if (periode === 'mois') { const d = new Date(now); d.setMonth(d.getMonth() - 1); return { debut: fmt(d), fin: fmt(now) }; }
    if (periode === 'annee') { const d = new Date(now); d.setFullYear(d.getFullYear() - 1); return { debut: fmt(d), fin: fmt(now) }; }
    return { debut: '', fin: '' };
  };

  const chargerDonnees = (periode = filtrePeriode, debut = dateDebut, fin = dateFin) => {
    setChargement(true);
    let params = '';
    if (periode !== 'tout' && periode !== 'perso') {
      const dates = getFiltreDates(periode);
      params = `?debut=${dates.debut}&fin=${dates.fin}`;
    } else if (periode === 'perso' && debut && fin) {
      params = `?debut=${debut}&fin=${fin}`;
    }
    fetch('https://varim-music.onrender.com/api/admin/stats${params}`)
      .then(res => res.json())
      .then(data => { setDonnees(data); setChargement(false); })
      .catch(() => setChargement(false));
  };

  useEffect(() => {
    if (!utilisateur || utilisateur.role !== 'admin') { allerVers('accueil'); return; }
    chargerDonnees();
  }, [utilisateur]);

  const appliquerFiltre = (periode) => {
    setFiltrePeriode(periode);
    chargerDonnees(periode);
  };

  const appliquerPersonnalise = () => {
    setFiltrePeriode('perso');
    chargerDonnees('perso', dateDebut, dateFin);
  };

  const traiterRetrait = async (retraitId, statut) => {
    try {
      const rep = await fetch('https://varim-music.onrender.com/api/admin/retrait', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ retrait_id: retraitId, statut })
      });
      const d = await rep.json();
      setMessage({ texte: d.message, type: 'succes' });
      chargerDonnees();
      setTimeout(() => setMessage({ texte: '', type: '' }), 3000);
    } catch { setMessage({ texte: 'Erreur lors du traitement', type: 'erreur' }); }
  };

  const bloquerUtilisateur = async (id, bloquer) => {
    try {
      const rep = await fetch('https://varim-music.onrender.com/api/admin/bloquer', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ utilisateur_id: id, bloquer })
      });
      const d = await rep.json();
      setMessage({ texte: d.message, type: 'succes' });
      chargerDonnees();
      setTimeout(() => setMessage({ texte: '', type: '' }), 3000);
    } catch { setMessage({ texte: 'Erreur', type: 'erreur' }); }
  };

  const s = donnees?.stats || {};
  const ops = donnees?.statsOps || [];
  const getMtn = ops.find(o => o.operateur === 'mtn') || {};
  const getAirtel = ops.find(o => o.operateur === 'airtel') || {};

  const periodes = [
    { id: 'tout', label: 'Tout' },
    { id: 'jour', label: "Aujourd'hui" },
    { id: 'semaine', label: '7 jours' },
    { id: 'mois', label: '30 jours' },
    { id: 'annee', label: 'Année' },
    { id: 'perso', label: 'Perso' },
  ];

  const onglets = [
    { id: 'comptabilite', label: 'Comptabilité', icone: <Wallet size={14} /> },
    { id: 'ventes', label: 'Ventes', icone: <ShoppingCart size={14} /> },
    { id: 'retraits', label: `Retraits${s.retraits_en_attente > 0 ? ` (${s.retraits_en_attente})` : ''}`, icone: <ArrowDownToLine size={14} /> },
    { id: 'utilisateurs', label: 'Utilisateurs', icone: <Users size={14} /> },
    { id: 'artistes', label: 'Artistes', icone: <Mic2 size={14} /> },
  ];

  if (chargement) return (
    <div className="adm-page">
      <div className="adm-chargement">Chargement...</div>
    </div>
  );

  return (
    <div className="adm-page">
      <header className="adm-header">
        <div className="adm-header-logo" onClick={() => allerVers('accueil')}>
          <img src="/logo.png" alt="Varim Music" className="adm-logo-img" />
          <span>Varim Music</span>
        </div>
        <NavMobile utilisateur={utilisateur} allerVers={allerVers} handleDeconnexion={handleDeconnexion} />
      </header>

      <div className="adm-contenu">
        <div className="adm-titre-wrapper">
          <Shield size={20} className="adm-titre-ic" />
          <h1 className="adm-titre">Panel Admin</h1>
        </div>

        {/* MESSAGE */}
        {message.texte && (
          <div className={`adm-message ${message.type}`}>
            {message.type === 'succes' ? <CheckCircle size={14} /> : <AlertCircle size={14} />}
            {message.texte}
          </div>
        )}

        {/* ALERTE RETRAITS */}
        {s.retraits_en_attente > 0 && (
          <div className="adm-alerte" onClick={() => setOnglet('retraits')}>
            <AlertCircle size={16} />
            <strong>{s.retraits_en_attente} retrait{s.retraits_en_attente > 1 ? 's' : ''}</strong> en attente
            <ChevronRight size={14} className="adm-alerte-arrow" />
          </div>
        )}

        {/* FILTRE PÉRIODE */}
        <div className="adm-filtres-periode">
          {periodes.map(p => (
            <button key={p.id} className={`adm-filtre-btn ${filtrePeriode === p.id ? 'actif' : ''}`} onClick={() => appliquerFiltre(p.id)}>
              {p.label}
            </button>
          ))}
        </div>
        {filtrePeriode === 'perso' && (
          <div className="adm-filtre-perso">
            <input type="date" value={dateDebut} onChange={e => setDateDebut(e.target.value)} />
            <span>→</span>
            <input type="date" value={dateFin} onChange={e => setDateFin(e.target.value)} />
            <button onClick={appliquerPersonnalise} className="adm-btn-appliquer">OK</button>
          </div>
        )}

        {/* STATS RAPIDES */}
        <div className="adm-stats-grille">
          <div className="adm-stat-card">
            <div className="adm-stat-ic blue"><Users size={16} /></div>
            <p className="adm-stat-val">{s.total_utilisateurs}</p>
            <p className="adm-stat-lab">Utilisateurs</p>
          </div>
          <div className="adm-stat-card">
            <div className="adm-stat-ic purple"><Mic2 size={16} /></div>
            <p className="adm-stat-val">{s.total_artistes}</p>
            <p className="adm-stat-lab">Artistes</p>
          </div>
          <div className="adm-stat-card">
            <div className="adm-stat-ic green"><Music size={16} /></div>
            <p className="adm-stat-val">{s.total_musiques}</p>
            <p className="adm-stat-lab">Titres</p>
          </div>
          <div className="adm-stat-card">
            <div className="adm-stat-ic orange"><ShoppingCart size={16} /></div>
            <p className="adm-stat-val">{s.total_achats}</p>
            <p className="adm-stat-lab">Ventes</p>
          </div>
          <div className="adm-stat-card highlight">
            <div className="adm-stat-ic gold"><Wallet size={16} /></div>
            <p className="adm-stat-val gold">{Number(s.total_commissions || 0).toLocaleString()} FCFA</p>
            <p className="adm-stat-lab">Mes commissions</p>
          </div>
          <div className="adm-stat-card">
            <div className="adm-stat-ic teal"><TrendingUp size={16} /></div>
            <p className="adm-stat-val">{Number(s.total_revenus || 0).toLocaleString()} FCFA</p>
            <p className="adm-stat-lab">Chiffre d'affaires</p>
          </div>
        </div>

        {/* ONGLETS */}
        <div className="adm-onglets">
          {onglets.map(o => (
            <button key={o.id} className={`adm-onglet ${onglet === o.id ? 'actif' : ''}`} onClick={() => setOnglet(o.id)}>
              {o.icone} {o.label}
            </button>
          ))}
        </div>

        {/* COMPTABILITÉ */}
        {onglet === 'comptabilite' && (
          <div className="adm-section">
            <h2 className="adm-section-titre">Comptabilité détaillée</h2>

            <div className="adm-compta-grille">
              <div className="adm-compta-card">
                <p className="adm-compta-label">Chiffre d'affaires total</p>
                <p className="adm-compta-val blue">{Number(s.total_revenus || 0).toLocaleString()} FCFA</p>
              </div>
              <div className="adm-compta-card">
                <p className="adm-compta-label">Reversé aux artistes</p>
                <p className="adm-compta-val green">{Number(s.total_revenus_artistes || 0).toLocaleString()} FCFA</p>
              </div>
              <div className="adm-compta-card highlight">
                <p className="adm-compta-label">Mes commissions (gains nets)</p>
                <p className="adm-compta-val gold">{Number(s.total_commissions || 0).toLocaleString()} FCFA</p>
              </div>
              <div className="adm-compta-card">
                <p className="adm-compta-label">Total retraits traités</p>
                <p className="adm-compta-val orange">{Number(s.total_retire || 0).toLocaleString()} FCFA</p>
              </div>
              <div className="adm-compta-card">
                <p className="adm-compta-label">Singles publiés</p>
                <p className="adm-compta-val">{s.total_singles || 0}</p>
              </div>
              <div className="adm-compta-card">
                <p className="adm-compta-label">Albums publiés</p>
                <p className="adm-compta-val">{s.total_albums || 0}</p>
              </div>
              <div className="adm-compta-card">
                <p className="adm-compta-label">Abonnements artistes</p>
                <p className="adm-compta-val">{s.total_abonnements || 0}</p>
              </div>
              <div className="adm-compta-card">
                <p className="adm-compta-label">Retraits en attente</p>
                <p className="adm-compta-val orange">{s.retraits_en_attente || 0}</p>
              </div>
            </div>

            <h3 className="adm-sous-titre">Par opérateur</h3>
            <div className="adm-ops-grille">
              <div className="adm-op-card mtn">
                <span className="adm-op-badge mtn">MTN</span>
                <div className="adm-op-lignes">
                  <div className="adm-op-ligne"><span>Ventes</span><strong>{getMtn.nb_ventes || 0}</strong></div>
                  <div className="adm-op-ligne"><span>Chiffre d'affaires</span><strong>{Number(getMtn.total_montant || 0).toLocaleString()} FCFA</strong></div>
                  <div className="adm-op-ligne"><span>Mes commissions</span><strong className="gold">{Number(getMtn.total_commission || 0).toLocaleString()} FCFA</strong></div>
                </div>
              </div>
              <div className="adm-op-card airtel">
                <span className="adm-op-badge airtel">Airtel</span>
                <div className="adm-op-lignes">
                  <div className="adm-op-ligne"><span>Ventes</span><strong>{getAirtel.nb_ventes || 0}</strong></div>
                  <div className="adm-op-ligne"><span>Chiffre d'affaires</span><strong>{Number(getAirtel.total_montant || 0).toLocaleString()} FCFA</strong></div>
                  <div className="adm-op-ligne"><span>Mes commissions</span><strong className="gold">{Number(getAirtel.total_commission || 0).toLocaleString()} FCFA</strong></div>
                </div>
              </div>
            </div>

            {donnees?.ventesParJour?.length > 0 && (
              <>
                <h3 className="adm-sous-titre">Ventes des 30 derniers jours</h3>
                <div className="adm-historique-liste">
                  {donnees.ventesParJour.slice().reverse().map((j, i) => (
                    <div key={i} className="adm-hist-ligne">
                      <span className="adm-hist-date">{new Date(j.jour).toLocaleDateString('fr-FR')}</span>
                      <span className="adm-hist-ventes">{j.nb_ventes} vente{j.nb_ventes > 1 ? 's' : ''}</span>
                      <span className="adm-hist-ca">{Number(j.chiffre_affaires).toLocaleString()} FCFA</span>
                      <span className="adm-hist-comm gold">+{Number(j.commissions).toLocaleString()}</span>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        )}

        {/* VENTES */}
        {onglet === 'ventes' && (
          <div className="adm-section">
            <h2 className="adm-section-titre">Dernières ventes ({donnees?.ventes?.length || 0})</h2>
            {donnees?.ventes?.length === 0
              ? <div className="adm-vide"><ShoppingCart size={40} /><p>Aucune vente sur cette période.</p></div>
              : <div className="adm-ventes-liste">
                {donnees.ventes.map(v => (
                  <div key={v.id} className="adm-vente-ligne">
                    <div className="adm-vente-infos">
                      <p className="adm-vente-titre">{v.titre} <span className="adm-badge">{v.type}</span></p>
                      <p className="adm-vente-meta">Acheteur : {v.acheteur_prenom} · Artiste : {v.artiste_prenom}</p>
                      <p className="adm-vente-date">{new Date(v.date_achat).toLocaleDateString('fr-FR')}</p>
                    </div>
                    <div className="adm-vente-droite">
                      <p className="adm-vente-montant">{v.montant} FCFA</p>
                      <p className="adm-vente-comm">+{v.commission} comm.</p>
                      <span className={`adm-op-badge ${v.operateur}`}>{v.operateur?.toUpperCase()}</span>
                    </div>
                  </div>
                ))}
              </div>
            }
          </div>
        )}

        {/* RETRAITS */}
        {onglet === 'retraits' && (
          <div className="adm-section">
            <h2 className="adm-section-titre">Gestion des retraits</h2>
            {donnees?.retraits?.length === 0
              ? <div className="adm-vide"><ArrowDownToLine size={40} /><p>Aucun retrait.</p></div>
              : <div className="adm-retraits-liste">
                {donnees.retraits.map(r => (
                  <div key={r.id} className="adm-retrait-carte">
                    {/* ARTISTE CLIQUABLE */}
                    <div className="adm-retrait-artiste" onClick={() => setArtisteSelectionne(r)}>
                      <div className="adm-retrait-avatar">
                        {r.photo_profil
                          ? <img src={r.photo_profil} alt={r.artiste_prenom} />
                          : <span>{(r.nom_artiste || r.artiste_prenom)?.[0]?.toUpperCase()}</span>
                        }
                      </div>
                      <div>
                        <p className="adm-retrait-nom">{r.nom_artiste || r.artiste_prenom}</p>
                        <p className="adm-retrait-tel">{r.telephone}</p>
                      </div>
                      <ChevronRight size={14} className="adm-retrait-arrow" />
                    </div>
                    {/* DÉTAILS RETRAIT */}
                    <div className="adm-retrait-details">
                      <div className="adm-retrait-ligne">
                        <span className={`adm-op-badge ${r.operateur}`}>{r.operateur?.toUpperCase()}</span>
                        <span className="adm-retrait-numero">+242 {r.numero_retrait}</span>
                        <span className="adm-retrait-montant">{Number(r.montant).toLocaleString()} FCFA</span>
                      </div>
                      <div className="adm-retrait-ligne">
                        <span className="adm-retrait-date"><Calendar size={11} /> {new Date(r.date_demande).toLocaleDateString('fr-FR')}</span>
                        <span className={`adm-retrait-statut ${r.statut}`}>
                          {r.statut === 'en_attente' && <><Clock size={10} /> En attente</>}
                          {r.statut === 'traite' && <><CheckCircle size={10} /> Traité</>}
                          {r.statut === 'annule' && <><XCircle size={10} /> Annulé</>}
                        </span>
                      </div>
                      {r.statut === 'en_attente' && (
                        <div className="adm-retrait-actions">
                          <button className="adm-btn-traiter" onClick={() => traiterRetrait(r.id, 'traite')}>
                            <CheckCircle size={13} /> Marquer traité
                          </button>
                          <button className="adm-btn-annuler" onClick={() => traiterRetrait(r.id, 'annule')}>
                            <XCircle size={13} /> Annuler
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            }
          </div>
        )}

        {/* UTILISATEURS */}
        {onglet === 'utilisateurs' && (
          <div className="adm-section">
            <h2 className="adm-section-titre">Utilisateurs ({donnees?.utilisateurs?.length || 0})</h2>
            <div className="adm-users-liste">
              {donnees?.utilisateurs?.map(u => (
                <div key={u.id} className="adm-user-ligne">
                  <div className="adm-user-infos">
                    <div className="adm-user-avatar">{u.prenom?.[0]?.toUpperCase()}</div>
                    <div>
                      <p className="adm-user-nom">{u.prenom} <span className={`adm-badge ${u.role}`}>{u.role}</span></p>
                      <p className="adm-user-meta">{u.telephone} · {new Date(u.date_inscription).toLocaleDateString('fr-FR')}</p>
                      <p className="adm-user-stats">
                        {u.role === 'artiste' ? `${u.nb_musiques} titre${u.nb_musiques > 1 ? 's' : ''}` : `${u.nb_achats} achat${u.nb_achats > 1 ? 's' : ''}`}
                      </p>
                    </div>
                  </div>
                  <div className="adm-user-actions">
                    {u.bloque
                      ? <span className="adm-user-statut bloque"><Ban size={11} /> Bloqué</span>
                      : <span className="adm-user-statut actif"><CheckCircle size={11} /> Actif</span>
                    }
                    {u.role !== 'admin' && (
                      <button className={u.bloque ? 'adm-btn-debloquer' : 'adm-btn-bloquer'} onClick={() => bloquerUtilisateur(u.id, !u.bloque)}>
                        {u.bloque ? <><Unlock size={12} /> Débloquer</> : <><Ban size={12} /> Bloquer</>}
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TOP ARTISTES */}
        {onglet === 'artistes' && (
          <div className="adm-section">
            <h2 className="adm-section-titre">Top Artistes</h2>
            <div className="adm-artistes-liste">
              {donnees?.topArtistes?.map((a, i) => (
                <div key={a.id} className="adm-artiste-ligne">
                  <span className="adm-artiste-rang">{i + 1}</span>
                  <div className="adm-artiste-avatar">
                    {a.photo_profil ? <img src={a.photo_profil} alt={a.prenom} /> : <span>{(a.nom_artiste || a.prenom)?.[0]?.toUpperCase()}</span>}
                  </div>
                  <div className="adm-artiste-infos">
                    <p className="adm-artiste-nom">{a.nom_artiste || a.prenom}</p>
                    <p className="adm-artiste-meta">{a.telephone} · {a.nb_musiques} titre{a.nb_musiques > 1 ? 's' : ''}</p>
                  </div>
                  <div className="adm-artiste-stats">
                    <p className="adm-artiste-ventes">{a.nb_ventes} ventes</p>
                    <p className="adm-artiste-revenus">{Number(a.revenus).toLocaleString()} FCFA</p>
                    <p className="adm-artiste-comm">Comm. : {Number(a.commissions_generees).toLocaleString()}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* MODAL ARTISTE (retrait) */}
      {artisteSelectionne && (
        <div className="adm-modal-overlay" onClick={() => setArtisteSelectionne(null)}>
          <div className="adm-modal" onClick={e => e.stopPropagation()}>
            <button className="adm-modal-fermer" onClick={() => setArtisteSelectionne(null)}><X size={18} /></button>
            <div className="adm-modal-avatar">
              {artisteSelectionne.photo_profil
                ? <img src={artisteSelectionne.photo_profil} alt={artisteSelectionne.artiste_prenom} />
                : <span>{(artisteSelectionne.nom_artiste || artisteSelectionne.artiste_prenom)?.[0]?.toUpperCase()}</span>
              }
            </div>
            <h2 className="adm-modal-nom">{artisteSelectionne.nom_artiste || artisteSelectionne.artiste_prenom}</h2>
            <p className="adm-modal-tel">{artisteSelectionne.telephone}</p>
            <div className="adm-modal-stats">
              <div className="adm-modal-stat">
                <p className="adm-modal-stat-val">{artisteSelectionne.nb_musiques}</p>
                <p className="adm-modal-stat-lab">Titres</p>
              </div>
              <div className="adm-modal-stat">
                <p className="adm-modal-stat-val">{artisteSelectionne.nb_ventes}</p>
                <p className="adm-modal-stat-lab">Ventes</p>
              </div>
              <div className="adm-modal-stat">
                <p className="adm-modal-stat-val gold">{Number(artisteSelectionne.total_gains || 0).toLocaleString()}</p>
                <p className="adm-modal-stat-lab">Gains totaux (FCFA)</p>
              </div>
              <div className="adm-modal-stat">
                <p className="adm-modal-stat-val orange">{Number(artisteSelectionne.total_retire || 0).toLocaleString()}</p>
                <p className="adm-modal-stat-lab">Total retiré (FCFA)</p>
              </div>
              <div className="adm-modal-stat">
                <p className="adm-modal-stat-val blue">{Number((artisteSelectionne.total_gains || 0) - (artisteSelectionne.total_retire || 0)).toLocaleString()}</p>
                <p className="adm-modal-stat-lab">Solde restant (FCFA)</p>
              </div>
            </div>
            <div className="adm-modal-retrait-info">
              <p>Retrait en cours : <strong>{Number(artisteSelectionne.montant).toLocaleString()} FCFA</strong></p>
              <p>Via <span className={`adm-op-badge ${artisteSelectionne.operateur}`}>{artisteSelectionne.operateur?.toUpperCase()}</span> · +242 {artisteSelectionne.numero_retrait}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Admin;