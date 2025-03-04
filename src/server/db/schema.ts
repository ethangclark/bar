import { relations, type InferSelectModel } from "drizzle-orm";
import {
  boolean,
  index,
  integer,
  pgEnum,
  pgTableCreator,
  primaryKey,
  serial,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core";
import { createSelectSchema } from "drizzle-zod";
import { z } from "zod";
import { integrationTypes } from "~/common/types";

export const pgTable = pgTableCreator((name) => name);

export const posts = pgTable(
  "post",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    name: text("name"),
    createdById: uuid("created_by_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }),
  },
  (example) => [
    index("post_created_by_id_idx").on(example.createdById),
    index("post_name_idx").on(example.name),
  ],
);
export type Post = InferSelectModel<typeof posts>;
export const postsRelations = relations(posts, ({ one }) => ({
  createdBy: one(users, {
    fields: [posts.createdById],
    references: [users.id],
  }),
}));
export const postSchema = createSelectSchema(posts);

export const users = pgTable(
  "user",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    name: text("name"),
    email: text("email"),
    unverifiedEmail: text("unverified_email"),
    passwordSalt: uuid("password_salt").notNull().defaultRandom(),
    passwordHash: text("password_hash"),
    loginTokenHash: text("login_token_hash"),
    loginTokenCreatedAt: timestamp("login_token_created_at", {
      withTimezone: true,
    }).notNull(),
    llmTokensUsed: integer("tokens_used").default(0).notNull(),
  },
  (u) => [
    index("user_email_idx").on(u.email),
    index("user_unverified_email_idx").on(u.unverifiedEmail),
    index("user_login_token_hash_idx").on(u.loginTokenHash),
  ],
);
export type User = InferSelectModel<typeof users>;
export const usersRelations = relations(users, ({ many }) => ({
  sessions: many(sessions),
  userIntegrations: many(userIntegrations),
  adHocActivities: many(adHocActivities),
}));
export const userSchema = createSelectSchema(users);

export const errors = pgTable(
  "error",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    ipAddress: text("ip_address").notNull(),
    userId: uuid("user_id").references(() => users.id, { onDelete: "cascade" }),
    message: text("message").notNull(),
    detailsSuperJsonString: text("details_super_json_string").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (e) => [
    index("error_ip_address_idx").on(e.ipAddress),
    index("error_user_id_idx").on(e.userId),
    index("error_created_at_idx").on(e.createdAt),
  ],
);
export type Error = InferSelectModel<typeof errors>;
export const errorsRelations = relations(errors, ({ one }) => ({
  user: one(users, { fields: [errors.userId], references: [users.id] }),
}));
export const errorSchema = createSelectSchema(errors);

export const sessions = pgTable(
  "session",
  {
    sessionCookieValue: uuid("session_cookie_value").notNull().primaryKey(),
    userId: uuid("user_id").references(() => users.id, { onDelete: "cascade" }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    lastIpAddress: text("last_ip_address").notNull(),
  },
  (session) => [index("session_user_id_idx").on(session.userId)],
);
export type Session = InferSelectModel<typeof sessions>;
export const sessionsRelations = relations(sessions, ({ one }) => ({
  user: one(users, { fields: [sessions.userId], references: [users.id] }),
}));
export const sessionSchema = createSelectSchema(sessions);

export const verificationTokens = pgTable(
  "verification_token",
  {
    identifier: text("identifier").notNull(),
    token: text("token").notNull(),
    expires: timestamp("expires", {
      mode: "date",
      withTimezone: true,
    }).notNull(),
  },
  (vt) => [primaryKey({ columns: [vt.identifier, vt.token] })],
);
export type VerificationToken = InferSelectModel<typeof verificationTokens>;
export const verificationTokensRelations = relations(
  verificationTokens,
  ({}) => ({}),
);
export const verificationTokenSchema = createSelectSchema(verificationTokens);

export const locks = pgTable("lock", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").notNull().unique(),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  maxDurationMs: integer("max_duration_ms").notNull(),
});
export type Lock = InferSelectModel<typeof locks>;
export const locksRelations = relations(locks, () => ({}));
export const lockSchema = createSelectSchema(locks);

export const integrationTypeEnum = pgEnum("integration_type", integrationTypes);
export const integrationTypeSchema = z.enum(integrationTypeEnum.enumValues);
export type IntegrationType = z.infer<typeof integrationTypeSchema>;

