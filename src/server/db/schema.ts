import { relations, type InferSelectModel } from "drizzle-orm";
import {
  boolean,
  index,
  integer,
  pgEnum,
  pgTableCreator,
  primaryKey,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core";
import { createSelectSchema } from "drizzle-zod";
import { type AdapterAccount } from "next-auth/adapters";
import { z } from "zod";

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

export const users = pgTable("user", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name"),
  email: text("email").notNull(),
  emailVerified: timestamp("email_verified", {
    mode: "date",
    withTimezone: true,
  }),
  tokensUsed: integer("tokens_used").default(0).notNull(),
  image: text("image"),
});
export type User = InferSelectModel<typeof users>;
export const usersRelations = relations(users, ({ many }) => ({
  accounts: many(accounts),
  sessions: many(sessions),
  ipUsers: many(ipUsers),
  userIntegrations: many(userIntegrations),
}));
export const userSchema = createSelectSchema(users);

export const ipUsers = pgTable(
  "ip_user",
  {
    ipAddress: text("ip_address").notNull().primaryKey(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
  },
  (ipu) => [index("ip_user_user_id_idx").on(ipu.userId)],
);
export type IpUser = InferSelectModel<typeof ipUsers>;
export const ipUsersRelations = relations(ipUsers, ({ one }) => ({
  user: one(users, { fields: [ipUsers.userId], references: [users.id] }),
}));
export const ipUserSchema = createSelectSchema(ipUsers);

export const accounts = pgTable(
  "account",
  {
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    type: text("type").$type<AdapterAccount["type"]>().notNull(),
    provider: text("provider").notNull(),
    providerAccountId: text("provider_account_id").notNull(),
    refresh_token: text("refresh_token"),
    access_token: text("access_token"),
    expires_at: integer("expires_at"),
    token_type: text("token_type"),
    scope: text("scope"),
    id_token: text("id_token"),
    session_state: text("session_state"),
  },
  (account) => [
    primaryKey({
      columns: [account.provider, account.providerAccountId],
    }),
    index("account_user_id_idx").on(account.userId),
  ],
);
export type Account = InferSelectModel<typeof accounts>;
export const accountsRelations = relations(accounts, ({ one }) => ({
  user: one(users, { fields: [accounts.userId], references: [users.id] }),
}));
export const accountSchema = createSelectSchema(accounts);

export const sessions = pgTable(
  "session",
  {
    sessionToken: text("session_token").notNull().primaryKey(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    expires: timestamp("expires", {
      mode: "date",
      withTimezone: true,
    }).notNull(),
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
export const verificationTokensSchema = createSelectSchema(verificationTokens);

export const integrationTypeEnum = pgEnum("integration_type", ["canvas"]);
export const integrationTypeSchema = z.enum(integrationTypeEnum.enumValues);
export type IntegrationType = z.infer<typeof integrationTypeSchema>;

export const integrations = pgTable("integration", {
  id: uuid("id").primaryKey().defaultRandom(),
  type: integrationTypeEnum("type").notNull(),
});
export type Integration = InferSelectModel<typeof integrations>;
export const integrationsRelations = relations(integrations, ({ many }) => ({
  userIntegraitons: many(userIntegrations),
  canvasIntegrations: many(canvasIntegrations),
}));

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

export const canvasIntegrations = pgTable(
  "canvas_integration",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    integrationId: uuid("integration_id")
      .notNull()
      .references(() => integrations.id, { onDelete: "cascade" }),
    canvasBaseUrl: text("canvas_base_url").notNull(),
    clientId: text("client_id").notNull(),
    clientSecret: text("client_secret").notNull(),
    validated: boolean("validated").default(false).notNull(),
  },
  (ci) => [
    index("canvas_integration_id_idx").on(ci.integrationId),
    uniqueIndex("canvas_int_base_url_idx").on(ci.canvasBaseUrl),
  ],
);
export type CanvasIntegration = InferSelectModel<typeof canvasIntegrations>;
export const canvasIntegrationsRelations = relations(
  canvasIntegrations,
  ({ one }) => ({
    integration: one(integrations, {
      fields: [canvasIntegrations.integrationId],
      references: [integrations.id],
    }),
  }),
);

export const activityStatusEnum = pgEnum("activity_status", [
  "draft",
  "published",
]);
export const activityStatusSchema = z.enum(activityStatusEnum.enumValues);
export type ActivityStatus = z.infer<typeof activityStatusSchema>;

export const activities = pgTable(
  "activity",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    exIdJson: text("ex_id_json").notNull(),
    integrationId: uuid("integration_id")
      .notNull()
      .references(() => integrations.id, { onDelete: "cascade" }),
    status: activityStatusEnum("status").notNull().default("draft"),
  },
  (a) => [
    index("activity_ex_id_json_idx").on(a.exIdJson),
    index("activity_integration_id_idx").on(a.integrationId),
  ],
);
export type Activity = InferSelectModel<typeof activities>;
export const activitiesRelations = relations(activities, ({ one, many }) => ({
  integration: one(integrations, {
    fields: [activities.integrationId],
    references: [integrations.id],
  }),
  activityItems: many(activityItems),
}));

export const questions = pgTable("question", {
  id: uuid("id").primaryKey().defaultRandom(),
  content: text("content").notNull(),
});
export type Question = InferSelectModel<typeof questions>;
export const questionsRelations = relations(questions, ({ many }) => ({
  activityItems: many(activityItems),
}));

export const infoTexts = pgTable("info_text", {
  id: uuid("id").primaryKey().defaultRandom(),
  content: text("content").notNull(),
});
export type InfoText = InferSelectModel<typeof infoTexts>;
export const infoTextsRelations = relations(infoTexts, ({ many }) => ({
  activityItems: many(activityItems),
}));

export const infoImages = pgTable("info_image", {
  id: uuid("id").primaryKey().defaultRandom(),
  url: text("url"),
});
export type InfoImage = InferSelectModel<typeof infoImages>;
export const infoImagesRelations = relations(infoImages, ({ many }) => ({
  activityItems: many(activityItems),
}));

// TODO: infoVideo (will require streaming storage setup of some sort)

export const activityItems = pgTable(
  "activity_item",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    activityId: uuid("activity_id")
      .notNull()
      .references(() => activities.id, { onDelete: "cascade" }),
    orderFracIdx: text("order_frac_idx").notNull(),
    questionId: uuid("question_id").references(() => questions.id, {
      onDelete: "cascade",
    }),
    infoTextId: uuid("info_text_id").references(() => infoTexts.id, {
      onDelete: "cascade",
    }),
    infoImageId: uuid("info_image_id").references(() => infoImages.id, {
      onDelete: "cascade",
    }),
  },
  (ai) => [index("activity_item_activity_id_idx").on(ai.activityId)],
);
export type ActivityItem = InferSelectModel<typeof activityItems>;
export type ActivityItemWithChildren = ActivityItem & {
  question: Question | null;
  infoText: InfoText | null;
  infoImage: InfoImage | null;
};
export const activityItemRelations = relations(activityItems, ({ one }) => ({
  activity: one(activities, {
    fields: [activityItems.activityId],
    references: [activities.id],
  }),
  question: one(questions, {
    fields: [activityItems.questionId],
    references: [questions.id],
  }),
  infoText: one(infoTexts, {
    fields: [activityItems.infoTextId],
    references: [infoTexts.id],
  }),
  infoImage: one(infoImages, {
    fields: [activityItems.infoImageId],
    references: [infoImages.id],
  }),
}));

export const threads = pgTable("thread", {
  id: uuid("id").primaryKey().defaultRandom(),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  activityItemId: uuid("activity_item_id")
    .notNull()
    .references(() => activityItems.id, { onDelete: "cascade" }),
});
export type Thread = InferSelectModel<typeof threads>;
export const threadsRelations = relations(threads, ({ one, many }) => ({
  activityItem: one(activityItems, {
    fields: [threads.activityItemId],
    references: [activityItems.id],
  }),
  messages: many(messages),
}));

export const senderRoleEnum = pgEnum("sender_role", [
  "user",
  "assistant",
  "system",
]);
export const senderRoleSchema = z.enum(senderRoleEnum.enumValues);
export type SenderRole = z.infer<typeof senderRoleSchema>;

export const messages = pgTable(
  "message",
  {
    id: uuid("id").primaryKey().defaultRandom(),
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
  },
  (cm) => [
    index("message_user_id_idx").on(cm.userId),
    index("message_thread_id_idx").on(cm.threadId),
  ],
);
export type Message = InferSelectModel<typeof messages>;
export const messagesRelations = relations(messages, ({ one }) => ({
  user: one(users, {
    fields: [messages.userId],
    references: [users.id],
  }),
  thread: one(threads, {
    fields: [messages.threadId],
    references: [threads.id],
  }),
}));
export const messageSchema = createSelectSchema(messages);

export const canvasUsers = pgTable(
  "canvas_user",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    canvasGlobalId: text("canvas_global_id").notNull(),
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
    // unique index to ensure only one canvas user per canvas global user id
    uniqueIndex("canvas_user_canvas_global_id_idx").on(cu.canvasGlobalId),
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
