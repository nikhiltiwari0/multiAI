
import { format } from "date-fns";

export type User = {
  id: string;
  name: string;
  avatar: string;
};

export type MessageType = "ai" | "user";

export type Message = {
  id: string;
  type: MessageType;
  content: string;
  timestamp: string;
  userId?: string; // For user messages
};

export type Chat = {
  id: string;
  title: string;
  messages: Message[];
  users: User[];
  createdAt: string;
  updatedAt: string;
};

// Mock users
export const mockUsers: User[] = [
  {
    id: "user-1",
    name: "Alice Johnson",
    avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Alice",
  },
  {
    id: "user-2",
    name: "Bob Smith",
    avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Bob",
  },
  {
    id: "user-3",
    name: "Carol Lee",
    avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Carol",
  },
  {
    id: "user-4",
    name: "Dave Miller",
    avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Dave",
  },
];

// Mock chats
export const mockChats: Chat[] = [
  {
    id: "chat-1",
    title: "AI Art Discussion",
    messages: [
      {
        id: "msg-1",
        type: "user",
        content: "Can anyone explain how AI-generated art works?",
        timestamp: format(new Date(2023, 3, 15, 9, 30), "PPpp"),
        userId: "user-1",
      },
      {
        id: "msg-2",
        type: "ai",
        content:
          "AI-generated art uses neural networks like GANs (Generative Adversarial Networks) or diffusion models to create images. These models learn patterns from existing artwork and generate new images based on text prompts or other inputs.",
        timestamp: format(new Date(2023, 3, 15, 9, 32), "PPpp"),
      },
      {
        id: "msg-3",
        type: "user",
        content: "Are there any ethical concerns with AI art?",
        timestamp: format(new Date(2023, 3, 15, 9, 35), "PPpp"),
        userId: "user-2",
      },
      {
        id: "msg-4",
        type: "ai",
        content:
          "Yes, there are several ethical concerns including copyright issues (as AI models are trained on existing art), potential job displacement for human artists, and questions about ownership and originality of AI-generated work. The field is still evolving in terms of both technology and ethics.",
        timestamp: format(new Date(2023, 3, 15, 9, 38), "PPpp"),
      },
    ],
    users: [mockUsers[0], mockUsers[1]],
    createdAt: format(new Date(2023, 3, 15, 9, 30), "PPpp"),
    updatedAt: format(new Date(2023, 3, 15, 9, 38), "PPpp"),
  },
  {
    id: "chat-2",
    title: "Machine Learning Project",
    messages: [
      {
        id: "msg-5",
        type: "user",
        content: "Anyone have experience with TensorFlow for image recognition?",
        timestamp: format(new Date(2023, 3, 10, 14, 12), "PPpp"),
        userId: "user-3",
      },
      {
        id: "msg-6",
        type: "ai",
        content:
          "TensorFlow is excellent for image recognition tasks. You might want to start with a pre-trained model like MobileNet or ResNet, then fine-tune it for your specific needs. This approach requires less data and computational resources than training from scratch.",
        timestamp: format(new Date(2023, 3, 10, 14, 15), "PPpp"),
      },
    ],
    users: [mockUsers[2], mockUsers[0]],
    createdAt: format(new Date(2023, 3, 10, 14, 12), "PPpp"),
    updatedAt: format(new Date(2023, 3, 10, 14, 15), "PPpp"),
  },
  {
    id: "chat-3",
    title: "Future of AI Discussion",
    messages: [
      {
        id: "msg-7",
        type: "user",
        content: "What do you think about AI development in the next decade?",
        timestamp: format(new Date(2023, 2, 20, 20, 5), "PPpp"),
        userId: "user-4",
      },
      {
        id: "msg-8",
        type: "ai",
        content:
          "The next decade will likely see significant advancement in AI capabilities, particularly in areas like natural language understanding, multimodal learning (combining text, images, audio), and perhaps general problem-solving abilities. We'll also likely see more regulations around AI development and deployment.",
        timestamp: format(new Date(2023, 2, 20, 20, 7), "PPpp"),
      },
      {
        id: "msg-9",
        type: "user",
        content: "Will we achieve AGI (Artificial General Intelligence)?",
        timestamp: format(new Date(2023, 2, 20, 20, 10), "PPpp"),
        userId: "user-1",
      },
      {
        id: "msg-10",
        type: "ai",
        content:
          "That's a complex question. While we're making progress in many domains of AI, true AGI requires capabilities that current systems lack, such as robust common sense reasoning, causal understanding, and perhaps consciousness. Some experts believe we're decades away, while others think it may be achieved sooner or might not be achievable with current approaches.",
        timestamp: format(new Date(2023, 2, 20, 20, 12), "PPpp"),
      },
    ],
    users: [mockUsers[3], mockUsers[0]],
    createdAt: format(new Date(2023, 2, 20, 20, 5), "PPpp"),
    updatedAt: format(new Date(2023, 2, 20, 20, 12), "PPpp"),
  },
];

// Current user (mimicking logged-in user)
export const currentUser: User = mockUsers[0];

// Function to simulate fetching chats
export function fetchChats(): Promise<Chat[]> {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve(mockChats);
    }, 500); // simulate network delay
  });
}

// Function to simulate fetching a single chat
export function fetchChat(chatId: string): Promise<Chat | undefined> {
  return new Promise((resolve) => {
    setTimeout(() => {
      const chat = mockChats.find((c) => c.id === chatId);
      resolve(chat);
    }, 300);
  });
}

// Function to simulate sending a message
export function sendMessage(
  chatId: string,
  message: string,
  userId = currentUser.id
): Promise<Message> {
  return new Promise((resolve) => {
    setTimeout(() => {
      // Create user message
      const userMessage: Message = {
        id: `msg-${Date.now()}-1`,
        type: "user",
        content: message,
        timestamp: format(new Date(), "PPpp"),
        userId,
      };

      // Create AI response (in real app, this would be from the API)
      const aiMessage: Message = {
        id: `msg-${Date.now()}-2`,
        type: "ai",
        content: `I'm an AI assistant responding to your message: "${message}". In a real application, this would be a genuine AI response.`,
        timestamp: format(new Date(Date.now() + 2000), "PPpp"), // 2 seconds later
      };

      // In a real app, you'd update the backend here
      // For now, we just resolve with the simulated user message
      resolve(userMessage);
    }, 300);
  });
}

// Function to simulate creating a new chat
export function createChat(title: string): Promise<Chat> {
  return new Promise((resolve) => {
    setTimeout(() => {
      const newChat: Chat = {
        id: `chat-${Date.now()}`,
        title,
        messages: [],
        users: [currentUser],
        createdAt: format(new Date(), "PPpp"),
        updatedAt: format(new Date(), "PPpp"),
      };

      // In a real app, you'd update the backend here
      resolve(newChat);
    }, 500);
  });
}
