import React, { useState, useEffect } from 'react';
import { Bookmark, BookmarkCheck } from 'lucide-react';

function BoutonEnregistrement({ utilisateur, musiqueId, style = 'rond' }) {
  const [estEnregistre, setEstEnregistre] = useState(false);
  const [chargement, setChargement] = useState(false);

  useEffect(() => {
    if (!utilisateur || !musiqueId) return;
    fetch(`/api/enregistrements/verifier?utilisateur_id=${utilisateur.id}&musique_id=${musiqueId}`)
      .then(r => r.json())
      .then(d => { if (d.estEnregistre !== undefined) setEstEnregistre(d.estEnregistre); })
      .catch(() => {});
  }, [utilisateur?.id, musiqueId]);

  const toggle = async (e) => {
    e.stopPropagation();
    if (!utilisateur || chargement) return;
    setChargement(true);
    try {
      if (estEnregistre) {
        const r = await fetch('/api/enregistrements', {
          method: 'DELETE',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ utilisateur_id: utilisateur.id, musique_id: musiqueId })
        });
        if (r.ok) setEstEnregistre(false);
      } else {
        const r = await fetch('/api/enregistrements', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ utilisateur_id: utilisateur.id, musique_id: musiqueId })
        });
        if (r.ok || r.status === 400) setEstEnregistre(true);
      }
    } catch {}
    setChargement(false);
  };

  if (!utilisateur) return null;

  if (style === 'texte') {
    return (
      <button onClick={toggle} style={{
        display: 'flex', alignItems: 'center', gap: '8px',
        width: '100%', padding: '12px', background: 'transparent',
        border: `1px solid ${estEnregistre ? '#f6ad55' : '#1e2a4a'}`,
        borderRadius: '12px',
        color: estEnregistre ? '#f6ad55' : '#a0aec0',
        fontSize: '14px', cursor: 'pointer'
      }}>
        {estEnregistre ? <BookmarkCheck size={16} /> : <Bookmark size={16} />}
        {estEnregistre ? 'Enregistré' : 'Enregistrer pour plus tard'}
      </button>
    );
  }

  return (
    <button onClick={toggle} style={{
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      width: '42px', height: '42px', borderRadius: '50%',
      border: `1px solid ${estEnregistre ? '#f6ad55' : '#1e2a4a'}`,
      background: 'transparent',
      color: estEnregistre ? '#f6ad55' : '#a0aec0',
      cursor: 'pointer', transition: 'all 0.2s'
    }}>
      {estEnregistre ? <BookmarkCheck size={18} /> : <Bookmark size={18} />}
    </button>
  );
}

export default BoutonEnregistrement;