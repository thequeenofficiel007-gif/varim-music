/**
 * SERVICE DE PAIEMENT MOBILE MONEY
 * Varim Music — Congo-Brazzaville
 *
 * Ce fichier gère les appels vers les API MTN MoMo et Airtel Money.
 * Dès que vous avez vos clés API, remplacez les valeurs dans .env
 * et changez PAIEMENT_SIMULE = false.
 *
 * DOCUMENTATION :
 * - MTN MoMo : https://momodeveloper.mtn.com/docs
 * - Airtel Money : https://developers.airtel.africa/documentation
 */

const PAIEMENT_SIMULE = true;
// ↑ Mettre false quand vous avez vos vraies clés API

// ─────────────────────────────────────────────
// MTN MoMo
// ─────────────────────────────────────────────

const mtnDemanderPaiement = async ({ montant, numero, referenceId, description }) => {
  if (PAIEMENT_SIMULE) {
    console.log(`[MTN SIMULÉ] Demande paiement ${montant} FCFA → ${numero} (ref: ${referenceId})`);
    return { succes: true, referenceId, statut: 'PENDING' };
  }

  try {
    const fetch = require('node-fetch');

    // 1. Obtenir un token d'accès MTN
    const tokenRes = await fetch(`${process.env.MTN_MOMO_URL}/token/`, {
      method: 'POST',
      headers: {
        'Authorization': 'Basic ' + Buffer.from(
          `${process.env.MTN_MOMO_API_KEY}:${process.env.MTN_MOMO_API_SECRET}`
        ).toString('base64'),
        'Ocp-Apim-Subscription-Key': process.env.MTN_MOMO_SUBSCRIPTION_KEY,
      }
    });

    const tokenData = await tokenRes.json();
    const accessToken = tokenData.access_token;

    // 2. Initier la demande de paiement (RequestToPay)
    const payRes = await fetch(`${process.env.MTN_MOMO_URL}/requesttopay`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'X-Reference-Id': referenceId,
        'X-Target-Environment': process.env.MTN_MOMO_ENVIRONMENT,
        'Ocp-Apim-Subscription-Key': process.env.MTN_MOMO_SUBSCRIPTION_KEY,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        amount: String(montant),
        currency: 'XAF',
        externalId: referenceId,
        payer: {
          partyIdType: 'MSISDN',
          partyId: numero.replace(/\s/g, '').replace('+', '')
        },
        payerMessage: description,
        payeeNote: 'Varim Music'
      })
    });

    if (payRes.status === 202) {
      return { succes: true, referenceId, statut: 'PENDING' };
    } else {
      const err = await payRes.json().catch(() => ({}));
      return { succes: false, erreur: err.message || 'Erreur MTN MoMo' };
    }

  } catch (erreur) {
    console.error('[MTN] Erreur:', erreur.message);
    return { succes: false, erreur: erreur.message };
  }
};

const mtnVerifierStatut = async (referenceId) => {
  if (PAIEMENT_SIMULE) {
    return { statut: 'SUCCESSFUL' };
  }

  try {
    const fetch = require('node-fetch');

    const tokenRes = await fetch(`${process.env.MTN_MOMO_URL}/token/`, {
      method: 'POST',
      headers: {
        'Authorization': 'Basic ' + Buffer.from(
          `${process.env.MTN_MOMO_API_KEY}:${process.env.MTN_MOMO_API_SECRET}`
        ).toString('base64'),
        'Ocp-Apim-Subscription-Key': process.env.MTN_MOMO_SUBSCRIPTION_KEY,
      }
    });

    const tokenData = await tokenRes.json();

    const statusRes = await fetch(`${process.env.MTN_MOMO_URL}/requesttopay/${referenceId}`, {
      headers: {
        'Authorization': `Bearer ${tokenData.access_token}`,
        'X-Target-Environment': process.env.MTN_MOMO_ENVIRONMENT,
        'Ocp-Apim-Subscription-Key': process.env.MTN_MOMO_SUBSCRIPTION_KEY,
      }
    });

    const data = await statusRes.json();
    return { statut: data.status }; // SUCCESSFUL | FAILED | PENDING

  } catch (erreur) {
    return { statut: 'FAILED', erreur: erreur.message };
  }
};

