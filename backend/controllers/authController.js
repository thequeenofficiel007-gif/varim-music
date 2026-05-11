const pool = require('../database');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

// INSCRIPTION
const inscription = async (req, res) => {
  try {
    const { prenom, telephone, mot_de_passe, confirmation_mot_de_passe, pin, role } = req.body;

    // Vérifier que tous les champs sont remplis
    if (!prenom || !telephone || !mot_de_passe || !confirmation_mot_de_passe || !pin || !role) {
      return res.status(400).json({ message: 'Tous les champs sont obligatoires !' });
    }

    // Vérifier la longueur du prénom
    if (prenom.length < 2 || prenom.length > 50) {
      return res.status(400).json({ message: 'Le prénom doit contenir entre 2 et 50 caractères !' });
    }

    // Vérifier le format du téléphone (8 à 15 chiffres)
    if (!/^\d{8,15}$/.test(telephone.replace(/\s/g, ''))) {
      return res.status(400).json({ message: 'Numéro de téléphone invalide !' });
    }

    // Vérifier la longueur du mot de passe
    if (mot_de_passe.length < 6) {
      return res.status(400).json({ message: 'Le mot de passe doit contenir au moins 6 caractères !' });
    }

    // Vérifier que les mots de passe correspondent
    if (mot_de_passe !== confirmation_mot_de_passe) {
      return res.status(400).json({ message: 'Les mots de passe ne correspondent pas !' });
    }

    // Vérifier que le PIN est bien 4 chiffres
    if (!/^\d{4}$/.test(pin)) {
      return res.status(400).json({ message: 'Le code PIN doit contenir exactement 4 chiffres !' });
    }

    // Vérifier si le numéro existe déjà
    const exist = await pool.query(
      'SELECT * FROM utilisateurs WHERE telephone = $1',
      [telephone]
    );

    if (exist.rows.length > 0) {
      return res.status(400).json({ message: 'Ce numéro est déjà utilisé !' });
    }

    // Chiffrer le mot de passe et le PIN
    const motDePasseChiffre = await bcrypt.hash(mot_de_passe, 10);
    const pinChiffre = await bcrypt.hash(pin, 10);

    // Sauvegarder l'utilisateur
    const nouvelUtilisateur = await pool.query(
      `INSERT INTO utilisateurs 
        (prenom, telephone, mot_de_passe, role, pin, pin_cree) 
       VALUES ($1, $2, $3, $4, $5, TRUE) 
       RETURNING *`,
      [prenom, telephone, motDePasseChiffre, role, pinChiffre]
    );

    res.status(201).json({
      message: 'Inscription réussie !',
      utilisateur: {
        id: nouvelUtilisateur.rows[0].id,
        prenom: nouvelUtilisateur.rows[0].prenom,
        telephone: nouvelUtilisateur.rows[0].telephone,
        role: nouvelUtilisateur.rows[0].role
      }
    });

  } catch (erreur) {
    res.status(500).json({ message: 'Erreur serveur : ' + erreur.message });
  }
};

// CONNEXION
const connexion = async (req, res) => {
  try {
    const { telephone, mot_de_passe } = req.body;

    const utilisateur = await pool.query(
      'SELECT * FROM utilisateurs WHERE telephone = $1',
      [telephone]
    );

    if (utilisateur.rows.length === 0) {
      return res.status(400).json({ message: 'Numéro introuvable !' });
    }

    const motDePasseValide = await bcrypt.compare(
      mot_de_passe,
      utilisateur.rows[0].mot_de_passe
    );

    if (!motDePasseValide) {
      return res.status(400).json({ message: 'Mot de passe incorrect !' });
    }

    const token = jwt.sign(
      {
        id: utilisateur.rows[0].id,
        role: utilisateur.rows[0].role
      },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.json({
      message: 'Connexion réussie !',
      token,
      utilisateur: {
        id: utilisateur.rows[0].id,
        prenom: utilisateur.rows[0].prenom,
        telephone: utilisateur.rows[0].telephone,
        role: utilisateur.rows[0].role,
        nom_artiste: utilisateur.rows[0].nom_artiste,
        photo_profil: utilisateur.rows[0].photo_profil,
        bio: utilisateur.rows[0].bio,
        numero_mtn: utilisateur.rows[0].numero_mtn,
        numero_airtel: utilisateur.rows[0].numero_airtel,
        numero_paiement_prefere: utilisateur.rows[0].numero_paiement_prefere
      }
    });

  } catch (erreur) {
    res.status(500).json({ message: 'Erreur serveur : ' + erreur.message });
  }
};

// VÉRIFIER LE PIN
const verifierPin = async (req, res) => {
  try {
    const { utilisateur_id, pin } = req.body;

    const utilisateur = await pool.query(
      'SELECT * FROM utilisateurs WHERE id = $1',
      [utilisateur_id]
    );

    if (utilisateur.rows.length === 0) {
      return res.status(404).json({ message: 'Utilisateur introuvable !' });
    }

    const pinValide = await bcrypt.compare(pin, utilisateur.rows[0].pin);

    if (!pinValide) {
      return res.status(400).json({ message: 'Code PIN incorrect !' });
    }

    res.json({ message: 'PIN vérifié avec succès !', valide: true });

  } catch (erreur) {
    res.status(500).json({ message: 'Erreur serveur : ' + erreur.message });
  }
};

const sauvegarderNumero = async (req, res) => {
  try {
    const { utilisateur_id, numero_paiement_prefere } = req.body;

    await pool.query(
      'UPDATE utilisateurs SET numero_paiement_prefere = $1 WHERE id = $2',
      [numero_paiement_prefere, utilisateur_id]
    );

    res.json({ message: 'Numéro sauvegardé !' });
  } catch (erreur) {
    res.status(500).json({ message: 'Erreur : ' + erreur.message });
  }
};

module.exports = { inscription, connexion, verifierPin, sauvegarderNumero };