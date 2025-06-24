export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  profileImageUrl?: string;
  isSubscribed: boolean;
  isAdmin: boolean;
  canPromoteUsers: boolean;
  isBanned: boolean;
  createdAt: string;
  updatedAt: string;
}