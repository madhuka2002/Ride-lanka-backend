import { Router } from "express";
import { getDb } from "../services/firebase.js";
import { requireAuth } from "../middleware/auth.js";

const router = Router();

const DEFAULT_EXPLORE_PLACES = [
  {
    title: "Sigiriya Rock Fortress",
    snippet: "An ancient palace and fortress complex that lies in the heart of the northern Matale District.",
    image: "https://upload.wikimedia.org/wikipedia/commons/thumb/4/4c/Sigiriya__Lion_Rock.jpg/1280px-Sigiriya__Lion_Rock.jpg",
    images: [
      "https://upload.wikimedia.org/wikipedia/commons/thumb/4/4c/Sigiriya__Lion_Rock.jpg/1280px-Sigiriya__Lion_Rock.jpg",
      "https://upload.wikimedia.org/wikipedia/commons/thumb/e/e0/Sigiriya_Frescoes.jpg/1280px-Sigiriya_Frescoes.jpg",
      "https://upload.wikimedia.org/wikipedia/commons/thumb/b/b3/Lion_Paws_Sigiriya.jpg/1280px-Lion_Paws_Sigiriya.jpg",
      "https://upload.wikimedia.org/wikipedia/commons/thumb/0/07/Sigiriya_Mirror_Wall.jpg/1280px-Sigiriya_Mirror_Wall.jpg"
    ],
    content: "Sigiriya, or Lion Rock, is a soaring granite peak in Sri Lanka featuring the ruins of an ancient stronghold. Renowned for its ancient frescoes and the monumental lion paws carved into its base, it was built by King Kasyapa in the 5th century. Visitors climb up a series of staircases attached to sheer rock walls to reach the summit, which houses the foundations of the lavish palace.",
    coordinates: { lat: 7.9570, lng: 80.7603 }
  },
  {
    title: "Anuradhapura Ancient City",
    snippet: "The first ancient capital of Sri Lanka, known for its well-preserved ruins and sacred Bodhi tree.",
    image: "https://upload.wikimedia.org/wikipedia/commons/thumb/3/32/Anuradhapura_view.jpg/1280px-Anuradhapura_view.jpg",
    images: [
      "https://upload.wikimedia.org/wikipedia/commons/thumb/3/32/Anuradhapura_view.jpg/1280px-Anuradhapura_view.jpg",
      "https://upload.wikimedia.org/wikipedia/commons/thumb/6/6f/Ruwanwelisaya_Stupa.jpg/1280px-Ruwanwelisaya_Stupa.jpg",
      "https://upload.wikimedia.org/wikipedia/commons/thumb/b/b5/Jaya_Sri_Maha_Bodhi.jpg/1280px-Jaya_Sri_Maha_Bodhi.jpg"
    ],
    content: "Anuradhapura was the center of Theravada Buddhism for many centuries. As one of the oldest continuously inhabited cities in the world, its vast complex contains massive stupas like Ruwanwelisaya and the sacred Jaya Sri Maha Bodhi, a sapling from the historical Bodhi tree. It remains a deeply spiritual destination.",
    coordinates: { lat: 8.3114, lng: 80.4037 }
  },
  {
    title: "Polonnaruwa Ruins",
    snippet: "The second most ancient of Sri Lanka's kingdoms, echoing the glory of historical kings.",
    image: "https://upload.wikimedia.org/wikipedia/commons/thumb/d/d1/Polonnaruwa_01.jpg/1280px-Polonnaruwa_01.jpg",
    images: [
      "https://upload.wikimedia.org/wikipedia/commons/thumb/d/d1/Polonnaruwa_01.jpg/1280px-Polonnaruwa_01.jpg",
      "https://upload.wikimedia.org/wikipedia/commons/thumb/f/fa/Gal_Vihara_Polonnaruwa.jpg/1280px-Gal_Vihara_Polonnaruwa.jpg",
      "https://upload.wikimedia.org/wikipedia/commons/thumb/1/1b/Vatadage_Polonnaruwa.jpg/1280px-Vatadage_Polonnaruwa.jpg"
    ],
    content: "Polonnaruwa succeeded Anuradhapura as the capital. Its archaeological park is a delight to explore, featuring the monumental Gal Vihara – four majestic statues of Buddha carved into the face of a granite rock. The ruins of the Royal Palace and the Quadrangle reveal the architectural brilliance of the 12th century.",
    coordinates: { lat: 7.9403, lng: 81.0188 }
  },
  {
    title: "Dambulla Cave Temple",
    snippet: "The largest and best-preserved cave temple complex in Sri Lanka, packed with profound history.",
    image: "https://upload.wikimedia.org/wikipedia/commons/thumb/3/34/Dambulla-buddhastupa.jpg/1280px-Dambulla-buddhastupa.jpg",
    images: [
      "https://upload.wikimedia.org/wikipedia/commons/thumb/3/34/Dambulla-buddhastupa.jpg/1280px-Dambulla-buddhastupa.jpg",
      "https://upload.wikimedia.org/wikipedia/commons/thumb/5/5c/Dambulla_Cave_Mural.jpg/1280px-Dambulla_Cave_Mural.jpg",
      "https://upload.wikimedia.org/wikipedia/commons/thumb/7/7e/Dambulla_Golden_Buddha.jpg/1280px-Dambulla_Golden_Buddha.jpg"
    ],
    content: "Dambulla Cave Temple, also known as the Golden Temple of Dambulla, holds over 150 stunning statues of Buddha and intricate mural paintings covering the cave ceilings. Used as a refuge by an ancient king, the caves have been a sacred pilgrimage site for over 22 centuries.",
    coordinates: { lat: 7.8742, lng: 80.6517 }
  },
  {
    title: "Temple of the Sacred Tooth Relic",
    snippet: "A deeply revered Buddhist temple in Kandy, housing the relic of the tooth of the Buddha.",
    image: "https://upload.wikimedia.org/wikipedia/commons/thumb/0/03/Kandy_Temple_of_the_Tooth.jpg/1280px-Kandy_Temple_of_the_Tooth.jpg",
    images: [
      "https://upload.wikimedia.org/wikipedia/commons/thumb/0/03/Kandy_Temple_of_the_Tooth.jpg/1280px-Kandy_Temple_of_the_Tooth.jpg",
      "https://upload.wikimedia.org/wikipedia/commons/thumb/1/1a/Kandy_Esala_Perahera.jpg/1280px-Kandy_Esala_Perahera.jpg",
      "https://upload.wikimedia.org/wikipedia/commons/thumb/6/64/Kandy_Lake_View.jpg/1280px-Kandy_Lake_View.jpg"
    ],
    content: "Located in the royal palace complex of the former Kingdom of Kandy, this beautifully adorned temple houses Sri Lanka's most important Buddhist relic. The rituals, traditional drumming, and the temple's serene lakeside setting make it an unforgettable cultural experience.",
    coordinates: { lat: 7.2936, lng: 80.6413 }
  },
  {
    title: "Galle Dutch Fort",
    snippet: "A historical, archaeological, and architectural heritage monument maintained on the southwest coast.",
    image: "https://upload.wikimedia.org/wikipedia/commons/thumb/7/77/Galle_Fort.jpg/1280px-Galle_Fort.jpg",
    images: [
      "https://upload.wikimedia.org/wikipedia/commons/thumb/7/77/Galle_Fort.jpg/1280px-Galle_Fort.jpg",
      "https://upload.wikimedia.org/wikipedia/commons/thumb/c/c2/Galle_Lighthouse.jpg/1280px-Galle_Lighthouse.jpg",
      "https://upload.wikimedia.org/wikipedia/commons/thumb/c/cf/Galle_Fort_Clock_Tower.jpg/1280px-Galle_Fort_Clock_Tower.jpg"
    ],
    content: "First built by the Portuguese in 1588 and extensively fortified by the Dutch during the 17th century, the Galle Fort is a living UNESCO World Heritage Site. Today, its cobblestone streets are lined with boutique shops, cafes, and historical mansions facing the Indian Ocean.",
    coordinates: { lat: 6.0286, lng: 80.2168 }
  },
  {
    title: "Nine Arch Bridge, Ella",
    snippet: "A colonial-era railway bridge known for its architectural beauty and lush surroundings.",
    image: "https://upload.wikimedia.org/wikipedia/commons/thumb/c/c9/Nine_Arch_Bridge.jpg/1280px-Nine_Arch_Bridge.jpg",
    images: [
      "https://upload.wikimedia.org/wikipedia/commons/thumb/c/c9/Nine_Arch_Bridge.jpg/1280px-Nine_Arch_Bridge.jpg",
      "https://upload.wikimedia.org/wikipedia/commons/thumb/1/12/Train_passing_Nine_Arch_Bridge.jpg/1280px-Train_passing_Nine_Arch_Bridge.jpg",
      "https://upload.wikimedia.org/wikipedia/commons/thumb/3/36/Ella_Rock_View.jpg/1280px-Ella_Rock_View.jpg"
    ],
    content: "The Nine Arch Bridge in Ella is one of the best examples of colonial-era railway construction in the country. Standing 91 feet high, it was built entirely of bricks, rock, and cement without a single piece of steel. It remains one of the most photographed spots in Sri Lanka's hill country.",
    coordinates: { lat: 6.8768, lng: 81.0608 }
  },
  {
    title: "Yala National Park",
    snippet: "The most visited national park in Sri Lanka, home to the elusive Sri Lankan Leopard.",
    image: "https://upload.wikimedia.org/wikipedia/commons/thumb/0/07/Leopard_Yala.jpg/1280px-Leopard_Yala.jpg",
    images: [
      "https://upload.wikimedia.org/wikipedia/commons/thumb/0/07/Leopard_Yala.jpg/1280px-Leopard_Yala.jpg",
      "https://upload.wikimedia.org/wikipedia/commons/thumb/b/be/Elephant_Yala.jpg/1280px-Elephant_Yala.jpg",
      "https://upload.wikimedia.org/wikipedia/commons/thumb/6/6f/Yala_National_Park_Sri_Lanka.jpg/1280px-Yala_National_Park_Sri_Lanka.jpg"
    ],
    content: "Yala National Park combines a strict nature reserve with a national park. Divided into 5 blocks, the park has a protected area of nearly 130,000 hectares of land consisting of light forests, scrubs, grasslands, tanks and lagoons. It is world-renowned for having one of the highest leopard densities in the world.",
    coordinates: { lat: 6.3725, lng: 81.5125 }
  },
  {
    title: "Horton Plains & World's End",
    snippet: "A protected area in the central highlands covered by montane grassland and cloud forest.",
    image: "https://upload.wikimedia.org/wikipedia/commons/thumb/4/47/Worlds_End_Horton_Plains.jpg/1280px-Worlds_End_Horton_Plains.jpg",
    images: [
      "https://upload.wikimedia.org/wikipedia/commons/thumb/4/47/Worlds_End_Horton_Plains.jpg/1280px-Worlds_End_Horton_Plains.jpg",
      "https://upload.wikimedia.org/wikipedia/commons/thumb/a/a2/Horton_Plains_National_Park.jpg/1280px-Horton_Plains_National_Park.jpg",
      "https://upload.wikimedia.org/wikipedia/commons/thumb/e/e1/Baker%27s_Falls.jpg/1280px-Baker%27s_Falls.jpg"
    ],
    content: "Horton Plains National Park is a plateau in the central highlands at an altitude of 2,100–2,300 meters. The 'World's End' viewpoint is a sheer precipice with a drop of about 870 meters, offering one of the most spectacular views in Sri Lanka.",
    coordinates: { lat: 6.8028, lng: 80.8144 }
  },
  {
    title: "Adam's Peak (Sri Pada)",
    snippet: "A sacred mountain peak revered by all local religions, famous for the 'sacred footprint'.",
    image: "https://upload.wikimedia.org/wikipedia/commons/thumb/a/a2/Sri_Pada.JPG/1280px-Sri_Pada.JPG",
    content: "Adam's Peak is a 2,243m tall conical mountain. For Buddhists, it is the footprint of Buddha; for Hindus, the footprint of Shiva; and for Christians and Muslims, that of Adam. The climb at night to see the sunrise is a traditional pilgrimage.",
    coordinates: { lat: 6.8096, lng: 80.4994 }
  },
  {
    title: "Arugam Bay",
    snippet: "A world-renowned surf destination on the east coast with a laid-back vibe.",
    image: "https://upload.wikimedia.org/wikipedia/commons/thumb/7/75/Arugam_Bay_Surf.jpg/1280px-Arugam_Bay_Surf.jpg",
    content: "Arugam Bay is a moon-shaped curl of soft sand. Known as one of the top ten surf points in the world, it attracts surfers from across the globe. Beyond surfing, it is home to serene lagoons and the nearby Kumana National Park.",
    coordinates: { lat: 6.8431, lng: 81.8267 }
  },
  {
    title: "Dambulla Golden Cave Temple",
    snippet: "The largest and best-preserved cave temple complex in Sri Lanka.",
    image: "https://upload.wikimedia.org/wikipedia/commons/thumb/3/34/Dambulla-buddhastupa.jpg/1280px-Dambulla-buddhastupa.jpg",
    content: "Dambulla Cave Temple holds over 150 stunning statues of Buddha and intricate mural paintings. Used as a refuge by an ancient king, the caves have been a sacred pilgrimage site for over 22 centuries.",
    coordinates: { lat: 7.8742, lng: 80.6517 }
  },
  {
    title: "Anuradhapura Sacred City",
    snippet: "The first ancient capital of Sri Lanka, known for its massive stupas and sacred gardens.",
    image: "https://upload.wikimedia.org/wikipedia/commons/thumb/3/32/Anuradhapura_view.jpg/1280px-Anuradhapura_view.jpg",
    content: "Anuradhapura was the center of Theravada Buddhism for many centuries. Its vast complex contains massive stupas like Ruwanwelisaya and the sacred Jaya Sri Maha Bodhi, a sapling from the historical Bodhi tree.",
    coordinates: { lat: 8.3501, lng: 80.3963 }
  },
  {
    title: "Knuckles Mountain Range",
    snippet: "A UNESCO World Heritage site known for its unique biodiversity and rugged trekking terrain.",
    image: "https://upload.wikimedia.org/wikipedia/commons/thumb/9/9d/Knuckles_Range.JPG/1280px-Knuckles_Range.JPG",
    content: "The Knuckles range is named after its resemblance to a folded fist. It is one of the most rugged and scenic parts of the highlands, home to rare flora and fauna and hidden mountain villages accessible only by trail.",
    coordinates: { lat: 7.4294, lng: 80.7816 }
  },
  {
    title: "Mirissa Beach",
    snippet: "A beach paradise famous for its whale-watching tours and clear blue waters.",
    image: "https://upload.wikimedia.org/wikipedia/commons/thumb/0/05/Mirissa_Beach.jpg/1280px-Mirissa_Beach.jpg",
    content: "Mirissa is famous for its breathtaking sunrises and sunsets. It has become a premier destination for Blue Whale and dolphin watching. The main beach is a crescent of sand fringed by palm trees and guest houses.",
    coordinates: { lat: 5.9483, lng: 80.4514 }
  }
];

