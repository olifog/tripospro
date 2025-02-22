import { db } from "@/db";
import { userSettingsTable, usersTable } from "@/db/schema/user";
import { env } from "@/env";
import type { WebhookEvent } from "@clerk/nextjs/server";
import { headers } from "next/headers";
import { Webhook } from "svix";

export async function POST(req: Request) {
  const SIGNING_SECRET = env.CLERK_SIGNING_SECRET;

  // Create new Svix instance with secret
  const wh = new Webhook(SIGNING_SECRET);

  // Get headers
  const headerPayload = await headers();
  const svix_id = headerPayload.get("svix-id");
  const svix_timestamp = headerPayload.get("svix-timestamp");
  const svix_signature = headerPayload.get("svix-signature");

  // If there are no headers, error out
  if (!svix_id || !svix_timestamp || !svix_signature) {
    return new Response("Error: Missing Svix headers", {
      status: 400
    });
  }

  // Get body
  const payload = await req.json();
  const body = JSON.stringify(payload);

  let evt: WebhookEvent;

  // Verify payload with headers
  try {
    evt = wh.verify(body, {
      "svix-id": svix_id,
      "svix-timestamp": svix_timestamp,
      "svix-signature": svix_signature
    }) as WebhookEvent;
  } catch (err) {
    console.error("Error: Could not verify webhook:", err);
    return new Response("Error: Verification error", {
      status: 400
    });
  }

  // Do something with payload
  // For this guide, log payload to console
  const { id } = evt.data;
  const eventType = evt.type;
  console.log(`Received webhook with ID ${id} and event type of ${eventType}`);

  if (eventType === "user.created") {
    const email =
      evt.data.email_addresses.find(
        (e) => e.id === evt.data.primary_email_address_id
      )?.email_address ?? evt.data.email_addresses[0].email_address;
    const crsid = email?.split("@")[0];
    const [user] = await db
      .insert(usersTable)
      .values({
        clerkId: evt.data.id,
        name: `${evt.data.first_name} ${evt.data.last_name}`,
        email: email,
        picture: evt.data.image_url,
        crsid: crsid
      })
      .returning();

    await db.insert(userSettingsTable).values({
      userId: user.id
    });
  }

  return new Response("Webhook received", { status: 200 });
}
