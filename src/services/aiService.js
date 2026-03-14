import fetch from "node-fetch";

const AI_URL = process.env.AI_SERVICE_URL || "http://localhost:8000";
const SECRET = process.env.BACKEND_SECRET || "";

/**
 * Call the AI service to get top-5 recommendations.
 * @param {string} userId
 * @param {string[]} interests
 * @param {object[]} behaviorQueue  - up to 50 events
 * @returns {Promise<object>}  the full recommendation response
 */
export async function fetchRecommendations(userId, interests, behaviorQueue) {
    const response = await fetch(`${AI_URL}/api/ai/recommend`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            "x-backend-secret": SECRET,
        },
        body: JSON.stringify({
            user_id: userId,
            interests,
            behavior_queue: behaviorQueue,
        }),
    });

    if (!response.ok) {
        const text = await response.text();
        throw new Error(`AI service error ${response.status}: ${text}`);
    }

    return response.json();
}