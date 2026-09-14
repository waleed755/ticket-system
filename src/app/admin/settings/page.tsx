import { prisma } from "@/lib/prisma";
import { Card, SectionHeading } from "@/components/ui";
import { PageEditor, SettingEditor, PaymentSettingsEditor } from "./page-editor";

export const dynamic = "force-dynamic";

const PAYMENT_SETTING_KEYS = ["payment_account_details", "payment_qr_image_url"];

export default async function AdminSettingsPage() {
  const [pages, settings] = await Promise.all([prisma.page.findMany(), prisma.siteSetting.findMany()]);
  const get = (key: string) => settings.find((s) => s.key === key)?.value ?? "";

  return (
    <div className="space-y-8">
      <SectionHeading title="Site settings" description="Manage public website content and system settings." />

      <PaymentSettingsEditor accountDetails={get("payment_account_details")} qrImageUrl={get("payment_qr_image_url")} />

      <Card className="p-6 space-y-4">
        <h2 className="font-semibold text-gray-900">System settings</h2>
        {settings.filter((s) => !PAYMENT_SETTING_KEYS.includes(s.key)).map((s) => <SettingEditor key={s.key} settingKey={s.key} value={s.value} />)}
      </Card>

      <div>
        <h2 className="font-semibold text-gray-900 mb-3">Website pages</h2>
        <div className="grid lg:grid-cols-2 gap-4">
          {pages.map((p) => <PageEditor key={p.slug} slug={p.slug} title={p.title} content={p.content} />)}
        </div>
      </div>
    </div>
  );
}
