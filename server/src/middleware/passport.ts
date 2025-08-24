import passport from 'passport';
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
import { Strategy as GitHubStrategy } from 'passport-github2';
import { prisma } from '../utils/database.js';
import { SessionUser } from '../types/index.js';

// Serialize user for session
passport.serializeUser((user: Express.User, done) => {
  done(null, user.id);
});

// Deserialize user from session
passport.deserializeUser(async (id: string, done) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        email: true,
        name: true,
        avatarUrl: true,
        provider: true,
      },
    });

    if (user) {
      done(null, user as SessionUser);
    } else {
      done(new Error('User not found'), null);
    }
  } catch (error) {
    done(error, null);
  }
});

// Google OAuth Strategy
if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
  passport.use(
    new GoogleStrategy(
      {
        clientID: process.env.GOOGLE_CLIENT_ID,
        clientSecret: process.env.GOOGLE_CLIENT_SECRET,
        callbackURL: "/api/auth/google/callback",
      },
      async (accessToken: string, refreshToken: string, profile: any, done: any) => {
        try {
          // Check if user exists
          let user = await prisma.user.findFirst({
            where: {
              OR: [
                { email: profile.emails?.[0]?.value },
                { provider: 'google', providerId: profile.id }
              ]
            }
          });

          if (user) {
            // Update existing user with Google info if needed
            if (user.provider !== 'google' || user.providerId !== profile.id) {
              user = await prisma.user.update({
                where: { id: user.id },
                data: {
                  provider: 'google',
                  providerId: profile.id,
                  avatarUrl: user.avatarUrl || profile.photos?.[0]?.value,
                },
              });
            }
          } else {
            // Create new user
            user = await prisma.user.create({
              data: {
                email: profile.emails?.[0]?.value || '',
                name: profile.displayName,
                avatarUrl: profile.photos?.[0]?.value,
                provider: 'google',
                providerId: profile.id,
              },
            });
          }

          done(null, {
            id: user.id,
            email: user.email,
            name: user.name,
            avatarUrl: user.avatarUrl,
            provider: user.provider,
          } as SessionUser);
        } catch (error) {
          done(error, undefined);
        }
      }
    )
  );
}

// GitHub OAuth Strategy
if (process.env.GITHUB_CLIENT_ID && process.env.GITHUB_CLIENT_SECRET) {
  passport.use(
    new GitHubStrategy(
      {
        clientID: process.env.GITHUB_CLIENT_ID,
        clientSecret: process.env.GITHUB_CLIENT_SECRET,
        callbackURL: "/api/auth/github/callback",
      },
      async (accessToken: string, refreshToken: string, profile: any, done: any) => {
        try {
          // Check if user exists
          let user = await prisma.user.findFirst({
            where: {
              OR: [
                { email: profile.emails?.[0]?.value },
                { provider: 'github', providerId: profile.id }
              ]
            }
          });

          if (user) {
            // Update existing user with GitHub info if needed
            if (user.provider !== 'github' || user.providerId !== profile.id) {
              user = await prisma.user.update({
                where: { id: user.id },
                data: {
                  provider: 'github',
                  providerId: profile.id,
                  avatarUrl: user.avatarUrl || profile.photos?.[0]?.value,
                },
              });
            }
          } else {
            // Create new user
            user = await prisma.user.create({
              data: {
                email: profile.emails?.[0]?.value || '',
                name: profile.displayName || profile.username,
                avatarUrl: profile.photos?.[0]?.value,
                provider: 'github',
                providerId: profile.id,
              },
            });
          }

          done(null, {
            id: user.id,
            email: user.email,
            name: user.name,
            avatarUrl: user.avatarUrl,
            provider: user.provider,
          } as SessionUser);
        } catch (error) {
          done(error, undefined);
        }
      }
    )
  );
}

export default passport;