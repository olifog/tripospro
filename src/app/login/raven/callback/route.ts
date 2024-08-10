import { raven, lucia } from "@/lib/auth";
import { cookies } from "next/headers";
import { OAuth2RequestError } from "arctic";
import { generateIdFromEntropySize } from "lucia";
import { NextRequest } from "next/server";
import { jwtDecode, JwtPayload } from "jwt-decode";
import { prisma } from "@/lib/prisma";
import { crsidFromEmail } from "@/lib/utils";

export async function GET(request: NextRequest): Promise<Response> {
  const code = request.nextUrl.searchParams.get("code");
  const state = request.nextUrl.searchParams.get("state");
  const storedState = cookies().get("raven_oauth_state")?.value ?? null;
  const storedCodeVerifier =
    cookies().get("raven_oauth_code_verifier")?.value ?? null;
  if (
    !code ||
    !state ||
    !storedState ||
    !storedCodeVerifier ||
    state !== storedState
  ) {
    return new Response(null, {
      status: 400,
    });
  }

  try {
    const tokens = await raven.validateAuthorizationCode(
      code,
      storedCodeVerifier
    );
    const ravenUser = jwtDecode(tokens.idToken) as JwtPayload & {
      email: string;
      name: string;
      picture: string;
      given_name: string;
      family_name: string;
      email_verified: boolean;
      hd: string;
    };

    const existingUser = await prisma.user.findUnique({
      where: {
        ravenId: ravenUser.email,
      },
      include: {
        tripos: true,
        triposPart: true,
      },
    });

    if (existingUser) {
      const session = await lucia.createSession(existingUser.id, {});
      const sessionCookie = lucia.createSessionCookie(session.id);
      cookies().set(
        sessionCookie.name,
        sessionCookie.value,
        sessionCookie.attributes
      );
      return new Response(null, {
        status: 302,
        headers: {
          Location: "/",
        },
      });
    }

    const userId = generateIdFromEntropySize(10); // 16 characters long

    const crsid = crsidFromEmail(ravenUser.email);

    await prisma.user.create({
      data: {
        id: userId,
        ravenId: ravenUser.email,
        crsid: crsid || "",
        picture: ravenUser.picture,
      },
    });

    const session = await lucia.createSession(userId, {});
    const sessionCookie = lucia.createSessionCookie(session.id);
    cookies().set(
      sessionCookie.name,
      sessionCookie.value,
      sessionCookie.attributes
    );
    return new Response(null, {
      status: 302,
      headers: {
        Location: "/onboarding",
      },
    });
  } catch (e) {
    if (e instanceof OAuth2RequestError) {
      return new Response(null, {
        status: 400,
      });
    }
    return new Response(null, {
      status: 500,
    });
  }
}
