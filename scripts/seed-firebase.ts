import { cert, getApps, initializeApp } from "firebase-admin/app"
import { getFirestore } from "firebase-admin/firestore"
import dotenv from "dotenv"

dotenv.config({ path: ".env.local" })

// Run this with: npx tsx scripts/seed-firebase.ts
// Make sure .env is loaded or vars are exported.

const serviceAccount = {
  projectId: process.env.FIREBASE_PROJECT_ID,
  client_email: process.env.FIREBASE_CLIENT_EMAIL,
  private_key: process.env.FIREBASE_PRIVATE_KEY?.replace(/\n/g, "\n"),
}

if (!serviceAccount.projectId) {
  console.error("Missing FIREBASE_PROJECT_ID env var")
  process.exit(1)
}

if (!getApps().length) {
  initializeApp({
    credential: cert(serviceAccount as Parameters<typeof cert>[0]),
  })
}

const db = getFirestore()

async function seed() {
  console.log("Seeding Firebase...")

  // Create Roadmap
  const roadmapRef = db.collection("roadmaps").doc()
  await roadmapRef.set({
    title: "Firebase Roadmap",
    slug: "firebase-demo", // Using a distinct slug
    workspaceId: "default",
    publicTitle: "Antigravity Roadmap",
    viewConfig: {},
    themeConfig: {},
    itemCount: 2,
    createdAt: new Date(),
    updatedAt: new Date(),
  })
  const roadmapId = roadmapRef.id

  // 2. Create Groups
  const group1Ref = roadmapRef.collection("groups").doc()
  await group1Ref.set({ name: "Core Features" })
  const group2Ref = roadmapRef.collection("groups").doc()
  await group2Ref.set({ name: "Ecosystem" })

  // 3. Create Items
  const items = [
    {
      title: "Firebase Migration",
      status: "SHIPPED",
      confidence: "H",
      roadmapId,
      groupId: group1Ref.id,
      featured: true,
      description: "Moving from Prisma to Firestore for better scaling.",
    },
    {
      title: "Auth.js Integration",
      status: "SHIPPED",
      confidence: "H",
      roadmapId,
      groupId: group1Ref.id,
      featured: true,
      description: "Google Auth and Firestore adapter.",
    },
    {
      title: "Web Component Embed",
      status: "BUILDING",
      confidence: "M",
      roadmapId,
      groupId: group2Ref.id,
      featured: true,
      description: "Standard web component for easy embedding.",
    },
    {
      title: "AI Personalization",
      status: "EXPLORING",
      confidence: "L",
      roadmapId,
      groupId: group2Ref.id,
      featured: false,
      description: "Using LLMs to personalize roadmaps for visitors.",
    },
  ]

  for (const item of items) {
    await db.collection("items").add({
      ...item,
      votes: Math.floor(Math.random() * 50),
      createdAt: new Date(),
      updatedAt: new Date(),
    })
  }

  console.log(`Seeded roadmap: /r/default/firebase-demo`)
}

seed()
