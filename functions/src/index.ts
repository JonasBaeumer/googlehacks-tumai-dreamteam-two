/**
 * Import function triggers from their respective submodules:
 *
 * import {onCall} from "firebase-functions/v2/https";
 * import {onDocumentWritten} from "firebase-functions/v2/firestore";
 *
 * See a full list of supported triggers at https://firebase.google.com/docs/functions
 */

import {onRequest} from "firebase-functions/v2/https";
import * as logger from "firebase-functions/logger";
import {initializeApp} from "firebase-admin/app";
import {getFirestore} from "firebase-admin/firestore";

// Start writing functions
// https://firebase.google.com/docs/functions/typescript

export const helloWorld = onRequest((request, response) => {
  logger.info("Hello logs!", {structuredData: true});
  response.send("Hello from Firebase!");
});

// Initialize the Admin SDK once per instance
const app = initializeApp();
const db = getFirestore(app);

// HTTPS function to add or update a document in Firestore
export const addToFirestore = onRequest(async (request, response) => {
  if (request.method !== "POST") {
    response.status(405).send("Method Not Allowed");
    return;
  }

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
