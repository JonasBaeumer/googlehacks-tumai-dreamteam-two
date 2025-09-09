export {helloWorld} from "./http/helloWorld";
export {addToFirestore} from "./http/addToFirestore";
export {addToFirestoreSecure} from "./http/addToFirestoreSecure";
export {ingest} from "./http/ingest";
export {claimCode} from "./http/claimCode";
export {generateCode} from "./http/generateCode";

// API endpoints for frontend
export {getSessions} from "./http/getSessions";
export {getTopics} from "./http/getTopics";
export {getDaily} from "./http/getDaily";
export {getGithub} from "./http/getGithub";
export {getXP} from "./http/getXP";

// Demo API endpoints with mock data
export {getSessionsDemo} from "./http/getSessionsDemo";
export {getTopicsDemo} from "./http/getTopicsDemo";
export {getDailyDemo} from "./http/getDailyDemo";
export {getGithubDemo} from "./http/getGithubDemo";
export {getXPDemo} from "./http/getXPDemo";

// Session group analysis triggers
export {onSessionGroupCreated, onSessionGroupUpdated} from "./triggers/sessionGroupAnalysis";
