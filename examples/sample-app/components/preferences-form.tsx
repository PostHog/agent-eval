"use client";

import { type FormEvent, useEffect, useState } from "react";
import { type Preferences, preferencesSchema } from "@/lib/schemas";
import { readStoredValue } from "@/lib/storage";
import styles from "./preferences-form.module.css";

const initial: Preferences = {
  tripLength: "weekend",
  interests: ["camp", "trail"],
  fieldNotes: true,
};

export function PreferencesForm() {
  const [preferences, setPreferences] = useState(initial);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    setPreferences(
      readStoredValue("northstar-preferences", preferencesSchema, initial),
    );
  }, []);

  function toggleInterest(interest: Preferences["interests"][number]) {
    setSaved(false);
    setPreferences((current) => ({
      ...current,
      interests: current.interests.includes(interest)
        ? current.interests.filter((entry) => entry !== interest)
        : [...current.interests, interest],
    }));
  }

  function save(event: FormEvent) {
    event.preventDefault();
    localStorage.setItem("northstar-preferences", JSON.stringify(preferences));
    setSaved(true);
  }

  return (
    <form className={styles.form} onSubmit={save}>
      <section>
        <div>
          <h2>Usual trip length</h2>
          <p>We will put shorter, lighter kits first when you browse.</p>
        </div>
        <label>
          <span className="sr-only">Usual trip length</span>
          <select
            value={preferences.tripLength}
            onChange={(event) => {
              setSaved(false);
              setPreferences((current) => ({
                ...current,
                tripLength: event.target.value as Preferences["tripLength"],
              }));
            }}
          >
            <option value="day">Day trip</option>
            <option value="weekend">Weekend</option>
            <option value="week">Five days or more</option>
          </select>
        </label>
      </section>

      <section>
        <div>
          <h2>What you pack for</h2>
          <p>Choose any areas you want to see more often.</p>
        </div>
        <fieldset className={styles.checkboxes}>
          <legend className="sr-only">Interests</legend>
          {(["camp", "trail", "kitchen", "navigation"] as const).map(
            (interest) => (
              <label key={interest}>
                <input
                  type="checkbox"
                  checked={preferences.interests.includes(interest)}
                  onChange={() => toggleInterest(interest)}
                />
                <span>{interest}</span>
              </label>
            ),
          )}
        </fieldset>
      </section>

      <section>
        <div>
          <h2>Field notes</h2>
          <p>Receive one practical route, repair, or camp recipe each month.</p>
        </div>
        <label className={styles.switch}>
          <input
            type="checkbox"
            checked={preferences.fieldNotes}
            onChange={(event) => {
              setSaved(false);
              setPreferences((current) => ({
                ...current,
                fieldNotes: event.target.checked,
              }));
            }}
          />
          <span>
            {preferences.fieldNotes ? "Subscribed" : "Not subscribed"}
          </span>
        </label>
      </section>

      <div className={styles.actions}>
        <button className="primary-button" type="submit">
          Save preferences
        </button>
        <p aria-live="polite">
          {saved ? "Preferences saved in this browser." : ""}
        </p>
      </div>
    </form>
  );
}
