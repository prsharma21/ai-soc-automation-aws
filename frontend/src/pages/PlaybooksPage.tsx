import { useState } from "react";
import { BookOpen, Search } from "lucide-react";
import type { PlaybookQuery } from "@/types";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { PageHeader } from "@/components/layout/PageHeader";
import { AsyncView } from "@/components/common/AsyncView";
import { DataModeBadge } from "@/components/common/DataModeBadge";
import { DetailDrawer, DrawerSection } from "@/components/common/DetailDrawer";
import { DisabledReason } from "@/components/common/DisabledReason";
import { EmptyState } from "@/components/common/EmptyState";
import { LoadingState } from "@/components/common/LoadingState";
import { MockDataNotice } from "@/components/common/MockDataNotice";
import { SearchAndFilters } from "@/components/common/SearchAndFilters";
import { SectionCard } from "@/components/common/SectionCard";
import { StatusBadge } from "@/components/common/StatusBadge";
import { Timestamp } from "@/components/common/Timestamp";
import { RetrievedDocumentList } from "@/components/evidence/RetrievedDocumentList";
import { PlaybookDetail } from "@/components/playbooks/PlaybookDetail";
import { useAsync } from "@/hooks/useAsync";
import { useQueryState } from "@/hooks/useQueryState";
import { optionsFrom, playbookCategoryLabels } from "@/lib/labels";
import { playbookService } from "@/services";

const DEFAULTS = { search: "", category: "all" };
const categoryOptions = optionsFrom(playbookCategoryLabels, "All categories");

function PlaybookDrawer({ playbookId, onClose }: { playbookId: string | null; onClose: () => void }) {
  const playbook = useAsync(() => (playbookId ? playbookService.get(playbookId) : Promise.resolve(null)), [playbookId]);
  const retrievals = useAsync(
    () => (playbookId ? playbookService.listRetrievals(playbookId) : Promise.resolve([])),
    [playbookId],
  );
  const data = playbook.data;

  return (
    <DetailDrawer
      open={playbookId !== null}
      onOpenChange={(open) => !open && onClose()}
      title={data?.title ?? playbookId ?? "Playbook"}
      description={data ? `${data.id} · ${playbookCategoryLabels[data.category]}` : undefined}
      badges={data && <StatusBadge kind="playbook" value={data.status} />}
    >
      <AsyncView state={playbook} errorTitle="Could not load playbook" loading={<LoadingState rows={5} />}>
        {(detail) => detail && <PlaybookDetail playbook={detail} />}
      </AsyncView>
      <DrawerSection title="Retrieved in investigations">
        <AsyncView state={retrievals} errorTitle="Could not load retrievals" loading={<LoadingState rows={2} />}>
          {(docs) => <RetrievedDocumentList documents={docs} emptyLabel="No investigation has retrieved this playbook." showInvestigation />}
        </AsyncView>
      </DrawerSection>
    </DetailDrawer>
  );
}

export default function PlaybooksPage() {
  const { values, setValues, reset, isFiltered } = useQueryState(DEFAULTS);
  const [selected, setSelected] = useState<string | null>(null);
  const query: PlaybookQuery = { search: values.search, category: values.category as PlaybookQuery["category"] };
  const playbooks = useAsync(() => playbookService.list(query), [query.search, query.category]);
  const retrievals = useAsync(() => playbookService.listRetrievals(), []);

  return (
    <>
      <PageHeader
        title="Playbooks & Knowledge"
        description="SOC playbooks used as the knowledge base for retrieval-augmented investigation."
        meta={<DataModeBadge />}
        breadcrumbs={[{ label: "Intelligence & Response" }, { label: "Playbooks & Knowledge" }]}
      />
      <MockDataNotice className="mb-4">
        Sample playbooks written for this demo. In mock mode there is no vector index; retrievals below are stored with the sample investigations.
      </MockDataNotice>

      <Card className="mb-4">
        <SearchAndFilters
          searchValue={values.search}
          onSearchChange={(search) => setValues({ search })}
          searchLabel="Search playbooks"
          searchPlaceholder="Title, ID, or description"
          isFiltered={isFiltered}
          onClear={reset}
          filters={[{ id: "category", label: "Category", value: values.category, options: categoryOptions, onChange: (category) => setValues({ category }) }]}
        />
        <div className="p-3">
          <AsyncView state={playbooks} errorTitle="Could not load playbooks" loading={<LoadingState rows={4} />}>
            {(rows) =>
              rows.length === 0 ? (
                <EmptyState icon={BookOpen} title="No playbooks match these filters" bordered={false} />
              ) : (
                <ul className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                  {rows.map((playbook) => (
                    <li key={playbook.id}>
                      <button
                        type="button"
                        onClick={() => setSelected(playbook.id)}
                        className="flex h-full w-full flex-col gap-2 rounded-lg border bg-card p-3.5 text-left transition-colors hover:border-primary/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                      >
                        <span className="flex items-center justify-between gap-2">
                          <span className="font-mono text-2xs text-muted-foreground">{playbook.id}</span>
                          <StatusBadge kind="playbook" value={playbook.status} />
                        </span>
                        <span className="text-sm font-semibold">{playbook.title}</span>
                        <span className="line-clamp-2 text-xs text-muted-foreground">{playbook.description}</span>
                        <span className="mt-auto flex items-center justify-between text-2xs text-muted-foreground">
                          <span>{playbookCategoryLabels[playbook.category]}</span>
                          <span>
                            Updated <Timestamp value={playbook.updatedAt} pattern="MMM dd, yyyy" />
                          </span>
                        </span>
                      </button>
                    </li>
                  ))}
                </ul>
              )
            }
          </AsyncView>
        </div>
      </Card>

      <SectionCard
        title="RAG retrieval"
        description="Passages retrieved by the Threat Intelligence / RAG agent during investigations. Scores are shown only when the retriever returns them."
      >
        <div className="mb-4 flex flex-col gap-2 sm:flex-row">
          <label htmlFor="rag-query" className="sr-only">
            Retrieval test query
          </label>
          <Input id="rag-query" placeholder="Test a retrieval query against the knowledge base" disabled className="sm:max-w-md" />
          <DisabledReason reason="Requires the backend retrieval API (Amazon Bedrock Knowledge Base). Not available in this frontend-only build.">
            <Button variant="outline" disabled>
              <Search /> Run query
            </Button>
          </DisabledReason>
        </div>
        <AsyncView state={retrievals} errorTitle="Could not load retrievals" loading={<LoadingState rows={3} />}>
          {(docs) => <RetrievedDocumentList documents={docs} showInvestigation />}
        </AsyncView>
      </SectionCard>

      <PlaybookDrawer playbookId={selected} onClose={() => setSelected(null)} />
    </>
  );
}
