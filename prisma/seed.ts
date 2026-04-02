import { PrismaClient } from '@prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'
import pg from 'pg'
import bcrypt from 'bcryptjs'
import 'dotenv/config'

const pool = new pg.Pool({
  connectionString: process.env.DATABASE_URL!,
  ssl: { rejectUnauthorized: false },
})
const adapter = new PrismaPg(pool)
const prisma = new PrismaClient({ adapter })

async function main() {
  // --- Step 1: Hard-delete stale data in FK-safe order ---
  const deletedCalls = await prisma.call.deleteMany()
  const deletedCampaignContacts = await prisma.campaignContact.deleteMany()
  const deletedCampaigns = await prisma.campaign.deleteMany()
  const deletedAgents = await prisma.agent.deleteMany()

  console.log(
    `Deleted: ${deletedCalls.count} calls, ${deletedCampaignContacts.count} campaign-contacts, ${deletedCampaigns.count} campaigns, ${deletedAgents.count} agents`
  )

  // --- Step 2: Upsert user & contacts (kept across seeds) ---
  const passwordHash = await bcrypt.hash('12345678', 12)

  const user = await prisma.user.upsert({
    where: { id: 'default-user' },
    update: { email: 'admin@voicecampaign.ai', name: 'Admin', password: passwordHash, role: 'ADMIN' },
    create: {
      id: 'default-user',
      name: 'Admin',
      email: 'admin@voicecampaign.ai',
      password: passwordHash,
      role: 'ADMIN',
    },
  })

  console.log('Seeded admin user:', user.email)

  const contacts = await Promise.all([
    prisma.contact.upsert({
      where: { userId_phoneNumber: { userId: user.id, phoneNumber: '+15551234567' } },
      update: {},
      create: {
        phoneNumber: '+15551234567',
        name: 'John Smith',
        email: 'john@example.com',
        tags: ['lead', 'warm'],
        userId: user.id,
      },
    }),
    prisma.contact.upsert({
      where: { userId_phoneNumber: { userId: user.id, phoneNumber: '+15559876543' } },
      update: {},
      create: {
        phoneNumber: '+15559876543',
        name: 'Jane Doe',
        email: 'jane@example.com',
        tags: ['lead', 'cold'],
        userId: user.id,
      },
    }),
    prisma.contact.upsert({
      where: { userId_phoneNumber: { userId: user.id, phoneNumber: '+15553456789' } },
      update: {},
      create: {
        phoneNumber: '+15553456789',
        name: 'Sarah Johnson',
        email: 'sarah@example.com',
        tags: ['lead', 'warm', 'enterprise'],
        userId: user.id,
      },
    }),
    prisma.contact.upsert({
      where: { userId_phoneNumber: { userId: user.id, phoneNumber: '+15557654321' } },
      update: {},
      create: {
        phoneNumber: '+15557654321',
        name: 'Michael Chen',
        email: 'michael@example.com',
        tags: ['prospect', 'cold'],
        userId: user.id,
      },
    }),
    prisma.contact.upsert({
      where: { userId_phoneNumber: { userId: user.id, phoneNumber: '+15552468013' } },
      update: {},
      create: {
        phoneNumber: '+15552468013',
        name: 'Emily Davis',
        email: 'emily@example.com',
        tags: ['customer', 'appointment'],
        userId: user.id,
      },
    }),
  ])

  console.log('Created contacts:', contacts.length)

  // --- Step 3: Create "Creeto Welcome" agent ---
  const agent = await prisma.agent.create({
    data: {
      name: 'Creeto Welcome',
      description:
        "Greets inbound prospects, introduces Creeto's AI platform, and qualifies their interest",
      provider: 'ELEVENLABS',
      voice: 'rachel',
      language: 'en',
      temperature: 0.7,
      maxDuration: 300,
      firstMessage:
        "Hi there! Thanks for reaching out to Creeto. I'm here to help you learn about our AI platform. How can I help you today?",
      systemPrompt: `You are a friendly and professional welcome assistant for Creeto, an AI technology platform. Your role is to greet callers warmly, introduce Creeto's capabilities, and understand what they're looking for.

Guidelines:
- Be warm, conversational, and concise — keep responses to 2-3 sentences
- Introduce Creeto as an AI-powered platform that helps businesses automate voice communications
- Ask what brought them to Creeto and what challenges they're trying to solve
- If they express interest, offer to schedule a demo or connect them with the sales team
- If they have technical questions you can't answer, let them know someone from the team will follow up
- Always be honest — if you don't know something, say so
- End calls gracefully by summarizing next steps`,
      userId: user.id,
    },
  })

  console.log(`Created agent: ${agent.name} (${agent.provider}, voice: ${agent.voice})`)

  // Register agent with ElevenLabs
  if (process.env.ELEVENLABS_API_KEY) {
    try {
      const res = await fetch('https://api.elevenlabs.io/v1/convai/agents', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'xi-api-key': process.env.ELEVENLABS_API_KEY,
        },
        body: JSON.stringify({
          name: agent.name,
          conversation_config: {
            agent: {
              prompt: { prompt: agent.systemPrompt },
              first_message: agent.firstMessage,
              language: agent.language,
            },
            tts: { voice_id: '21m00Tcm4TlvDq8ikWAM' }, // rachel
            conversation: { max_duration_seconds: agent.maxDuration },
          },
        }),
      })
      const data = await res.json()
      if (data.agent_id) {
        await prisma.agent.update({
          where: { id: agent.id },
          data: { elevenLabsAgentId: data.agent_id },
        })
        console.log(`Synced to ElevenLabs: ${data.agent_id}`)
      } else {
        console.warn('ElevenLabs agent creation returned no agent_id:', data)
      }
    } catch (err) {
      console.warn('Failed to sync agent to ElevenLabs (non-fatal):', err)
    }
  } else {
    console.log('Skipping ElevenLabs sync (no ELEVENLABS_API_KEY)')
  }

  console.log('\n✅ Seed complete!')
}

main()
  .catch((e) => {
    console.error('Seed failed:', e)
    process.exit(1)
  })
  .finally(() => prisma.$disconnect())