// ─────────────────────────────────────────────
// Airtel Money
// ─────────────────────────────────────────────

const airtelDemanderPaiement = async ({ montant, numero, referenceId, description }) => {
  if (PAIEMENT_SIMULE) {
    console.log(`[AIRTEL SIMULÉ] Demande paiement ${montant} FCFA → ${numero} (ref: ${referenceId})`);
    return { succes: true, referenceId, statut: 'PENDING' };
  }

  try {
    const fetch = require('node-fetch');

    // 1. Obtenir un token Airtel
    const tokenRes = await fetch(`${process.env.AIRTEL_MONEY_URL}/auth/oauth2/token`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        client_id: process.env.AIRTEL_MONEY_CLIENT_ID,
        client_secret: process.env.AIRTEL_MONEY_CLIENT_SECRET,
        grant_type: 'client_credentials'
      })
    });

    const tokenData = await tokenRes.json();
    const accessToken = tokenData.access_token;

    // 2. Initier le paiement Airtel
    const payRes = await fetch(`${process.env.AIRTEL_MONEY_URL}/merchant/v1/payments/`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
        'X-Country': 'CG',
        'X-Currency': 'XAF',
      },
      body: JSON.stringify({
        reference: referenceId,
        subscriber: {
          country: 'CG',
          currency: 'XAF',
          msisdn: numero.replace(/\s/g, '').replace('+242', '')
        },
        transaction: {
          amount: montant,
          country: 'CG',
          currency: 'XAF',
          id: referenceId
        }
      })
    });

    const data = await payRes.json();

    if (data.status?.success) {
      return { succes: true, referenceId, statut: 'PENDING' };
    } else {
      return { succes: false, erreur: data.status?.message || 'Erreur Airtel Money' };
    }

  } catch (erreur) {
    console.error('[AIRTEL] Erreur:', erreur.message);
    return { succes: false, erreur: erreur.message };
  }
};

const airtelVerifierStatut = async (referenceId) => {
  if (PAIEMENT_SIMULE) {
    return { statut: 'TS' }; // TS = Transaction Successful chez Airtel
  }

  try {
    const fetch = require('node-fetch');

    const tokenRes = await fetch(`${process.env.AIRTEL_MONEY_URL}/auth/oauth2/token`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        client_id: process.env.AIRTEL_MONEY_CLIENT_ID,
        client_secret: process.env.AIRTEL_MONEY_CLIENT_SECRET,
        grant_type: 'client_credentials'
      })
    });

    const tokenData = await tokenRes.json();

    const statusRes = await fetch(`${process.env.AIRTEL_MONEY_URL}/standard/v1/payments/${referenceId}`, {
      headers: {
        'Authorization': `Bearer ${tokenData.access_token}`,
        'X-Country': 'CG',
        'X-Currency': 'XAF',
      }
    });

    const data = await statusRes.json();
    return { statut: data.data?.transaction?.status };
    // TS = succès, TF = échec, TP = en attente

  } catch (erreur) {
    return { statut: 'TF', erreur: erreur.message };
  }
};

// ─────────────────────────────────────────────
// Fonction principale unifiée
// ─────────────────────────────────────────────

const demanderPaiement = async ({ operateur, montant, numero, referenceId, description }) => {
  if (operateur === 'mtn') {
    return mtnDemanderPaiement({ montant, numero, referenceId, description });
  } else if (operateur === 'airtel') {
    return airtelDemanderPaiement({ montant, numero, referenceId, description });
  }
  return { succes: false, erreur: 'Opérateur inconnu' };
};

const verifierStatutPaiement = async ({ operateur, referenceId }) => {
  if (operateur === 'mtn') {
    const res = await mtnVerifierStatut(referenceId);
    return {
      confirme: res.statut === 'SUCCESSFUL',
      echec: res.statut === 'FAILED',
      enAttente: res.statut === 'PENDING'
    };
  } else if (operateur === 'airtel') {
    const res = await airtelVerifierStatut(referenceId);
    return {
      confirme: res.statut === 'TS',
      echec: res.statut === 'TF',
      enAttente: res.statut === 'TP'
    };
  }
  return { confirme: false, echec: true, enAttente: false };
};

module.exports = { demanderPaiement, verifierStatutPaiement, PAIEMENT_SIMULE };