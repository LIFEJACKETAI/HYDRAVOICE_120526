/**
 * Seed script: Creates the admin user for Hydravoice.
 * 
 * Usage: bun run prisma/seed-admin.ts
 * 
 * Default admin credentials:
 *   Email: admin@hydravoice.com
 *   Password: HydraAdmin2024!
 */

import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  const adminEmail = process.env.ADMIN_EMAIL || 'admin@hydravoice.com'
  const adminPassword = process.env.ADMIN_PASSWORD || 'HydraAdmin2024!'
  const adminName = process.env.ADMIN_NAME || 'Hydravoice Admin'

  console.log(`🔑 Creating admin user: ${adminEmail}`)

  // Check if admin already exists
  const existing = await prisma.user.findUnique({
    where: { email: adminEmail },
  })

  if (existing) {
    // Update existing user to admin role
    const passwordHash = await bcrypt.hash(adminPassword, 12)
    await prisma.user.update({
      where: { email: adminEmail },
      data: {
        role: 'admin',
        plan: 'enterprise',
        passwordHash,
        name: adminName,
      },
    })
    console.log(`✅ Updated existing user "${adminEmail}" to admin role with enterprise plan`)
  } else {
    // Create new admin user
    const passwordHash = await bcrypt.hash(adminPassword, 12)
    await prisma.user.create({
      data: {
        email: adminEmail,
        name: adminName,
        passwordHash,
        role: 'admin',
        plan: 'enterprise',
      },
    })
    console.log(`✅ Created admin user "${adminEmail}" with enterprise plan`)
  }

  console.log('')
  console.log('═══════════════════════════════════════════')
  console.log('  ADMIN CREDENTIALS')
  console.log('═══════════════════════════════════════════')
  console.log(`  Email:    ${adminEmail}`)
  console.log(`  Password: ${adminPassword}`)
  console.log('  Role:     admin')
  console.log('  Plan:     enterprise (paywall bypass)')
  console.log('═══════════════════════════════════════════')
  console.log('')
  console.log('⚠️  Change the default password after first login!')
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
