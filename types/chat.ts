export interface Conversation {
  _id: string;
  type: 'dm' | 'group';
  // DM fields
  otherParticipant?: {
    _id: string;
    fullName: string;
    profilePicture?: string;
    lastSeen: Date | string;
  };
  // Group fields
  name?: string;
  description?: string;
  groupAvatar?: string;
  groupType?: 'batch' | 'department' | 'custom';
  memberCount?: number;
  admins?: string[];
  lastMessage?: {
    _id: string;
    content?: string;
    attachments?: Attachment[];
    sender: {
      _id: string;
      fullName: string;
      profilePicture?: string;
    };
    createdAt: string;
  };
  lastActivity: string;
  unreadCount: number;
  createdAt: string;
}

export interface GroupMember {
  _id: string;
  fullName: string;
  profilePicture?: string;
  department?: string;
  batch?: string;
  role: 'admin' | 'member';
}

export interface Message {
  _id: string;
  conversationId: string;
  sender: {
    _id: string;
    fullName: string;
    profilePicture?: string;
  };
  content?: string;
  attachments: Attachment[];
  status: 'sent' | 'delivered' | 'seen';
  reactions: Reaction[];
  replyTo?: {
    _id: string;
    content?: string;
    sender: {
      _id: string;
      fullName: string;
    };
  };
  isDeleted?: boolean;
  deletedAt?: string;
  isSystemMessage?: boolean;
  createdAt: string;
}

export interface Attachment {
  url: string;
  type: 'image' | 'document';
  fileName: string;
  fileSize: number;
}

export interface Reaction {
  userId: string;
  emoji: string;
}

export interface TypingUser {
  userId: string;
  timestamp: number;
}

export interface AppNotification {
  _id: string;
  recipient: string;
  type: string;
  title: string;
  body: string;
  link: string;
  isRead: boolean;
  actor?: {
    _id: string;
    fullName: string;
    profilePicture?: string;
  };
  entityId?: string;
  entityModel?: string;
  createdAt: string;
}
