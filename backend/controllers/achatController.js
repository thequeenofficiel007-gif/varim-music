const pool = require('../database');
const { v4: uuidv4 } = require('uuid');
const { demanderPaiement, verifierStatutPaiement, PAIEMENT_SIMULE } = require('../paiement');

/**
 * CRÉER UN ACHAT
 * - En mode simulé : confirme immédiatement (comportement actuel)
 * - En mode réel : initie la demande Mobile Money et attend la confirmation
 */
const creerAchat = async (req, res) => {
  try {
    const { acheteur_id, musique_id, operateur, numero_paiement } = req.body;

    // Récupérer la musique et les infos artiste
    const musique = await pool.query(
      `SELECT m.*, u.numero_mtn, u.numero_airtel, u.prenom as nom_artiste
       FROM musiques m
       JOIN utilisateurs u ON m.artiste_id = u.id
       WHERE m.id = $1`,
      [musique_id]
    );

    if (musique.rows.length === 0) {
      return res.status(404).json({ message: 'Musique introuvable !' });
    }

    const m = musique.rows[0];

    if (operateur === 'mtn' && !m.numero_mtn) {
      return res.status(400).json({ message: 'Cet artiste n\'accepte pas les paiements MTN.' });
    }
    if (operateur === 'airtel' && !m.numero_airtel) {
      return res.status(400).json({ message: 'Cet artiste n\'accepte pas les paiements Airtel.' });
    }

    // Vérifier que l'acheteur n'a pas déjà acheté
    const dejaAchete = await pool.query(
      'SELECT id FROM achats WHERE acheteur_id = $1 AND musique_id = $2',
      [acheteur_id, musique_id]
    );
    if (dejaAchete.rows.length > 0) {
      return res.status(400).json({ message: 'Vous avez déjà acheté cette musique !' });
    }

    const montant = m.prix;
    const commission = m.commission;
    const revenu_artiste = montant - commission;
    const referenceId = uuidv4();

    // ──────────────────────────────────────────
    // MODE SIMULÉ (actuel)
    // ──────────────────────────────────────────
    if (PAIEMENT_SIMULE) {
      const nouvelAchat = await pool.query(
        `INSERT INTO achats
          (acheteur_id, musique_id, montant, commission, revenu_artiste, operateur, numero_paiement, statut, reference_paiement)
         VALUES ($1, $2, $3, $4, $5, $6, $7, 'confirme', $8)
         RETURNING *`,
        [acheteur_id, musique_id, montant, commission, revenu_artiste, operateur, numero_paiement, referenceId]
      );

      await pool.query(
        'UPDATE musiques SET nb_ventes = nb_ventes + 1 WHERE id = $1',
        [musique_id]
      );

      return res.status(201).json({
        message: 'Paiement confirmé ! Musique ajoutée à votre bibliothèque.',
        achat: nouvelAchat.rows[0],
        mode: 'simule'
      });
    }

    // ──────────────────────────────────────────
    // MODE RÉEL (quand vous aurez vos clés API)
    // ──────────────────────────────────────────

    // 1. Initier la demande de paiement Mobile Money
    const resultatPaiement = await demanderPaiement({
      operateur,
      montant,
      numero: numero_paiement,
      referenceId,
      description: `Achat ${m.titre} sur Varim Music`
    });

    if (!resultatPaiement.succes) {
      return res.status(400).json({
        message: 'Impossible d\'initier le paiement : ' + resultatPaiement.erreur
      });
    }

    // 2. Créer l'achat en statut "en_attente"
    await pool.query(
      `INSERT INTO achats
        (acheteur_id, musique_id, montant, commission, revenu_artiste, operateur, numero_paiement, statut, reference_paiement)
       VALUES ($1, $2, $3, $4, $5, $6, $7, 'en_attente', $8)`,
      [acheteur_id, musique_id, montant, commission, revenu_artiste, operateur, numero_paiement, referenceId]
    );

    // 3. Retourner en attendant la confirmation (le frontend va poller)
    return res.status(202).json({
      message: 'Demande de paiement envoyée. Validez sur votre téléphone.',
      referenceId,
      statut: 'en_attente',
      mode: 'reel'
    });

  } catch (erreur) {
    console.error('[ACHAT] Erreur:', erreur.message);
    res.status(500).json({ message: 'Erreur : ' + erreur.message });
  }
};

/**
 * VÉRIFIER LE STATUT D'UN PAIEMENT
 * Le frontend appelle cette route toutes les 3 secondes
 * pour savoir si le client a validé sur son téléphone
 */
