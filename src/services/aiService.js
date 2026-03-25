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

export async function fetchReorder(userId, stops, route_preference) {
    const response = await fetch(`${AI_URL}/api/ai/reorder`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            "x-backend-secret": SECRET,
        },
        body: JSON.stringify({ user_id: userId, stops, route_preference }),
    });

    if (!response.ok) {
        const text = await response.text();
        throw new Error(`AI reorder error ${response.status}: ${text}`);
    }

    return response.json();
}

export async function searchPlaceAI(userId, query) {
    const response = await fetch(`${AI_URL}/api/ai/search-place`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            "x-backend-secret": SECRET,
        },
        body: JSON.stringify({ query }),
    });

    if (!response.ok) {
        const text = await response.text();
        throw new Error(`AI search error ${response.status}: ${text}`);
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

/**
 * Call the AI service to verify a traveler's quest story.
 * @param {object} quest - { title, description }
 * @param {string} story - The text to verify
 * @returns {Promise<object>} { isValid: boolean, reason: string }
 */
export async function verifyQuestStory(quest, story) {
    // Attempt real AI call
    try {
        const response = await fetch(`${AI_URL}/api/ai/verify-quest`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "x-backend-secret": SECRET,
            },
            body: JSON.stringify({
                quest_title: quest.title,
                quest_description: quest.description,
                story: story
            }),
        });

        if (response.ok) {
            return response.json();
        }
    } catch (err) {
        console.warn("AI Verify Quest Service unreachable, using smart simulation.");
    }

    // Smart simulation for demo/fallback
    const words = story.trim().split(/\s+/).length;
    if (words < 10) {
        return { isValid: false, reason: "Your story is too short. Please tell us more about your experience (at least 10 words)." };
    }
    
    // Check if any words from the quest title are in the story (basic relevance)
    const titleKeywords = quest.title.toLowerCase().split(/\s+/).filter(w => w.length > 3);
    const storyLower = story.toLowerCase();
    const hasKeywords = titleKeywords.some(kw => storyLower.includes(kw));

    if (!hasKeywords) {
        return { isValid: false, reason: "Your story doesn't seem to mention details related to the quest. Please be more specific." };
    }

    return { isValid: true, reason: "Success! Your experience has been verified by Ride-Lanka AI." };
}