import { PrismaClient } from './app/generated/prisma/index.js';
import crypto from 'crypto';

const prisma = new PrismaClient();

async function createTestUser() {
  try {
    // Check if test user already exists
    const existing = await prisma.user.findUnique({
      where: { email: 'test@mockapi.dev' }
    });

    if (existing) {
      console.log('✓ Test user already exists');
      console.log('Email:', existing.email);
      console.log('User ID:', existing.id);
      return existing;
    }

    // Create test user
    const user = await prisma.user.create({
      data: {
        id: crypto.randomUUID(),
        email: 'test@mockapi.dev',
        name: 'Test User',
        emailVerified: true
      }
    });

    console.log('✓ Test user created successfully');
    console.log('Email:', user.email);
    console.log('Password: (no password - email verified)');
    console.log('User ID:', user.id);

    return user;
  } catch (error) {
    console.error('Error creating test user:', error.message);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

createTestUser();
