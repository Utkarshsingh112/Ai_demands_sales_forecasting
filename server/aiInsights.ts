import { invokeLLM } from "./_core/llm";

export interface ForecastData {
  productName: string;
  currentAvg: number;
  forecastedAvg: number;
  changePercent: number;
  trend: 'up' | 'down' | 'stable';
  historicalData: Array<{ date: string; value: number }>;
}

export interface AnomalyDetection {
  date: string;
  value: number;
  expectedRange: { lower: number; upper: number };
  severity: 'low' | 'medium' | 'high';
  description: string;
}

export interface InsightGeneration {
  summary: string;
  trendNarratives: string[];
  anomalies: AnomalyDetection[];
  recommendations: string[];
  confidenceScore: number;
}

/**
 * Generate AI-powered insights based on forecast data
 * Uses LLM to create natural language explanations of trends and recommendations
 */
export async function generateAIInsights(
  forecasts: ForecastData[],
  historicalData: Array<{ date: string; productName: string; revenue: number; quantity: number }>
): Promise<InsightGeneration> {
  try {
    // Prepare context for LLM
    const forecastSummary = forecasts
      .map(f => `${f.productName}: ${f.changePercent > 0 ? '+' : ''}${f.changePercent}% (${f.trend})`)
      .join(', ');

    const prompt = `
You are a business intelligence analyst. Analyze the following demand forecast data and provide actionable insights.

Forecast Summary:
${forecastSummary}

Product Details:
${forecasts.map(f => `- ${f.productName}: Current avg ${f.currentAvg}, Forecasted avg ${f.forecastedAvg}, Trend: ${f.trend}`).join('\n')}

Please provide:
1. A brief executive summary (2-3 sentences)
2. 3-4 specific trend narratives explaining what's happening and why
3. Anomalies or unusual patterns detected
4. 3-4 actionable business recommendations

Format your response as JSON with keys: summary, trendNarratives (array), anomalies (array with fields: date, description, severity), recommendations (array)
`;

    const response = await invokeLLM({
      messages: [
        {
          role: "system",
          content: "You are a demand forecasting expert. Provide insights in valid JSON format only." as any
        },
        {
          role: "user",
          content: prompt as any
        }
      ],
      response_format: {
        type: "json_schema",
        json_schema: {
          name: "forecast_insights",
          strict: true,
          schema: {
            type: "object",
            properties: {
              summary: { type: "string" },
              trendNarratives: { type: "array", items: { type: "string" } },
              anomalies: {
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    date: { type: "string" },
                    description: { type: "string" },
                    severity: { type: "string", enum: ["low", "medium", "high"] }
                  },
                  required: ["date", "description", "severity"]
                }
              },
              recommendations: { type: "array", items: { type: "string" } }
            },
            required: ["summary", "trendNarratives", "anomalies", "recommendations"],
            additionalProperties: false
          }
        }
      }
    });

    // Parse LLM response
    const content = response.choices[0]?.message.content;
    if (!content) {
      throw new Error("No response from LLM");
    }

    const contentStr = typeof content === 'string' ? content : JSON.stringify(content);
    const parsed = JSON.parse(contentStr);

    return {
      summary: parsed.summary,
      trendNarratives: parsed.trendNarratives || [],
      anomalies: (parsed.anomalies || []).map((a: any) => ({
        date: a.date,
        value: 0, // Would be populated from actual data
        expectedRange: { lower: 0, upper: 0 },
        severity: a.severity,
        description: a.description
      })),
      recommendations: parsed.recommendations || [],
      confidenceScore: 0.85 // Default confidence
    };
  } catch (error) {
    console.error("Error generating AI insights:", error);
    // Return fallback insights
    return {
      summary: "Unable to generate AI insights at this time. Please try again later.",
      trendNarratives: [],
      anomalies: [],
      recommendations: [
        "Monitor demand trends closely over the next week",
        "Consider adjusting inventory based on recent patterns",
        "Review seasonal factors that may impact forecasts"
      ],
      confidenceScore: 0.5
    };
  }
}

/**
 * Detect significant demand changes for notifications
 */
export function detectSignificantChanges(
  forecasts: ForecastData[]
): Array<{
  productName: string;
  changeType: 'spike' | 'drop' | 'seasonal';
  changePercent: number;
  message: string;
}> {
  const changes: Array<{
    productName: string;
    changeType: 'spike' | 'drop' | 'seasonal';
    changePercent: number;
    message: string;
  }> = [];

  forecasts.forEach(forecast => {
    // Demand spike > 25%
    if (forecast.changePercent > 25) {
      changes.push({
        productName: forecast.productName,
        changeType: 'spike',
        changePercent: forecast.changePercent,
        message: `Demand spike detected for ${forecast.productName}: +${forecast.changePercent}% increase expected`
      });
    }

    // Demand drop > 15%
    if (forecast.changePercent < -15) {
      changes.push({
        productName: forecast.productName,
        changeType: 'drop',
        changePercent: forecast.changePercent,
        message: `Demand drop detected for ${forecast.productName}: ${forecast.changePercent}% decrease expected`
      });
    }
  });

  return changes;
}
