import { getCurrentUser } from "@/queries/user";
import { ClientHomeRedirecter } from "./ClientHomeRedirecter";

export const HomeRedirecter = async () => {
  const user = await getCurrentUser();

  if (!user) return null;

  return <ClientHomeRedirecter user={user} />;
};
