import { ActivitiesController } from "./activitiesController";
import { ActivityItemsController } from "./activityItemsController";
import { EvalKeysController } from "./evalKeysController";
import { InfoImagesController } from "./infoImagesController";
import { InfoTextsController } from "./InfoTextsController";
import { MessagesController } from "./messagesController";
import { QuestionsController } from "./questionsController";
import { ThreadsController } from "./threadsController";
import { TableController } from "../tableController";
import { TableName } from "../tableSetSchema";

export const controllers = {
  activities: new ActivitiesController(),
  activityItems: new ActivityItemsController(),
  evalKeys: new EvalKeysController(),
  infoImages: new InfoImagesController(),
  infoTexts: new InfoTextsController(),
  messages: new MessagesController(),
  questions: new QuestionsController(),
  threads: new ThreadsController(),
} satisfies { [K in TableName]: TableController<K> };
