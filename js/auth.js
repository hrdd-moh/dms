export const defaultUsers = [
  { id: 1, username: 'admin', password: 'admin123', altPass: '123', fullname: 'ថ្នាក់ដឹកនាំរដ្ឋបាល', role: 'SuperAdmin', bureau: 'all' },
  { id: 2, username: 'user1', password: '123', fullname: 'មន្ត្រីការិយាល័យទី១', role: 'Editor', bureau: 'bureau_1' },
  { id: 3, username: 'user2', password: '123', fullname: 'មន្ត្រីការិយាល័យទី២', role: 'Editor', bureau: 'bureau_2' },
  { id: 4, username: 'user3', password: '123', fullname: 'មន្ត្រីការិយាល័យទី៣', role: 'Editor', bureau: 'bureau_3' }
];

export function authenticateUser(username, password) {
  const u = String(username || '').trim().toLowerCase();
  const p = String(password || '').trim();
  const found = defaultUsers.find(x => x.username === u && (x.password === p || x.altPass === p));
  if (found) return found;
  throw new Error('ឈ្មោះគណនី ឬលេខសម្ងាត់មិនត្រឹមត្រូវ!');
}
