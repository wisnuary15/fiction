import { _stop, logger } from "@factor/api"
import { FullUser, PrivateUser } from "@factor/types"
import jwt from "jsonwebtoken"

export type TokenFields = Partial<PrivateUser> & { userId: string }
/**
 * Sets the auth token secret or falls back to a basic one (insecure)
 */
const getTokenSecret = (): string => {
  const secret = process.env.TOKEN_SECRET || process.env.FACTOR_TOKEN_SECRET
  if (!secret) {
    logger.log({
      level: "warn",
      description: "JWT token secret is missing (TOKEN_SECRET)",
      context: "auth",
    })
  }

  return secret ?? "INSECURE"
}
/**
 * Returns a user authentication credential including token for storage in client
 */
export const createClientToken = (user: Partial<FullUser>): string => {
  const { role = "", userId, email } = user
  return jwt.sign({ role, userId, email }, getTokenSecret())
}
/**
 * Take a JWT token and decode into the associated user _id
 */
export const decodeClientToken = (token: string): TokenFields => {
  const r = jwt.verify(token, getTokenSecret()) as TokenFields

  if (!r.userId || !r.email) {
    throw _stop({ message: "token error", code: "TOKEN_ERROR" })
  }

  return r
}