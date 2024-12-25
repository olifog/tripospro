import { getAllTriposes } from "@/queries/tripos";
import { ClientOnboarding } from "./ClientOnboarding";
import { validateRequest } from "@/lib/auth";

export const OnboardingFlow = async () => {
  const triposes = await getAllTriposes();
  const { user } = await validateRequest();

  return <ClientOnboarding triposes={triposes} user={user} />;
};
