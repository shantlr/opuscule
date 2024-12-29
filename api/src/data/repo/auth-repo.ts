import { createCipheriv, createDecipheriv, randomBytes } from 'crypto';

import { config } from 'config';
import { logger } from 'config/logger';
import { db } from 'data/db';
import { User, AuthSession } from 'data/schemas';
import { and, eq } from 'drizzle-orm';
import { GOOGLE_AUTH } from 'lib/auth';
import { dayjs } from 'lib/dayjs';

export const AuthRepo = {
  sessions: {
    create: async ({
      origin,
      userId,
    }: {
      origin: (typeof AuthSession)['$inferSelect']['origin'];
      userId: string;
    }) => {
      const [session] = await db
        .insert(AuthSession)
        .values([
          {
            origin,
            user_id: userId,
            expires_at: dayjs()
              .add(config.get('auth.session.duration.seconds'), 'second')
              .toDate(),
          },
        ])
        .returning();
      return session;
    },
    resolve: async ({ token }: { token: string }) => {
      const session = await db.query.AuthSession.findFirst({
        where: and(eq(AuthSession.token, token)),
      });
      if (!session) {
        return {
          error: 'INVALID_SESSION' as const,
        };
      }
      if (session.deleted_at) {
        return {
          error: 'EXPIRED_SESSION' as const,
        };
      }

      // Session max duration
      if (
        dayjs().diff(dayjs(session.created_at), 'second') >=
        config.get('auth.session.maxDuration.seconds')
      ) {
        return {
          error: 'EXPIRED_SESSION' as const,
        };
      }

      // Session expiration
      if (session.expires_at.valueOf() < Date.now()) {
        // Auto-refresh google session
        if (session.origin === 'google') {
          const user = await AuthRepo.user.get.byId(session.user_id);
          if (
            user?.google_encrypted_refresh_token &&
            user?.google_encrypted_refresh_token_iv
          ) {
            try {
              const decipher = createDecipheriv(
                'aes-256-cbc',
                Buffer.from(
                  config.get('google.oauth.encrypt.refresh.token.secret'),
                  'hex',
                ),
                Buffer.from(user.google_encrypted_refresh_token_iv, 'base64'),
              );

              const refreshToken = Buffer.concat([
                decipher.update(
                  Buffer.from(user.google_encrypted_refresh_token, 'base64'),
                ),
                decipher.final(),
              ]).toString('utf-8');

              await GOOGLE_AUTH.refreshToken({
                refreshToken,
              });
              logger.info(`google access token refreshed`);

              // extends session
              const updatedSession = await db
                .update(AuthSession)
                .set({
                  expires_at: dayjs()
                    .add(config.get('auth.session.duration.seconds'), 'second')
                    .toDate(),
                })
                .where(and(eq(AuthSession.token, token)))
                .returning();
              logger.info(`session extended`);

              return {
                session: updatedSession[0]!,
              };
            } catch (err) {
              if (
                err &&
                typeof err === 'object' &&
                'code' in err &&
                (err.code === 'ERR_CRYPTO_INVALID_IV' ||
                  err.code === 'ERR_CRYPTO_INVALID_KEYLEN')
              ) {
                return {
                  error: 'FAILED_TO_DECRYPT_REFRESH_TOKEN' as const,
                };
              }
              throw err;
            }
          }
        }

        return {
          error: 'EXPIRED_SESSION' as const,
        };
      }

      return {
        session,
      };
    },
    disable: async (id: string) => {
      const session = await db
        .update(AuthSession)
        .set({
          deleted_at: new Date(),
        })
        .where(and(eq(AuthSession.id, id)))
        .returning();
      return session[0];
    },
  },
  user: {
    get: {
      byId: async (id: string) => {
        const user = await db.query.User.findFirst({
          where: and(eq(User.id, id)),
        });
        return user;
      },
    },
    async upsert({
      firstName,
      lastName,
      google,
    }: {
      firstName?: string;
      lastName?: string;
      google?: {
        sub: string;
        refreshToken?: string;
      };
    }) {
      const value = {
        first_name: firstName,
        last_name: lastName,
        google_sub: google?.sub,
        google_encrypted_refresh_token: null as string | null,
        google_encrypted_refresh_token_iv: null as string | null,
      };
      if (google?.refreshToken) {
        const iv = randomBytes(16);

        const cipher = createCipheriv(
          'aes-256-cbc',
          Buffer.from(
            config.get('google.oauth.encrypt.refresh.token.secret'),
            'hex',
          ),
          iv,
        );

        value.google_encrypted_refresh_token = Buffer.concat([
          cipher.update(google.refreshToken, 'utf8'),
          cipher.final(),
        ]).toString('base64');
        value.google_encrypted_refresh_token_iv = iv.toString('base64');
      }

      const res = await db
        .insert(User)
        .values([value])
        .onConflictDoUpdate({
          target: User.google_sub,
          set: {
            google_encrypted_refresh_token:
              value.google_encrypted_refresh_token,
            google_encrypted_refresh_token_iv:
              value.google_encrypted_refresh_token_iv,
          },
        })
        .returning();

      return res[0];
    },
  },
};
