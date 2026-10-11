const isProduction = process.env.NODE_ENV === "production";

const sameSite = isProduction ? "none" : "strict";

export const accessTokenCookieOptions = {
  httpOnly: true,
  secure: isProduction,
  sameSite,
  maxAge: 15 * 60 * 1000,
};

export const refreshTokenCookieOptions = {
  httpOnly: true,
  secure: isProduction,
  sameSite,
  maxAge: 7 * 24 * 60 * 60 * 1000,
};

