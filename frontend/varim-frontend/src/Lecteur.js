import React, { useState, useEffect, useRef } from 'react';
import { Play, Pause, SkipForward, SkipBack, Volume2, VolumeX, ChevronDown, Share2, Music, Heart } from 'lucide-react';
import './Lecteur.css';

function Lecteur({ piste, playlist, onPisteChange, onFermer }) {
  const [enLecture, setEnLecture] = useState(false);
  const [progression, setProgression] = useState(0);
  const [duree, setDuree] = useState(0);
  const [volume, setVolume] = useState(1);
  const [muet, setMuet] = useState(false);
  const [pleinEcran, setPleinEcran] = useState(false);
  const [aime, setAime] = useState(false);
  const utilisateurRef = React.useRef(null);

  useEffect(() => {
    const u = localStorage.getItem('utilisateur');
    if (u) utilisateurRef.current = JSON.parse(u);
  }, []);

  // Vérifier si la piste est déjà en favori quand elle change
  useEffect(() => {
    if (!piste?.url) { setAime(false); return; }
    const u = utilisateurRef.current;
    if (!u) { setAime(false); return; }

    const musiqueId = piste.musiqueId || piste.id;
    const pisteId = piste.estPisteAlbum ? piste.id : null;
    const url = `/api/favoris/verifier?utilisateur_id=${u.id}&musique_id=${musiqueId}${pisteId ? '&piste_id=' + pisteId : ''}`;

    fetch(url)
      .then(r => r.json())
      .then(d => { if (d.estFavori !== undefined) setAime(d.estFavori); })
      .catch(() => setAime(false));
  }, [piste?.url]);

  const toggleAime = async () => {
    const u = utilisateurRef.current;
    if (!u) return;

    const musiqueId = piste.musiqueId || piste.id;
    const pisteId = piste.estPisteAlbum ? piste.id : null;
    const body = { utilisateur_id: u.id, musique_id: musiqueId, piste_id: pisteId || null };

    if (aime) {
      const r = await fetch('/api/favoris', { method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
      if (r.ok) setAime(false);
    } else {
      const r = await fetch('/api/favoris', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
      if (r.ok || r.status === 400) setAime(true); // 400 = déjà en favori
    }
  };
  const audioRef = useRef(null);
  const estMonteRef = useRef(true);

  useEffect(() => {
    estMonteRef.current = true;
    return () => { estMonteRef.current = false; };
  }, []);

  useEffect(() => {
    if (!piste?.url) return;
    const ancienAudio = audioRef.current;
    if (ancienAudio) { ancienAudio.pause(); ancienAudio.src = ''; ancienAudio.load(); }
    const audio = new Audio();
    audioRef.current = audio;
    audio.volume = muet ? 0 : volume;
    setProgression(0); setDuree(0); setEnLecture(false);
    audio.addEventListener('loadedmetadata', () => { if (estMonteRef.current) setDuree(audio.duration); });
    audio.addEventListener('timeupdate', () => { if (estMonteRef.current) setProgression(audio.currentTime); });
    audio.addEventListener('ended', () => { if (estMonteRef.current) passerSuivante(); });
    audio.src = piste.url; audio.load();
    const t = audio.play();
    if (t) t.then(() => { if (estMonteRef.current) setEnLecture(true); }).catch(() => {});
    return () => { audio.pause(); audio.src = ''; };
  }, [piste?.url]);

  const passerSuivante = () => {
    if (!playlist?.length) return;
    onPisteChange(playlist[(playlist.findIndex(p => p.url === piste.url) + 1) % playlist.length]);
  };
  const passerPrecedente = () => {
    if (!playlist?.length) return;
    const idx = playlist.findIndex(p => p.url === piste.url);
    onPisteChange(playlist[(idx - 1 + playlist.length) % playlist.length]);
  };
  const toggleLecture = (e) => {
    e?.stopPropagation();
    if (!audioRef.current) return;
    if (enLecture) { audioRef.current.pause(); setEnLecture(false); }
    else { audioRef.current.play().then(() => setEnLecture(true)).catch(() => {}); }
  };
  const handleProgression = (e) => {
    const val = parseFloat(e.target.value);
    if (audioRef.current) audioRef.current.currentTime = val;
    setProgression(val);
  };
  const toggleMuet = () => {
    const nouveau = !muet;
    setMuet(nouveau);
    if (audioRef.current) audioRef.current.volume = nouveau ? 0 : volume;
  };
  const fmt = (s) => {
    if (!s || isNaN(s)) return '0:00';
    return `${Math.floor(s / 60)}:${Math.floor(s % 60).toString().padStart(2, '0')}`;
  };
  const pct = duree > 0 ? (progression / duree) * 100 : 0;

  if (!piste) return null;

  /* ─── PLEIN ÉCRAN ─── */
  if (pleinEcran) return (
    <>
      <div className="lp-wrap">
        {/* Fond dégradé depuis la couleur dominante simulée */}
        <div className="lp-bg">
          {piste.pochette && <img src={piste.pochette} alt="" className="lp-bg-img" />}
          <div className="lp-bg-overlay" />
        </div>

        {/* Barre du haut */}
        <div className="lp-topbar">
          <button className="lp-icon-btn" onClick={() => setPleinEcran(false)}>
            <ChevronDown size={24} />
          </button>
          <div className="lp-topbar-centre">
            <p className="lp-topbar-label">EN LECTURE</p>
          </div>
          <button className="lp-icon-btn" onClick={() => {
            if (piste.estPisteAlbum && piste.musiqueId) {
              window.location.href = `${window.location.origin}?album=${piste.musiqueId}`;
            } else {
              window.location.href = `${window.location.origin}?single=${piste.musiqueId || piste.id}`;
            }
          }}>
            <Share2 size={20} />
          </button>
        </div>

        {/* Pochette */}
        <div className="lp-pochette-zone">
          <div className={`lp-pochette-cadre ${!piste.estPisteAlbum && enLecture ? 'tourne' : ''} ${piste.estPisteAlbum ? 'album' : ''}`}>
            {piste.pochette
              ? <img src={piste.pochette} alt={piste.titre} className="lp-pochette-img" />
              : <div className="lp-pochette-vide"><Music size={72} /></div>
            }
          </div>
        </div>

        {/* Titre + like */}
        <div className="lp-meta">
          <div className="lp-meta-texte">
            <h2 className="lp-titre">{piste.titre}</h2>
            <p className="lp-artiste">{piste.artiste || 'Artiste inconnu'}</p>
          </div>
          <button className={`lp-like-btn ${aime ? 'aime' : ''}`} onClick={toggleAime}>
            <Heart size={22} fill={aime ? '#ff4d6d' : 'none'} />
          </button>
        </div>

        {/* Barre de progression */}
        <div className="lp-prog-zone">
          <div className="lp-prog-barre" onClick={e => {
            const rect = e.currentTarget.getBoundingClientRect();
            const ratio = (e.clientX - rect.left) / rect.width;
            const val = ratio * duree;
            if (audioRef.current) audioRef.current.currentTime = val;
            setProgression(val);
          }}>
            <div className="lp-prog-bg" />
            <div className="lp-prog-fill" style={{ width: `${pct}%` }} />
            <div className="lp-prog-thumb" style={{ left: `${pct}%` }} />
            <input type="range" min="0" max={duree || 0} value={progression}
              onChange={handleProgression} className="lp-prog-input" />
          </div>
          <div className="lp-prog-temps">
            <span>{fmt(progression)}</span>
            <span>{fmt(duree)}</span>
          </div>
        </div>

        {/* Contrôles */}
        <div className="lp-controles">
          <button className="lp-nav-btn" onClick={passerPrecedente}>
            <SkipBack size={26} strokeWidth={2} />
          </button>
          <button className="lp-play-btn" onClick={toggleLecture}>
            {enLecture
              ? <Pause size={30} fill="#fff" strokeWidth={0} />
              : <Play size={30} fill="#fff" strokeWidth={0} />
            }
          </button>
          <button className="lp-nav-btn" onClick={passerSuivante}>
            <SkipForward size={26} strokeWidth={2} />
          </button>
        </div>

        {/* Volume */}
        <div className="lp-volume">
          <button className="lp-icon-btn small" onClick={toggleMuet}>
            {muet ? <VolumeX size={16} /> : <Volume2 size={16} />}
          </button>
          <div className="lp-volume-barre">
            <div className="lp-volume-bg" />
            <div className="lp-volume-fill" style={{ width: `${muet ? 0 : volume * 100}%` }} />
            <input type="range" min="0" max="1" step="0.01" value={muet ? 0 : volume}
              onChange={e => { const v = parseFloat(e.target.value); setVolume(v); setMuet(v === 0); if (audioRef.current) audioRef.current.volume = v; }}
              className="lp-prog-input" />
          </div>
        </div>
      </div>
    </>
  );

  /* ─── MODE MINI ─── */
  return (
    <div className="lm-wrap" onClick={() => setPleinEcran(true)}>
      <div className="lm-prog-line">
        <div className="lm-prog-fill" style={{ width: `${pct}%` }} />
      </div>
      <div className="lm-inner">
        <div className="lm-gauche">
          {piste.pochette
            ? <img src={piste.pochette} alt={piste.titre} className="lm-pochette" />
            : <div className="lm-pochette-vide"><Music size={18} /></div>
          }
          <div className="lm-texte">
            <p className="lm-titre">{piste.titre}</p>
            <p className="lm-artiste">{piste.artiste || 'Artiste'}</p>
          </div>
        </div>
        <div className="lm-droite" onClick={e => e.stopPropagation()}>
          <button className="lm-btn" onClick={toggleLecture}>
            {enLecture ? <Pause size={20} fill="#fff" strokeWidth={0} /> : <Play size={20} fill="#fff" strokeWidth={0} />}
          </button>
          <button className="lm-btn close" onClick={() => { audioRef.current?.pause(); onFermer(); }}>
            ✕
          </button>
        </div>
      </div>
    </div>
  );
}

export default Lecteur;