export const integrations = pgTable("integration", {
  id: uuid("id").primaryKey().defaultRandom(),
  type: integrationTypeEnum("type").notNull(),
});
export type Integration = InferSelectModel<typeof integrations>;
export const integrationsRelations = relations(
  integrations,
  ({ one, many }) => ({
    userIntegraitons: many(userIntegrations),
    canvasIntegration: one(canvasIntegrations),
    integrationActivities: many(integrationActivities),
  }),
);

export const userIntegrations = pgTable(
  "user_integrations",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    integrationId: uuid("integration_id")
      .notNull()
      .references(() => integrations.id, { onDelete: "cascade" }),
  },
  (ui) => [
    // ensure userId/integrationId pair is unique
    uniqueIndex("user_integrations_unique_pair_idx").on(
      ui.userId,
      ui.integrationId,
    ),
  ],
);
export type UserIntegration = InferSelectModel<typeof userIntegrations>;
export const userIntegrationsRelations = relations(
  userIntegrations,
  ({ one }) => ({
    user: one(users, {
      fields: [userIntegrations.userId],
      references: [users.id],
    }),
    integration: one(integrations, {
      fields: [userIntegrations.integrationId],
      references: [integrations.id],
    }),
  }),
);

export const canvasIntegrations = pgTable("canvas_integration", {
  id: uuid("id").primaryKey().defaultRandom(),
  integrationId: uuid("integration_id")
    .notNull()
    .unique()
    .references(() => integrations.id, { onDelete: "cascade" }),
  canvasBaseUrl: text("canvas_base_url").notNull().unique(),
  clientId: text("client_id").notNull(),
  clientSecret: text("client_secret").notNull(),
  validated: boolean("validated").default(false).notNull(),
});
export type CanvasIntegration = InferSelectModel<typeof canvasIntegrations>;
export const canvasIntegrationsRelations = relations(
  canvasIntegrations,
  ({ one, many }) => ({
    integration: one(integrations, {
      fields: [canvasIntegrations.integrationId],
      references: [integrations.id],
    }),
    canvasUsers: many(canvasUsers),
  }),
);
export const canvasIntegrationSchema = createSelectSchema(canvasIntegrations);

export const canvasUsers = pgTable(
  "canvas_user",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    canvasGlobalId: text("canvas_global_id").notNull().unique(),
    nonGlobalIdsArrJson: text("non_global_ids_arr_json").notNull(),
    canvasUserName: text("canvas_user_name").notNull(),
    oauthRefreshToken: text("oauth_refresh_token").notNull(),
    accessTokenLifespanMs: integer("access_token_lifespan_ms"),
    canvasIntegrationId: uuid("canvas_integration_id")
      .notNull()
      .references(() => canvasIntegrations.id, { onDelete: "cascade" }),
  },
  (cu) => [
    index("canvas_user_user_id_idx").on(cu.userId),
    index("canvas_user_canvas_integration_id_idx").on(cu.canvasIntegrationId),
  ],
);
export type CanvasUser = InferSelectModel<typeof canvasUsers>;
export const canvasUsersRelations = relations(canvasUsers, ({ one }) => ({
  user: one(users, { fields: [canvasUsers.userId], references: [users.id] }),
  canvasIntegration: one(integrations, {
    fields: [canvasUsers.canvasIntegrationId],
    references: [integrations.id],
  }),
}));
export const canvasUserSchema = createSelectSchema(canvasUsers);

export const activityStatusEnum = pgEnum("activity_status", [
  "draft",
  "published",
]);
export const activityStatusSchema = z.enum(activityStatusEnum.enumValues);
export type ActivityStatus = z.infer<typeof activityStatusSchema>;

export const activities = pgTable("activity", {
  id: uuid("id").primaryKey().defaultRandom(),
  status: activityStatusEnum("status").notNull().default("draft"),
});
export type Activity = InferSelectModel<typeof activities>;
export const activitiesRelations = relations(activities, ({ one, many }) => ({
  items: many(items),
  evalKeys: many(evalKeys),
  questions: many(questions),
  infoTexts: many(infoTexts),
  infoImages: many(infoImages),
  infoVideos: many(infoVideos),
  threads: many(threads),
  messages: many(messages),
  itemCompletions: many(itemCompletions),
  // should be exactly one of these
  adHocActivity: one(adHocActivities),
  integrationActivity: one(integrationActivities),
}));
export const activitySchema = createSelectSchema(activities);

