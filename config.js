import dotenv from "dotenv";
dotenv.config({ path: "apikey.env" });

export const API_KEY = process.env.MONDAY_API_KEY;
