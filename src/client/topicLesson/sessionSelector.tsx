import type { MenuProps } from "antd";
import { Dropdown } from "antd";
import { observer } from "mobx-react-lite";
import { useMemo } from "react";
import { useCss } from "~/client/hooks/useCss";
import { selectedSessionStore } from "./stores/selectedSessionStore";
import { selectedTopicStore } from "./stores/selectedTopicStore";
import { getSessionLabel } from "./utils";
import { LoadStatus } from "~/common/utils/loading";

export const SessionSelector = observer(function SessionSelector() {
  const { topicSessionsEarliestFirst } = selectedTopicStore;
  const selectedSessionId = selectedSessionStore.sessionId;

  const menuItems = useMemo((): MenuProps["items"] => {
    if (topicSessionsEarliestFirst instanceof LoadStatus) {
      return [];
    }
    return topicSessionsEarliestFirst
      .map((session, idx) => ({
        key: session.id,
        label: getSessionLabel(session, idx),
        onClick: () => selectedTopicStore.selectTopic(session.id),
      }))
      .reverse();
  }, [topicSessionsEarliestFirst]);

  const selectedLabel = useMemo(() => {
    if (topicSessionsEarliestFirst instanceof LoadStatus) return "";
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
