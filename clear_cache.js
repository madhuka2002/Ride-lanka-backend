import 'dotenv/config';
import { getDb } from "./src/services/firebase.js";

async function clear() {
   try {
       const db = getDb();
       const snap = await db.collection("users").get();
       for (let doc of snap.docs) {
           await doc.ref.update({ recommendations: [] });
       }
       console.log("Cache cleared successfully!");
       process.exit(0);
   } catch (e) {
       console.error("Error:", e);
       process.exit(1);
   }
}
clear();