export const integrationActivities = pgTable(
  "integration_activities",
  {
    integrationId: uuid("integration_id")
      .notNull()
      .references(() => integrations.id, {
        onDelete: "cascade",
      }),
    activityId: uuid("activity_id")
      .notNull()
      .references(() => activities.id, {
        onDelete: "cascade",
      })
      .unique(),
    exCourseIdJson: text("ex_course_id_json").notNull(),
    exAssignmentIdJson: text("ex_assignment_id_json").notNull(),
  },
  (ia) => [
    primaryKey({ columns: [ia.integrationId, ia.activityId] }),
    index("integration_activities_ex_course_id_json_idx").on(ia.exCourseIdJson),
    index("integration_activities_ex_assignment_id_json_idx").on(
      ia.exAssignmentIdJson,
    ),
  ],
);
export type IntegrationActivity = InferSelectModel<
  typeof integrationActivities
>;
export const integrationActivitiesRelations = relations(
  integrationActivities,
  ({ one }) => ({
    integration: one(integrations, {
      fields: [integrationActivities.integrationId],
      references: [integrations.id],
    }),
    activity: one(activities, {
      fields: [integrationActivities.activityId],
      references: [activities.id],
    }),
  }),
);
export const integrationActivitySchema = createSelectSchema(
  integrationActivities,
);

export const adHocActivities = pgTable(
  "ad_hoc_activities",
  {
    activityId: uuid("activity_id")
      .notNull()
      .references(() => activities.id, {
        onDelete: "cascade",
      })
      .unique(),
    creatorId: uuid("creator_id")
      .notNull()
      .references(() => users.id, {
        onDelete: "cascade",
      }),
    title: text("title").notNull(),
  },
  (ma) => [index("ad_hoc_activities_creator_id_idx").on(ma.creatorId)],
);
export type AdHocActivity = InferSelectModel<typeof adHocActivities>;
export const adHocActivitiesRelations = relations(
  adHocActivities,
  ({ one }) => ({
    activity: one(activities, {
      fields: [adHocActivities.activityId],
      references: [activities.id],
    }),
    creator: one(users, {
      fields: [adHocActivities.creatorId],
      references: [users.id],
    }),
  }),
);
export const adHocActivitySchema = createSelectSchema(adHocActivities);

export const items = pgTable(
  "item",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    activityId: uuid("activity_id")
      .notNull()
      .references(() => activities.id, { onDelete: "cascade" }),
    orderFracIdx: text("order_frac_idx").notNull(),
  },
  (ai) => [index("item_activity_id_idx").on(ai.activityId)],
);
export type Item = InferSelectModel<typeof items>;
export const itemRelations = relations(items, ({ one }) => ({
  activity: one(activities, {
    fields: [items.activityId],
    references: [activities.id],
  }),

  // should be exactly one of these
  question: one(questions),
  infoText: one(infoTexts),
  infoImage: one(infoImages),
  infoVideo: one(infoVideos),
}));
export const itemSchema = createSelectSchema(items);

export type ItemDescendents = {
  question:
    | (Question & {
        evalKey: null | EvalKey;
      })
    | null;
  infoText: InfoText | null;
  infoImage: InfoImage | null;
  infoVideo: InfoVideo | null;
};
export type ItemWithDescendents = Item & ItemDescendents;

export const evalKeys = pgTable(
  "eval_key",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    activityId: uuid("activity_id")
      .notNull()
      .references(() => activities.id, { onDelete: "cascade" }),
    questionId: uuid("question_id")
      .notNull()
      .references(() => questions.id, { onDelete: "cascade" }),
    content: text("content").notNull(),
  },
  (ek) => [
    index("eval_key_activity_id_idx").on(ek.activityId),
    index("eval_key_question_id_idx").on(ek.questionId),
  ],
);
export type EvalKey = InferSelectModel<typeof evalKeys>;
export const evalKeysRelations = relations(evalKeys, ({ one }) => ({
  activity: one(activities, {
    fields: [evalKeys.activityId],
    references: [activities.id],
  }),
  question: one(questions, {
    fields: [evalKeys.questionId],
    references: [questions.id],
  }),
}));
export const evalKeySchema = createSelectSchema(evalKeys);

