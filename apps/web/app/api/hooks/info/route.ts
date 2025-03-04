import Airtable from "airtable";
import { getCachedHookInfo, setCachedHookInfo } from "@/lib/cache";

const base = new Airtable({
  apiKey:
    process.env.AIRTABLE_API_KEY ||
    (() => {
      // Log all environment variable names (but not values for security)
      console.error(
        "Available env vars:",
        Object.keys(process.env).sort().join(", ")
      );
      console.error("NODE_ENV:", process.env.NODE_ENV);
      console.error("VERCEL_ENV:", process.env.VERCEL_ENV);
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

    // Log a few records to debug
    if (records.length > 0 && records[0] && records[0].fields) {
      console.log(
        "Sample Airtable record fields:",
        JSON.stringify(records[0].fields, null, 2)
      );
    }

    const data = records.map((record) => {
      if (!record) return { id: "", fields: {} };

      // Get the fields or empty object if undefined
      const fields = record.fields || {};

      // Check for both "Address" and "address" fields
      let addressField = fields.address || fields.Address || null;

      // Log any address fields for debugging
      if (addressField) {
        console.log(
          `Hook ${fields.Name || record.id}: Raw Address = ${addressField}`
        );
      }

      return {
        id: record.id,
        fields: {
          ...fields,
          // Ensure required fields exist (even if empty) to prevent undefined errors
          Type: fields.Type || "",
          Name: fields.Name || "",
          "Project Description": fields["Project Description"] || "",
          "Stage ": fields["Stage "] || "",
          // Normalize the address field (use either lowercase or uppercase version)
          address: addressField,
          website: fields.website || null,
          X: fields.X || null,
        },
      };
    });

    // Log the first processed record for debugging
    if (data.length > 0 && data[0]) {
      console.log("First processed record:", JSON.stringify(data[0], null, 2));
    }

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
