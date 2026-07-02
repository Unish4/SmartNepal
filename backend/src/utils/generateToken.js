import jwt from "jsonwebtoken";
import ENV from "../config/env.js";

const generateToken = (userId) => {
  return jwt.sign({ id: userId }, ENV.JWT_SECRET, {
    expiresIn: "7d",
  });
};

export default generateToken;
