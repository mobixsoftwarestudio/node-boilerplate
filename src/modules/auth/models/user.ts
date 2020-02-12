import { Document, Error, Model, Schema, model } from 'mongoose';
import bcrypt from 'bcrypt-nodejs';
import crypto from 'crypto';

export interface UserDocument extends Document {
  email: string;
  password: string;
  passwordResetToken: string;
  passwordResetExpires: Date;

  facebook: string;
  tokens: AuthToken[];

  profile: {
    name: string;
    gender: string;
    location: string;
    website: string;
    picture: string;
  };

  comparePassword: ComparePasswordType;
  gravatar: (size: number) => string;
}

type ComparePasswordType = (
  candidatePassword: string,
  cb: (err: Error, isMatch: boolean) => {},
) => void;

export interface AuthToken {
  accessToken: string;
  kind: string;
}

const userSchema = new Schema(
  {
    email: { type: String, unique: true },
    password: String,
    passwordResetToken: String,
    passwordResetExpires: Date,

    facebook: String,
    twitter: String,
    google: String,
    tokens: Array,

    profile: {
      name: String,
      gender: String,
      location: String,
      website: String,
      picture: String,
    },
  },
  { timestamps: true },
);

/**
 * Password hash middleware.
 */
userSchema.pre('save', (next): void => {
  if (!this.isModified('password')) {
    return next();
  }
  return bcrypt.genSalt(10, (err, salt) => {
    if (err) {
      return next(err);
    }
    return bcrypt.hash(this.password, salt, undefined, (mongooseErr: Error, hash) => {
      if (mongooseErr) {
        return next(mongooseErr);
      }
      this.password = hash;
      return next();
    });
  });
});

const comparePassword: ComparePasswordType = (candidatePassword, cb) => {
  bcrypt.compare(candidatePassword, this.password, (err: Error, isMatch: boolean) => {
    cb(err, isMatch);
  });
};

userSchema.methods.comparePassword = comparePassword;

/**
 * Helper method for getting user's gravatar.
 */
userSchema.methods.gravatar = (size = 200): string => {
  if (!this.email) {
    return `https://gravatar.com/avatar/?s=${size}&d=retro`;
  }
  const md5 = crypto
    .createHash('md5')
    .update(this.email)
    .digest('hex');
  return `https://gravatar.com/avatar/${md5}?s=${size}&d=retro`;
};

export const User: Model<UserDocument> = model<UserDocument>('User', userSchema);
