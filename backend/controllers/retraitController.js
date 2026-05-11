const pool = require('../database');

const demanderRetrait = async (req, res) => {
  try {
    const { artiste_id, operateur, montant } = req.body;

    if (!artiste_id || !operateur || !montant) {
      return res.status(400).json({ message: 'Tous les champs sont obligatoires !' });
    }

    if (montant < 500) {
      return res.status(400).json({ message: 'Le montant minimum de retrait est 500 FCFA !' });
    }

    // Récupérer les numéros de l'artiste
    const artiste = await pool.query(
      'SELECT * FROM utilisateurs WHERE id = $1',
      [artiste_id]
    );

    if (artiste.rows.length === 0) {
      return res.status(404).json({ message: 'Artiste introuvable !' });
    }

    // Vérifier que l'artiste a un numéro pour cet opérateur
    if (operateur === 'mtn' && !artiste.rows[0].numero_mtn) {
      return res.status(400).json({ message: 'Vous n\'avez pas de numéro MTN enregistré. Ajoutez-le dans Mon Compte !' });
    }

    if (operateur === 'airtel' && !artiste.rows[0].numero_airtel) {
      return res.status(400).json({ message: 'Vous n\'avez pas de numéro Airtel enregistré. Ajoutez-le dans Mon Compte !' });
    }

    // Calculer les gains disponibles par opérateur
    const gains = await pool.query(
      `SELECT 
        COALESCE(SUM(a.revenu_artiste), 0) as gains_disponibles
       FROM achats a
       JOIN musiques m ON a.musique_id = m.id
       WHERE m.artiste_id = $1 AND a.operateur = $2`,
      [artiste_id, operateur]
    );

    // Calculer les retraits déjà effectués par opérateur
    const retraitsEffectues = await pool.query(
      `SELECT COALESCE(SUM(montant), 0) as total_retire
       FROM retraits
       WHERE artiste_id = $1 AND operateur = $2 
       AND statut != 'annule'`,
      [artiste_id, operateur]
    );

    const gainsDisponibles = parseInt(gains.rows[0].gains_disponibles);
    const totalRetire = parseInt(retraitsEffectues.rows[0].total_retire);
    const soldeDisponible = gainsDisponibles - totalRetire;

    if (montant > soldeDisponible) {
      return res.status(400).json({
        message: `Solde insuffisant ! Vous avez ${soldeDisponible} FCFA disponibles via ${operateur.toUpperCase()}.`
      });
    }

    const numeroRetrait = operateur === 'mtn'
      ? artiste.rows[0].numero_mtn
      : artiste.rows[0].numero_airtel;

    // Créer la demande de retrait
    const retrait = await pool.query(
      `INSERT INTO retraits (artiste_id, montant, operateur, numero_retrait, statut)
       VALUES ($1, $2, $3, $4, 'en_attente')
       RETURNING *`,
      [artiste_id, montant, operateur, numeroRetrait]
    );

    res.status(201).json({
      message: `Demande de retrait de ${montant} FCFA via ${operateur.toUpperCase()} enregistrée avec succès !`,
      retrait: retrait.rows[0],
      numero: numeroRetrait
    });

  } catch (erreur) {
    res.status(500).json({ message: 'Erreur : ' + erreur.message });
  }
};

const getMesRetraits = async (req, res) => {
  try {
    const { artiste_id } = req.params;

    const retraits = await pool.query(
      `SELECT * FROM retraits 
       WHERE artiste_id = $1 
       ORDER BY date_demande DESC`,
      [artiste_id]
    );

    // Calculer les soldes disponibles par opérateur
    const gainsMtn = await pool.query(
      `SELECT COALESCE(SUM(a.revenu_artiste), 0) as total
       FROM achats a JOIN musiques m ON a.musique_id = m.id
       WHERE m.artiste_id = $1 AND a.operateur = 'mtn'`,
      [artiste_id]
    );

    const gainsAirtel = await pool.query(
      `SELECT COALESCE(SUM(a.revenu_artiste), 0) as total
       FROM achats a JOIN musiques m ON a.musique_id = m.id
       WHERE m.artiste_id = $1 AND a.operateur = 'airtel'`,
      [artiste_id]
    );

    const retraitsMtn = await pool.query(
      `SELECT COALESCE(SUM(montant), 0) as total
       FROM retraits WHERE artiste_id = $1 
       AND operateur = 'mtn' AND statut != 'annule'`,
      [artiste_id]
    );

    const retraitsAirtel = await pool.query(
      `SELECT COALESCE(SUM(montant), 0) as total
       FROM retraits WHERE artiste_id = $1 
       AND operateur = 'airtel' AND statut != 'annule'`,
      [artiste_id]
    );

    const soldeMtn = parseInt(gainsMtn.rows[0].total) - parseInt(retraitsMtn.rows[0].total);
    const soldeAirtel = parseInt(gainsAirtel.rows[0].total) - parseInt(retraitsAirtel.rows[0].total);

    res.json({
      retraits: retraits.rows,
      soldes: {
        mtn: soldeMtn,
        airtel: soldeAirtel,
        total: soldeMtn + soldeAirtel
      }
    });

  } catch (erreur) {
    res.status(500).json({ message: 'Erreur : ' + erreur.message });
  }
};

module.exports = { demanderRetrait, getMesRetraits };