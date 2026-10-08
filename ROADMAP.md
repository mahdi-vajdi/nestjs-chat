# Roadmap

This document tracks the planned features for **Chatterbox**. It is a living document: priorities may change, and nothing here is a commitment to a specific date.

Want to help? Pick an item marked `help wanted`, open an issue to discuss the approach, then send a PR. Please read [ARCHITECTURE.md](./ARCHITECTURE.md) first; new features must follow the DDD / Clean / Hexagonal conventions described there.

**Legend**

| Symbol | Meaning |
|---|---|
| ✅ | Implemented |
| 🚧 | Partially implemented |
| 📋 | Planned |
| 💡 | Idea / under consideration |

**Priority:** `P0` = fix first, `P1` = core chat functionality, `P2` = important, `P3` = nice to have.

---

## Where we are today

| Area | Status |
|---|---|
| 1-on-1 direct conversations | ✅ |
| Text messages over WebSocket (Socket.IO) | ✅ |
| Multi-instance WebSocket scaling (Redis adapter) | ✅ |
| Read tracking (`markSeen`) and unread counts | ✅ |
| JWT auth (access + refresh tokens, RSA) | 🚧 refresh/logout not exposed over HTTP |
| User blocking / unblocking | ✅ |
| Offset-based pagination | ✅ (to be replaced, see Phase 2) |
| Swagger docs, Winston/Pino logging, migrations, unit + e2e tests | ✅ |

---

## Phase 0: Stability and correctness (P0)

Known issues in the current code that should be fixed before building new features.

- [ ] **Migration drift / unique constraint on `last_seen_message_id`** 📋
  The initial chat migration creates `conversation_members` with a `UNIQUE` constraint on `last_seen_message_id` (and a stale `last_message` column), which does not match the current TypeORM entity. If two members of a conversation have read up to the same message, the write can fail on a database created from migrations. Add a corrective migration, and run the e2e tests against migrations instead of `synchronize()` so drift is caught.
- [ ] **Blocked-user messages are still delivered in real time** 📋
  `MessageCreatedWsEventHandler` filters room names (`user-<id>`) against `deletedForUserIds` (plain user IDs), so the filter never matches. Messages from a blocked sender are persisted as hidden but are still pushed live to the blocker.
- [ ] **Multi-device / multi-tab sync for the sender** 📋
  Outgoing messages are only broadcast to the recipient's `user-<id>` room. The sender's other devices and tabs never receive them.
- [ ] **Expose `POST /v1/auth/refresh` and `POST /v1/auth/logout`** 📋
  `RefreshTokensCommand` already exists but has no controller endpoint. Logout needs refresh-token revocation.
- [ ] **Stop joining every conversation room on connect** 📋
  `handleConnection` joins the socket to all of a user's conversation rooms. This does not scale for users with many chats. Deliver through per-user rooms and/or join lazily.
- [ ] **Docs: README project structure is out of date** 📋
  The README describes `src/application`, `src/presentation`, etc., but the code is organised under `src/modules/<module>/{domain,application,infrastructure,presentation}`.

---

## Phase 1: Core messaging (P1)

### Message lifecycle
- [ ] **Edit message** with `message.edited` event, `edited_at` field 📋
- [ ] **Delete message**: "delete for me" and "delete for everyone" with a `message.deleted` event 📋
  (The `deleted_messages` table exists today but is only used internally for block-shadowing.)
- [ ] **Replies / quoted messages** (`reply_to_message_id`) 📋
- [ ] **Idempotent sends** via client-generated `clientMessageId` to prevent duplicates on retry 📋

### Delivery and receipts
- [ ] **Delivery states**: `SENT` → `DELIVERED` → `READ` (today there is only a boolean `seen`) 📋

### Conversations
- [ ] **Group chats**: `GROUP` conversation type, create/rename/set avatar 📋
  Requires reworking the 2-member limit in `ConversationEntity` and the single-recipient assumption in the WebSocket event handlers.
- [ ] **Group membership and roles**: `OWNER` / `ADMIN` / `MEMBER`; add/remove members, promote/demote, leave group 📋
- [ ] **System messages** (e.g. "Alice added Bob") 📋
- [ ] **User-initiated conversation delete / archive / hide** 🚧
  (`DeleteConversationCommand` exists but is currently only used as an internal rollback.)

### History and sync
- [ ] **Cursor-based pagination** for message history (offset pagination skips/duplicates items when new messages arrive) 📋
- [ ] **Offline catch-up / delta sync** (fetch everything changed since a cursor after reconnect) 📋

---

## Phase 2: Real-time experience (P2)

- [ ] **Typing indicators** (ephemeral, Redis-backed, not persisted) 📋
- [ ] **Online presence and "last seen"** (per-user socket tracking in Redis, `user.presence.changed` event) 📋
- [ ] **Push notifications** (FCM / APNs / Web Push) for offline users 📋
  - [ ] Device token registration
  - [ ] Dispatcher that triggers when the recipient has no active sockets
- [ ] **Conversation muting** (`muted_until`) 📋
- [ ] **Rate limiting / anti-spam** for WebSocket events and auth endpoints 📋

---

## Phase 3: Media and rich content (P2)

- [ ] **File storage integration** (S3-compatible, e.g. MinIO) with presigned upload URLs 📋
- [ ] **Attachment message types**: `IMAGE`, `VIDEO`, `AUDIO` (voice), `FILE` 📋
- [ ] **Attachment metadata**: size, MIME type, dimensions, duration, thumbnails 📋
- [ ] `LOCATION`, `CONTACT`, `STICKER` message types 💡

---

## Phase 4: Engagement features (P3)

- [ ] **Message reactions** (emoji, with add/remove events) 📋
- [ ] **Mentions** (`@username`, `@all`) with targeted notifications 📋
- [ ] **Pinned messages** 📋
- [ ] **Message forwarding** 📋
- [ ] **Full-text message search** (PostgreSQL `tsvector` or an external engine) 📋
- [ ] **Threads** 💡

---

## API and account completeness

- [ ] **REST endpoints for chat** (history, media upload, integrations). Today the chat domain is WebSocket-only 📋
- [ ] **`GET /user/me`** and **profile update** (name, avatar, bio) 📋
- [ ] **User search / contacts** 📋
- [ ] **Token revocation / session management** 📋

---

## Long-term ideas

- 💡 End-to-end encryption
- 💡 Voice / video calls (WebRTC signalling)
- 💡 Bots and webhooks
- 💡 Message retention policies and data export
- 💡 Admin / moderation tooling (reports, bans)

---

## Suggested release order

1. **Phase 0**: stability and correctness
2. **Phase 1**: edit/delete, group chats, cursor pagination
3. **Phase 2**: typing, presence, push notifications
4. **Phase 3**: media
5. **Phase 4**: reactions, mentions, search

Have a feature request that is not listed? Please [open an issue](../../issues) and describe your use case.
