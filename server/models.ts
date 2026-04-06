import mongoose, { Schema, Document } from 'mongoose';

// User Schema
export interface User extends Document {
  _id: mongoose.Types.ObjectId;
  id: string; // Virtual
  openId: string;
  name?: string | null;
  email?: string | null;
  loginMethod?: string | null;
  role: 'user' | 'admin';
  createdAt: Date;
  updatedAt: Date;
  lastSignedIn: Date;
}

export type InsertUser = Partial<Omit<User, 'id' | '_id' | 'createdAt' | 'updatedAt'>> & { openId: string };

const userSchema = new Schema<User>({
  openId: { type: String, required: true, unique: true },
  name: { type: String, default: null },
  email: { type: String, default: null },
  loginMethod: { type: String, default: null },
  role: { type: String, enum: ['user', 'admin'], default: 'user' },
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
