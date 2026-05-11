const pool = require('../database');

const getEnregistrements = async (req, res) => {
  try {
    const { utilisateur_id } = req.params;
    const result = await pool.query(`
      SELECT e.id as enregistrement_id, e.date_ajout,
        m.id as musique_id, m.titre, m.type, m.pochette_url, m.prix,
        m.artiste_id, u.prenom as nom_artiste, u.photo_profil
      FROM enregistrements e
      JOIN musiques m ON e.musique_id = m.id
      JOIN utilisateurs u ON m.artiste_id = u.id
      WHERE e.utilisateur_id = $1
      ORDER BY e.date_ajout DESC
    `, [utilisateur_id]);
    res.json({ enregistrements: result.rows });
  } catch (e) { res.status(500).json({ message: e.message }); }
};

const ajouterEnregistrement = async (req, res) => {
  try {
    const { utilisateur_id, musique_id } = req.body;
    const exist = await pool.query(
      'SELECT id FROM enregistrements WHERE utilisateur_id=$1 AND musique_id=$2',
      [utilisateur_id, musique_id]
    );
    if (exist.rows.length > 0) return res.status(400).json({ message: 'Déjà enregistré.' });
    await pool.query('INSERT INTO enregistrements (utilisateur_id, musique_id) VALUES ($1,$2)', [utilisateur_id, musique_id]);
    res.status(201).json({ message: 'Enregistré !' });
  } catch (e) { res.status(500).json({ message: e.message }); }
};

const retirerEnregistrement = async (req, res) => {
  try {
    const { utilisateur_id, musique_id } = req.body;
    await pool.query('DELETE FROM enregistrements WHERE utilisateur_id=$1 AND musique_id=$2', [utilisateur_id, musique_id]);
    res.json({ message: 'Enregistrement retiré.' });
  } catch (e) { res.status(500).json({ message: e.message }); }
};

const verifierEnregistrement = async (req, res) => {
  try {
    const { utilisateur_id, musique_id } = req.query;
    const result = await pool.query(
      'SELECT id FROM enregistrements WHERE utilisateur_id=$1 AND musique_id=$2',
      [utilisateur_id, musique_id]
    );
    res.json({ estEnregistre: result.rows.length > 0 });
  } catch (e) { res.status(500).json({ message: e.message }); }
};

module.exports = { getEnregistrements, ajouterEnregistrement, retirerEnregistrement, verifierEnregistrement };