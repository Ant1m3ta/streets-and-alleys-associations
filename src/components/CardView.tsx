import type { CSSProperties, PointerEvent, ReactNode } from 'react';
import type { Card } from '../types';

interface Props {
  card: Card | null;
  faceDown?: boolean;
  draggable?: boolean;
  isDragging?: boolean;
  isDropTarget?: boolean;
  counter?: { current: number; total: number };
  className?: string;
  style?: CSSProperties;
  onPointerDown?: (e: PointerEvent<HTMLDivElement>) => void;
  children?: ReactNode;
}

export function CardView({
  card,
  faceDown,
  draggable,
  isDragging,
  isDropTarget,
  counter,
  className = '',
  style,
  onPointerDown,
  children,
}: Props) {
  const classes = [
    'card',
    card?.isCategory ? 'category' : '',
    faceDown ? 'face-down' : '',
    draggable ? 'draggable' : '',
    isDragging ? 'dragging' : '',
    isDropTarget ? 'drop-target' : '',
    className,
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <div className={classes} style={style} onPointerDown={onPointerDown}>
      {!faceDown && card && card.isIcon && card.imageId ? (
        <img
          className="card-image"
          src={`${import.meta.env.BASE_URL}images/${card.imageId}.png`}
          alt={card.word}
          draggable={false}
        />
      ) : null}
      {!faceDown && card && !card.isIcon && (
        <span className="card-label">{card.word}</span>
      )}
      {!faceDown && counter && (
        <span className="card-counter">
          {counter.current}/{counter.total}
        </span>
      )}
      {children}
    </div>
  );
}
