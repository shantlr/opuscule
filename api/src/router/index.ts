import { Router } from 'express';

import { Sources, fetchSourceLatests } from '../sources';
import { SourceRepo } from '../data/repo/source';
import { z } from 'zod';

export const router = Router();

router.get('/sources/available', (req, res) => {
  return res.status(200).send(
    Sources.map((s) => ({
      id: s.id,
      name: s.name,
      url: s.url,
    })),
  );
});

router.post('/sources/subscribe', async (req, res) => {
  try {
    const { id } = z
      .object({
        id: z.string(),
      })
      .parse(req.body);

    const source = Sources.find((s) => s.id === id);
    if (!source) {
      return res.status(400).send({
        success: false,
        error: 'UNKNOWN_SOURCE',
      });
    }

    await SourceRepo.updates.subscribe(id);
    console.log(`[fetch-source-latests] ${source.id} started (from=subscribe)`);
    void fetchSourceLatests(source!).catch((err) => {
      console.error(
        `[fetch-source-latests] ${source!.id} failed (from=subscribe)`,
        err,
      );
    });

    return res.status(200).send({
      success: true,
    });
  } catch (err) {
    console.error(err);
    return res.status(500).send({
      success: false,
    });
  }
});

// router.delete('/sources/:id/subscribe', async (req, res) => {
//   const { id } = req.params;
//   try {
//     await SourceRepo.unsubscribe(id);
//     return res.status(200).send({
//       success: true,
//     });
//   } catch (err) {
//     console.log(err);
//     return res.status(500).send({
//       success: false,
//     });
//   }
// });
