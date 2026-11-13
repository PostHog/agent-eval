import type { Metadata } from "next";
import { PreferencesForm } from "@/components/preferences-form";

export const metadata: Metadata = {
  title: "Account",
  description: "Set your Northstar Supply trip preferences.",
};

export default function AccountPage() {
  return (
    <div className="page-shell">
      <div className="page-heading">
        <h1>Make the next kit more useful.</h1>
        <p>
          Save the kind of trip you take most often. This sample stores your
          choices only in this browser.
        </p>
      </div>
      <PreferencesForm />
    </div>
  );
}
