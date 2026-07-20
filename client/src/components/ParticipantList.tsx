type Props = {
  users: { userId: string }[];
};

export default function ParticipantList({ users }: Props) {
  return (
    <div>
      <h4>Participants</h4>
      <ul>
        {users.map((u, i) => <li key={i}>{u.userId}</li>)}
      </ul>
    </div>
  );
}