// ─── Get all explore places ──────────────────────────────────────────────
// GET /api/explore
router.get("/", requireAuth, async (req, res) => {
    try {
        const db = getDb();
        const snap = await db.collection("explore_places").orderBy("createdAt", "asc").get();
        let places = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));

        // Smart Sync: Ensure all default famous places are up-to-date in the DB
        for (const defaultPlace of DEFAULT_EXPLORE_PLACES) {
            const existing = places.find(p => p.title === defaultPlace.title);
            if (!existing) {
                console.log(`[explore] Adding missing place: ${defaultPlace.title}`);
                const newDoc = { ...defaultPlace, createdAt: new Date().toISOString() };
                const docRef = await db.collection("explore_places").add(newDoc);
                places.push({ id: docRef.id, ...newDoc });
            } else if (existing.image !== defaultPlace.image || !existing.coordinates) {
                // Update existing if image changed or coordinates missing
                console.log(`[explore] Updating data for: ${defaultPlace.title}`);
                await db.collection("explore_places").doc(existing.id).update({
                    image: defaultPlace.image,
                    coordinates: defaultPlace.coordinates,
                    snippet: defaultPlace.snippet,
                    content: defaultPlace.content
                });
                // Update local list for immediate response
                Object.assign(existing, defaultPlace);
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
