import { v4 as uuidv4 } from 'uuid';
import { getUserById, createUser, type User } from '../src/models/userModel.js';

async function test() {
  const userId = uuidv4();

  const newUser: User = {
    user_id: userId,
    email: 'test@example.com',
    full_name: 'Mud Test',
    google_id: 'google123',
    avatar_url: null
  };

  await createUser(newUser);
  console.log('User created:', userId);

  const user = await getUserById(userId);
  console.log('User fetched:', user);
}

test();