const verifierPaiement = async (req, res) => {
  try {
    const { referenceId } = req.params;

    // Récupérer l'achat en attente
    const achatRes = await pool.query(
      'SELECT * FROM achats WHERE reference_paiement = $1',
      [referenceId]
    );

    if (achatRes.rows.length === 0) {
      return res.status(404).json({ message: 'Transaction introuvable' });
    }

    const achat = achatRes.rows[0];

    // Déjà confirmé
    if (achat.statut === 'confirme') {
      return res.json({ statut: 'confirme', message: 'Paiement confirmé !' });
    }

    // Vérifier auprès de l'opérateur
    const resultat = await verifierStatutPaiement({
      operateur: achat.operateur,
      referenceId
    });

    if (resultat.confirme) {
      // Confirmer l'achat en base
      await pool.query(
        'UPDATE achats SET statut = $1 WHERE reference_paiement = $2',
        ['confirme', referenceId]
      );
      await pool.query(
        'UPDATE musiques SET nb_ventes = nb_ventes + 1 WHERE id = $1',
        [achat.musique_id]
      );
      return res.json({ statut: 'confirme', message: 'Paiement confirmé ! Musique ajoutée à votre bibliothèque.' });
    }

    if (resultat.echec) {
      await pool.query(
        'UPDATE achats SET statut = $1 WHERE reference_paiement = $2',
        ['echec', referenceId]
      );
      return res.json({ statut: 'echec', message: 'Paiement refusé ou annulé.' });
    }

    // Toujours en attente
    return res.json({ statut: 'en_attente', message: 'En attente de votre confirmation...' });

  } catch (erreur) {
    res.status(500).json({ message: 'Erreur : ' + erreur.message });
  }
};

/**
 * WEBHOOK — Confirmation automatique par MTN/Airtel
 * MTN et Airtel appellent cette URL quand le paiement est confirmé
 * Configurez cette URL dans votre dashboard MTN/Airtel :
 * https://votresite.com/api/achats/webhook/mtn
 * https://votresite.com/api/achats/webhook/airtel
 */
const webhookMTN = async (req, res) => {
  try {
    const { externalId, status } = req.body;
    if (status === 'SUCCESSFUL' && externalId) {
      const achatRes = await pool.query(
        'SELECT * FROM achats WHERE reference_paiement = $1 AND statut = $2',
        [externalId, 'en_attente']
      );
      if (achatRes.rows.length > 0) {
        await pool.query('UPDATE achats SET statut = $1 WHERE reference_paiement = $2', ['confirme', externalId]);
        await pool.query('UPDATE musiques SET nb_ventes = nb_ventes + 1 WHERE id = $1', [achatRes.rows[0].musique_id]);
        console.log(`[WEBHOOK MTN] Paiement confirmé: ${externalId}`);
      }
    }
    res.status(200).json({ message: 'OK' });
  } catch (erreur) {
    res.status(500).json({ message: erreur.message });
  }
};

const webhookAirtel = async (req, res) => {
  try {
    const transaction = req.body?.transaction;
    if (transaction?.status === 'TS' && transaction?.id) {
      const achatRes = await pool.query(
        'SELECT * FROM achats WHERE reference_paiement = $1 AND statut = $2',
        [transaction.id, 'en_attente']
      );
      if (achatRes.rows.length > 0) {
        await pool.query('UPDATE achats SET statut = $1 WHERE reference_paiement = $2', ['confirme', transaction.id]);
        await pool.query('UPDATE musiques SET nb_ventes = nb_ventes + 1 WHERE id = $1', [achatRes.rows[0].musique_id]);
        console.log(`[WEBHOOK AIRTEL] Paiement confirmé: ${transaction.id}`);
      }
    }
    res.status(200).json({ message: 'OK' });
  } catch (erreur) {
    res.status(500).json({ message: erreur.message });
  }
};

const getMesAchats = async (req, res) => {
  try {
    const { acheteur_id } = req.params;
    const achats = await pool.query(
      `SELECT a.*, m.titre, m.type, m.pochette_url, m.fichier_url, m.artiste_id, u.prenom as nom_artiste
       FROM achats a
       JOIN musiques m ON a.musique_id = m.id
       JOIN utilisateurs u ON m.artiste_id = u.id
       WHERE a.acheteur_id = $1 AND a.statut = 'confirme'
       ORDER BY a.date_achat DESC`,
      [acheteur_id]
    );
    res.json({ achats: achats.rows });
  } catch (erreur) {
    res.status(500).json({ message: 'Erreur : ' + erreur.message });
  }
};

module.exports = { creerAchat, verifierPaiement, webhookMTN, webhookAirtel, getMesAchats };