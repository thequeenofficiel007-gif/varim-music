import React, { useState, useEffect } from 'react';
import { ShoppingCart, CheckCircle, AlertCircle, BookOpen, ChevronLeft, User, Music, Disc } from 'lucide-react';
import './Achat.css';

function Achat({ allerVers, utilisateur, musiqueId }) {
  const [musique, setMusique] = useState(null);
  const [operateur, setOperateur] = useState('mtn');
  const [numero, setNumero] = useState('');
  const [etape, setEtape] = useState('paiement');
  const [chargement, setChargement] = useState(false);
  const [message, setMessage] = useState({ texte: '', type: '' });

  useEffect(() => {
    fetch('https://varim-music.onrender.com/api/musiques')
      .then(res => res.json())
      .then(data => {
        const m = data.musiques.find(m => m.id === parseInt(musiqueId));
        setMusique(m);
        if (m) {
          if (m.numero_mtn) setOperateur('mtn');
          else if (m.numero_airtel) setOperateur('airtel');
        }
      });
    if (utilisateur) {
      setNumero(utilisateur.numero_paiement_prefere || utilisateur.telephone || '');
    }
  }, [musiqueId, utilisateur]);

  const accepteMtn = !!musique?.numero_mtn;
  const accepteAirtel = !!musique?.numero_airtel;

  const handlePaiement = async () => {
    if (!utilisateur) { allerVers('login'); return; }
    if (!numero) { setMessage({ texte: 'Entrez votre numéro Mobile Money.', type: 'erreur' }); return; }
    const propre = numero.replace(/\s/g, '').replace('+242', '');
    if (operateur === 'mtn' && !propre.startsWith('06')) {
      setMessage({ texte: 'Un numéro MTN doit commencer par 06.', type: 'erreur' }); return;
    }
    if (operateur === 'airtel' && !propre.startsWith('05') && !propre.startsWith('04')) {
      setMessage({ texte: 'Un numéro Airtel doit commencer par 05 ou 04.', type: 'erreur' }); return;
    }
    setChargement(true);
    setMessage({ texte: '', type: '' });
    try {
      const reponse = await fetch('https://varim-music.onrender.com/api/achats', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ acheteur_id: utilisateur.id, musique_id: parseInt(musiqueId), operateur, numero_paiement: numero })
      });
      const donnees = await reponse.json();

      // MODE SIMULÉ — confirmation immédiate
      if (reponse.status === 201) {
        await fetch('https://varim-music.onrender.com/api/auth/sauvegarder-numero', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ utilisateur_id: utilisateur.id, numero_paiement_prefere: numero })
        }).catch(() => {});
        setEtape('succes');

      // MODE RÉEL — attendre confirmation sur le téléphone
      } else if (reponse.status === 202) {
        const { referenceId } = donnees;
        setMessage({ texte: 'Vérifiez votre téléphone et validez le paiement...', type: 'attente' });

        // Polling toutes les 3 secondes pendant max 2 minutes
        let tentatives = 0;
        const maxTentatives = 40;
        const interval = setInterval(async () => {
          tentatives++;
          try {
            const check = await fetch(`/api/achats/verifier/${referenceId}`);
            const data = await check.json();
            if (data.statut === 'confirme') {
              clearInterval(interval);
              setChargement(false);
              setEtape('succes');
            } else if (data.statut === 'echec') {
              clearInterval(interval);
              setChargement(false);
              setMessage({ texte: 'Paiement refusé ou annulé.', type: 'erreur' });
            } else if (tentatives >= maxTentatives) {
              clearInterval(interval);
              setChargement(false);
              setMessage({ texte: 'Délai dépassé. Réessayez si le paiement n\'a pas abouti.', type: 'erreur' });
            }
          } catch { clearInterval(interval); setChargement(false); }
        }, 3000);
        return; // Ne pas setChargement(false) ici, le polling s'en charge

      } else {
        setMessage({ texte: donnees.message, type: 'erreur' });
      }
    } catch {
      setMessage({ texte: 'Impossible de contacter le serveur', type: 'erreur' });
    }
    setChargement(false);
  };

  if (!musique) return (
    <div className="achat-page">
      <div className="achat-chargement">Chargement...</div>
    </div>
  );

  if (etape === 'succes') return (
    <div className="achat-page">
      <div className="achat-box">
        <div className="achat-succes-ic"><CheckCircle size={52} /></div>
        <h2 className="achat-succes-titre">Paiement réussi !</h2>
        <p className="achat-succes-texte">
          <strong>{musique.titre}</strong> a été ajouté à votre bibliothèque.
        </p>
        <p className="achat-succes-detail">
          {musique.prix} FCFA débités sur votre {operateur.toUpperCase()} +242 {numero}
        </p>
        <button className="achat-btn-biblio" onClick={() => allerVers('bibliotheque')}>
          <BookOpen size={16} /> Voir ma bibliothèque
        </button>
        <button className="achat-btn-retour" onClick={() => allerVers('catalogue')}>
          Retour au catalogue
        </button>
      </div>
    </div>
  );

  return (
    <div className="achat-page">
      <div className="achat-box">
        {/* LOGO */}
        <div className="achat-logo" onClick={() => allerVers('accueil')}>
          <img src="/logo.png" alt="Varim Music" className="achat-logo-img" />
          <span>Varim Music</span>
        </div>

        <button className="achat-retour" onClick={() => allerVers('catalogue')}>
          <ChevronLeft size={15} /> Retour
        </button>

        <h2 className="achat-titre">Finaliser l'achat</h2>

        {/* RÉCAP MUSIQUE */}
        <div className="achat-recap">
          <div className="achat-pochette">
            {musique.pochette_url
              ? <img src={musique.pochette_url} alt={musique.titre} />
              : <div className="achat-pochette-vide">{musique.type === 'album' ? <Disc size={24} /> : <Music size={24} />}</div>
            }
            <span className="achat-type-badge">{musique.type}</span>
          </div>
          <div className="achat-info">
            <h3 className="achat-info-titre">{musique.titre}</h3>
            <p className="achat-info-artiste" onClick={() => allerVers('profil_' + musique.artiste_id)}>
              <User size={12} /> {musique.nom_artiste}
            </p>
            <p className="achat-info-prix">{musique.prix} FCFA</p>
          </div>
        </div>

        {message.texte && (
          <div className={`achat-message ${message.type}`}>
            <AlertCircle size={14} /> {message.texte}
          </div>
        )}

        {/* OPÉRATEUR */}
        <div className="achat-champ">
          <label>Opérateur Mobile Money</label>
          <div className="achat-operateurs">
            {['mtn', 'airtel'].map(op => (
              <div
                key={op}
                className={`achat-op-carte ${operateur === op ? 'active' : ''} ${!(op === 'mtn' ? accepteMtn : accepteAirtel) ? 'desactive' : ''}`}
                onClick={() => (op === 'mtn' ? accepteMtn : accepteAirtel) && setOperateur(op)}
              >
                <span className={`achat-op-badge ${op}`}>{op === 'mtn' ? 'MTN' : 'Airtel'}</span>
                <span className="achat-op-nom">{op === 'mtn' ? 'Mobile Money' : 'Money'}</span>
                {!(op === 'mtn' ? accepteMtn : accepteAirtel) && (
                  <span className="achat-op-indispo">Non disponible</span>
                )}
              </div>
            ))}
          </div>
          {!accepteMtn && !accepteAirtel && (
            <p className="achat-erreur-op">Cet artiste n'a pas encore configuré ses moyens de paiement.</p>
          )}
        </div>

        {/* NUMÉRO */}
        <div className="achat-champ">
          <label>Votre numéro {operateur === 'mtn' ? 'MTN' : 'Airtel'}</label>
          <div className="achat-input-tel">
            <span className="achat-indicatif">+242</span>
            <input
              type="tel"
              placeholder={operateur === 'mtn' ? '06XXXXXXX' : '05XXXXXXX'}
              value={numero}
              onChange={e => setNumero(e.target.value)}
            />
          </div>
          <span className="achat-aide">Numéro pré-rempli depuis votre compte. Modifiez si nécessaire.</span>
        </div>

        {/* TOTAL */}
        <div className="achat-total">
          <span>Total à payer</span>
          <span className="achat-total-prix">{musique.prix} FCFA</span>
        </div>

        {!utilisateur && (
          <p className="achat-connexion">
            <a href="#" onClick={() => allerVers('login')}>Connectez-vous</a> pour acheter
          </p>
        )}

        <button className="achat-btn" onClick={handlePaiement} disabled={chargement || (!accepteMtn && !accepteAirtel)}>
          <ShoppingCart size={16} />
          {chargement ? 'Traitement...' : `Payer ${musique.prix} FCFA`}
        </button>

        <button className="achat-btn-annuler" onClick={() => allerVers('catalogue')}>Annuler</button>
      </div>
    </div>
  );
}

export default Achat;