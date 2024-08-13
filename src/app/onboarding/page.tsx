import { OnboardingFlow } from "@/components/OnboardingFlow";
import { validateRequest } from "@/lib/auth";
import { getCurrentUser } from "@/queries/user";

export default async function Onboarding() {
  const { user } = await validateRequest();

  return (
    <div className="absolute w-screen h-screen flex flex-col items-center justify-center max-w-screen-sm">
      <div className="max-w-screen-sm h-64 flex flex-col items-center space-y-4">
        <h1 className="text-3xl">
          Hey{" "}
          <span className="text-gray-300 ml-0.5">
            {user?.crsid || user?.ravenId}
          </span>
          !
        </h1>
        <p className="text-gray-300">
          Welcome to Tripos Pro. Please choose your Tripos and Part to get
          started.
        </p>
        <OnboardingFlow />
      </div>
    </div>
  );
}
