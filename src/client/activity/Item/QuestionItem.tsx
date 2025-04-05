import { type Question } from "~/server/db/schema";
import { Editor } from "../../components/editor/Editor";
import { storeObserver } from "../../utils/storeObserver";
import { isEvalKeyDraftReady, isQuestionDraftReady } from "./itemValidator";

export const QuestionItem = storeObserver<{
  question: Question;
}>(function Question({ question, questionStore, draftStore }) {
  const evalKey = questionStore.getEvalKey(question.id);
  const questionOk = isQuestionDraftReady(question);
  const evalKeyOk = isEvalKeyDraftReady(evalKey);

  return (
    <div key={question.id} className="flex w-full flex-col">
      <div className="mb-1">
        <Editor
          placeholder="Insert question here..."
          value={question.content}
          onChange={(v) => {
            draftStore.updateDraft("questions", {
              id: question.id,
              content: v,
            });
          }}
          isOk={questionOk}
        />
      </div>
      {evalKey ? (
        <div className="ml-7">
          <div className="text-sm font-bold">Answer</div>
          <Editor
            placeholder="Insert answer here..."
            value={evalKey.content}
            onChange={(v) => {
              draftStore.updateDraft("evalKeys", {
                id: evalKey.id,
                content: v,
              });
            }}
            isOk={questionOk ? evalKeyOk : true}
          />
        </div>
      ) : null}
    </div>
  );
});
