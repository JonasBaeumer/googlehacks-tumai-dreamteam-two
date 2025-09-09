import {onRequest} from "firebase-functions/v2/https";
import * as logger from "firebase-functions/logger";
import {getDb} from "../config/admin";

export const addToFirestore = onRequest(async (request, response) => {
  if (request.method !== "POST") {
    response.status(405).send("Method Not Allowed");
    return;
  }

  const db = getDb();

  try {
    const {collection, data, docId} = request.body ?? {};

    if (typeof collection !== "string" || collection.length === 0) {
      response.status(400).send("Missing or invalid 'collection'");
      return;
    }

    if (typeof data !== "object" || data === null) {
      response.status(400).send("Missing or invalid 'data'");
      return;
    }

    let resultId = "";
    let created = false;

    if (typeof docId === "string" && docId.length > 0) {
      await db.collection(collection).doc(docId).set(data, {merge: true});
      resultId = docId;
    } else {
      const writeRef = await db.collection(collection).add(data);
      resultId = writeRef.id;
      created = true;
    }

    response.status(200).json({ok: true, id: resultId, created});
  } catch (error) {
    logger.error("Failed to add document", {error: (error as Error).message});
    response.status(500).json({ok: false, error: "Internal Server Error"});
  }
});


