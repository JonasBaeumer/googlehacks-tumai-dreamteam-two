import {onRequest} from "firebase-functions/v2/https";
import * as logger from "firebase-functions/logger";
import {getAuth as getAdminAuth} from "firebase-admin/auth";
import {getDb} from "../config/admin";

export const addToFirestoreSecure = onRequest(async (request, response) => {
  if (request.method !== "POST") {
    response.status(405).send("Method Not Allowed");
    return;
  }

  const db = getDb();

  // Extract bearer token
  const authHeader = request.headers.authorization || "";
  const token = authHeader.startsWith("Bearer ") ? authHeader.slice(7) : "";

  // Allow bypass in emulator for local testing if explicitly requested
  const isEmulator = process.env.FUNCTIONS_EMULATOR === "true";
  const skipAuth = isEmulator && request.headers["x-skip-auth"] === "true";

  try {
    let uid = "";

    if (skipAuth) {
      uid = "emulator-test-user";
    } else {
      if (!token) {
        response.status(401).send("Missing Authorization bearer token");
        return;
      }
      const decoded = await getAdminAuth().verifyIdToken(token);
      uid = decoded.uid;
    }

    const {collection, data, docId} = request.body ?? {};

    if (typeof collection !== "string" || collection.length === 0) {
      response.status(400).send("Missing or invalid 'collection'");
      return;
    }

    if (typeof data !== "object" || data === null) {
      response.status(400).send("Missing or invalid 'data'");
      return;
    }

    const payload = {...data, uid};
    let resultId = "";
    let created = false;

    if (typeof docId === "string" && docId.length > 0) {
      await db.collection(collection).doc(docId).set(payload, {merge: true});
      resultId = docId;
    } else {
      const writeRef = await db.collection(collection).add(payload);
      resultId = writeRef.id;
      created = true;
    }

    response.status(200).json({ok: true, id: resultId, created});
  } catch (error) {
    logger.error("Auth/Write failed", {error: (error as Error).message});
    response.status(401).json({ok: false, error: "Unauthorized"});
  }
});


