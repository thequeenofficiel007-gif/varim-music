const pool = require('../database');

const getDashboardArtiste = async (req, res) => {
  try {
    const { artiste_id } = req.params;

    // Musiques avec stats
    const musiques = await pool.query(
      `SELECT m.*, 
        COUNT(a.id) as nb_ventes_reel,
        COALESCE(SUM(a.revenu_artiste), 0) as revenus_total,
        COALESCE(SUM(a.commission), 0) as commissions_total
       FROM musiques m
       LEFT JOIN achats a ON m.id = a.musique_id
       WHERE m.artiste_id = $1
       GROUP BY m.id
       ORDER BY m.date_ajout DESC`,
      [artiste_id]
    );

    // Totaux bruts
    const totaux = await pool.query(
      `SELECT 
        COUNT(a.id) as total_ventes,
        COALESCE(SUM(a.revenu_artiste), 0) as total_revenus_bruts,
        COALESCE(SUM(a.commission), 0) as total_commissions
       FROM achats a
       JOIN musiques m ON a.musique_id = m.id
       WHERE m.artiste_id = $1`,
      [artiste_id]
    );

    // Total retiré
    const totalRetire = await pool.query(
      `SELECT COALESCE(SUM(montant), 0) as total_retire
       FROM retraits
       WHERE artiste_id = $1 AND statut != 'annule'`,
      [artiste_id]
    );

    // Soldes nets par opérateur
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

    const totalRevenusBruts = parseInt(totaux.rows[0].total_revenus_bruts);
    const totalRetraitEffectue = parseInt(totalRetire.rows[0].total_retire);
    const totalRevenusNets = totalRevenusBruts - totalRetraitEffectue;
    const soldeMtn = parseInt(gainsMtn.rows[0].total) - parseInt(retraitsMtn.rows[0].total);
    const soldeAirtel = parseInt(gainsAirtel.rows[0].total) - parseInt(retraitsAirtel.rows[0].total);

    // Dernières ventes
    const dernieresVentes = await pool.query(
      `SELECT a.*, m.titre, m.type, u.prenom as acheteur_prenom
       FROM achats a
       JOIN musiques m ON a.musique_id = m.id
       JOIN utilisateurs u ON a.acheteur_id = u.id
       WHERE m.artiste_id = $1
       ORDER BY a.date_achat DESC
       LIMIT 5`,
      [artiste_id]
    );

    // Historique des retraits
    const historiqueRetraits = await pool.query(
      `SELECT * FROM retraits 
       WHERE artiste_id = $1 
       ORDER BY date_demande DESC 
       LIMIT 10`,
      [artiste_id]
    );

    // Notifications groupées (20 dernières)
    const notifications = await pool.query(
      `SELECT 
        m.titre,
        m.id as musique_id,
        COUNT(a.id) as nb_achats,
        MAX(a.date_achat) as derniere_date
       FROM achats a
       JOIN musiques m ON a.musique_id = m.id
       WHERE m.artiste_id = $1
       GROUP BY m.id, m.titre
       ORDER BY derniere_date DESC
       LIMIT 20`,
      [artiste_id]
    );

    res.json({
      musiques: musiques.rows,
      totaux: {
        total_ventes: totaux.rows[0].total_ventes,
        total_revenus_bruts: totalRevenusBruts,
        total_revenus_nets: totalRevenusNets,
        total_retire: totalRetraitEffectue,
        total_commissions: totaux.rows[0].total_commissions,
        solde_mtn: soldeMtn,
        solde_airtel: soldeAirtel
      },
      dernieresVentes: dernieresVentes.rows,
      historiqueRetraits: historiqueRetraits.rows,
      notifications: notifications.rows
    });

  } catch (erreur) {
    res.status(500).json({ message: 'Erreur : ' + erreur.message });
  }
};

module.exports = { getDashboardArtiste };