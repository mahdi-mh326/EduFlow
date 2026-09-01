import { apiClient } from './client'
import type { ChatbotResponse } from '@/types/chatbot'

export interface ChatHistoryItem {
  role: 'user' | 'model' | 'assistant'
  content: string
}

export const chatbotApi = {
  sendMessage: async (
    message: string,
    history?: ChatHistoryItem[],
    isGuest: boolean = false
  ): Promise<ChatbotResponse['data']> => {
    const endpoint = isGuest ? '/chatbot/guest-chat' : '/chatbot/chat'
    const { data } = await apiClient.post<ChatbotResponse>(endpoint, { message, history })
    return data.data
  },
}

