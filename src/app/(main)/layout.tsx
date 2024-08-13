import { BackButton } from "@/components/BackButton";
import { Header } from "@/components/Header";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="w-full h-full flex flex-col items-center">
      <div className="w-full fixed">
        <Header showBreadcrumb={false} />
      </div>
      <div className="pt-24 max-w-screen-sm w-full flex flex-col">
        {children}
      </div>
    </div>
  );
}
