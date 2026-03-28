import { deleteUser } from '../models/userModel.js';

async function testDelete() {
  const userId = '33bbc2ad-e5b3-4517-ba24-079f4c86377b';
  await deleteUser(userId);
  console.log(`User with ID ${userId} has been deleted`);
}

testDelete();
