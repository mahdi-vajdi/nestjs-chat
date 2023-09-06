import { User } from 'src/users/interfaces/user.interface';

export interface Chat {
  id: string;
  createdAt: Date;
  user1: User;
  user2: User;
}
