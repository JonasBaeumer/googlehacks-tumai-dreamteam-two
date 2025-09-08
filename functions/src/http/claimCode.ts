import {onRequest} from "firebase-functions/v2/https";
import * as logger from "firebase-functions/logger";
import {getAuth as getAdminAuth} from "firebase-admin/auth";
import {getDb} from "../config/admin";

export const claimCode = onRequest(async (request, response) => {
  if (request.method !== "POST") {
    response.status(405).send("Method Not Allowed");
    return;
  }

  const db = getDb();

  try {
    const {code} = request.body;

    if (!code || typeof code !== "string" || code.length !== 6) {
      response.status(400).send("Invalid pairing code format");
      return;
    }

    // Look up the pairing code
    const pairingCodeRef = db.collection("pairing_codes")
      .doc(code.toUpperCase());
    const pairingDoc = await pairingCodeRef.get();

    if (!pairingDoc.exists) {
      response.status(404).send("Invalid or expired pairing code");
      return;
    }

    const pairingData = pairingDoc.data();
    if (!pairingData) {
      response.status(404).send("Invalid pairing code data");
      return;
    }

    // Check if code is expired (5 minutes)
    const now = Date.now();
    const codeAge = now - pairingData.created_at;
    const EXPIRY_TIME = 5 * 60 * 1000; // 5 minutes

    if (codeAge > EXPIRY_TIME) {
      // Clean up expired code
      await pairingCodeRef.delete();
      response.status(410).send("Pairing code has expired");
      return;
    }

    const targetUid = pairingData.uid;
    if (!targetUid) {
      response.status(400).send("Invalid pairing code");
      return;
    }

    // Generate a custom token for the target user
    const customToken = await getAdminAuth().createCustomToken(targetUid, {
      source: "extension_pairing",
      paired_at: new Date().toISOString(),
    });

    // Clean up the used pairing code
    await pairingCodeRef.delete();

    // Log the successful pairing
    logger.info("Extension paired successfully", {
      code: code.toUpperCase(),
      uid: targetUid,
      paired_at: new Date().toISOString(),
    });

    response.status(200).json({
      ok: true,
      customToken,
      message: "Pairing successful",
    });
  } catch (error) {
    logger.error("Pairing code claim failed",
      {error: (error as Error).message});
    response.status(500).json({ok: false, error: "Internal server error"});
  }
});
