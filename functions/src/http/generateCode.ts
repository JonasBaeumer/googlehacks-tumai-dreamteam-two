import {onRequest} from "firebase-functions/v2/https";
import * as logger from "firebase-functions/logger";
import {getAuth as getAdminAuth} from "firebase-admin/auth";
import {getDb} from "../config/admin";

export const generateCode = onRequest(async (request, response) => {
  if (request.method !== "POST") {
    response.status(405).send("Method Not Allowed");
    return;
  }

  const db = getDb();

  // Extract bearer token
  const authHeader = request.headers.authorization || "";
  const token = authHeader.startsWith("Bearer ") ? authHeader.slice(7) : "";

  try {
    if (!token) {
      response.status(401).send("Missing Authorization bearer token");
      return;
    }

    const decoded = await getAdminAuth().verifyIdToken(token);
    const uid = decoded.uid;

    // Generate a 6-character pairing code
    const pairingCode = generatePairingCode();

    // Store the pairing code with expiry
    const pairingCodeRef = db.collection("pairing_codes").doc(pairingCode);
    await pairingCodeRef.set({
      uid,
      created_at: Date.now(),
      expires_at: Date.now() + (5 * 60 * 1000), // 5 minutes from now
      used: false,
    });

    // Clean up any existing pairing codes for this user
    const existingCodesQuery = await db.collection("pairing_codes")
      .where("uid", "==", uid)
      .where("used", "==", false)
      .get();

    const batch = db.batch();
    existingCodesQuery.docs.forEach((doc) => {
      if (doc.id !== pairingCode) {
        batch.delete(doc.ref);
      }
    });
    await batch.commit();

    logger.info("Pairing code generated", {
      uid,
      code: pairingCode,
      created_at: new Date().toISOString(),
    });

    response.status(200).json({
      ok: true,
      code: pairingCode,
      expires_in: 300, // 5 minutes in seconds
      message: "Pairing code generated successfully",
    });
  } catch (error) {
    logger.error("Pairing code generation failed",
      {error: (error as Error).message});
    response.status(500).json({ok: false, error: "Internal server error"});
  }
});

/**
 * Generates a random 6-character pairing code
 * @return {string} The generated pairing code
 */
function generatePairingCode(): string {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  let result = "";
  for (let i = 0; i < 6; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}
