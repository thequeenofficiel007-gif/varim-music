import React, { useState, useEffect } from 'react';
import { ArrowDownToLine, Wallet, AlertCircle, CheckCircle, XCircle, Clock, Settings, ChevronLeft, RefreshCw } from 'lucide-react';
import NavMobile from './NavMobile';
import VerifierPin from './VerifierPin';
import './Retrait.css';

function Retrait({ allerVers, utilisateur, handleDeconnexion }) {
  const [soldes, setSoldes] = useState({ mtn: 0, airtel: 0, total: 0 });
  const [retraits, setRetraits] = useState([]);
  const [operateur, setOperateur] = useState('mtn');
  const [montant, setMontant] = useState('');
  const [message, setMessage] = useState({ texte: '', type: '' });
  const [chargement, setChargement] = useState(false);
  const [pinVerifie, setPinVerifie] = useState(false);
  const [succes, setSucces] = useState(false);

  const chargerDonnees = () => {
    if (utilisateur) {
      fetch(`/api/retraits/${utilisateur.id}`)
        .then(res => res.json())
        .then(data => { setSoldes(data.soldes); setRetraits(data.retraits); });
    }
  };

  useEffect(() => { chargerDonnees(); }, [utilisateur]);

  const handleRetrait = async () => {
    setMessage({ texte: '', type: '' });
    if (!montant || parseInt(montant) < 500) {
      setMessage({ texte: 'Le montant minimum est 500 FCFA.', type: 'erreur' }); return;
    }
    if (operateur === 'mtn' && !utilisateur.numero_mtn) {
      setMessage({ texte: 'Numéro MTN non configuré. Ajoutez-le dans Mon Compte.', type: 'erreur' }); return;
    }
    if (operateur === 'airtel' && !utilisateur.numero_airtel) {
      setMessage({ texte: 'Numéro Airtel non configuré. Ajoutez-le dans Mon Compte.', type: 'erreur' }); return;
    }
    const soldeDisponible = operateur === 'mtn' ? soldes.mtn : soldes.airtel;
    if (parseInt(montant) > soldeDisponible) {
      setMessage({ texte: `Solde insuffisant. Vous avez ${soldeDisponible} FCFA disponibles.`, type: 'erreur' }); return;
    }

    setChargement(true);
    try {
      const reponse = await fetch('/api/retraits', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ artiste_id: utilisateur.id, operateur, montant: parseInt(montant) })
      });
      const donnees = await reponse.json();
      if (reponse.ok) {
        setSucces(true);
        chargerDonnees();
      } else {
        setMessage({ texte: donnees.message, type: 'erreur' });
      }
    } catch {
      setMessage({ texte: 'Impossible de contacter le serveur.', type: 'erreur' });
    }
    setChargement(false);
  };

  if (!pinVerifie) {
    return <VerifierPin utilisateur={utilisateur} titre="Accès Retrait" onSuccess={() => setPinVerifie(true)} onCancel={() => allerVers('dashboard')} />;
  }

  const soldeActif = operateur === 'mtn' ? soldes.mtn : soldes.airtel;
  const numeroActif = operateur === 'mtn' ? utilisateur?.numero_mtn : utilisateur?.numero_airtel;

  return (
    <div className="ret-page">

      {/* HEADER */}
      <header className="ret-header">
        <div className="ret-header-logo" onClick={() => allerVers('accueil')}>
          <img src="/logo.png" alt="Varim Music" className="ret-logo-img" />
          <span>Varim Music</span>
        </div>
        <NavMobile utilisateur={utilisateur} allerVers={allerVers} handleDeconnexion={handleDeconnexion} />
      </header>

      <div className="ret-contenu">

        {/* RETOUR + TITRE */}
        <button className="ret-retour" onClick={() => allerVers('dashboard')}>
          <ChevronLeft size={16} /> Dashboard
        </button>

        <div className="ret-titre-wrapper">
          <ArrowDownToLine size={20} />
          <h1 className="ret-titre">Retirer mes gains</h1>
        </div>

        {/* SOLDES */}
        <div className="ret-soldes">
          <div className="ret-solde-total">
            <Wallet size={18} className="ret-wallet-ic" />
            <div>
              <p className="ret-solde-val">{soldes.total} FCFA</p>
              <p className="ret-solde-lab">Total disponible</p>
            </div>
          </div>
          <div className="ret-soldes-ops">
            <div className="ret-solde-op mtn">
              <span className="ret-op-badge mtn">MTN</span>
              <div>
                <p className="ret-op-montant">{soldes.mtn} FCFA</p>
                {utilisateur?.numero_mtn
                  ? <p className="ret-op-numero">+242 {utilisateur.numero_mtn}</p>
                  : <p className="ret-op-warning"><AlertCircle size={11} /> Non configuré</p>
                }
              </div>
            </div>
            <div className="ret-solde-op airtel">
              <span className="ret-op-badge airtel">Airtel</span>
              <div>
                <p className="ret-op-montant">{soldes.airtel} FCFA</p>
                {utilisateur?.numero_airtel
                  ? <p className="ret-op-numero">+242 {utilisateur.numero_airtel}</p>
                  : <p className="ret-op-warning"><AlertCircle size={11} /> Non configuré</p>
                }
              </div>
            </div>
          </div>
        </div>

        {/* FORMULAIRE OU SUCCÈS */}
        <div className="ret-box">
          {succes ? (
            <div className="ret-succes">
              <div className="ret-succes-ic"><CheckCircle size={40} /></div>
              <h2>Demande envoyée !</h2>
              <p>Vous recevrez <strong>{montant} FCFA</strong> sur votre numéro <strong>{operateur.toUpperCase()}</strong> +242 {numeroActif} sous 24–48h.</p>
              <button className="ret-btn-primaire" onClick={() => { setSucces(false); setMontant(''); setMessage({ texte: '', type: '' }); }}>
                <RefreshCw size={15} /> Nouveau retrait
              </button>
              <button className="ret-btn-secondaire" onClick={() => allerVers('dashboard')}>
                Retour au Dashboard
              </button>
            </div>
          ) : (
            <>
              <h2 className="ret-box-titre">Nouvelle demande</h2>

              {message.texte && (
                <div className={`ret-message ${message.type}`}>
                  <AlertCircle size={14} /> {message.texte}
                </div>
              )}

              {/* CHOIX OPÉRATEUR */}
              <div className="ret-champ">
                <label>Opérateur</label>
                <div className="ret-operateurs">
                  {['mtn', 'airtel'].map(op => (
                    <div
                      key={op}
                      className={`ret-op-carte ${operateur === op ? 'actif' : ''} ${!(op === 'mtn' ? utilisateur?.numero_mtn : utilisateur?.numero_airtel) ? 'desactive' : ''}`}
                      onClick={() => (op === 'mtn' ? utilisateur?.numero_mtn : utilisateur?.numero_airtel) && setOperateur(op)}
                    >
                      <span className={`ret-op-badge ${op}`}>{op === 'mtn' ? 'MTN' : 'Airtel'}</span>
                      <p className="ret-op-carte-montant">{op === 'mtn' ? soldes.mtn : soldes.airtel} FCFA</p>
                      {!(op === 'mtn' ? utilisateur?.numero_mtn : utilisateur?.numero_airtel) && (
                        <p className="ret-op-carte-warning"><AlertCircle size={10} /> Non configuré</p>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* MONTANT */}
              <div className="ret-champ">
                <label>Montant (FCFA)</label>
                <input
                  type="number"
                  placeholder="Ex : 5000"
                  value={montant}
                  onChange={e => setMontant(e.target.value)}
                  min="500"
                  max={soldeActif}
                />
                <span className="ret-aide">Minimum 500 FCFA · Disponible : {soldeActif} FCFA</span>
              </div>

              {/* DESTINATION */}
              {numeroActif && (
                <div className="ret-destination">
                  <span className={`ret-op-badge ${operateur}`}>{operateur.toUpperCase()}</span>
                  Envoi vers <strong>+242 {numeroActif}</strong>
                </div>
              )}

              <button className="ret-btn-primaire" onClick={handleRetrait} disabled={chargement}>
                <ArrowDownToLine size={15} />
                {chargement ? 'Traitement...' : `Retirer ${montant || 0} FCFA`}
              </button>

              <button className="ret-btn-secondaire" onClick={() => allerVers('mon-compte')}>
                <Settings size={14} /> Configurer mes numéros
              </button>
            </>
          )}
        </div>

        {/* HISTORIQUE */}
        {retraits.length > 0 && (
          <div className="ret-historique">
            <h2 className="ret-historique-titre"><Clock size={16} /> Historique</h2>
            <div className="ret-historique-liste">
              {retraits.map(r => (
                <div key={r.id} className="ret-historique-ligne">
                  <div className="ret-hist-gauche">
                    <span className={`ret-op-badge ${r.operateur}`}>{r.operateur?.toUpperCase()}</span>
                    <div>
                      <p className="ret-hist-numero">+242 {r.numero_retrait}</p>
                      <p className="ret-hist-date">{new Date(r.date_demande).toLocaleDateString('fr-FR')}</p>
                    </div>
                  </div>
                  <div className="ret-hist-droite">
                    <p className="ret-hist-montant">{r.montant} FCFA</p>
                    <span className={`ret-statut ${r.statut}`}>
                      {r.statut === 'en_attente' && <><Clock size={10} /> En attente</>}
                      {r.statut === 'traite'     && <><CheckCircle size={10} /> Traité</>}
                      {r.statut === 'annule'     && <><XCircle size={10} /> Annulé</>}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default Retrait;