export const questions = pgTable(
  "question",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    activityId: uuid("activity_id")
      .notNull()
      .references(() => activities.id, { onDelete: "cascade" }),
    itemId: uuid("item_id")
      .notNull()
      .references(() => items.id, { onDelete: "cascade" }),
    content: text("content").notNull(),
  },
  (q) => [
    index("question_activity_id_idx").on(q.activityId),
    index("question_item_id_idx").on(q.itemId),
  ],
);
export type Question = InferSelectModel<typeof questions>;
export const questionsRelations = relations(questions, ({ one }) => ({
  activity: one(activities, {
    fields: [questions.activityId],
    references: [activities.id],
  }),
  item: one(items, {
    fields: [questions.itemId],
    references: [items.id],
  }),
  evalKey: one(evalKeys),
}));
export const questionSchema = createSelectSchema(questions);

export const infoTexts = pgTable(
  "info_text",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    activityId: uuid("activity_id")
      .notNull()
      .references(() => activities.id, { onDelete: "cascade" }),
    itemId: uuid("item_id")
      .notNull()
      .references(() => items.id, { onDelete: "cascade" }),
    content: text("content").notNull(),
  },
  (it) => [
    index("info_text_activity_id_idx").on(it.activityId),
    index("info_text_item_id_idx").on(it.itemId),
  ],
);
export type InfoText = InferSelectModel<typeof infoTexts>;
export const infoTextsRelations = relations(infoTexts, ({ one }) => ({
  activity: one(activities, {
    fields: [infoTexts.activityId],
    references: [activities.id],
  }),
  item: one(items, {
    fields: [infoTexts.itemId],
    references: [items.id],
  }),
}));
export const infoTextSchema = createSelectSchema(infoTexts);

export const infoImages = pgTable(
  "info_image",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    numericId: serial("numeric_id"), // we add 1000 to this
    activityId: uuid("activity_id")
      .notNull()
      .references(() => activities.id, { onDelete: "cascade" }),
    itemId: uuid("item_id")
      .notNull()
      .references(() => items.id, { onDelete: "cascade" }),
    url: text("url").notNull(),
    textAlternative: text("text_alternative").notNull(),
  },
  (ii) => [
    index("info_image_numeric_id_idx").on(ii.numericId),
    index("info_image_activity_id_idx").on(ii.activityId),
    index("info_image_item_id_idx").on(ii.itemId),
  ],
);
export type InfoImage = InferSelectModel<typeof infoImages>;
export const infoImagesRelations = relations(infoImages, ({ one }) => ({
  activity: one(activities, {
    fields: [infoImages.activityId],
    references: [activities.id],
  }),
  item: one(items, {
    fields: [infoImages.itemId],
    references: [items.id],
  }),
}));
export const infoImageSchema = createSelectSchema(infoImages);

// not going to make this a descendent, as the data flow will be different
export const videos = pgTable(
  "video",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    cloudinaryPublicExId: text("cloudinary_public_ex_id").notNull(),
    cloudinarySecureUrl: text("cloudinary_secure_url").notNull(),
    cloudinaryAudioUrl: text("cloudinary_audio_url"), // null if no audio track
  },
  (v) => [index("video_cloudinary_public_id_idx").on(v.cloudinaryPublicExId)],
);
export type Video = InferSelectModel<typeof videos>;
export const videosRelations = relations(videos, () => ({}));
export const videoSchema = createSelectSchema(videos);

export const infoVideos = pgTable(
  "info_video",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    numericId: serial("numeric_id"), // we add 2000 to this
    activityId: uuid("activity_id")
      .notNull()
      .references(() => activities.id, { onDelete: "cascade" }),
    itemId: uuid("item_id")
      .notNull()
      .references(() => items.id, { onDelete: "cascade" }),
    videoId: uuid("video_id")
      .notNull()
      .references(() => videos.id, { onDelete: "cascade" }),
    textAlternative: text("text_alternative").notNull(),
  },
  (iv) => [
    index("info_video_activity_id_idx").on(iv.activityId),
    index("info_video_item_id_idx").on(iv.itemId),
    index("info_video_video_id_idx").on(iv.videoId),
  ],
);
export type InfoVideo = InferSelectModel<typeof infoVideos>;
export const infoVideosRelations = relations(infoVideos, ({ one }) => ({
  activity: one(activities, {
    fields: [infoVideos.activityId],
    references: [activities.id],
  }),
  item: one(items, {
    fields: [infoVideos.itemId],
    references: [items.id],
  }),
  video: one(videos, {
    fields: [infoVideos.videoId],
    references: [videos.id],
  }),
}));
export const infoVideoSchema = createSelectSchema(infoVideos);

