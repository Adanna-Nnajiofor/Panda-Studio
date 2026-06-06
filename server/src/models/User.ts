import bcrypt from "bcryptjs";
import {
  model,
  models,
  Schema,
  type HydratedDocument,
  type Model,
  type Types,
} from "mongoose";

import type { ApprovalStatus, CrewAvailability, UserRole } from "../types/auth";

export interface IUser {
  fullName: string;
  email: string;
  password: string;
  role: UserRole;
  phone?: string;
  avatar?: string;
  department?: string;
  position?: string;
  bio?: string;
  isApproved: boolean;
  isActive: boolean;
  approvalStatus: ApprovalStatus;
  availability: CrewAvailability;
  approvedBy?: Types.ObjectId | null;
  approvedAt?: Date | null;
  assignedProjects: Types.ObjectId[];
  createdAt?: Date;
  updatedAt?: Date;

  comparePassword(candidatePassword: string): Promise<boolean>;
}

export type UserDocument = HydratedDocument<IUser>;

export interface UserModel extends Model<IUser> {
  build(attrs: Partial<IUser>): IUser;
}

const userSchema = new Schema<IUser>(
  {
    fullName: {
      type: String,
      required: [true, "Full name is required"],
      trim: true,
    },

    email: {
      type: String,
      required: [true, "Email is required"],
      unique: true,
      lowercase: true,
      trim: true,
      index: true,
    },

    password: {
      type: String,
      required: [true, "Password is required"],
      minlength: [6, "Password must be at least 6 characters"],
      select: false,
    },

    role: {
      type: String,
      enum: ["client", "admin", "super_admin", "crew", "staff"],
      default: "client",
      index: true,
    },

    phone: {
      type: String,
      trim: true,
    },

    avatar: {
      type: String,
      trim: true,
    },

    department: {
      type: String,
      trim: true,
    },

    position: {
      type: String,
      trim: true,
    },

    bio: {
      type: String,
      trim: true,
    },

    isApproved: {
      type: Boolean,
      default: function defaultApproval(this: IUser) {
        return (
          this.role === "client" ||
          this.role === "admin" ||
          this.role === "super_admin"
        );
      },
    },

    isActive: {
      type: Boolean,
      default: true,
      index: true,
    },

    approvalStatus: {
      type: String,
      enum: ["pending", "approved", "rejected", "suspended"],
      default: function defaultApprovalStatus(this: IUser) {
        return this.role === "client" ||
          this.role === "admin" ||
          this.role === "super_admin"
          ? "approved"
          : "pending";
      },
    },

    availability: {
      type: String,
      enum: ["available", "busy", "on_project", "offline"],
      default: "offline",
    },

    approvedBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },

    approvedAt: {
      type: Date,
      default: null,
    },

    assignedProjects: [
      {
        type: Schema.Types.ObjectId,
        ref: "Project",
      },
    ],
  },
  {
    timestamps: true,
    versionKey: false,
  },
);

userSchema.pre("save", async function () {
  if (!this.isModified("password")) {
    return;
  }

  const salt = await bcrypt.genSalt(10);

  this.password = await bcrypt.hash(this.password, salt);
});

userSchema.method(
  "comparePassword",
  async function comparePassword(candidatePassword: string): Promise<boolean> {
    return bcrypt.compare(candidatePassword, this.password);
  },
);

userSchema.set("toJSON", {
  transform(_doc, ret: Partial<IUser>) {
    ret.password = undefined;
    return ret;
  },
});

const User =
  (models.User as UserModel) || model<IUser, UserModel>("User", userSchema);

export default User;
