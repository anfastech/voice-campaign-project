import { prisma } from '../lib/prisma'

/**
 * Get the admin userId for MCP server context.
 * The MCP server runs as a standalone stdio process without web auth,
 * so we look up the first admin user from the database.
 */
export async function getAdminUserIdForMcp(): Promise<string> {
  const admin = await prisma.user.findFirst({
    where: { role: 'ADMIN' },
    select: { id: true },
  })
  if (!admin) throw new Error('No admin user found in database')
  return admin.id
}