export const threads = pgTable(
  "thread",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    activityId: uuid("activity_id")
      .notNull()
      .references(() => activities.id, { onDelete: "cascade" }),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (x) => [
    index("thread_activity_id_idx").on(x.activityId),
    index("thread_user_id_idx").on(x.userId),
  ],
);
export type Thread = InferSelectModel<typeof threads>;
export const threadsRelations = relations(threads, ({ one, many }) => ({
  user: one(users, {
    fields: [threads.userId],
    references: [users.id],
  }),
  activity: one(activities, {
    fields: [threads.activityId],
    references: [activities.id],
  }),
  messages: many(messages),
}));
export const threadSchema = createSelectSchema(threads);

export const itemCompletions = pgTable(
  "item_completion",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    activityId: uuid("activity_id")
      .notNull()
      .references(() => activities.id, { onDelete: "cascade" }),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    threadId: uuid("thread_id")
      .notNull()
      .references(() => threads.id, { onDelete: "cascade" }),
    itemId: uuid("item_id")
      .notNull()
      .references(() => items.id, { onDelete: "cascade" }),
  },
  (ic) => [
    index("item_completion_activity_id_idx").on(ic.activityId),
    index("item_completion_user_id_idx").on(ic.userId),
    index("item_completion_thread_id_idx").on(ic.threadId),
    index("item_completion_item_id_idx").on(ic.itemId),
  ],
);
export type ItemCompletion = InferSelectModel<typeof itemCompletions>;
export const itemCompletionsRelations = relations(
  itemCompletions,
  ({ one }) => ({
    activity: one(activities, {
      fields: [itemCompletions.activityId],
      references: [activities.id],
    }),
    user: one(users, {
      fields: [itemCompletions.userId],
      references: [users.id],
    }),
    thread: one(threads, {
      fields: [itemCompletions.threadId],
      references: [threads.id],
    }),
    item: one(items, {
      fields: [itemCompletions.itemId],
      references: [items.id],
    }),
  }),
);
export const itemCompletionSchema = createSelectSchema(itemCompletions);

export const senderRoleEnum = pgEnum("sender_role", [
  "user",
  "assistant",
  "system",
]);
export const senderRoleSchema = z.enum(senderRoleEnum.enumValues);
export type SenderRole = z.infer<typeof senderRoleSchema>;

// could add image support to messages at some point if that makes sense
export const messages = pgTable(
  "message",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    activityId: uuid("activity_id")
      .notNull()
      .references(() => activities.id, { onDelete: "cascade" }),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    threadId: uuid("thread_id")
      .notNull()
      .references(() => threads.id, { onDelete: "cascade" }),
    senderRole: senderRoleEnum("sender_role").notNull(),
    content: text("content").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    completed: boolean("completed").notNull(),
  },
  (x) => [
    index("message_user_id_idx").on(x.userId),
    index("message_thread_id_idx").on(x.threadId),
    index("message_activity_id_idx").on(x.activityId),
  ],
);
export type Message = InferSelectModel<typeof messages>;
export const messagesRelations = relations(messages, ({ one, many }) => ({
  user: one(users, {
    fields: [messages.userId],
    references: [users.id],
  }),
  thread: one(threads, {
    fields: [messages.threadId],
    references: [threads.id],
  }),
  viewPieces: many(viewPieces),
}));
export const messageSchema = createSelectSchema(messages);

export type MessageWithDescendents = Message & {
  viewPieces: Array<
    ViewPiece & {
      images: Array<ViewPieceImage & { infoImage: InfoImage }>;
      videos: Array<ViewPieceVideo & { infoVideo: InfoVideo }>;
      texts: ViewPieceText[];
    }
  >;
};

export const viewPieces = pgTable(
  "view_piece",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    activityId: uuid("activity_id")
      .notNull()
      .references(() => activities.id, { onDelete: "cascade" }),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    messageId: uuid("message_id")
      .notNull()
      .references(() => messages.id, { onDelete: "cascade" }),
    order: integer("order").notNull(),
  },
  (vp) => [
    index("view_piece_activity_id_idx").on(vp.activityId),
    index("view_piece_user_id_idx").on(vp.userId),
    index("view_piece_message_id_idx").on(vp.messageId),
  ],
);
export type ViewPiece = InferSelectModel<typeof viewPieces>;
export const viewPiecesRelations = relations(viewPieces, ({ one, many }) => ({
  message: one(messages, {
    fields: [viewPieces.messageId],
    references: [messages.id],
  }),
  images: many(viewPieceImages),
  videos: many(viewPieceVideos),
  texts: many(viewPieceTexts),
}));
export const viewPieceSchema = createSelectSchema(viewPieces);

