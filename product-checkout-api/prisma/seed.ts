import 'dotenv/config';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '../src/generated/prisma/client';

const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL ?? '',
});

const prisma = new PrismaClient({ adapter });

const seededProductId = '11111111-1111-4111-8111-111111111111';

async function main() {
  await prisma.product.updateMany({
    where: {
      id: {
        not: seededProductId,
      },
    },
    data: {
      active: false,
    },
  });

  const product = await prisma.product.upsert({
    where: { id: seededProductId },
    update: {
      name: 'Auriculares Inalambricos Pro',
      description:
        'Auriculares bluetooth con cancelacion de ruido y autonomia de larga duracion.',
      priceCents: 129900,
      stock: 10,
      imageUrl:
        'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=1200&q=80',
      active: true,
    },
    create: {
      id: seededProductId,
      name: 'Auriculares Inalambricos Pro',
      description:
        'Auriculares bluetooth con cancelacion de ruido y autonomia de larga duracion.',
      priceCents: 129900,
      stock: 10,
      imageUrl:
        'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=1200&q=80',
      active: true,
    },
  });

  console.log(`Seeded product ${product.id} (${product.name})`);
}

main()
  .catch((error: unknown) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
