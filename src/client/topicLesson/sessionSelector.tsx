import type { MenuProps } from "antd";
import { Dropdown } from "antd";
import { useMemo } from "react";
import { useCss } from "~/client/hooks/useCss";
import { getSessionLabel } from "./utils";
import { Status } from "~/common/utils/status";
import { storeObserver } from "../utils/storeObserver";

export const SessionSelector = storeObserver(function SessionSelector({
  selectedSessionStore,
  selectedTopicStore,
}) {
  const { topicSessionsEarliestFirst } = selectedTopicStore;
  const selectedSessionId = selectedSessionStore.sessionId;

  const menuItems = useMemo((): MenuProps["items"] => {
    if (topicSessionsEarliestFirst instanceof Status) {
      return [];
    }
    return topicSessionsEarliestFirst
      .map((session, idx) => ({
        key: session.id,
        label: getSessionLabel(session, idx),
        onClick: () => {
          selectedSessionStore.selectSession(session.id);
        },
      }))
      .reverse();
  }, [selectedSessionStore, topicSessionsEarliestFirst]);

  const selectedLabel = useMemo(() => {
    if (topicSessionsEarliestFirst instanceof Status) return "";
    const selectedSession = topicSessionsEarliestFirst.find(
      (s) => s.id === selectedSessionId,
    );
    if (!selectedSession) return "";
    return getSessionLabel(
      selectedSession,
      topicSessionsEarliestFirst.map((s) => s.id).indexOf(selectedSession.id),
    );
  }, [selectedSessionId, topicSessionsEarliestFirst]);

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
});
