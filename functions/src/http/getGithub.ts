import {onRequest} from "firebase-functions/v2/https";
import {getDb} from "../config/admin";

/**
 * Saves GitHub commits from the last hour to Firestore
 * @param {string} token - GitHub access token
 * @param {string} username - GitHub username
 * @param {any} db - Firestore database instance
 */
async function saveCommitsToFirestore(token:string, username:string, db:any) {
  console.log("=== saveCommitsToFirestore START ===");
  const oneHourAgo = new Date(Date.now() - 3600000).toISOString();

  const reposResponse = await fetch("https://api.github.com/user/repos", {
    headers: {"Authorization": `Bearer ${token}`},
  });
  const repos = await reposResponse.json() as any[];
  console.log("Repos Response Status:", reposResponse.status);

  if (!reposResponse.ok) {
    console.error("Repos API Fehler:", await reposResponse.text());
    return;
  }

  for (const repo of repos) {
    console.log(`Prüfe Repo: ${repo.full_name}`);
    const commitsResponse = await fetch(`https://api.github.com/repos/${repo.full_name}/commits?since=${oneHourAgo}&author=${username}`, {
    headers: {"Authorization": `Bearer ${token}`},
    });
    const allCommits = await commitsResponse.json() as any[];
    console.log(`Commits Response Status für ${repo.full_name}:`,
    commitsResponse.status);

    // DEBUG: Zeige die tatsächliche API Response
    // if (allCommits.length === 0) {
    //console.log(`Keine Commits gefunden für ${repo.full_name} 
        //seit ${oneHourAgo}`);

    // Teste ohne Zeitfilter
    //const allCommitsResponse = await fetch(
      //`https://api.github.com/repos/${repo.full_name}/commits?author=${username}`, {
        //headers: {"Authorization": `Bearer ${token}`},
      //});
    //const allCommits = await allCommitsResponse.json() as any[];
    //console.log(`Alle Commits von ${username}
         //in ${repo.full_name}:`, allCommits.length);

    //console.log("All Commits Response Status:", allCommitsResponse.status);

    //if (allCommits.length > 0) {
      //console.log("Letzter Commit war am:",
       // allCommits[0].commit.committer.date);
    //}

    //const finalCommits=allCommits;
    // }

    console.log("allCommits ist Array:", Array.isArray(allCommits));
    console.log("allCommits Inhalt:", JSON.stringify(allCommits, null, 2));

    // Falls es ein Array ist, zeige die ersten paar Commits
    if (Array.isArray(allCommits) && allCommits.length > 0) {
      console.log("Erster Commit:", JSON.stringify(allCommits[0], null, 2));
    }

    for (const commit of allCommits) {
      console.log(`Verarbeite Commit: ${commit.sha}`);
      const commitDetailResponse = await fetch(`https://api.github.com/repos/${repo.full_name}/commits/${commit.sha}`, {
        headers: {"Authorization": `Bearer ${token}`},
      });
      const commitDetail = await commitDetailResponse.json() as any;

      const languages = commitDetail.files.map((file:any) => {
        const ext = file.filename.split(".").pop();
        return ext || "unknown";
      });
      await db.collection("commits").add({
        timestamp: new Date(commit.commit.committer.date),
        linesChanged: commitDetail.stats.additions+commitDetail.stats.deletions,
        sha: commit.sha,
        repo: repo.full_name,
        languages: languages,
      });
      console.log("Commit gespeichert in Firestore");
    }
  }
}


export const getCommit = onRequest(async (request, response) => {
  try {
    if (request.method !== "GET") {
      response.status(405).send("Method Not Allowed");
      return;
    }

    const db = getDb();

    const allUsers = await db.collection("users").get();
    console.log("Kann ich überhaupt auf users zugreifen?", allUsers.size);

    // const userDocs = await db.collection(
    // "users").where("userId", "==", "123").get();


    // console.log("Anzahl gefundene Dokumente:", userDocs.size);
    // console.log("Query empty:", userDocs.empty);

    if (allUsers.empty) {
      response.status(404).send("User not found");
      return;
    }

    const userData = allUsers.docs[0].data();
    const githubToken = userData.githubToken;
    const githubUsername = userData.githubUsername;

    await saveCommitsToFirestore(githubToken, githubUsername, db);

    // Das hat gefehlt:
    response.status(200).send("Commits saved successfully");
  } catch (error) {
    console.error("Error:", error);
    response.status(500).send("Error: ");
  }
});

