import { type Question } from "~/server/db/schema";
import { Editor } from "../../components/Editor";
import { storeObserver } from "../../utils/storeObserver";

export const QuestionItem = storeObserver<{
  question: Question;
}>(function Question({ question, questionStore, activityEditorStore }) {
  const evalKey = questionStore.getEvalKey(question.id);
  return (
    <div key={question.id} className="flex w-full flex-col">
      <div className="mb-1">
        <Editor
          placeholder="Insert question here..."
          value={question.content}
          setValue={(v) => {
            activityEditorStore.updateDraft("questions", {
              id: question.id,
              content: v,
            });
          }}
          className={question.content ? "" : "placeholder-red-500"}
        />
      </div>
      {evalKey ? (
        <div className="ml-7">
          <div className="text-sm font-bold">Answer</div>
          <Editor
            placeholder="Insert answer here..."
            value={evalKey.key}
            setValue={(v) => {
              activityEditorStore.updateDraft("evalKeys", {
                id: evalKey.id,
                key: v,
              });
            }}
            className={
              question.content && !evalKey.key
                ? "placeholder-red-500"
                : ""
            }
          />
        </div>
      ) : null}
    </div>
});
