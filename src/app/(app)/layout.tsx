import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import NavShell from "@/components/NavShell";
import ServiceWorkerRegister from "@/components/ServiceWorkerRegister";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getCurrentUser();
  if (!user) {
    redirect("/login");
  }
  return (
    <>
      <ServiceWorkerRegister />
      <NavShell user={{ name: user.name, role: user.role }}>
        {children}
      </NavShell>
    </>
  );
}
