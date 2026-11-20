import User from "../models/User.js";
import escapeRegex from "../utils/escapeRegex.js";

const httpError = (statusCode, message) => {
  const error = new Error(message);
  error.statusCode = statusCode;
  return error;
};

// Never send the password hash back
const safeUser = (u) => ({
  _id: u._id,
  name: u.name,
  email: u.email,
  role: u.role,
  isActive: u.isActive,
  createdAt: u.createdAt,
});

// GET /api/users?search=raj&role=employee
export const getUsers = async (req, res, next) => {
  try {
    const { search, role } = req.query;
    const filter = {};

    if (search) {
      const regex = { $regex: escapeRegex(search), $options: "i" };
      filter.$or = [{ name: regex }, { email: regex }];
    }
    if (role === "admin" || role === "employee") {
      filter.role = role;
    }

    const users = await User.find(filter).sort({ createdAt: 1 });
    res.json(users.map(safeUser));
  } catch (error) {
    next(error);
  }
};

// POST /api/users
export const createUser = async (req, res, next) => {
  try {
    const { name, email, password, role } = req.body;
    const user = await User.create({ name, email, password, role });
    res.status(201).json(safeUser(user));
  } catch (error) {
    next(error);
  }
};

// PUT /api/users/:id
export const updateUser = async (req, res, next) => {
  try {
    const { name, email, role, isActive, password } = req.body;

    const user = await User.findById(req.params.id);
    if (!user) throw httpError(404, "User not found");

    const isSelf = String(user._id) === String(req.user._id);
    const losingAdmin =
      user.role === "admin" &&
      ((role !== undefined && role !== "admin") || isActive === false);

    if (losingAdmin && isSelf) {
      throw httpError(
        400,
        "You cannot remove your own admin access or disable your own account",
      );
    }

    if (name !== undefined) user.name = name;
    if (email !== undefined) user.email = email;
    if (role !== undefined) user.role = role;
    if (isActive !== undefined) user.isActive = isActive;
    if (password) user.password = password;

    await user.save();
    res.json(safeUser(user));
  } catch (error) {
    next(error);
  }
};

// DELETE /api/users/:id
export const deleteUser = async (req, res, next) => {
  try {
    if (req.params.id === String(req.user._id)) {
      throw httpError(400, "You cannot delete your own account");
    }

    const user = await User.findByIdAndDelete(req.params.id);
    if (!user) throw httpError(404, "User not found");

    res.json({ message: "User deleted" });
  } catch (error) {
    next(error);
  }
};
