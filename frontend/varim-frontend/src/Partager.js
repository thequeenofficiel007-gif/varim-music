import React, { useState } from 'react';
import { Share2, Copy, Check, X } from 'lucide-react';
import './Partager.css';

function Partager({ lien, titre, onFermer }) {
  const [copie, setCopie] = useState(false);

  const copierLien = () => {
    navigator.clipboard.writeText(lien);
    setCopie(true);
    setTimeout(() => setCopie(false), 2000);
  };

  const partagerWhatsApp = () => {
    window.open(`https://wa.me/?text=${encodeURIComponent(titre + ' - ' + lien)}`, '_blank');
  };

  const partagerFacebook = () => {
    window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(lien)}`, '_blank');
  };

  const partagerTwitter = () => {
    window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(titre)}&url=${encodeURIComponent(lien)}`, '_blank');
  };

  return (
    <div className="partager-overlay" onClick={onFermer}>
      <div className="partager-modal" onClick={e => e.stopPropagation()}>
        <div className="partager-header">
          <h3>Partager</h3>
          <button className="partager-fermer" onClick={onFermer}>
            <X size={20} />
          </button>
        </div>

        <p className="partager-titre">{titre}</p>

        <div className="partager-reseaux">
          <button className="partager-reseau whatsapp" onClick={partagerWhatsApp}>
            <span className="reseau-icone">W</span>
            WhatsApp
          </button>
          <button className="partager-reseau facebook" onClick={partagerFacebook}>
            <span className="reseau-icone">f</span>
            Facebook
          </button>
          <button className="partager-reseau twitter" onClick={partagerTwitter}>
            <span className="reseau-icone">X</span>
            Twitter/X
          </button>
        </div>

        <div className="partager-lien">
          <input
            type="text"
            value={lien}
            readOnly
            className="partager-lien-input"
          />
          <button className="partager-copier" onClick={copierLien}>
            {copie ? <Check size={16} /> : <Copy size={16} />}
            {copie ? 'Copié !' : 'Copier'}
          </button>
        </div>
      </div>
    </div>
  );
}

export default Partager;