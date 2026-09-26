import mongoose from "mongoose";
import bcrypt from "bcryptjs";

const schema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true, maxlength: 80 },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    phone: { type: String, trim: true },
    password: { type: String, required: true, select: false },
    role: {
      type: String,
      enum: ["customer", "admin", "superadmin"],
      default: "customer",
      index: true,
    },
    active: { type: Boolean, default: true },
    cart: [
      {
        _id: false,
        productId: { type: mongoose.Schema.Types.ObjectId, ref: "Product" },
        variantId: String,
        quantity: { type: Number, min: 1, default: 1 },
      },
    ],
    wishlist: [{ type: mongoose.Schema.Types.ObjectId, ref: "Product" }],
    lastLoginAt: Date,

    resetPasswordToken: { type: String, select: false },
    resetPasswordExpires: { type: Date, select: false },
  },
  { timestamps: true },
);

schema.pre("save", async function hash(next) {
  if (!this.isModified("password")) return next();
  this.password = await bcrypt.hash(this.password, 12);
  next();
});
schema.methods.matchPassword = function matchPassword(plain) {
  return bcrypt.compare(plain, this.password);
};
schema.set("toJSON", {
  transform: (_d, ret) => {
    delete ret.password;
    delete ret.__v;
    return ret;
  },
});

export const User = mongoose.model("User", schema);
