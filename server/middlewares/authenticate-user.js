import jwt from "jsonwebtoken";

// Authenticate requests using the JWT stored in an HTTP-only cookie.
const authenticateUser = (req, res, next) => {
  const accessToken = req.cookies.accessToken;

  if (!accessToken) {
    return res.status(401).json({
      success: false,
      message: "Unauthorized: Please login to access this resource.",
    });
  }

  try {
    const decoded = jwt.verify(accessToken, process.env.JWT_SECRET);

    if (!decoded.userId) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized: Invalid token.",
      });
    }

    req.userId = decoded.userId;

    next();
  } catch (error) {
    return res.status(401).json({
      success: false,
      message: "Unauthorized: Invalid token.",
    });
  }
};

export default authenticateUser;
