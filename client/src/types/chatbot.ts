export interface ChatbotSource {
  type: string
  title: string
}

export interface ChatbotRequest {
  message: string
}

export interface ChatbotResponseData {
  reply: string
  sources: ChatbotSource[]
  queryDomain: string
}

export interface ChatbotResponse {
  success: boolean
  message: string
  data: ChatbotResponseData
}

export interface ChatMessage {
  id: string
  role: 'user' | 'assistant'
  content: string
  sources?: ChatbotSource[]
  queryDomain?: string
  timestamp?: number
  error?: boolean
}
