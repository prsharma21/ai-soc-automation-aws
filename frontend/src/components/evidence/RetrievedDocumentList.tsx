import { BookOpenText } from "lucide-react";
import { Link } from "react-router-dom";
import type { RetrievedDocument } from "@/types";
import { EmptyState } from "@/components/common/EmptyState";

interface RetrievedDocumentListProps {
  documents: RetrievedDocument[];
  emptyLabel?: string;
  showInvestigation?: boolean;
}

function SourceBadge({ source }: { source: RetrievedDocument["retrievalSource"] }) {
  return source === "mock" ? (
    <span className="rounded bg-amber-50 px-1.5 py-0.5 text-2xs font-semibold text-amber-800 ring-1 ring-inset ring-amber-200">
      Mock retrieval
    </span>
  ) : (
    <span className="rounded bg-emerald-50 px-1.5 py-0.5 text-2xs font-semibold text-emerald-700 ring-1 ring-inset ring-emerald-200">
      Bedrock Knowledge Base
    </span>
  );
}

/** Shows retrieved passages exactly as returned; a missing score is shown as "not provided", never estimated. */
export function RetrievedDocumentList({ documents, emptyLabel = "No passages retrieved.", showInvestigation = false }: RetrievedDocumentListProps) {
  if (!documents.length) return <EmptyState icon={BookOpenText} title={emptyLabel} bordered={false} className="py-6" />;

  return (
    <ul className="space-y-2" aria-label="Retrieved passages">
      {documents.map((doc) => (
        <li key={doc.id} className="space-y-1.5 rounded-md border px-3 py-2.5">
          <div className="flex flex-wrap items-center gap-2">
            <p className="text-sm font-medium">{doc.documentTitle}</p>
            <SourceBadge source={doc.retrievalSource} />
          </div>
          <blockquote className="border-l-2 border-primary/30 pl-3 text-xs italic text-foreground/80">{doc.passage}</blockquote>
          <dl className="grid grid-cols-1 gap-x-4 gap-y-0.5 text-2xs text-muted-foreground sm:grid-cols-2">
            <div>
              <dt className="inline font-semibold">Playbook: </dt>
              <dd className="inline font-mono">{doc.playbookId}</dd>
            </div>
            <div>
              <dt className="inline font-semibold">Chunk: </dt>
              <dd className="inline font-mono">{doc.chunkId}</dd>
            </div>
            <div>
              <dt className="inline font-semibold">Score: </dt>
              <dd className="inline">{doc.score === null ? "Not provided by retriever" : doc.score.toFixed(3)}</dd>
            </div>
            {showInvestigation && doc.investigationId && (
              <div>
                <dt className="inline font-semibold">Investigation: </dt>
                <dd className="inline">
                  <Link to={`/investigations/${doc.investigationId}`} className="text-primary hover:underline">
                    {doc.investigationId}
                  </Link>
                </dd>
              </div>
            )}
            <div className="sm:col-span-2">
              <dt className="inline font-semibold">Query: </dt>
              <dd className="inline">“{doc.query}”</dd>
            </div>
          </dl>
        </li>
      ))}
    </ul>
  );
}
