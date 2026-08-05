import User from "../modules/user/user.model.js";

/**
 * Creates a staff User document with the given role, status, and createdBy.
 * Teacher/Admin-specific fields must be handled by the calling module.
 *
 * @param {object} userPayload  - Validated user fields (fullName, email, phone, gender, etc.)
 * @param {string} password     - Plain-text temporary password (hashed by pre-save hook)
 * @param {object} options
 * @param {string} options.role
 * @param {string} options.status
 * @param {boolean} options.isVerified
 * @param {boolean} options.mustChangePassword
 * @param {mongoose.Types.ObjectId} options.createdBy
 * @param {mongoose.ClientSession} [options.session]
 */
export const createStaffUser = async (userPayload, password, { role, status, isVerified, mustChangePassword, createdBy, session } = {}) => {
  const doc = {
    ...userPayload,
    password,
    role,
    status,
    isVerified,
    mustChangePassword,
    createdBy,
  };

  if (session) {
    const [user] = await User.create([doc], { session });
    return user;
  }

  return User.create(doc);
};
