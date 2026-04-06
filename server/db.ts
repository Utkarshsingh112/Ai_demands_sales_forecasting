import mongoose from "mongoose";
import { 
  UserModel, 
  SalesDataModel, 
  ForecastModel, 
  ReportModel, 
  UserProfileModel, 
  InsertUser 
} from "./models";
import { ENV } from './_core/env';

export async function getDb() {
  if (mongoose.connection.readyState !== 1) {
    if (!process.env.DATABASE_URL) {
      console.warn("[Database] DATABASE_URL not set");
      return null;
    }
    try {
      await mongoose.connect(process.env.DATABASE_URL);
      console.log("[Database] Connected successfully");
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      return null;
    }
  }
  return true;
}

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) {
    throw new Error("User openId is required for upsert");
  }

  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot upsert user: database not available");
    return;
  }

  try {
    const updateSet: any = { ...user };
    
    if (user.openId === ENV.ownerOpenId && !updateSet.role) {
      updateSet.role = 'admin';
    }

    updateSet.lastSignedIn = new Date();

    await UserModel.findOneAndUpdate(
      { openId: user.openId },
      { $set: updateSet },
      { upsert: true, new: true }
    ).exec();
  } catch (error) {
    console.error("[Database] Failed to upsert user:", error);
    throw error;
  }
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) return undefined;

  const result = await UserModel.findOne({ openId }).exec();
  return result ? result.toObject() : undefined;
}

// Sales Data queries
export async function createSalesData(userId: string, datasetName: string, records: unknown[]) {
  await getDb();
  const ds = new SalesDataModel({ userId, datasetName, records });
  const result = await ds.save();
  return { insertId: result.id };
}

export async function getSalesDataByUser(userId: string) {
  const db = await getDb();
  if (!db) return [];
  const results = await SalesDataModel.find({ userId }).sort({ uploadedAt: -1 }).exec();
  return results.map((r: any) => r.toObject());
}

export async function getSalesDataById(id: string) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await SalesDataModel.findById(id).exec();
  return result ? result.toObject() : undefined;
}

export async function deleteSalesData(id: string) {
  const db = await getDb();
  if (!db) return;
  await SalesDataModel.findByIdAndDelete(id).exec();
}

// Forecast queries
export async function createForecast(
  userId: string,
  datasetId: string,
  horizon: number,
  overallTrend: string,
  confidenceScore: number,
  forecastData: unknown[],
  productForecasts: unknown[],
  insights: string[]
) {
  await getDb();
  const ds = new ForecastModel({
    userId,
    datasetId,
    horizon,
    overallTrend,
    confidenceScore,
    forecastData,
    productForecasts,
    insights,
  });
  const result = await ds.save();
  return { insertId: result.id };
}

export async function getForecastsByUser(userId: string) {
  const db = await getDb();
  if (!db) return [];
  const results = await ForecastModel.find({ userId }).sort({ generatedAt: -1 }).exec();
  return results.map((r: any) => r.toObject());
}

export async function getForecastById(id: string) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await ForecastModel.findById(id).exec();
  return result ? result.toObject() : undefined;
}

// Report queries
export async function createReport(userId: string, forecastId: string, pdfUrl?: string, csvUrl?: string) {
  await getDb();
  const ds = new ReportModel({ userId, forecastId, pdfUrl, csvUrl });
  const result = await ds.save();
  return { insertId: result.id };
}

export async function getReportsByUser(userId: string) {
  const db = await getDb();
  if (!db) return [];
  const results = await ReportModel.find({ userId }).sort({ generatedAt: -1 }).exec();
  return results.map((r: any) => r.toObject());
}

export async function getReportById(id: string) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await ReportModel.findById(id).exec();
  return result ? result.toObject() : undefined;
}

// User Profile queries
export async function createOrUpdateUserProfile(userId: string, businessName?: string, industry?: string, currency?: string) {
  const db = await getDb();
  if (!db) return;
  const update: any = {};
  if (businessName !== undefined) update.businessName = businessName;
  if (industry !== undefined) update.industry = industry;
  if (currency !== undefined) update.currency = currency;

  await UserProfileModel.findOneAndUpdate(
    { userId },
    { $set: update },
    { upsert: true, new: true }
  ).exec();
}

export async function getUserProfile(userId: string) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await UserProfileModel.findOne({ userId }).exec();
  return result ? result.toObject() : undefined;
}
