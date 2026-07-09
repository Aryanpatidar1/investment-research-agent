import fs from "fs";
import path from "path";
import crypto from "crypto";

const DATA_DIR = path.join(process.cwd(), "data");
const USERS_FILE = path.join(DATA_DIR, "users.json");
const OTPS_FILE = path.join(DATA_DIR, "otps.json");
const JWT_SECRET = process.env.JWT_SECRET || "investment_research_agent_secret_key_123456";

if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}
if (!fs.existsSync(USERS_FILE)) {
  fs.writeFileSync(USERS_FILE, JSON.stringify([], null, 2), "utf8");
}
if (!fs.existsSync(OTPS_FILE)) {
  fs.writeFileSync(OTPS_FILE, JSON.stringify({}, null, 2), "utf8");
}

function readUsers() {
  try {
    const data = fs.readFileSync(USERS_FILE, "utf8");
    return JSON.parse(data);
  } catch (err) {
    console.error("Error reading users file:", err);
    return [];
  }
}

function writeUsers(users) {
  try {
    fs.writeFileSync(USERS_FILE, JSON.stringify(users, null, 2), "utf8");
    return true;
  } catch (err) {
    console.error("Error writing users file:", err);
    return false;
  }
}

function readOtps() {
  try {
    const data = fs.readFileSync(OTPS_FILE, "utf8");
    return JSON.parse(data);
  } catch {
    return {};
  }
}

function writeOtps(otps) {
  try {
    fs.writeFileSync(OTPS_FILE, JSON.stringify(otps, null, 2), "utf8");
    return true;
  } catch (err) {
    console.error("Error writing otps file:", err);
    return false;
  }
}

function hashPassword(password) {
  const salt = crypto.randomBytes(16).toString("hex");
  const hash = crypto.pbkdf2Sync(password, salt, 1000, 64, "sha512").toString("hex");
  return { salt, hash };
}

function verifyPassword(password, salt, savedHash) {
  const hash = crypto.pbkdf2Sync(password, salt, 1000, 64, "sha512").toString("hex");
  return hash === savedHash;
}

function sanitizeUser(user) {
  return {
    id: user.id,
    name: user.name,
    email: user.email || null,
    phone: user.phone || null,
    provider: user.provider,
    picture: user.picture || null,
  };
}

export function generateToken(payload) {
  const header = Buffer.from(JSON.stringify({ alg: "HS256", typ: "JWT" })).toString("base64url");
  const body = Buffer.from(JSON.stringify({ ...payload, exp: Date.now() + 24 * 60 * 60 * 1000 })).toString("base64url");
  const signature = crypto.createHmac("sha256", JWT_SECRET).update(`${header}.${body}`).digest("base64url");
  return `${header}.${body}.${signature}`;
}

export function verifyToken(token) {
  if (!token) return null;
  try {
    const [header, body, signature] = token.split(".");
    const expectedSignature = crypto.createHmac("sha256", JWT_SECRET).update(`${header}.${body}`).digest("base64url");
    if (signature !== expectedSignature) return null;

    const decodedBody = JSON.parse(Buffer.from(body, "base64url").toString("utf8"));
    if (decodedBody.exp && decodedBody.exp < Date.now()) {
      return null;
    }
    return decodedBody;
  } catch {
    return null;
  }
}

function decodeGoogleToken(credential) {
  const parts = credential.split(".");
  if (parts.length !== 3) return null;
  try {
    const payload = JSON.parse(Buffer.from(parts[1], "base64url").toString("utf8"));
    return {
      googleId: payload.sub,
      email: payload.email,
      name: payload.name,
      picture: payload.picture,
    };
  } catch {
    return null;
  }
}

export const registerUser = async (req, res) => {
  try {
    const { email, password, name } = req.body;

    if (!email || !password || !name) {
      return res.status(400).json({ success: false, message: "Please fill all fields" });
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ success: false, message: "Please enter a valid email address" });
    }

    if (password.length < 6) {
      return res.status(400).json({ success: false, message: "Password must be at least 6 characters" });
    }

    const users = readUsers();
    const existingUser = users.find((u) => u.email?.toLowerCase() === email.toLowerCase());

    if (existingUser) {
      return res.status(400).json({ success: false, message: "User already exists with this email" });
    }

    const { salt, hash } = hashPassword(password);
    const newUser = {
      id: crypto.randomUUID(),
      name,
      email: email.toLowerCase(),
      phone: null,
      provider: "email",
      salt,
      hash,
      picture: null,
      createdAt: new Date().toISOString(),
    };

    users.push(newUser);

    if (!writeUsers(users)) {
      return res.status(500).json({ success: false, message: "Failed to save user data. Check server permissions." });
    }

    const token = generateToken({ id: newUser.id, email: newUser.email, name: newUser.name });

    res.status(201).json({
      success: true,
      message: "Registration successful",
      token,
      user: sanitizeUser(newUser),
    });
  } catch (err) {
    console.error("Register Error:", err);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
};

