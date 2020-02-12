import _ from 'lodash';
import passport from 'passport';
import passportLocal from 'passport-local';
import passportFacebook from 'passport-facebook';

// import { User, UserType } from '../models/User';
import { Request, Response, NextFunction } from 'express';
import { User, UserDocument } from '../modules/auth/models/user';

const LocalStrategy = passportLocal.Strategy;
const FacebookStrategy = passportFacebook.Strategy;

passport.serializeUser<any, any>((user, done) => {
  done(undefined, user.id);
});

passport.deserializeUser((id, done) => {
  User.findById(id, (err, user) => {
    done(err, user);
  });
});

/**
 * Sign in using Email and Password.
 */
passport.use(
  new LocalStrategy({ usernameField: 'email' }, (email, password, done) => {
    User.findOne({ email: email.toLowerCase() }, (err, user: any) => {
      if (err) {
        return done(err);
      }
      if (!user) {
        return done(undefined, false, { message: `Email ${email} not found.` });
      }
      return user.comparePassword(password, (compareErr: Error, isMatch: boolean) => {
        if (compareErr) {
          return done(compareErr);
        }
        if (isMatch) {
          return done(undefined, user);
        }
        return done(undefined, false, {
          message: 'Invalid email or password.',
        });
      });
    });
  }),
);

/**
 * OAuth Strategy Overview
 *
 * - User is already logged in.
 *   - Check if there is an existing account with a provider id.
 *     - If there is, return an error message. (Account merging not supported)
 *     - Else link new OAuth account with currently logged-in user.
 * - User is not logged in.
 *   - Check if it's a returning user.
 *     - If returning user, sign in and we are done.
 *     - Else check if there is an existing account with user's email.
 *       - If there is, return an error message.
 *       - Else create a new account.
 */

/**
 * Sign in with Facebook.
 */
passport.use(
  new FacebookStrategy(
    {
      clientID: process.env.FACEBOOK_ID,
      clientSecret: process.env.FACEBOOK_SECRET,
      callbackURL: '/auth/facebook/callback',
      profileFields: ['name', 'email', 'link', 'locale', 'timezone'],
      passReqToCallback: true,
    },
    (req: any, accessToken, refreshToken, profile, done) => {
      if (req.user) {
        User.findOne({ facebook: profile.id }, (err, existingUser) => {
          if (err) {
            return done(err);
          }
          if (existingUser) {
            req.flash('errors', {
              msg:
                'There is already a Facebook account that belongs to you. Sign in with that account or delete it, then link it with your current account.',
            });
            return done(err);
          }
          return User.findById(req.user.id, (mongooseErr, user: any) => {
            if (mongooseErr) {
              return done(mongooseErr);
            }
            const updatedUser = user;
            updatedUser.facebook = profile.id;
            updatedUser.tokens.push({ kind: 'facebook', accessToken });
            updatedUser.profile.name =
              updatedUser.profile.name || `${profile.name.givenName} ${profile.name.familyName}`;
            updatedUser.profile.gender = updatedUser.profile.gender || profile._json.gender;
            updatedUser.profile.picture =
              updatedUser.profile.picture ||
              `https://graph.facebook.com/${profile.id}/picture?type=large`;
            return updatedUser.save((saveErr: Error) => {
              req.flash('info', { msg: 'Facebook account has been linked.' });
              return done(saveErr, updatedUser);
            });
          });
        });
      } else {
        User.findOne({ facebook: profile.id }, (err, existingUser) => {
          if (err) {
            return done(err);
          }
          if (existingUser) {
            return done(undefined, existingUser);
          }
          return User.findOne({ email: profile._json.email }, (mongooseErr, existingEmailUser) => {
            if (mongooseErr) {
              return done(mongooseErr);
            }
            if (existingEmailUser) {
              req.flash('errors', {
                msg:
                  'There is already an account using this email address. Sign in to that account and link it with Facebook manually from Account Settings.',
              });
              return done(mongooseErr);
            }
            const user: any = new User();
            user.email = profile._json.email;
            user.facebook = profile.id;
            user.tokens.push({ kind: 'facebook', accessToken });
            user.profile.name = `${profile.name.givenName} ${profile.name.familyName}`;
            user.profile.gender = profile._json.gender;
            user.profile.picture = `https://graph.facebook.com/${profile.id}/picture?type=large`;
            user.profile.location = profile._json.location ? profile._json.location.name : '';
            return user.save((saveErr: Error) => done(saveErr, user));
          });
        });
      }
    },
  ),
);

/**
 * Login Required middleware.
 */
export const isAuthenticated = (req: Request, res: Response, next: NextFunction) => {
  if (req.isAuthenticated()) {
    return next();
  }
  return res.redirect('/login');
};

/**
 * Authorization Required middleware.
 */
export const isAuthorized = (req: Request, res: Response, next: NextFunction) => {
  const provider = req.path.split('/').slice(-1)[0];

  const user = req.user as UserDocument;
  if (_.find(user.tokens, { kind: provider })) {
    return next();
  }
  return res.redirect(`/auth/${provider}`);
};