export const viewPieceImages = pgTable(
  "view_piece_image",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    activityId: uuid("activity_id")
      .notNull()
      .references(() => activities.id, { onDelete: "cascade" }),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    viewPieceId: uuid("view_piece_id")
      .notNull()
      .references(() => viewPieces.id, { onDelete: "cascade" }),
    infoImageId: uuid("info_image_id")
      .notNull()
      .references(() => infoImages.id, { onDelete: "cascade" }),
  },
  (vpi) => [
    index("view_piece_image_activity_id_idx").on(vpi.activityId),
    index("view_piece_image_user_id_idx").on(vpi.userId),
    index("view_piece_image_view_piece_id_idx").on(vpi.viewPieceId),
    index("view_piece_image_info_image_id_idx").on(vpi.infoImageId),
  ],
);
export type ViewPieceImage = InferSelectModel<typeof viewPieceImages>;
export const viewPieceImagesRelations = relations(
  viewPieceImages,
  ({ one }) => ({
    viewPiece: one(viewPieces, {
      fields: [viewPieceImages.viewPieceId],
      references: [viewPieces.id],
    }),
    infoImage: one(infoImages, {
      fields: [viewPieceImages.infoImageId],
      references: [infoImages.id],
    }),
  }),
);
export const viewPieceImageSchema = createSelectSchema(viewPieceImages);

export const viewPieceVideos = pgTable(
  "view_piece_video",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    activityId: uuid("activity_id")
      .notNull()
      .references(() => activities.id, { onDelete: "cascade" }),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    viewPieceId: uuid("view_piece_id")
      .notNull()
      .references(() => viewPieces.id, { onDelete: "cascade" }),
    infoVideoId: uuid("info_video_id")
      .notNull()
      .references(() => infoVideos.id, { onDelete: "cascade" }),
  },
  (vpt) => [
    index("view_piece_video_activity_id_idx").on(vpt.activityId),
    index("view_piece_video_user_id_idx").on(vpt.userId),
    index("view_piece_video_view_piece_id_idx").on(vpt.viewPieceId),
    index("view_piece_video_info_video_id_idx").on(vpt.infoVideoId),
  ],
);
export type ViewPieceVideo = InferSelectModel<typeof viewPieceVideos>;
export const viewPieceVideosRelations = relations(
  viewPieceVideos,
  ({ one }) => ({
    viewPiece: one(viewPieces, {
      fields: [viewPieceVideos.viewPieceId],
      references: [viewPieces.id],
    }),
    infoVideo: one(infoVideos, {
      fields: [viewPieceVideos.infoVideoId],
      references: [infoVideos.id],
    }),
  }),
);
export const viewPieceVideoSchema = createSelectSchema(viewPieceVideos);

export const viewPieceTexts = pgTable(
  "view_piece_text",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    activityId: uuid("activity_id")
      .notNull()
      .references(() => activities.id, { onDelete: "cascade" }),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    viewPieceId: uuid("view_piece_id")
      .notNull()
      .references(() => viewPieces.id, { onDelete: "cascade" }),
    content: text("content").notNull(),
  },
  (vpt) => [
    index("view_piece_text_activity_id_idx").on(vpt.activityId),
    index("view_piece_text_user_id_idx").on(vpt.userId),
    index("view_piece_text_view_piece_id_idx").on(vpt.viewPieceId),
  ],
);
export type ViewPieceText = InferSelectModel<typeof viewPieceTexts>;
export const viewPieceTextsRelations = relations(viewPieceTexts, ({ one }) => ({
  viewPiece: one(viewPieces, {
    fields: [viewPieceTexts.viewPieceId],
    references: [viewPieces.id],
  }),
}));
export const viewPieceTextSchema = createSelectSchema(viewPieceTexts);

export const cacheValues = pgTable("cache_values", {
  id: uuid("id").primaryKey().defaultRandom(),
  value: text("value").notNull(),
  expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
});
export type CacheValue = InferSelectModel<typeof cacheValues>;
export const cacheValuesRelations = relations(cacheValues, () => ({}));
export const cacheValueSchema = createSelectSchema(cacheValues);
