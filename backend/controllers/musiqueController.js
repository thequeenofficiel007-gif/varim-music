const pool = require('../database');
const cloudinary = require('../cloudinary');

const uploaderFichier = (buffer, options) => {
  return new Promise((resolve, reject) => {
    cloudinary.uploader.upload_stream(options, (error, result) => {
      if (error) reject(error);
      else resolve(result);
    }).end(buffer);
  });
};

const uploadMusique = async (req, res) => {
  try {
    const { titre, genre, type, artiste_id, nombre_pistes } = req.body;
    const prix = type === 'album' ? 5000 : 500;
    const commission = type === 'album' ? 1500 : 150;

    // Uploader la pochette
    let pochetteUrl = '';
    const pochetteArray = req.files?.pochette;
    if (pochetteArray && pochetteArray.length > 0) {
      const result = await uploaderFichier(pochetteArray[0].buffer, {
        resource_type: 'image',
        folder: 'varim-music/pochettes'
      });
      pochetteUrl = result.secure_url;
    }

    if (type === 'single') {
      const fichierArray = req.files?.fichier;
      if (!fichierArray || fichierArray.length === 0) {
        return res.status(400).json({ message: 'Fichier audio manquant !' });
      }

      const fichierResult = await uploaderFichier(fichierArray[0].buffer, {
        resource_type: 'video',
        folder: 'varim-music/musiques'
      });

      const nouvelleMusique = await pool.query(
        `INSERT INTO musiques 
          (titre, artiste_id, genre, type, prix, commission, fichier_url, pochette_url) 
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8) 
         RETURNING *`,
        [titre, artiste_id, genre, type, prix, commission, fichierResult.secure_url, pochetteUrl]
      );

      return res.status(201).json({
        message: 'Single publié avec succès !',
        musique: nouvelleMusique.rows[0]
      });
    }

    if (type === 'album') {
      const nouvelAlbum = await pool.query(
        `INSERT INTO musiques 
          (titre, artiste_id, genre, type, prix, commission, pochette_url) 
         VALUES ($1, $2, $3, $4, $5, $6, $7) 
         RETURNING *`,
        [titre, artiste_id, genre, type, prix, commission, pochetteUrl]
      );

      const albumId = nouvelAlbum.rows[0].id;
      const nbPistes = parseInt(nombre_pistes);

      for (let i = 0; i < nbPistes; i++) {
        const pisteFichier = req.files?.[`piste_fichier_${i}`];
        const pisteTitre = req.body[`piste_titre_${i}`];

        if (pisteFichier && pisteFichier.length > 0) {
          const pisteResult = await uploaderFichier(pisteFichier[0].buffer, {
            resource_type: 'video',
            folder: 'varim-music/pistes'
          });

          await pool.query(
            `INSERT INTO pistes (musique_id, titre, numero_ordre, fichier_url) 
             VALUES ($1, $2, $3, $4)`,
            [albumId, pisteTitre, i + 1, pisteResult.secure_url]
          );
        }
      }

      return res.status(201).json({
        message: 'Album publié avec succès !',
        musique: nouvelAlbum.rows[0]
      });
    }

    return res.status(400).json({ message: 'Type de musique invalide !' });

  } catch (erreur) {
    console.log('ERREUR DÉTAILLÉE : ', erreur);
    res.status(500).json({ message: 'Erreur : ' + erreur.message });
  }
};

const getMusiques = async (req, res) => {
  try {
    const musiques = await pool.query(
      `SELECT m.*, u.prenom as nom_artiste, 
        u.numero_mtn, u.numero_airtel, u.photo_profil
       FROM musiques m 
       JOIN utilisateurs u ON m.artiste_id = u.id 
       ORDER BY m.date_ajout DESC`
    );
    res.json({ musiques: musiques.rows });
  } catch (erreur) {
    res.status(500).json({ message: 'Erreur : ' + erreur.message });
  }
};

const getPistesAlbum = async (req, res) => {
  try {
    const { id } = req.params;
    const utilisateur_id = req.query.utilisateur_id || null;

    const album = await pool.query(
      `SELECT m.*, u.prenom as nom_artiste 
       FROM musiques m 
       JOIN utilisateurs u ON m.artiste_id = u.id 
       WHERE m.id = $1`,
      [id]
    );

    const pistes = await pool.query(
      `SELECT * FROM pistes 
       WHERE musique_id = $1 
       ORDER BY numero_ordre ASC`,
      [id]
    );

    // Vérifier si l'utilisateur a acheté l'album
    let aAchete = false;
    if (utilisateur_id) {
      const achat = await pool.query(
        `SELECT id FROM achats 
         WHERE acheteur_id = $1 AND musique_id = $2 AND statut = 'confirme'`,
        [utilisateur_id, id]
      );
      aAchete = achat.rows.length > 0;
    }

    // Si pas acheté → URL Cloudinary limitée à 30 secondes (eo_30)
    const pistesSecurisees = pistes.rows.map(p => {
      if (aAchete || !p.fichier_url) return p;
      const urlExtrait = p.fichier_url.replace('/upload/', '/upload/eo_30/');
      return { ...p, fichier_url: urlExtrait, estExtrait: true };
    });

    res.json({
      album: album.rows[0],
      pistes: pistesSecurisees,
      aAchete
    });

  } catch (erreur) {
    res.status(500).json({ message: 'Erreur : ' + erreur.message });
  }
};

const getNouveautes = async (req, res) => {
  try {
    const musiques = await pool.query(
      `SELECT m.*, u.prenom as nom_artiste 
       FROM musiques m 
       JOIN utilisateurs u ON m.artiste_id = u.id 
       ORDER BY m.date_ajout DESC
       LIMIT 20`
    );
    res.json({ musiques: musiques.rows });
  } catch (erreur) {
    res.status(500).json({ message: 'Erreur : ' + erreur.message });
  }
};

