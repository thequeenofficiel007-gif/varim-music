const pool = require('../database');
const cloudinary = require('../cloudinary');

// RÉCUPÉRER PROFIL ARTISTE
const getProfilArtiste = async (req, res) => {
  try {
    const { artiste_id } = req.params;

    const artiste = await pool.query(
      `SELECT id, prenom, nom_artiste, bio, photo_profil, role
       FROM utilisateurs 
       WHERE id = $1 AND role = 'artiste'`,
      [artiste_id]
    );

    if (artiste.rows.length === 0) {
      return res.status(404).json({ message: 'Artiste introuvable !' });
    }

    const musiques = await pool.query(
      `SELECT * FROM musiques 
       WHERE artiste_id = $1 
       ORDER BY date_ajout DESC`,
      [artiste_id]
    );

    const abonnes = await pool.query(
      `SELECT COUNT(*) as nb_abonnes 
       FROM abonnements 
       WHERE artiste_id = $1`,
      [artiste_id]
    );

    res.json({
      artiste: artiste.rows[0],
      musiques: musiques.rows,
      nb_abonnes: abonnes.rows[0].nb_abonnes
    });

  } catch (erreur) {
    res.status(500).json({ message: 'Erreur : ' + erreur.message });
  }
};

// MODIFIER PROFIL
const modifierProfil = async (req, res) => {
  try {
    const { utilisateur_id, nom_artiste, bio, numero_mtn, numero_airtel } = req.body;

    // Valider numéro MTN si fourni
    if (numero_mtn) {
      const propre = numero_mtn.replace(/\s/g, '').replace('+242', '');
      if (!propre.startsWith('06')) {
        return res.status(400).json({ message: 'Le numéro MTN doit commencer par 06 !' });
      }
    }

    // Valider numéro Airtel si fourni
    if (numero_airtel) {
      const propre = numero_airtel.replace(/\s/g, '').replace('+242', '');
      if (!propre.startsWith('05') && !propre.startsWith('04')) {
        return res.status(400).json({ message: 'Le numéro Airtel doit commencer par 05 ou 04 !' });
      }
    }

    let photoUrl = null;
    if (req.file) {
      const result = await new Promise((resolve, reject) => {
        cloudinary.uploader.upload_stream(
          { resource_type: 'image', folder: 'varim-music/profils' },
          (error, result) => {
            if (error) reject(error);
            else resolve(result);
          }
        ).end(req.file.buffer);
      });
      photoUrl = result.secure_url;
    }

    const query = photoUrl
      ? `UPDATE utilisateurs SET nom_artiste=$1, bio=$2, photo_profil=$3, numero_mtn=$4, numero_airtel=$5 WHERE id=$6 RETURNING *`
      : `UPDATE utilisateurs SET nom_artiste=$1, bio=$2, numero_mtn=$3, numero_airtel=$4 WHERE id=$5 RETURNING *`;

    const params = photoUrl
      ? [nom_artiste, bio, photoUrl, numero_mtn, numero_airtel, utilisateur_id]
      : [nom_artiste, bio, numero_mtn, numero_airtel, utilisateur_id];

    const utilisateur = await pool.query(query, params);

    res.json({
      message: 'Profil mis à jour !',
      utilisateur: {
        id: utilisateur.rows[0].id,
        prenom: utilisateur.rows[0].prenom,
        nom_artiste: utilisateur.rows[0].nom_artiste,
        bio: utilisateur.rows[0].bio,
        photo_profil: utilisateur.rows[0].photo_profil,
        numero_mtn: utilisateur.rows[0].numero_mtn,
        numero_airtel: utilisateur.rows[0].numero_airtel,
        role: utilisateur.rows[0].role
      }
    });

  } catch (erreur) {
    res.status(500).json({ message: 'Erreur : ' + erreur.message });
  }
};

// S'ABONNER
const sAbonner = async (req, res) => {
  try {
    const { abonne_id, artiste_id } = req.body;

    await pool.query(
      `INSERT INTO abonnements (abonne_id, artiste_id) 
       VALUES ($1, $2) ON CONFLICT DO NOTHING`,
      [abonne_id, artiste_id]
    );

    res.json({ message: 'Abonnement réussi !' });

  } catch (erreur) {
    res.status(500).json({ message: 'Erreur : ' + erreur.message });
  }
};

// SE DÉSABONNER
const seDesabonner = async (req, res) => {
  try {
    const { abonne_id, artiste_id } = req.body;

    await pool.query(
      `DELETE FROM abonnements 
       WHERE abonne_id = $1 AND artiste_id = $2`,
      [abonne_id, artiste_id]
    );

    res.json({ message: 'Désabonnement réussi !' });

  } catch (erreur) {
    res.status(500).json({ message: 'Erreur : ' + erreur.message });
  }
};

// VÉRIFIER ABONNEMENT
const getAbonnements = async (req, res) => {
  try {
    const { artiste_id } = req.params;
    const { abonne_id } = req.query;

    const abonnement = await pool.query(
      `SELECT * FROM abonnements 
       WHERE abonne_id = $1 AND artiste_id = $2`,
      [abonne_id, artiste_id]
    );

    res.json({ estAbonne: abonnement.rows.length > 0 });

  } catch (erreur) {
    res.status(500).json({ message: 'Erreur : ' + erreur.message });
  }
};

module.exports = { getProfilArtiste, modifierProfil, sAbonner, seDesabonner, getAbonnements };