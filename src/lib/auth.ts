
import { Lucia, Session, User } from "lucia";
import { NeonHTTPAdapter } from "@lucia-auth/adapter-postgresql";
import { neon } from "@neondatabase/serverless";

import { Raven } from "./Raven";
import { cache } from "react";
import { cookies } from "next/headers";

const baseURL = process.env.NODE_ENV === "production" ? "https://tripos.pro" : "http://localhost:3000";

const sql = neon(process.env.DATABASE_URL);

const adapter = new NeonHTTPAdapter(sql, {
	user: "User",
	session: "UserSession"
});

export const lucia = new Lucia(adapter, {
	sessionCookie: {
		expires: false,
		attributes: {
			secure: process.env.NODE_ENV === "production"
		}
	},
	getUserAttributes: (attributes) => {
		return {
			...attributes
		}
	}
});

declare module "lucia" {
	interface Register {
		Lucia: typeof lucia;
		DatabaseUserAttributes: DatabaseUserAttributes;
	}
}

interface DatabaseUserAttributes {
	ravenId: string;
	crsid: string;
	picture: string;
}

export const raven = new Raven(process.env.RAVEN_CLIENT_ID, process.env.RAVEN_CLIENT_SECRET, baseURL + "/login/raven/callback");

export const validateRequest = cache(
	async (): Promise<{ user: User; session: Session } | { user: null; session: null }> => {
		const sessionId = cookies().get(lucia.sessionCookieName)?.value ?? null;
		if (!sessionId) {
			return {
				user: null,
				session: null
			};
		}

		const result = await lucia.validateSession(sessionId);
		// next.js throws when you attempt to set cookie when rendering page
		try {
			if (result.session && result.session.fresh) {
				const sessionCookie = lucia.createSessionCookie(result.session.id);
				cookies().set(sessionCookie.name, sessionCookie.value, sessionCookie.attributes);
			}
			if (!result.session) {
				const sessionCookie = lucia.createBlankSessionCookie();
				cookies().set(sessionCookie.name, sessionCookie.value, sessionCookie.attributes);
			}
		} catch {}
		return result;
	}
);
