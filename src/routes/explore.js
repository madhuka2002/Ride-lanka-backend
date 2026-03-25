import { Router } from "express";
import { getDb } from "../services/firebase.js";
import { requireAuth } from "../middleware/auth.js";

const router = Router();

const DEFAULT_EXPLORE_PLACES = [
  {
    title: "Sigiriya Rock Fortress",
    snippet: "An ancient palace and fortress complex that lies in the heart of the northern Matale District.",
    image: "https://images.unsplash.com/photo-1588096344390-8b0101b44917?w=800&q=80",
    content: "Sigiriya, or Lion Rock, is a soaring granite peak in Sri Lanka featuring the ruins of an ancient stronghold. Renowned for its ancient frescoes and the monumental lion paws carved into its base, it was built by King Kasyapa in the 5th century. Visitors climb up a series of staircases attached to sheer rock walls to reach the summit, which houses the foundations of the lavish palace."
  },
  {
    title: "Anuradhapura Ancient City",
    snippet: "The first ancient capital of Sri Lanka, known for its well-preserved ruins and sacred Bodhi tree.",
    image: "https://images.unsplash.com/photo-1620216637380-4df2f2a71bf6?w=800&q=80",
    content: "Anuradhapura was the center of Theravada Buddhism for many centuries. As one of the oldest continuously inhabited cities in the world, its vast complex contains massive stupas like Ruwanwelisaya and the sacred Jaya Sri Maha Bodhi, a sapling from the historical Bodhi tree. It remains a deeply spiritual destination."
  },
  {
    title: "Polonnaruwa Ruins",
    snippet: "The second most ancient of Sri Lanka's kingdoms, echoing the glory of historical kings.",
    image: "https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?w=800&q=80",
    content: "Polonnaruwa succeeded Anuradhapura as the capital. Its archaeological park is a delight to explore, featuring the monumental Gal Vihara – four majestic statues of Buddha carved into the face of a granite rock. The ruins of the Royal Palace and the Quadrangle reveal the architectural brilliance of the 12th century."
  },
  {
    title: "Dambulla Cave Temple",
    snippet: "The largest and best-preserved cave temple complex in Sri Lanka, packed with profound history.",
    image: "https://images.unsplash.com/photo-1590483863777-be8e811b590e?w=800&q=80",
    content: "Dambulla Cave Temple, also known as the Golden Temple of Dambulla, holds over 150 stunning statues of Buddha and intricate mural paintings covering the cave ceilings. Used as a refuge by an ancient king, the caves have been a sacred pilgrimage site for over 22 centuries."
  },
  {
    title: "Temple of the Sacred Tooth Relic",
    snippet: "A deeply revered Buddhist temple in the city of Kandy, housing the relic of the tooth of the Buddha.",
    image: "https://images.unsplash.com/photo-1624647970792-71ab523b09de?w=800&q=80",
    content: "Located in the royal palace complex of the former Kingdom of Kandy, this beautifully adorned temple houses Sri Lanka's most important Buddhist relic: a tooth of the Buddha. The rituals, traditional drumming, and the temple's serene lakeside setting make it an unforgettable cultural experience."
  },
  {
    title: "Galle Dutch Fort",
    snippet: "A historical, archaeological, and architectural heritage monument maintained on the southwest coast.",
    image: "https://images.unsplash.com/photo-1549473889-14f410d83298?w=800&q=80",
    content: "First built by the Portuguese in 1588 and extensively fortified by the Dutch during the 17th century, the Galle Fort is a living UNESCO World Heritage Site. Today, its cobblestone streets are lined with boutique shops, cafes, and historical mansions facing the Indian Ocean."
  },
  {
    title: "Yapahuwa Rock Fortress",
    snippet: "A monumental ancient fortress offering steep steps and extraordinary ornamental stairways.",
    image: "https://images.unsplash.com/photo-1601639016912-870ba68aa0fa?w=800&q=80",
    content: "Briefly the capital of Sri Lanka in the 13th century, Yapahuwa is built around a massive granite rock rising abruptly from the plain. The steep ornamental staircase adorned with elaborate stone carvings of lions and mythical creatures is its most striking feature."
  },
  {
    title: "Ruwanwelisaya Stupa",
    snippet: "One of the world's tallest ancient monuments standing majestically in Anuradhapura.",
    image: "https://images.unsplash.com/photo-1632832971206-88d4078ea222?w=800&q=80",
    content: "Built by King Dutugemunu in 140 B.C., the Ruwanwelisaya is a magnificent hemispherical stupa. Surrounded by an elephant wall, it is considered a marvel of the ancient world's engineering and stands as a testament to the island's devout Buddhist heritage."
  },
  {
    title: "Mihintale Peak",
    snippet: "Believed to be the meeting site that inaugurated the presence of Buddhism in Sri Lanka.",
    image: "https://images.unsplash.com/photo-1628189873099-281ce13dca7c?w=800&q=80",
    content: "Mihintale is an ancient mountain peak housing ruined monasteries, hospitals, and stupas. Pilgrims climb over 1,800 granite steps to reach the summit where the Indian monk Mahinda first taught Buddhism to the Sinhalese King Devanampiyatissa."
  },
  {
    title: "Ritigala Nature Reserve",
    snippet: "An ancient Buddhist monastery hidden deep within a strict nature reserve.",
    image: "https://images.unsplash.com/photo-1558223681-3be2cdfae513?w=800&q=80",
    content: "Nestled in a dense jungle mountain, the Ritigala ruins date back to the 1st century BC. Devoid of the traditional stupas or temples, the site focuses on ascetic meditation. Walking through its shaded, stone-paved paths feels like stepping back into an untouched ancient world."
  },
  {
    title: "Kataragama Sacred City",
    snippet: "A holy city venerated by Buddhists, Hindus, Muslims, and the indigenous Vedda people.",
    image: "https://images.unsplash.com/photo-1591873215206-cfa39247eb97?w=800&q=80",
    content: "Kataragama is an incredible melting pot of cultures. Dedicated to the deity Kataragama deviyo (Murugan), the bustling temple complex hosts vibrant evening pujas filled with traditional music, fire-walking rituals, and a unifying spiritual atmosphere."
  },
  {
    title: "Aukana Buddha Statue",
    snippet: "A colossal, perfectly proportioned standing statue of the Buddha carved out of a granite rock face.",
    image: "https://images.unsplash.com/photo-1637402517869-ff0405cf52fc?w=800&q=80",
    content: "Carved in the 5th century, the Aukana Buddha stands over 40 feet tall. The precision of the sculpture is legendary: it is said a drop of water falling from the nose would drop exactly straight down between the toes. It remains one of Sri Lanka's most breathtaking ancient masterpieces."
  }
];

