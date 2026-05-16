import type { NextAuthOptions } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import GoogleProvider from 'next-auth/providers/google';
import MicrosoftProvider from 'next-auth/providers/azure-ad';
import bcrypt from 'bcryptjs';
import { db } from '@/lib/db';
import { env } from '@/lib/env';

export const authOptions: NextAuthOptions = {
  session: {
    strategy: 'jwt',
    maxAge: 30 * 24 * 60 * 60,
  },
  secret: env.NEXTAUTH_SECRET,
  pages: {
    signIn: '/',
    error: '/',
  },
  providers: [
    CredentialsProvider({
      name: 'credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error('Email and password are required');
        }
        const user = await db.user.findUnique({ where: { email: credentials.email } });
        if (!user || !user.passwordHash) throw new Error('Invalid email or password');
        const isValid = await bcrypt.compare(credentials.password, user.passwordHash);
        if (!isValid) throw new Error('Invalid email or password');
        return { id: user.id, email: user.email, name: user.name, image: user.image, role: user.role, plan: user.plan };
      },
    }),
    ...(env.GOOGLE_ID && env.GOOGLE_SECRET
      ? [GoogleProvider({ clientId: env.GOOGLE_ID, clientSecret: env.GOOGLE_SECRET })]
      : []),
    ...(env.MICROSOFT_ID && env.MICROSOFT_SECRET
      ? [MicrosoftProvider({ clientId: env.MICROSOFT_ID, clientSecret: env.MICROSOFT_SECRET })]
      : []),
  ],
  callbacks: {
    async signIn({ user, account }) {
      if (!account || account.provider === 'credentials') return true;
      if (!user.email) return false;

      try {
        const existingUser = await db.user.findUnique({ where: { email: user.email } });
        console.log('[auth] signIn OAuth', { email: user.email, provider: account.provider, existingUser: !!existingUser });

        if (!existingUser) {
          const created = await db.user.create({
            data: {
              email: user.email,
              name: user.name || null,
              image: user.image || null,
              oauthProvider: account.provider,
              oauthId: account.providerAccountId,
              role: 'user',
              plan: 'free',
            },
          });
          console.log('[auth] signIn created user', created.id);
        } else if (!existingUser.oauthProvider) {
          await db.user.update({
            where: { id: existingUser.id },
            data: {
              oauthProvider: account.provider,
              oauthId: account.providerAccountId,
              image: user.image || existingUser.image,
            },
          });
          console.log('[auth] signIn linked OAuth to existing user', existingUser.id);
        } else {
          console.log('[auth] signIn existing OAuth user', existingUser.id);
        }
      } catch (err) {
        console.error('[auth] signIn error', err);
        return false;
      }

      return true;
    },
    async jwt({ token, user, account }) {
      if (user && account && account.provider !== 'credentials') {
        const dbUser = await db.user.findUnique({ where: { email: user.email! } });
        console.log('[auth] jwt OAuth lookup by email', user.email, 'found:', !!dbUser);
        if (dbUser) {
          token.id = dbUser.id;
          token.role = dbUser.role;
          token.plan = dbUser.plan;
        }
      } else if (user) {
        token.id = user.id;
        token.role = (user as any).role || 'user';
        token.plan = (user as any).plan || 'free';
      } else if (token.id) {
        const dbUser = await db.user.findUnique({ where: { id: token.id as string } });
        if (dbUser) {
          token.role = dbUser.role;
          token.plan = dbUser.plan;
        }
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
        (session.user as any).role = token.role as string;
        (session.user as any).plan = token.plan as string;
      }
      return session;
    },
  },
};
