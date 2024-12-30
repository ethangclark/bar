import { Dropdown } from "antd";
import type { MenuProps } from "antd";
import { useMemo } from "react";
import { type TutoringSession } from "~/server/db/schema";
import { getSessionLabel, sortSessionsEarliestFirst } from "./utils";
import { useCss } from "~/client/hooks/useCss";

interface SessionSelectorProps {
  sessions: TutoringSession[];
  selectedSessionId: string | null;
  onSelect: (sessionId: string) => void;
}

export function SessionSelector({
  sessions,
  selectedSessionId,
  onSelect,
}: SessionSelectorProps) {
  const sessionsEarliestFirst = useMemo(
    () => sortSessionsEarliestFirst(sessions),
    [sessions],
  );

  const menuItems = useMemo((): MenuProps["items"] => {
    return sessionsEarliestFirst
      .map((session, idx) => ({
        key: session.id,
        label: getSessionLabel(session, idx),
        onClick: () => onSelect(session.id),
      }))
      .reverse();
  }, [onSelect, sessionsEarliestFirst]);

  const selectedLabel = useMemo(() => {
    const selectedSession = sessionsEarliestFirst.find(
      (s) => s.id === selectedSessionId,
    );
    if (!selectedSession) return "";
    return getSessionLabel(
      selectedSession,
      sessionsEarliestFirst.map((s) => s.id).indexOf(selectedSession.id),
    );
  }, [selectedSessionId, sessionsEarliestFirst]);

  const { id: dropdownWrapperId } = useCss(
    (id) =>
      `#${id} .ant-dropdown-menu { max-height: 200px; overflow-y: auto; }`,
  );

  return (
    <div className="mb-4 text-sm" id={dropdownWrapperId}>
      <Dropdown.Button menu={{ items: menuItems }}>
        <span>{selectedLabel}</span>
      </Dropdown.Button>
    </div>
  );
}
