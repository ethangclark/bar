import { type TopicContext } from "~/server/db/schema";

export function Topic({ topicContext }: { topicContext: TopicContext }) {
  const { course, courseType, unit, module, topic, understandingCriteria } =
    topicContext;
  console.log({ understandingCriteria });
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
      </div>
    </div>
  );
}