const getTopVentes = async (req, res) => {
  try {
    const musiques = await pool.query(
      `SELECT m.*, u.prenom as nom_artiste 
       FROM musiques m 
       JOIN utilisateurs u ON m.artiste_id = u.id 
       ORDER BY m.nb_ventes DESC
       LIMIT 20`
    );
    res.json({ musiques: musiques.rows });
  } catch (erreur) {
    res.status(500).json({ message: 'Erreur : ' + erreur.message });
  }
};

const getGenres = async (req, res) => {
  try {
    const genres = await pool.query(
      `SELECT DISTINCT genre FROM musiques 
       WHERE genre IS NOT NULL 
       ORDER BY genre ASC`
    );
    res.json({ genres: genres.rows.map(g => g.genre) });
  } catch (erreur) {
    res.status(500).json({ message: 'Erreur : ' + erreur.message });
  }
};

const getMusiquesByGenre = async (req, res) => {
  try {
    const { genre } = req.params;
    const musiques = await pool.query(
      `SELECT m.*, u.prenom as nom_artiste 
       FROM musiques m 
       JOIN utilisateurs u ON m.artiste_id = u.id 
       WHERE m.genre = $1
       ORDER BY m.nb_ventes DESC`,
      [genre]
    );
    res.json({ musiques: musiques.rows });
  } catch (erreur) {
    res.status(500).json({ message: 'Erreur : ' + erreur.message });
  }
};

const getTopSingles = async (req, res) => {
  try {
    const musiques = await pool.query(
      `SELECT m.*, u.prenom as nom_artiste, u.photo_profil
       FROM musiques m
       JOIN utilisateurs u ON m.artiste_id = u.id
       WHERE m.type = 'single'
       ORDER BY m.nb_ventes DESC
       LIMIT 10`
    );
    res.json({ musiques: musiques.rows });
  } catch (erreur) {
    res.status(500).json({ message: 'Erreur : ' + erreur.message });
  }
};

const getTopAlbums = async (req, res) => {
  try {
    const musiques = await pool.query(
      `SELECT m.*, u.prenom as nom_artiste, u.photo_profil
       FROM musiques m
       JOIN utilisateurs u ON m.artiste_id = u.id
       WHERE m.type = 'album'
       ORDER BY m.nb_ventes DESC
       LIMIT 10`
    );
    res.json({ musiques: musiques.rows });
  } catch (erreur) {
    res.status(500).json({ message: 'Erreur : ' + erreur.message });
  }
};

const getTopArtistes = async (req, res) => {
  try {
    const artistes = await pool.query(
      // JOIN au lieu de LEFT JOIN + HAVING = seulement artistes avec au moins une musique
      `SELECT u.id, u.prenom, u.nom_artiste, u.photo_profil,
              COALESCE(SUM(m.nb_ventes), 0) as total_ventes
       FROM utilisateurs u
       JOIN musiques m ON m.artiste_id = u.id
       WHERE u.role = 'artiste'
       GROUP BY u.id
       HAVING COUNT(m.id) > 0
       ORDER BY total_ventes DESC
       LIMIT 10`
    );
    res.json({ artistes: artistes.rows });
  } catch (erreur) {
    res.status(500).json({ message: 'Erreur : ' + erreur.message });
  }
};

const rechercherMusiques = async (req, res) => {
  try {
    const { q } = req.query;
    if (!q || q.trim().length < 2) {
      return res.json({ musiques: [], artistes: [] });
    }
    const terme = `%${q.trim().toLowerCase()}%`;

    const musiques = await pool.query(
      `SELECT m.id, m.titre, m.type, m.prix, m.pochette_url, m.fichier_url,
              m.nb_ventes, m.artiste_id, u.prenom as nom_artiste, u.photo_profil
       FROM musiques m
       JOIN utilisateurs u ON m.artiste_id = u.id
       WHERE LOWER(m.titre) LIKE $1
       ORDER BY m.nb_ventes DESC
       LIMIT 20`,
      [terme]
    );

    const artistes = await pool.query(
      `SELECT id, prenom, nom_artiste, photo_profil, bio
       FROM utilisateurs
       WHERE role = 'artiste'
         AND (LOWER(prenom) LIKE $1 OR LOWER(nom_artiste) LIKE $1)
       LIMIT 8`,
      [terme]
    );

    res.json({
      musiques: musiques.rows,
      artistes: artistes.rows
    });
  } catch (erreur) {
    res.status(500).json({ message: 'Erreur : ' + erreur.message });
  }
};

const getMusiquesSuivis = async (req, res) => {
  try {
    const { utilisateur_id } = req.params;

    const musiques = await pool.query(
      `SELECT m.*, u.prenom as nom_artiste, u.photo_profil
       FROM musiques m
       JOIN utilisateurs u ON m.artiste_id = u.id
       WHERE m.artiste_id IN (
         SELECT artiste_id FROM abonnements WHERE abonne_id = $1
       )
       ORDER BY m.date_ajout DESC`,
      [utilisateur_id]
    );

    res.json({ musiques: musiques.rows });
  } catch (erreur) {
    res.status(500).json({ message: 'Erreur : ' + erreur.message });
  }
};

module.exports = { uploadMusique, getMusiques, getPistesAlbum, getNouveautes, getTopVentes, getTopSingles, getTopAlbums, getTopArtistes, getGenres, getMusiquesByGenre, getMusiquesSuivis, rechercherMusiques };