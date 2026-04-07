import mongoose, { Schema, Document } from 'mongoose';

// User Schema
export interface User extends Document {
  _id: mongoose.Types.ObjectId;
  id: string; // Virtual
  email: string;
  name?: string | null;
  passwordHash: string;
  loginMethod?: string | null;
  role: 'user' | 'admin';
  resetPasswordOtp?: string | null;
  resetPasswordOtpExpiry?: Date | null;
  createdAt: Date;
  updatedAt: Date;
  lastSignedIn: Date;
}

export type InsertUser = Partial<Omit<User, 'id' | '_id' | 'createdAt' | 'updatedAt'>> & { email: string };

const userSchema = new Schema<User>({
  email: { type: String, required: true, unique: true },
  name: { type: String, default: null },
  passwordHash: { type: String, required: true },
  loginMethod: { type: String, default: 'email' },
  role: { type: String, enum: ['user', 'admin'], default: 'user' },
  resetPasswordOtp: { type: String, default: null },
  resetPasswordOtpExpiry: { type: Date, default: null },
  lastSignedIn: { type: Date, default: Date.now },
}, { timestamps: true });

// Sales Data Schema
export interface SalesData extends Document {
  _id: mongoose.Types.ObjectId;
  id: string;
  userId: string;
  datasetName: string;
  records: any[];
  uploadedAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

const salesDataSchema = new Schema<SalesData>({
  userId: { type: String, required: true },
  datasetName: { type: String, required: true },
  records: { type: Schema.Types.Mixed, required: true },
  uploadedAt: { type: Date, default: Date.now },
}, { timestamps: true });

// Forecast Schema
export interface Forecast extends Document {
  _id: mongoose.Types.ObjectId;
  id: string;
  userId: string;
  datasetId: string;
  horizon: number;
  overallTrend: string;
  confidenceScore: number;
  forecastData: any[];
  productForecasts: any[];
  insights: any[];
  generatedAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

const forecastSchema = new Schema<Forecast>({
  userId: { type: String, required: true },
  datasetId: { type: String, required: true },
  horizon: { type: Number, required: true },
  overallTrend: { type: String, required: true },
  confidenceScore: { type: Number, required: true },
  forecastData: { type: Schema.Types.Mixed, required: true },
  productForecasts: { type: Schema.Types.Mixed, required: true },
  insights: { type: Schema.Types.Mixed, required: true },
  generatedAt: { type: Date, default: Date.now },
}, { timestamps: true });

// Report Schema
export interface Report extends Document {
  _id: mongoose.Types.ObjectId;
  id: string;
  userId: string;
  forecastId: string;
  pdfUrl?: string | null;
  csvUrl?: string | null;
  generatedAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

const reportSchema = new Schema<Report>({
  userId: { type: String, required: true },
  forecastId: { type: String, required: true },
  pdfUrl: { type: String, default: null },
  csvUrl: { type: String, default: null },
  generatedAt: { type: Date, default: Date.now },
}, { timestamps: true });

// User Profile Schema
export interface UserProfile extends Document {
  _id: mongoose.Types.ObjectId;
  id: string;
  userId: string;
  businessName?: string | null;
  industry?: string | null;
  currency: string;
  notificationsEnabled: number;
  createdAt: Date;
  updatedAt: Date;
}

const userProfileSchema = new Schema<UserProfile>({
  userId: { type: String, required: true, unique: true },
  businessName: { type: String, default: null },
  industry: { type: String, default: null },
  currency: { type: String, default: 'INR' },
  notificationsEnabled: { type: Number, default: 1 },
}, { timestamps: true });


// OTP Model — stores short-lived OTPs for registration email verification
// (password-reset OTPs are stored directly on the UserModel)
const otpSchema = new Schema({
  email:     { type: String, required: true },
  otp:       { type: String, required: true },
  purpose:   { type: String, required: true, enum: ['registration'] },
  expiresAt: { type: Date,   required: true },
}, { timestamps: true });

// MongoDB TTL index: auto-delete documents once expiresAt is reached
otpSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });
otpSchema.index({ email: 1, purpose: 1 });

export const OtpModel = mongoose.models.Otp || mongoose.model('Otp', otpSchema);

// Expose id virtual mapping
[userSchema, salesDataSchema, forecastSchema, reportSchema, userProfileSchema].forEach(schema => {
  schema.virtual('id').get(function(this: any) {
    return this._id.toHexString();
  });
  (schema as any).set('toJSON', { virtuals: true, versionKey: false, transform: (doc: any, ret: any) => { delete ret._id; } });
  (schema as any).set('toObject', { virtuals: true, versionKey: false, transform: (doc: any, ret: any) => { delete ret._id; } });
});

export const UserModel = mongoose.models.User || mongoose.model<User>('User', userSchema);
export const SalesDataModel = mongoose.models.SalesData || mongoose.model<SalesData>('SalesData', salesDataSchema);
export const ForecastModel = mongoose.models.Forecast || mongoose.model<Forecast>('Forecast', forecastSchema);
export const ReportModel = mongoose.models.Report || mongoose.model<Report>('Report', reportSchema);
export const UserProfileModel = mongoose.models.UserProfile || mongoose.model<UserProfile>('UserProfile', userProfileSchema);
