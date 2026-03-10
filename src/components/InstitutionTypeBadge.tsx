import type { InstitutionType } from "@/types/schema";

import { formatInstitutionType } from "@/lib/format";

type InstitutionTypeBadgeProps = {
  type: InstitutionType;
};

export function InstitutionTypeBadge({ type }: InstitutionTypeBadgeProps) {
  return (
    <span className="inline-flex rounded-md bg-accent/10 px-2.5 py-1 text-xs font-medium text-accent">
      {formatInstitutionType(type)}
    </span>
  );
}
