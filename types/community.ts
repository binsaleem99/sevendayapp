export interface Post {
  id: string;
  user_id: string;
  title: string;
  content: string;
  image_url?: string;
  is_pinned: boolean;
  category: 'general' | 'announcements' | 'success' | 'help';
  likes_count: number;
  comments_count: number;
  created_at: string;
  is_locked?: boolean;
  participants?: string[];
  author: {
    full_name: string;
    avatar_url: string;
    level: number;
    is_admin: boolean;
  };
  comments?: Comment[];
}

export interface Comment {
  id: string;
  author: {
    name: string;
    avatar: string;
    level?: number;
  };
  content: string;
  createdAt: string;
  likes: number;
}

export interface CommunityStats {
  total_members: number;
  online_now: number;
  admins_count: number;
  total_posts: number;
}

export interface CalendarEvent {
  id: string;
  title: string;
  description: string;
  date: string;
  time: string;
  attendees_count: number;
  image_url?: string;
  is_online: boolean;
}

export interface FileItem {
  id: string;
  title: string;
  description: string;
  version: string;
  download_count: number;
  size: string;
  upload_date: string;
  image_url?: string;
  file_url?: string;
  user_downloaded?: boolean;
  author: {
    name: string;
    avatar: string;
  };
  comments: Comment[];
}
