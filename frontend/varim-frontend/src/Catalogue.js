import React, { useState, useEffect, useRef } from 'react';
import { Search, Play, ShoppingCart, Share2, X, Music, TrendingUp, Disc, User, ChevronRight } from 'lucide-react';
import NavMobile from './NavMobile';
import Lecteur from './Lecteur';
import Partager from './Partager';
import './Catalogue.css';

function Catalogue({ allerVers, utilisateur, handleDeconnexion }) {
  const [nouveautes, setNouveautes] = useState([]);
  const [topVentes, setTopVentes] = useState([]);
  const [topSingles, setTopSingles] = useState([]);
  const [topAlbums, setTopAlbums] = useState([]);
  const [topArtistes, setTopArtistes] = useState([]);
  const [chargement, setChargement] = useState(true);
  const [recherche, setRecherche] = useState('');
  const [resultatsRecherche, setResultatsRecherche] = useState({ musiques: [], artistes: [] });
  const [rechercheActive, setRechercheActive] = useState(false);
  const [rechercheEnCours, setRechercheEnCours] = useState(false);
  const rechercheTimeout = useRef(null);
  const [bottomSheet, setBottomSheet] = useState(null);
  const [pisteActive, setPisteActive] = useState(null);
  const [playlist, setPlaylist] = useState([]);
  const [partagerMusique, setPartagerMusique] = useState(null);
  const [voirPlus, setVoirPlus] = useState(null);

  useEffect(() => {
    // Chaque section charge ses propres données — jamais tout en même temps
    Promise.all([
      fetch('https://varim-music.onrender.com/api/musiques/nouveautes').then(r => r.json()),
      fetch('https://varim-music.onrender.com/api/musiques/top-ventes').then(r => r.json()),
      fetch('https://varim-music.onrender.com/api/musiques/top-singles').then(r => r.json()),
      fetch('https://varim-music.onrender.com/api/musiques/top-albums').then(r => r.json()),
      fetch('https://varim-music.onrender.com/api/musiques/top-artistes').then(r => r.json()),
    ]).then(([nouv, top, singles, albums, artistes]) => {
      setNouveautes((nouv.musiques || []).slice(0, 10));
      setTopVentes((top.musiques || []).slice(0, 10));
      setTopSingles((singles.musiques || []).slice(0, 10));
      setTopAlbums((albums.musiques || []).slice(0, 10));
      setTopArtistes((artistes.artistes || []).map(a => ({
        id: a.id,
        nom: a.nom_artiste || a.prenom,
        photo: a.photo_profil || null,
        ventes: a.total_ventes
      })));
      setChargement(false);
    }).catch(() => setChargement(false));
  }, []);

  // Recherche vraie dans la base de données (avec délai pour ne pas appeler à chaque lettre)
  useEffect(() => {
    if (rechercheTimeout.current) clearTimeout(rechercheTimeout.current);
    if (recherche.trim().length < 2) {
      setResultatsRecherche({ musiques: [], artistes: [] });
      setRechercheActive(false);
      return;
    }
    setRechercheActive(true);
    setRechercheEnCours(true);
    rechercheTimeout.current = setTimeout(() => {
      fetch(`/api/musiques/recherche?q=${encodeURIComponent(recherche.trim())}`)
        .then(r => r.json())
        .then(data => {
          setResultatsRecherche({ musiques: data.musiques || [], artistes: data.artistes || [] });
          setRechercheEnCours(false);
        })
        .catch(() => setRechercheEnCours(false));
    }, 350); // attend 350ms après la dernière lettre tapée
  }, [recherche]);

  const ouvrirBottomSheet = (musique) => setBottomSheet(musique);
  const fermerBottomSheet = () => setBottomSheet(null);

  const jouerExtrait = (musique) => {
    fermerBottomSheet();
    const singles = topSingles.filter(m => m.fichier_url);
    setPlaylist(singles.map(m => ({ url: m.fichier_url, titre: m.titre, artiste: m.nom_artiste, pochette: m.pochette_url, id: m.id, estExtrait: true })));
    setPisteActive({ url: musique.fichier_url, titre: musique.titre, artiste: musique.nom_artiste, pochette: musique.pochette_url, id: musique.id, estExtrait: true });
  };

  // PAGE VOIR PLUS
  if (voirPlus) {
    const titres = { nouveautes: 'Nouveautés', topVentes: 'Top Ventes', topSingles: 'Top Singles', topAlbums: 'Top Albums' };
    const listes = { nouveautes: nouveautes, topVentes: topVentes, topSingles: topSingles, topAlbums: topAlbums };
    return (
      <div className="catalogue-page">
        <header className="cat-header">
          <div className="cat-header-logo" onClick={() => allerVers('accueil')}>
            <img src="/logo.png" alt="Varim Music" className="cat-logo-img" />
            <span>Varim Music</span>
          </div>
          <NavMobile utilisateur={utilisateur} allerVers={allerVers} handleDeconnexion={handleDeconnexion} />
        </header>
        <div className="voir-plus-page">
          <button className="btn-retour" onClick={() => setVoirPlus(null)}>
            <ChevronRight size={18} style={{transform:'rotate(180deg)'}} /> Retour
          </button>
          <h2 className="voir-plus-titre">{titres[voirPlus]}</h2>
          <div className="liste-voir-plus">
            {listes[voirPlus].map((m, i) => (
              <div key={m.id} className="item-liste" onClick={() => { setVoirPlus(null); ouvrirBottomSheet(m); }}>
                <span className="item-rang">{i + 1}</span>
                <div className="item-pochette-small">
                  {m.pochette_url ? <img src={m.pochette_url} alt={m.titre} /> : <div className="pochette-vide-small"><Music size={16} /></div>}
                </div>
                <div className="item-infos">
                  <p className="item-titre">{m.titre}</p>
                  <p className="item-artiste-lien" onClick={e => { e.stopPropagation(); allerVers('profil_' + m.artiste_id); }}>{m.nom_artiste}</p>
                </div>
                <span className="item-ventes-hebdo">+{m.nb_ventes || 0}</span>
              </div>
            ))}
          </div>
        </div>
        {bottomSheet && <BottomSheetMusique musique={bottomSheet} onFermer={fermerBottomSheet} allerVers={allerVers} jouerExtrait={jouerExtrait} setPartagerMusique={setPartagerMusique} />}
        {pisteActive && <Lecteur piste={pisteActive} playlist={playlist} onPisteChange={setPisteActive} onFermer={() => { setPisteActive(null); setPlaylist([]); }} />}
        {partagerMusique && <Partager lien={`${window.location.origin}?musique=${partagerMusique.id}`} titre={`${partagerMusique.titre} - ${partagerMusique.nom_artiste}`} onFermer={() => setPartagerMusique(null)} />}
      </div>
    );
  }

  return (
    <div className="catalogue-page">
      <header className="cat-header">
        <div className="cat-header-logo" onClick={() => allerVers('accueil')}>
          <img src="/logo.png" alt="Varim Music" className="cat-logo-img" />
          <span>Varim Music</span>
        </div>
        <NavMobile utilisateur={utilisateur} allerVers={allerVers} handleDeconnexion={handleDeconnexion} />
      </header>

      <div className="catalogue-contenu">

        {/* BARRE DE RECHERCHE */}
        <div className="barre-recherche-wrapper">
          <div className="barre-recherche">
            <Search size={16} className="icone-recherche" />
            <input
              type="text"
              placeholder="Rechercher une musique, un artiste..."
              value={recherche}
              onChange={e => { setRecherche(e.target.value); setRechercheActive(true); }}
              onFocus={() => setRechercheActive(true)}
            />
            {recherche && (
              <button className="btn-effacer" onClick={() => { setRecherche(''); setRechercheActive(false); }}>
                <X size={14} />
              </button>
            )}
          </div>
          {rechercheActive && (
            <div className="resultats-recherche">
              {rechercheEnCours ? (
                <div className="resultat-chargement">Recherche en cours...</div>
              ) : resultatsRecherche.musiques.length === 0 && resultatsRecherche.artistes.length === 0 ? (
                <div className="resultat-vide">Aucun résultat pour "{recherche}"</div>
              ) : (
                <>
                  {resultatsRecherche.artistes.length > 0 && (
                    <div className="resultats-section">
                      <p className="resultats-section-titre">Artistes</p>
                      {resultatsRecherche.artistes.map(a => (
                        <div key={a.id} className="resultat-item" onClick={() => { allerVers('profil_' + a.id); setRecherche(''); setRechercheActive(false); }}>
                          <div className="resultat-pochette">
                            {a.photo_profil ? <img src={a.photo_profil} alt={a.prenom} /> : <User size={14} />}
                          </div>
                          <div>
                            <p className="resultat-titre">{a.nom_artiste || a.prenom}</p>
                            <p className="resultat-artiste">Artiste</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                  {resultatsRecherche.musiques.length > 0 && (
                    <div className="resultats-section">
                      <p className="resultats-section-titre">Musiques</p>
                      {resultatsRecherche.musiques.map(m => (
                        <div key={m.id} className="resultat-item" onClick={() => { ouvrirBottomSheet(m); setRecherche(''); setRechercheActive(false); }}>
                          <div className="resultat-pochette">
                            {m.pochette_url ? <img src={m.pochette_url} alt={m.titre} /> : <Music size={14} />}
                          </div>
                          <div>
                            <p className="resultat-titre">{m.titre}</p>
                            <p className="resultat-artiste">{m.nom_artiste} · {m.type}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </>
              )}
            </div>
          )}
        </div>

        {chargement ? (
          <div className="chargement">Chargement...</div>
        ) : (
          <>
            <Section titre="Nouveautés" icone={<Music size={15} />} onVoirPlus={() => setVoirPlus('nouveautes')}>
              <div className="scroll-horizontal">
                {nouveautes.map(m => <CarteMusique key={m.id} musique={m} onClick={() => ouvrirBottomSheet(m)} />)}
              </div>
            </Section>

            <Section titre="Top Ventes" icone={<TrendingUp size={15} />} onVoirPlus={() => setVoirPlus('topVentes')}>
              <div className="scroll-horizontal">
                {topVentes.map((m, i) => <CarteTopVente key={m.id} musique={m} rang={i + 1} onClick={() => ouvrirBottomSheet(m)} />)}
              </div>
            </Section>

            <Section titre="Top Artistes" icone={<User size={15} />}>
              <div className="scroll-horizontal">
                {topArtistes.map(a => (
                  <div key={a.id} className="carte-artiste-rond" onClick={() => allerVers('profil_' + a.id)}>
                    <div className="artiste-avatar">
                      {a.photo ? <img src={a.photo} alt={a.nom} /> : <span>{a.nom?.[0]?.toUpperCase()}</span>}
                    </div>
                    <p className="artiste-nom">{a.nom}</p>
                  </div>
                ))}
              </div>
            </Section>

            <Section titre="Top Singles" icone={<Music size={15} />} onVoirPlus={() => setVoirPlus('topSingles')}>
              <div className="scroll-horizontal">
                {topSingles.map((m, i) => <CarteTopVente key={m.id} musique={m} rang={i + 1} onClick={() => ouvrirBottomSheet(m)} />)}
              </div>
            </Section>

            <Section titre="Top Albums" icone={<Disc size={15} />} onVoirPlus={() => setVoirPlus('topAlbums')}>
              <div className="scroll-horizontal">
                {topAlbums.map((m, i) => <CarteTopVente key={m.id} musique={m} rang={i + 1} onClick={() => ouvrirBottomSheet(m)} />)}
              </div>
            </Section>
          </>
        )}
      </div>

      {bottomSheet && (
        <BottomSheetMusique
          musique={bottomSheet}
          onFermer={fermerBottomSheet}
          allerVers={allerVers}
          jouerExtrait={jouerExtrait}
          setPartagerMusique={setPartagerMusique}
        />
      )}

      {pisteActive && (
        <Lecteur piste={pisteActive} playlist={playlist} onPisteChange={setPisteActive} onFermer={() => { setPisteActive(null); setPlaylist([]); }} />
      )}
      {partagerMusique && (
        <Partager lien={`${window.location.origin}?musique=${partagerMusique.id}`} titre={`${partagerMusique.titre} - ${partagerMusique.nom_artiste}`} onFermer={() => setPartagerMusique(null)} />
      )}
    </div>
  );
}

function Section({ titre, icone, onVoirPlus, children }) {
  return (
    <div className="section">
      <div className="section-header">
        <div className="section-titre-wrapper">
          {icone}
          <h2 className="section-titre">{titre}</h2>
        </div>
        {onVoirPlus && (
          <button className="btn-voir-plus" onClick={onVoirPlus}>
            Voir plus <ChevronRight size={13} />
          </button>
        )}
      </div>
      {children}
    </div>
  );
}

function CarteMusique({ musique, onClick }) {
  return (
    <div className="carte-musique" onClick={onClick}>
      <div className="carte-pochette">
        {musique.pochette_url
          ? <img src={musique.pochette_url} alt={musique.titre} />
          : <div className="pochette-vide"><Music size={22} /></div>
        }
        <span className="carte-type-badge">{musique.type}</span>
      </div>
      <p className="carte-titre-texte">{musique.titre}</p>
      <p className="carte-artiste-texte">{musique.nom_artiste}</p>
    </div>
  );
}

function CarteTopVente({ musique, rang, onClick }) {
  return (
    <div className="carte-top-vente" onClick={onClick}>
      <span className="top-rang-numero">{rang}</span>
      <div className="carte-pochette">
        {musique.pochette_url
          ? <img src={musique.pochette_url} alt={musique.titre} />
          : <div className="pochette-vide"><Music size={22} /></div>
        }
        <span className="carte-type-badge">{musique.type}</span>
      </div>
      <p className="carte-titre-texte">{musique.titre}</p>
      <p className="carte-artiste-texte">{musique.nom_artiste}</p>
    </div>
  );
}

function BottomSheetMusique({ musique, onFermer, allerVers, jouerExtrait, setPartagerMusique }) {
  return (
    <div className="bs-overlay" onClick={onFermer}>
      <div className="bottom-sheet" onClick={e => e.stopPropagation()}>
        <div className="bs-drag-bar" />
        <div className="bs-contenu">
          <div className="bs-haut">
            <div className="bs-pochette-wrapper">
              {musique.pochette_url
                ? <img src={musique.pochette_url} alt={musique.titre} className="bs-pochette-img" />
                : <div className="bs-pochette-vide"><Music size={36} /></div>
              }
              <span className="bs-type-badge">{musique.type}</span>
            </div>
            <div className="bs-meta">
              <h3 className="bs-titre">{musique.titre}</h3>
              <p className="bs-artiste" onClick={() => { onFermer(); allerVers('profil_' + musique.artiste_id); }}>
                <User size={12} /> {musique.nom_artiste}
              </p>
              <p className="bs-prix">{musique.prix} FCFA</p>
            </div>
          </div>
          <div className="bs-actions">
            {musique.type === 'album' ? (
              <button className="bs-btn-extrait" onClick={() => { onFermer(); allerVers('album_' + musique.id); }}>
                <Play size={15} /> Voir l'album
              </button>
            ) : (
              <button className="bs-btn-extrait" onClick={() => { onFermer(); allerVers('single_' + musique.id); }}>
                <Play size={15} /> Écouter l'extrait
              </button>
            )}
            <button className="bs-btn-acheter" onClick={() => { onFermer(); allerVers('achat_' + musique.id); }}>
              <ShoppingCart size={15} /> Acheter — {musique.prix} FCFA
            </button>
            <button className="bs-btn-partager" onClick={() => { setPartagerMusique(musique); onFermer(); }}>
              <Share2 size={15} /> Partager
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Catalogue;