const mongoose = require('mongoose');

const integrationSchema = mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    platform: {
      type: String,
      required: true,
      enum: ['google', 'github'],
    },
    accessToken: {
      type: String,
      required: true,
    },
    refreshToken: {
      type: String,
    },
    expiryDate: {
      type: Number,
    },
    scope: {
      type: String,
    },
    profileEmail: {
      type: String,
    },
    profileName: {
      type: String,
    },
    profilePicture: {
      type: String,
    },
    initialSyncDone: {
      type: Boolean,
      default: false,
    },
    lastHistoryId: {
      type: String,
    },
  },
  {
    timestamps: true,
  }
);

// Ensure a user can only have one integration per platform
integrationSchema.index({ userId: 1, platform: 1 }, { unique: true });

const Integration = mongoose.model('Integration', integrationSchema);

module.exports = Integration;
