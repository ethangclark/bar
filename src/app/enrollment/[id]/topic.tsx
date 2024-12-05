import { Spin } from "antd";
import { useState } from "react";
import { type TutoringSession, type TopicContext } from "~/server/db/schema";
import { api } from "~/trpc/react";

export function Topic({
  topicContext,
  tutoringSessions,
}: {
  topicContext: TopicContext;
  tutoringSessions: TutoringSession[];
}) {
  const { course, courseType, unit, module, topic } = topicContext;

  const [tutoringSessionId, setTutoringSessionId] = useState<string | null>(
    () => {
      const sorted = tutoringSessions.sort(
        (a, b) => a.createdAt.getTime() - b.createdAt.getTime(),
      );
      return sorted[0]?.id ?? null;
    },
  );

  const messages = api.tutoringSession.chatMessages.useQuery({
    tutoringSessionId,
  });

  if (!messages.data) {
    return <Spin />;
  }

  return (
    <div
      className="mb-2 flex h-full w-full flex-col px-8"
      style={{ width: 672 }}
    >
      <div>
        {courseType.name} &gt; {unit.name} &gt; {module.name}
      </div>
      <div className="mb-4 text-2xl">{topic.name}</div>
      <div className="outline-3 h-full w-full rounded-3xl p-8 outline outline-gray-200">
        <h1>{courseType.name}</h1>
        <h2>{course.id}</h2>
        <h3>{unit.name}</h3>
        <h4>{module.name}</h4>
        <h5>{topic.name}</h5>
        <h6>Messages:</h6>
        {messages.data.map((m) => (
          <div key={m.id}>{m.content}</div>
        ))}
      </div>
    </div>
  );
}
