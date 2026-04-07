import MemberLayout from "@/components/layout/MemberLayout";

export default function MemberRouteLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <MemberLayout>{children}</MemberLayout>;
}
