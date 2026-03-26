import { initFirebase, getDb } from "./src/services/firebase.js";
import 'dotenv/config'; // loads .env so process.env has firebase secrets

async function clearFakeData() {
    try {
        console.log("Initializing Firebase...");
        initFirebase();
        const db = getDb();
        
        console.log("Fetching users...");
        const usersSnapshot = await db.collection("users").get();
        console.log(`Found ${usersSnapshot.size} users.`);
        
        let updateCount = 0;
        
        for (const doc of usersSnapshot.docs) {
            const data = doc.data();
            const recommendations = data.recommendations || [];
            
            let hasFakeData = false;
            const updatedRecommendations = recommendations.filter(rec => {
                if (rec && rec.name && rec.name.includes("FIX SUCCESS")) {
                    hasFakeData = true;
                    return false;
                }
                return true;
            });
            
            if (hasFakeData) {
                console.log(`Clearing fake data for user ${doc.id}`);
                await doc.ref.update({
                    recommendations: updatedRecommendations
                });
                updateCount++;
            }
        }
        
        console.log(`Successfully cleared fake data from ${updateCount} users.`);
    } catch (err) {
        console.error("Error clearing fake data:", err);
    } finally {
        process.exit();
    }
}

clearFakeData();
