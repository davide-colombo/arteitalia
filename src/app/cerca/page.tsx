import { Suspense } from "react";

import { SearchResults } from "@/components/SearchResults";

export default function SearchPage() {
  return (
    <Suspense fallback={null}>
      <SearchResults />
    </Suspense>
  );
}
