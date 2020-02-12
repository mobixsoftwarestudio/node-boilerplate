import { Request, Response } from 'express';
// import { User, UserDocument, AuthToken } from './models/user';

export const getLogin = (req: Request, res: Response): void => {
  res.send('Get Login');
};

export const getSignUp = (req: Request, res: Response): void => {
  res.send('Get SignUp');
};