// ─── Get all explore places ──────────────────────────────────────────────
// GET /api/explore
router.get("/", requireAuth, async (req, res) => {
    try {
        const db = getDb();
        const snap = await db.collection("explore_places").orderBy("createdAt", "asc").get();
        let places = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));

        // Auto-seed if empty
        if (places.length === 0) {
            console.log("[explore] Collection empty, seeding default places...");
            for (const place of DEFAULT_EXPLORE_PLACES) {
                const newPlace = {
                    ...place,
                    createdAt: new Date().toISOString()
                };
                const docRef = await db.collection("explore_places").add(newPlace);
                places.push({ id: docRef.id, ...newPlace });
            }
        }

        return res.json({ places });
    } catch (err) {
        console.error("[explore GET]", err);
        return res.status(500).json({ error: "Failed to fetch explore places" });
    }
});

// ─── Create a new explore place (Admin Only) ───────────────────────────
// POST /api/explore
// Body: { title, snippet, content, image }
router.post("/", requireAuth, async (req, res) => {
    try {
        if (req.user.email !== "admin@gmail.com") {
            return res.status(403).json({ error: "Forbidden: Admins only" });
        }

        const { title, snippet, content, image } = req.body;
        if (!title || !snippet || !content) {
            return res.status(400).json({ error: "Missing required fields" });
        }

        const db = getDb();
        const newPlace = {
            title,
            snippet,
            content,
            image: image || "https://images.unsplash.com/photo-1588096344390-8b0101b44917?w=800&q=80",
            createdAt: new Date().toISOString()
        };

        const docRef = await db.collection("explore_places").add(newPlace);
        return res.status(201).json({ id: docRef.id, ...newPlace });
    } catch (err) {
        console.error("[explore POST]", err);
        return res.status(500).json({ error: "Failed to create explore place" });
    }
});

// ─── Delete an explore place (Admin Only) ──────────────────────────────
// DELETE /api/explore/:id
router.delete("/:id", requireAuth, async (req, res) => {
    try {
        if (req.user.email !== "admin@gmail.com") {
            return res.status(403).json({ error: "Forbidden: Admins only" });
        }

        const db = getDb();
        await db.collection("explore_places").doc(req.params.id).delete();
        return res.json({ success: true, id: req.params.id });
    } catch (err) {
        console.error("[explore DELETE]", err);
        return res.status(500).json({ error: "Failed to delete explore place" });
    }
});

export default router;
