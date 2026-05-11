const pool = require('../database');

// Récupérer tous les favoris d'un utilisateur
const getFavoris = async (req, res) => {
  try {
    const { utilisateur_id } = req.params;

    const favoris = await pool.query(`
      SELECT 
        f.id as favori_id,
        f.musique_id,
        f.piste_id,
        f.date_ajout,
        -- Si c'est une piste d'album
        CASE 
          WHEN f.piste_id IS NOT NULL THEN p.titre
          ELSE m.titre
        END as titre,
        CASE
          WHEN f.piste_id IS NOT NULL THEN 'piste'
          ELSE m.type
        END as type,
        m.pochette_url,
        m.prix,
        m.artiste_id,
        m.id as album_id_parent,
        u.prenom as nom_artiste,
        u.photo_profil,
        -- URL du fichier
        CASE
          WHEN f.piste_id IS NOT NULL THEN p.fichier_url
          ELSE m.fichier_url
        END as fichier_url,
        -- Nom de l'album parent si c'est une piste
        CASE
          WHEN f.piste_id IS NOT NULL THEN m.titre
          ELSE NULL
        END as titre_album
      FROM favoris f
      JOIN musiques m ON f.musique_id = m.id
      LEFT JOIN pistes p ON f.piste_id = p.id
      JOIN utilisateurs u ON m.artiste_id = u.id
      WHERE f.utilisateur_id = $1
      ORDER BY f.date_ajout DESC
    `, [utilisateur_id]);

    res.json({ favoris: favoris.rows });
  } catch (erreur) {
    res.status(500).json({ message: 'Erreur : ' + erreur.message });
  }
};

// Ajouter un favori
const ajouterFavori = async (req, res) => {
  try {
    const { utilisateur_id, musique_id, piste_id } = req.body;

    // Vérifier si déjà en favori
    const existant = await pool.query(
      `SELECT id FROM favoris 
       WHERE utilisateur_id = $1 AND musique_id = $2 AND (piste_id = $3 OR (piste_id IS NULL AND $3 IS NULL))`,
      [utilisateur_id, musique_id, piste_id || null]
    );

    if (existant.rows.length > 0) {
      return res.status(400).json({ message: 'Déjà dans vos favoris.' });
    }

    await pool.query(
      `INSERT INTO favoris (utilisateur_id, musique_id, piste_id) VALUES ($1, $2, $3)`,
      [utilisateur_id, musique_id, piste_id || null]
    );

    res.status(201).json({ message: 'Ajouté aux favoris !' });
  } catch (erreur) {
    res.status(500).json({ message: 'Erreur : ' + erreur.message });
  }
};

// Retirer un favori
const retirerFavori = async (req, res) => {
  try {
    const { utilisateur_id, musique_id, piste_id } = req.body;

    await pool.query(
      `DELETE FROM favoris 
       WHERE utilisateur_id = $1 AND musique_id = $2 AND (piste_id = $3 OR (piste_id IS NULL AND $3 IS NULL))`,
      [utilisateur_id, musique_id, piste_id || null]
    );

    res.json({ message: 'Retiré des favoris.' });
  } catch (erreur) {
    res.status(500).json({ message: 'Erreur : ' + erreur.message });
  }
};

// Vérifier si une musique/piste est en favori
const verifierFavori = async (req, res) => {
  try {
    const { utilisateur_id, musique_id, piste_id } = req.query;

    const result = await pool.query(
      `SELECT id FROM favoris 
       WHERE utilisateur_id = $1 AND musique_id = $2 AND (piste_id = $3 OR (piste_id IS NULL AND $3 IS NULL))`,
      [utilisateur_id, musique_id, piste_id || null]
    );

    res.json({ estFavori: result.rows.length > 0 });
  } catch (erreur) {
    res.status(500).json({ message: 'Erreur : ' + erreur.message });
  }
};

module.exports = { getFavoris, ajouterFavori, retirerFavori, verifierFavori };