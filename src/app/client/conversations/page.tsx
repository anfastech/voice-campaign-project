import { ConversationPanel } from '@/components/conversations/ConversationPanel'

export default function ClientConversationsPage() {
  return <ConversationPanel apiBasePath="/api/client/conversations" />
}
