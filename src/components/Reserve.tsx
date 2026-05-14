import { CardView } from './CardView';

interface Props {
  count: number;
}

export function Reserve({ count }: Props) {
  if (count === 0) return null;
  return (
    <div className="reserve">
      <CardView card={null} faceDown>
        <span className="reserve-count">{count}</span>
      </CardView>
    </div>
  );
}
