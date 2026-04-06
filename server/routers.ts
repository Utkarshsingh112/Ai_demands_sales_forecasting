import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, router, protectedProcedure } from "./_core/trpc";
import { z } from "zod";
import {
  createSalesData,
  getSalesDataByUser,
  getSalesDataById,
  deleteSalesData,
  createForecast,
  getForecastsByUser,
  getForecastById,
  createReport,
  getReportsByUser,
  createOrUpdateUserProfile,
  getUserProfile,
} from "./db";
import { runForecast } from "./forecastEngine";
import { generateAIInsights, detectSignificantChanges } from "./aiInsights";
import { generatePDFReport, generateCSVExport } from "./pdfExport";
import { notifyOwner } from "./_core/notification";

export const appRouter = router({
  system: systemRouter,
  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return {
        success: true,
      } as const;
    }),
  }),

  // Data management
  data: router({
    upload: protectedProcedure
      .input(
        z.object({
          datasetName: z.string(),
          records: z.array(
            z.object({
              date: z.string(),
              productName: z.string(),
              category: z.string().optional(),
              quantitySold: z.number(),
              revenue: z.number(),
            })
          ),
        })
      )
      .mutation(async ({ ctx, input }) => {
        const result = await createSalesData(String(ctx.user.id), input.datasetName, input.records);
        return { success: true, message: "Data uploaded successfully" };
      }),

    list: protectedProcedure.query(async ({ ctx }) => {
      const datasets = await getSalesDataByUser(String(ctx.user.id));
      return datasets.map((ds: any) => ({
        id: ds.id,
        datasetName: ds.datasetName,
        recordCount: Array.isArray(ds.records) ? ds.records.length : 0,
        uploadedAt: ds.uploadedAt,
      }));
    }),

    delete: protectedProcedure
      .input(z.object({ id: z.string() }))
      .mutation(async ({ ctx, input }) => {
        const dataset = await getSalesDataById(input.id);
        if (!dataset || dataset.userId !== String(ctx.user.id)) {
          throw new Error("Dataset not found");
        }
        await deleteSalesData(input.id);
        return { success: true };
      }),

    get: protectedProcedure
      .input(z.object({ id: z.string() }))
      .query(async ({ ctx, input }) => {
        const dataset = await getSalesDataById(input.id);
        if (!dataset || dataset.userId !== String(ctx.user.id)) {
          throw new Error("Dataset not found");
        }
        return dataset;
      }),
  }),

  // Forecast generation and management
  forecast: router({
    run: protectedProcedure
      .input(
        z.object({
          datasetId: z.string(),
          horizon: z.number().default(30),
        })
      )
      .mutation(async ({ ctx, input }) => {
        const dataset = await getSalesDataById(input.datasetId);
        if (!dataset || dataset.userId !== String(ctx.user.id)) {
          throw new Error("Dataset not found");
        }

        const records = Array.isArray(dataset.records) ? dataset.records : JSON.parse(dataset.records as any);
        const result = await runForecast(records, input.horizon);

        const forecastResult = await createForecast(
          String(ctx.user.id),
          input.datasetId,
          input.horizon,
          result.overallTrend,
          result.confidenceScore,
          result.forecastData,
          result.productForecasts,
          result.insights
        );

        return { success: true, forecastId: forecastResult.insertId };
      }),

    list: protectedProcedure.query(async ({ ctx }) => {
      const forecasts = await getForecastsByUser(String(ctx.user.id));
      return forecasts.map((f: any) => ({
        id: f.id,
        datasetId: f.datasetId,
        horizon: f.horizon,
        overallTrend: f.overallTrend,
        confidenceScore: f.confidenceScore,
        generatedAt: f.generatedAt,
      }));
    }),

    get: protectedProcedure
      .input(z.object({ id: z.string() }))
      .query(async ({ ctx, input }) => {
        const forecast = await getForecastById(input.id);
        if (!forecast || forecast.userId !== String(ctx.user.id)) {
          throw new Error("Forecast not found");
        }
        return {
          id: forecast.id,
          overallTrend: forecast.overallTrend,
          confidenceScore: forecast.confidenceScore,
          forecastData: Array.isArray(forecast.forecastData) ? forecast.forecastData : JSON.parse(forecast.forecastData as any),
          productForecasts: Array.isArray(forecast.productForecasts) ? forecast.productForecasts : JSON.parse(forecast.productForecasts as any),
          insights: Array.isArray(forecast.insights) ? forecast.insights : JSON.parse(forecast.insights as any),
          generatedAt: forecast.generatedAt,
        };
      }),
  }),

  // Reports
  reports: router({
    list: protectedProcedure.query(async ({ ctx }) => {
      const reports = await getReportsByUser(String(ctx.user.id));
      return reports.map((r: any) => ({
        id: r.id,
        forecastId: r.forecastId,
        pdfUrl: r.pdfUrl,
        csvUrl: r.csvUrl,
        generatedAt: r.generatedAt,
      }));
    }),

    get: protectedProcedure
      .input(z.object({ id: z.string() }))
      .query(async ({ ctx, input }) => {
        const report = await getReportsByUser(String(ctx.user.id));
        const found = report.find((r: any) => r.id === input.id);
        if (!found) {
          throw new Error("Report not found");
        }
        return found;
      }),

    generate: protectedProcedure
      .input(z.object({ forecastId: z.string() }))
      .mutation(async ({ ctx, input }) => {
        const forecast = await getForecastById(input.forecastId);
        if (!forecast || forecast.userId !== String(ctx.user.id)) {
          throw new Error("Forecast not found");
        }

        const productForecasts = Array.isArray(forecast.productForecasts)
          ? forecast.productForecasts
          : JSON.parse(forecast.productForecasts as any);

        const insights = Array.isArray(forecast.insights)
          ? forecast.insights
          : JSON.parse(forecast.insights as any);

        // Generate PDF and CSV
        const pdfResult = await generatePDFReport(
          {
            title: `Demand Forecast Report - ${new Date().toLocaleDateString()}`,
            generatedAt: new Date(),
            summary: `30-day demand forecast with ${forecast.confidenceScore}% confidence`,
            forecasts: productForecasts,
            insights: insights,
            recommendations: insights,
          },
          String(ctx.user.id)
        );

        const csvResult = await generateCSVExport(
          {
            title: `Demand Forecast Report - ${new Date().toLocaleDateString()}`,
            generatedAt: new Date(),
            summary: `30-day demand forecast with ${forecast.confidenceScore}% confidence`,
            forecasts: productForecasts,
            insights: insights,
            recommendations: insights,
          },
          String(ctx.user.id)
        );

        // Store report in database
        const report = await createReport(
          String(ctx.user.id),
          input.forecastId,
          pdfResult.url,
          csvResult.url
        );

        return { success: true, reportId: report.insertId };
      }),
  }),

  // User profile
  profile: router({
    get: protectedProcedure.query(async ({ ctx }) => {
      const profile = await getUserProfile(String(ctx.user.id));
      return profile || { businessName: "", industry: "", currency: "INR" };
    }),

    update: protectedProcedure
      .input(
        z.object({
          businessName: z.string().optional(),
          industry: z.string().optional(),
          currency: z.string().optional(),
        })
      )
      .mutation(async ({ ctx, input }) => {
        await createOrUpdateUserProfile(
          String(ctx.user.id),
          input.businessName,
          input.industry,
          input.currency
        );
        return { success: true };
      }),
  }),

  // Insights and notifications
  insights: router({
    generate: protectedProcedure
      .input(z.object({ forecastId: z.string() }))
      .mutation(async ({ ctx, input }) => {
        const forecast = await getForecastById(input.forecastId);
        if (!forecast || forecast.userId !== String(ctx.user.id)) {
          throw new Error("Forecast not found");
        }

        const productForecasts = Array.isArray(forecast.productForecasts)
          ? forecast.productForecasts
          : JSON.parse(forecast.productForecasts as any);

        // Generate AI insights
        const aiInsights = await generateAIInsights(productForecasts, []);

        // Detect significant changes for notifications
        const changes = detectSignificantChanges(productForecasts);

        // Send notifications for significant changes
        for (const change of changes) {
          await notifyOwner({
            title: `Demand ${change.changeType === 'spike' ? 'Spike' : 'Drop'} Detected`,
            content: change.message,
          });
        }

        return {
          insights: aiInsights,
          changes,
        };
      }),
  }),
});

export type AppRouter = typeof appRouter;
