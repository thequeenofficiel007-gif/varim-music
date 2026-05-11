const pool = require('../database');

const getStatsAdmin = async (req, res) => {
  try {
    const { debut, fin } = req.query;

    const avecFiltre = debut && fin;

    // Stats globales (toujours sans filtre de date)
    const stats = await pool.query(`
      SELECT
        (SELECT COUNT(*) FROM utilisateurs) as total_utilisateurs,
        (SELECT COUNT(*) FROM utilisateurs WHERE role = 'artiste') as total_artistes,
        (SELECT COUNT(*) FROM utilisateurs WHERE role = 'acheteur') as total_acheteurs,
        (SELECT COUNT(*) FROM musiques) as total_musiques,
        (SELECT COUNT(*) FROM musiques WHERE type = 'single') as total_singles,
        (SELECT COUNT(*) FROM musiques WHERE type = 'album') as total_albums,
        (SELECT COUNT(*) FROM abonnements) as total_abonnements,
        (SELECT COUNT(*) FROM retraits WHERE statut = 'en_attente') as retraits_en_attente,
        (SELECT COALESCE(SUM(montant), 0) FROM retraits WHERE statut = 'traite') as total_retire
    `);

    // Stats ventes avec filtre optionnel
    let statsVentesQuery;
    if (avecFiltre) {
      statsVentesQuery = await pool.query(`
        SELECT
          COUNT(*) as total_achats,
          COALESCE(SUM(commission), 0) as total_commissions,
          COALESCE(SUM(montant), 0) as total_revenus,
          COALESCE(SUM(revenu_artiste), 0) as total_revenus_artistes
        FROM achats
        WHERE date_achat >= $1 AND date_achat <= ($2::date + interval '1 day')
      `, [debut, fin]);
    } else {
      statsVentesQuery = await pool.query(`
        SELECT
          COUNT(*) as total_achats,
          COALESCE(SUM(commission), 0) as total_commissions,
          COALESCE(SUM(montant), 0) as total_revenus,
          COALESCE(SUM(revenu_artiste), 0) as total_revenus_artistes
        FROM achats
      `);
    }

    // Stats par opérateur
    let statsOpsQuery;
    if (avecFiltre) {
      statsOpsQuery = await pool.query(`
        SELECT operateur,
          COUNT(*) as nb_ventes,
          COALESCE(SUM(montant), 0) as total_montant,
          COALESCE(SUM(commission), 0) as total_commission
        FROM achats
        WHERE date_achat >= $1 AND date_achat <= ($2::date + interval '1 day')
        GROUP BY operateur
      `, [debut, fin]);
    } else {
      statsOpsQuery = await pool.query(`
        SELECT operateur,
          COUNT(*) as nb_ventes,
          COALESCE(SUM(montant), 0) as total_montant,
          COALESCE(SUM(commission), 0) as total_commission
        FROM achats
        GROUP BY operateur
      `);
    }

    // Ventes par jour (30 derniers jours, toujours)
    const ventesParJour = await pool.query(`
      SELECT
        DATE(date_achat) as jour,
        COUNT(*) as nb_ventes,
        COALESCE(SUM(montant), 0) as chiffre_affaires,
        COALESCE(SUM(commission), 0) as commissions
      FROM achats
      WHERE date_achat >= NOW() - INTERVAL '30 days'
      GROUP BY DATE(date_achat)
      ORDER BY jour ASC
    `);

    // Dernières ventes
    let ventesQuery;
    if (avecFiltre) {
      ventesQuery = await pool.query(`
        SELECT a.*, m.titre, m.type,
          u1.prenom as acheteur_prenom, u1.telephone as acheteur_tel,
          u2.prenom as artiste_prenom, u2.telephone as artiste_tel
        FROM achats a
        JOIN musiques m ON a.musique_id = m.id
        JOIN utilisateurs u1 ON a.acheteur_id = u1.id
        JOIN utilisateurs u2 ON m.artiste_id = u2.id
        WHERE a.date_achat >= $1 AND a.date_achat <= ($2::date + interval '1 day')
        ORDER BY a.date_achat DESC
        LIMIT 50
      `, [debut, fin]);
    } else {
      ventesQuery = await pool.query(`
        SELECT a.*, m.titre, m.type,
          u1.prenom as acheteur_prenom, u1.telephone as acheteur_tel,
          u2.prenom as artiste_prenom, u2.telephone as artiste_tel
        FROM achats a
        JOIN musiques m ON a.musique_id = m.id
        JOIN utilisateurs u1 ON a.acheteur_id = u1.id
        JOIN utilisateurs u2 ON m.artiste_id = u2.id
        ORDER BY a.date_achat DESC
        LIMIT 50
      `);
    }

    // Utilisateurs
    const utilisateurs = await pool.query(`
      SELECT id, prenom, telephone, role, date_inscription, bloque,
        (SELECT COUNT(*) FROM achats WHERE acheteur_id = u.id) as nb_achats,
        (SELECT COUNT(*) FROM musiques WHERE artiste_id = u.id) as nb_musiques
      FROM utilisateurs u
      ORDER BY date_inscription DESC
    `);

    // Top artistes
    const topArtistes = await pool.query(`
      SELECT u.id, u.prenom, u.nom_artiste, u.telephone, u.photo_profil,
        COUNT(DISTINCT m.id) as nb_musiques,
        COUNT(a.id) as nb_ventes,
        COALESCE(SUM(a.revenu_artiste), 0) as revenus,
        COALESCE(SUM(a.commission), 0) as commissions_generees
      FROM utilisateurs u
      LEFT JOIN musiques m ON u.id = m.artiste_id
      LEFT JOIN achats a ON m.id = a.musique_id
      WHERE u.role = 'artiste'
      GROUP BY u.id
      ORDER BY nb_ventes DESC
      LIMIT 20
    `);

    // Retraits avec infos artiste enrichies
    const retraits = await pool.query(`
      SELECT r.*,
        u.prenom as artiste_prenom, u.telephone, u.nom_artiste, u.photo_profil,
        (SELECT COALESCE(SUM(a.revenu_artiste), 0) FROM achats a JOIN musiques m ON a.musique_id = m.id WHERE m.artiste_id = u.id) as total_gains,
        (SELECT COALESCE(SUM(montant), 0) FROM retraits WHERE artiste_id = u.id AND statut = 'traite') as total_retire,
        (SELECT COUNT(*) FROM musiques WHERE artiste_id = u.id) as nb_musiques,
        (SELECT COUNT(*) FROM achats a JOIN musiques m ON a.musique_id = m.id WHERE m.artiste_id = u.id) as nb_ventes
      FROM retraits r
      JOIN utilisateurs u ON r.artiste_id = u.id
      ORDER BY r.date_demande DESC
    `);

    const statsVentes = statsVentesQuery.rows[0];

    res.json({
      stats: {
        ...stats.rows[0],
        ...statsVentes
      },
      statsOps: statsOpsQuery.rows,
      ventesParJour: ventesParJour.rows,
      utilisateurs: utilisateurs.rows,
      ventes: ventesQuery.rows,
      topArtistes: topArtistes.rows,
      retraits: retraits.rows,
      filtre: { debut, fin }
    });

  } catch (erreur) {
    console.error('ERREUR ADMIN:', erreur);
    res.status(500).json({ message: 'Erreur : ' + erreur.message });
  }
};

const traiterRetrait = async (req, res) => {
  try {
    const { retrait_id, statut } = req.body;
    if (!['traite', 'annule'].includes(statut)) {
      return res.status(400).json({ message: 'Statut invalide !' });
    }
    await pool.query(
      `UPDATE retraits SET statut = $1, date_traitement = NOW() WHERE id = $2`,
      [statut, retrait_id]
    );
    res.json({ message: `Retrait marqué comme ${statut} !` });
  } catch (erreur) {
    res.status(500).json({ message: 'Erreur : ' + erreur.message });
  }
};

const bloquerUtilisateur = async (req, res) => {
  try {
    const { utilisateur_id, bloquer } = req.body;
    await pool.query(`UPDATE utilisateurs SET bloque = $1 WHERE id = $2`, [bloquer, utilisateur_id]);
    res.json({ message: bloquer ? 'Utilisateur bloqué !' : 'Utilisateur débloqué !' });
  } catch (erreur) {
    res.status(500).json({ message: 'Erreur : ' + erreur.message });
  }
};

module.exports = { getStatsAdmin, traiterRetrait, bloquerUtilisateur };