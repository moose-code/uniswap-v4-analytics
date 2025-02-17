import Airtable from "airtable";
import { getCachedHookInfo, setCachedHookInfo } from "@/lib/cache";

const base = new Airtable({
  apiKey:
    process.env.AIRTABLE_API_KEY ||
    (() => {
      console.error("Available env vars:", Object.keys(process.env));
      throw new Error(
        `AIRTABLE_API_KEY is ${process.env.AIRTABLE_API_KEY ? "set but empty" : "not set"}`
      );
    })(),
}).base("apppg8u4jvFsqU0vX");

export async function GET() {
  try {
    // Try to get cached data first
    const cachedData = await getCachedHookInfo();
    if (cachedData) {
      return Response.json(cachedData);
    }

    // If no cache or cache is expired, fetch from Airtable
    const records = await base("hooks").select().all();
    const data = records.map((record) => ({
      id: record.id,
      fields: record.fields,
    }));

    // Cache the new data
    await setCachedHookInfo(data);

    return Response.json(data);
  } catch (error) {
    console.error("Error fetching Airtable data:", error);

    // If there's an error but we have cached data, return it as a fallback
    const cachedData = await getCachedHookInfo();
    if (cachedData) {
      console.log("Returning cached data as fallback");
      return Response.json(cachedData);
    }

    return Response.json(
      { error: "Failed to fetch hook information" },
      { status: 500 }
    );
  }
}
