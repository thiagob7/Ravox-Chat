import type { Prisma } from "@prisma/client";
import { prisma } from "~/lib/prisma.js";

export const adRepository = {
  findMany() {
    return prisma.ad.findMany({ orderBy: { createdAt: "desc" } });
  },

  findRunning(now: Date) {
    return prisma.ad.findMany({
      where: {
        active: true,
        AND: [
          { OR: [{ startsAt: null }, { startsAt: { lte: now } }] },
          { OR: [{ endsAt: null }, { endsAt: { gt: now } }] },
        ],
      },
      orderBy: { createdAt: "desc" },
    });
  },

  findById(id: string) {
    return prisma.ad.findUnique({ where: { id } });
  },

  create(data: Prisma.AdUncheckedCreateInput) {
    return prisma.ad.create({ data });
  },

  update(id: string, data: Prisma.AdUncheckedUpdateInput) {
    return prisma.ad.update({ where: { id }, data });
  },

  deleteOne(id: string) {
    return prisma.ad.deleteMany({ where: { id } });
  },

  addImpressions(ids: string[]) {
    return prisma.ad.updateMany({ where: { id: { in: ids } }, data: { impressions: { increment: 1 } } });
  },

  addClick(id: string) {
    return prisma.ad.updateMany({ where: { id }, data: { clicks: { increment: 1 } } });
  },
};
