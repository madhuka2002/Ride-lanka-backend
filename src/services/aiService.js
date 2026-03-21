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

/**
 * Call the AI service to generate a trip plan with N stops.
 * @param {string} userId
 * @param {object} planInput
 * @returns {Promise<object>}
 */
export async function fetchTripPlan(userId, planInput) {
    const response = await fetch(`${AI_URL}/api/ai/trip-plan`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            "x-backend-secret": SECRET,
        },
        body: JSON.stringify({
            user_id: userId,
            ...planInput,
        }),
    });

    if (!response.ok) {
        const text = await response.text();
        throw new Error(`AI trip-plan error ${response.status}: ${text}`);
    }

    return response.json();
}

/**
 * Call the AI service to fetch cultural rules for a place
 * @param {string} userId
 * @param {string} placeName
 */
export async function fetchCulture(userId, placeName) {
    const response = await fetch(`${AI_URL}/api/ai/culture-info`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            "x-backend-secret": SECRET,
        },
        body: JSON.stringify({
            place_name: placeName
        }),
    });

    if (!response.ok) {
        const text = await response.text();
        throw new Error(`AI culture error ${response.status}: ${text}`);
    }

    return response.json();
}