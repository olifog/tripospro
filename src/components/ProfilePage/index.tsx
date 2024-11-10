import { getUserByCrsid } from "@/queries/user";
import { Badge } from "../ui/badge";
import Image from "next/image";
export const ProfilePage = async ({
  user,
}: {
  user: NonNullable<Awaited<ReturnType<typeof getUserByCrsid>>>;
}) => {
  return (
    <div className="flex flex-col space-y-4 w-full max-w-xl mb-12">
      <div className="flex space-x-2 items-center">
        {user.picture ? (
          <Image
            src={user.picture}
            alt={user.name ?? user.crsid}
            width={50}
            height={50}
            className="rounded-full"
          />
        ) : null}
        {user.name ? (
          <div className="flex items-center space-x-2">
            <h1 className="text-3xl">{user.name}</h1>
            <span className="text-3xl text-slate-500 dark:text-slate-400">
              ({user.crsid})
            </span>
          </div>
        ) : (
          <h1 className="text-3xl">{user.crsid}</h1>
        )}
        {user.admin && <Badge variant="secondary">Admin</Badge>}
        {user.lecturer && <Badge variant="secondary">Lecturer</Badge>}
      </div>
      <div className="flex flex-col space-y-1 text-sm text-slate-500 dark:text-slate-400">
        <p>
          This page is still under construction!
          <br />
          Planning to add:
        </p>
        <ul className="list-disc list-inside">
          <li>Recently answered questions</li>
          <li>Question stats</li>
          <li>Lectures lectured (if lecturer)</li>
          <li>Question streak tracker</li>
          <li>Day-by-day heatmap</li>
        </ul>
      </div>
      
    </div>
  );
};
