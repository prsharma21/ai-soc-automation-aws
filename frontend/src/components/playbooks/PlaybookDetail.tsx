import type { Playbook } from "@/types";
import { DrawerSection } from "@/components/common/DetailDrawer";

function Steps({ items, ordered = false }: { items: string[]; ordered?: boolean }) {
  const ListTag = ordered ? "ol" : "ul";
  return (
    <ListTag className={ordered ? "list-decimal space-y-1 pl-5 text-sm" : "list-disc space-y-1 pl-5 text-sm"}>
      {items.map((item) => (
        <li key={item}>{item}</li>
      ))}
    </ListTag>
  );
}

export function PlaybookDetail({ playbook }: { playbook: Playbook }) {
  return (
    <>
      <DrawerSection title="Purpose">
        <p className="text-sm">{playbook.purpose}</p>
      </DrawerSection>
      <DrawerSection title="Trigger conditions">
        <Steps items={playbook.triggerConditions} />
      </DrawerSection>
      <DrawerSection title="Investigation steps">
        <Steps items={playbook.investigationSteps} ordered />
      </DrawerSection>
      <DrawerSection title="Evidence to collect">
        <Steps items={playbook.evidenceToCollect} />
      </DrawerSection>
      <DrawerSection title="Recommended actions">
        <Steps items={playbook.recommendedActions} />
      </DrawerSection>
      <DrawerSection title="Escalation criteria">
        <Steps items={playbook.escalationCriteria} />
      </DrawerSection>
      <DrawerSection title="Approval requirements">
        <Steps items={playbook.approvalRequirements} />
      </DrawerSection>
    </>
  );
}
