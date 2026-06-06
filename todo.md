# HeartLink - Proactive AI Relationship Agent

## Phase 1: Database Schema Update
- [ ] Add agent_interactions table for tracking follow-ups and responses
- [ ] Add relationship_history table for past mistakes and patterns
- [ ] Add notification_schedule table for custom timing
- [ ] Add quick_replies table for notification responses
- [ ] Add agent_memory table for learned patterns and insights
- [ ] Create migration and apply to database

## Phase 2: Agent Logic Engine
- [ ] Build agent context builder (relationship state, history, patterns)
- [ ] Create follow-up question generator (LLM-powered)
- [ ] Build suggestion engine based on relationship context
- [ ] Implement mistake detection and prevention logic
- [ ] Create agent personality and tone system

## Phase 3: Push Notification System
- [ ] Set up Apple Push Notification (APNs) integration
- [ ] Create notification payload builder
- [ ] Implement quick-action buttons for notifications
- [ ] Build notification response handler
- [ ] Add notification history tracking

## Phase 4: iOS Widget Support
- [ ] Design widget data structure and endpoints
- [ ] Create widget configuration endpoint
- [ ] Build small widget (relationship status)
- [ ] Build medium widget (today's action)
- [ ] Build large widget (agent insights)
- [ ] Implement widget refresh logic

## Phase 5: Notification Scheduling
- [ ] Build custom schedule analyzer from relationship patterns
- [ ] Create scheduling engine (morning, lunch, evening, night)
- [ ] Implement pattern learning from user behavior
- [ ] Build schedule adjustment based on feedback
- [ ] Create background job for notification dispatch

## Phase 6: Agent-First UI Rebuild
- [ ] Redesign dashboard as agent command center
- [ ] Create quick-response interface for notifications
- [ ] Build agent conversation view (not just chat)
- [ ] Create relationship history/memory view
- [ ] Build settings for notification preferences and patterns
- [ ] Add quick action buttons for common responses

## Phase 7: Agent Memory Management
- [ ] Build memory storage for mistakes/challenges
- [ ] Create pattern recognition from check-ins
- [ ] Implement relationship timeline
- [ ] Build insight generation system
- [ ] Add memory recall in agent responses

## Phase 8: Testing & Polish
- [ ] Test agent follow-up flows
- [ ] Test notification delivery and quick replies
- [ ] Test iOS widget rendering
- [ ] Test custom scheduling logic
- [ ] Performance optimization
- [ ] Edge case handling

## Phase 9: Agent Infrastructure Complete
- [x] Database schema with 7 new agent tables
- [x] Agent logic engine for proactive follow-ups
- [x] Push notification service for iOS
- [x] Notification scheduling system
- [x] tRPC procedures for agent interactions
- [x] Comprehensive agent tests (14/14 passing)
- [x] Device token registration
- [x] Relationship history tracking
- [x] Agent memory system

## Next Steps for Production
- [ ] Integrate with Apple Push Notification (APNs) service
- [ ] Build iOS app wrapper with notification handling
- [ ] Create iOS widgets for home screen
- [ ] Set up background job scheduler for notifications
- [ ] Deploy to production
- [ ] Configure APNs certificates
