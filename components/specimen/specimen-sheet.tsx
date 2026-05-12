import { LETTERS } from "@/lib/letters";
import { SpecimenCard } from "./specimen-card";

/** Periodic-table-like layout of all 24 static ASL letters. */
export function SpecimenSheet() {
  return (
    <section className="ruled-y -mx-px">
      <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 [&>*]:border-r [&>*]:border-l [&>*]:border-rule [&>*]:-ml-px">
        {LETTERS.map((meta) => (
          <SpecimenCard key={meta.code} meta={meta} />
        ))}
      </div>
    </section>
  );
}
