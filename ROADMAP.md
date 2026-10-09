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
| JWT auth (access + refresh tokens, RSA, rotation, logout) | ✅ |
| User blocking / unblocking | ✅ |
| Offset-based pagination | ✅ (to be replaced, see Phase 2) |
| Swagger docs, Pino logging, migrations, unit + e2e tests | ✅ |

---

## Phase 0: Stability and correctness (P0)

Known issues in the current code that should be fixed before building new features.

- [x] **Migration drift / unique constraint on `last_seen_message_id`** ✅
  Fixed initial chat migration and entity mappings: eliminated erroneous `UNIQUE` constraint on `last_seen_message_id`, removed phantom columns (`conversationId`, `last_message`), added proper `@JoinColumn` on message conversation relation, and added appropriate indexes.
- [x] **Blocked-user messages are still delivered in real time** ✅
  Fixed room filtering in `MessageCreatedWsEventHandler` to filter raw target user IDs before generating `user-<id>` room names.
- [x] **Multi-device / multi-tab sync for the sender** ✅
  Broadcast outgoing messages, new conversation creations, and read-receipt events to the sender's user room (`user-<authUserId>`), enabling seamless multi-device/multi-tab sync.
- [x] **Expose `POST /v1/auth/refresh` and `POST /v1/auth/logout`** ✅
  Exposed `POST /v1/auth/refresh` with automatic user role lookup, atomic token rotation, and reuse/replay detection that invalidates all compromised sessions. Exposed `POST /v1/auth/logout` with single-device or all-devices revocation.
- [x] **Stop joining every conversation room on connect** ✅
  Removed the expensive `GetUserConversationIdsQuery` query and bulk `client.join(conversationIds)` on WebSocket connect, routing solely via per-user rooms.
- [x] **Docs: README project structure is out of date** ✅
  Updated README to reflect current modular DDD folder layout, accurate Pino logging references, complete environment variables, and module migration commands.

---

## Phase 1: Core messaging (P1)

### Message lifecycle
- [x] **Edit message** with `conversation.message.edited` event, `edited_at` field ✅
  Implemented text message editing: domain invariants in `MessageEntity.edit()`, `MessageEditedDomainEvent`, isolated `updateMessage` repository method, `edited_at` DB migration, WebSocket `conversation.message.edit` handler, and real-time broadcast with multi-device sync and blocked-user isolation.
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
