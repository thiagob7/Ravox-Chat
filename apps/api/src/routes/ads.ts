import type { FastifyInstance } from "fastify";
import { z } from "zod";

import { objectId } from "~/validations/common.js";
import { adService } from "~/services/ad-service.js";

export async function adRoutes(app: FastifyInstance) {
  app.addHook("preHandler", app.authenticate);

  app.get("/ads", (req) => adService.running(req.userId));

  app.post("/ads/:adId/click", async (req, reply) => {
    const { adId } = z.object({ adId: objectId }).parse(req.params);

    await adService.click(adId);
    return reply.code(204).send();
  });
}
