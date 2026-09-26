import crypto from "crypto";
import { User } from "../models/User.js";

import { signToken } from "../middleware/auth.js";
import { ApiError, ah, ok } from "../utils/http.js";
import { emails } from "../services/email.js";

const session = (user) => ({ token: signToken(user), user });

export const register = ah(async (req, res) => {
  const { name, email, phone, password } = req.body;
  if (await User.exists({ email }))
    throw new ApiError(
      409,
      "An account with this email already exists. Try signing in.",
    );
  const user = await User.create({ name, email, phone, password });
  emails.welcome(user);
  ok(res, session(user), 201);
});

async function authenticate(email, password) {
  const user = await User.findOne({ email }).select("+password");
  if (!user || !(await user.matchPassword(password)))
    throw new ApiError(401, "Incorrect email or password");
  if (!user.active)
    throw new ApiError(403, "This account has been disabled. Contact support.");
  user.lastLoginAt = new Date();
  await user.save();
  return user;
}

export const login = ah(async (req, res) =>
  ok(res, session(await authenticate(req.body.email, req.body.password))),
);
export const forgotPassword = ah(async (req, res) => {
  const email = String(req.body.email || "")
    .trim()
    .toLowerCase();

  const user = await User.findOne({ email });

  // Don't reveal whether the email exists.
  if (!user) {
    return ok(res, {
      message:
        "If an account exists with that email, a password reset link has been sent.",
    });
  }

  const rawToken = crypto.randomBytes(32).toString("hex");

  const hashedToken = crypto
    .createHash("sha256")
    .update(rawToken)
    .digest("hex");

  user.resetPasswordToken = hashedToken;
  user.resetPasswordExpires = new Date(Date.now() + 15 * 60 * 1000);

  await user.save({ validateBeforeSave: false });

  await emails.passwordReset(user, rawToken);

  ok(res, {
    message:
      "If an account exists with that email, a password reset link has been sent.",
  });
});
export const resetPassword = ah(async (req, res) => {
  const { token } = req.params;
  const { password } = req.body;

  if (!token) {
    throw new ApiError(400, "Invalid password reset link");
  }

  if (!password || password.length < 6) {
    throw new ApiError(400, "Password must be at least 6 characters");
  }

  const hashedToken = crypto.createHash("sha256").update(token).digest("hex");

  const user = await User.findOne({
    resetPasswordToken: hashedToken,
    resetPasswordExpires: { $gt: new Date() },
  }).select("+password +resetPasswordToken +resetPasswordExpires");

  if (!user) {
    throw new ApiError(
      400,
      "This password reset link is invalid or has expired.",
    );
  }

  user.password = password;
  user.resetPasswordToken = undefined;
  user.resetPasswordExpires = undefined;

  await user.save();

  ok(res, {
    message: "Password reset successfully. You can now sign in.",
  });
});
export const adminLogin = ah(async (req, res) => {
  const user = await authenticate(req.body.email, req.body.password);
  if (!["admin", "superadmin"].includes(user.role))
    throw new ApiError(403, "This account does not have admin access");
  ok(res, session(user));
});

export const me = (req, res) => ok(res, { user: req.user });

export const updateProfile = ah(async (req, res) => {
  const { name, phone, currentPassword, newPassword } = req.body;
  const user = await User.findById(req.user._id).select("+password");
  if (name) user.name = name;
  if (phone) user.phone = phone;
  if (newPassword) {
    if (!currentPassword || !(await user.matchPassword(currentPassword)))
      throw new ApiError(400, "Current password is incorrect");
    user.password = newPassword;
  }
  await user.save();
  ok(res, { user });
});
