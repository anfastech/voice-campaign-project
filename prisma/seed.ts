import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  const user = await prisma.user.upsert({
    where: { email: 'admin@example.com' },
    update: {},
    create: {
      id: 'default-user',
      email: 'admin@example.com',
      name: 'Admin User',
    },
  })

  console.log('Created user:', user.email)

  const agent = await prisma.agent.upsert({
    where: { id: 'default-agent' },
    update: {},
    create: {
      id: 'default-agent',
      name: 'Sales Agent',
      description: 'Friendly outbound sales agent for lead qualification',
      systemPrompt:
        'You are a friendly sales representative named Alex. Start by greeting the person and introducing yourself. Ask if they have a moment to speak. If yes, briefly explain you are calling about our product and ask if they have any interest. Keep the conversation natural and professional. If they are not interested, thank them politely and end the call.',
      voice: 'Mark',
      language: 'en',
      temperature: 0.7,
      maxDuration: 300,
      userId: user.id,
    },
  })

  console.log('Created agent:', agent.name)

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
  ])

  console.log('Created contacts:', contacts.length)
  console.log('\n✅ Seed complete!')
}

main()
  .catch((e) => {
    console.error('Seed failed:', e)
    process.exit(1)
  })
  .finally(() => prisma.$disconnect())
