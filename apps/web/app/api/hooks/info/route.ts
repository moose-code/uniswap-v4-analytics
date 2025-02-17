import Airtable from "airtable";

const base = new Airtable({
  apiKey: process.env.AIRTABLE_API_KEY,
}).base("apppg8u4jvFsqU0vX");

export async function GET() {
  try {
    const records = await base("hooks").select().all();
    const data = records.map((record) => ({
      id: record.id,
      fields: record.fields,
    }));

    return Response.json(data);
  } catch (error) {
    console.error("Error fetching Airtable data:", error);
    return Response.json(
      { error: "Failed to fetch hook information" },
      { status: 500 }
    );
  }
}
