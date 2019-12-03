import { User, UserDocument, AuthToken } from "./models/user";
import { Request, Response } from "express";

export const getLogin = (req: Request, res: Response) => {
    res.send("Get Login");
};