export const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ success: false, message: "Please fill all fields" });
    }

    const users = readUsers();
    const user = users.find((u) => u.email?.toLowerCase() === email.toLowerCase() && u.provider === "email");

    if (!user) {
      return res.status(401).json({ success: false, message: "Invalid email or password" });
    }

    const isMatch = verifyPassword(password, user.salt, user.hash);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: "Invalid email or password" });
    }

    const token = generateToken({ id: user.id, email: user.email, name: user.name });

    res.json({
      success: true,
      message: "Login successful",
      token,
      user: sanitizeUser(user),
    });
  } catch (err) {
    console.error("Login Error:", err);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
};

export const googleAuth = async (req, res) => {
  try {
    const { credential } = req.body;

    if (!credential) {
      return res.status(400).json({ success: false, message: "Google credential is required" });
    }

    const googleUser = decodeGoogleToken(credential);
    if (!googleUser?.email || !googleUser?.googleId) {
      return res.status(400).json({ success: false, message: "Invalid Google token" });
    }

    const users = readUsers();
    let user = users.find(
      (u) => u.googleId === googleUser.googleId || u.email?.toLowerCase() === googleUser.email.toLowerCase()
    );

    if (!user) {
      user = {
        id: crypto.randomUUID(),
        name: googleUser.name || "Google User",
        email: googleUser.email.toLowerCase(),
        phone: null,
        provider: "google",
        googleId: googleUser.googleId,
        picture: googleUser.picture || null,
        createdAt: new Date().toISOString(),
      };
      users.push(user);

      if (!writeUsers(users)) {
        return res.status(500).json({ success: false, message: "Failed to save user data" });
      }
    }

    const token = generateToken({ id: user.id, email: user.email, name: user.name });

    res.json({
      success: true,
      message: user.createdAt ? "Google sign-in successful" : "Google account linked",
      token,
      user: sanitizeUser(user),
    });
  } catch (err) {
    console.error("Google Auth Error:", err);
    res.status(500).json({ success: false, message: "Google authentication failed" });
  }
};

export const sendPhoneOtp = async (req, res) => {
  try {
    const { phone, name } = req.body;

    if (!phone || phone.length < 10) {
      return res.status(400).json({ success: false, message: "Enter a valid 10-digit phone number" });
    }

    const cleanPhone = phone.replace(/\D/g, "");
    const otp = String(Math.floor(100000 + Math.random() * 900000));
    const otps = readOtps();

    otps[cleanPhone] = {
      otp,
      name: name || null,
      expiresAt: Date.now() + 5 * 60 * 1000,
    };

    if (!writeOtps(otps)) {
      return res.status(500).json({ success: false, message: "Failed to generate OTP" });
    }

    console.log(`OTP for ${cleanPhone}: ${otp}`);

    res.json({
      success: true,
      message: "OTP sent successfully",
      demoOtp: process.env.NODE_ENV !== "production" ? otp : undefined,
    });
  } catch (err) {
    console.error("Send OTP Error:", err);
    res.status(500).json({ success: false, message: "Failed to send OTP" });
  }
};

export const verifyPhoneOtp = async (req, res) => {
  try {
    const { phone, otp, name } = req.body;

    if (!phone || !otp) {
      return res.status(400).json({ success: false, message: "Phone and OTP are required" });
    }

    const cleanPhone = phone.replace(/\D/g, "");
    const otps = readOtps();
    const record = otps[cleanPhone];

    if (!record) {
      return res.status(400).json({ success: false, message: "No OTP found. Please request a new one." });
    }

    if (record.expiresAt < Date.now()) {
      delete otps[cleanPhone];
      writeOtps(otps);
      return res.status(400).json({ success: false, message: "OTP expired. Please request a new one." });
    }

    if (record.otp !== otp) {
      return res.status(400).json({ success: false, message: "Invalid OTP. Please try again." });
    }

    delete otps[cleanPhone];
    writeOtps(otps);

    const users = readUsers();
    let user = users.find((u) => u.phone === cleanPhone);

    if (!user) {
      user = {
        id: crypto.randomUUID(),
        name: name || record.name || `User ${cleanPhone.slice(-4)}`,
        email: null,
        phone: cleanPhone,
        provider: "phone",
        picture: null,
        createdAt: new Date().toISOString(),
      };
      users.push(user);

      if (!writeUsers(users)) {
        return res.status(500).json({ success: false, message: "Failed to save user data" });
      }
    }

    const token = generateToken({ id: user.id, phone: user.phone, name: user.name });

    res.json({
      success: true,
      message: "Phone verification successful",
      token,
      user: sanitizeUser(user),
    });
  } catch (err) {
    console.error("Verify OTP Error:", err);
    res.status(500).json({ success: false, message: "Phone verification failed" });
  }
};

export const authenticate = (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({ success: false, message: "Access denied. No token provided." });
    }

    const token = authHeader.split(" ")[1];
    const decoded = verifyToken(token);

    if (!decoded) {
      return res.status(401).json({ success: false, message: "Invalid or expired token." });
    }

    req.user = decoded;
    next();
  } catch (err) {
    console.error("Auth Middleware Error:", err);
    res.status(500).json({ success: false, message: "Authentication failed" });
  }
};

export const getUserProfile = (req, res) => {
  res.json({
    success: true,
    user: req.user,
  });
};
